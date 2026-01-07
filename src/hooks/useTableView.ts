'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Sentinel value stored in cache/localStorage to represent "All <table>" selected
// (i.e. no saved view applied, show unfiltered/un-grouped table)
const ALL_ITEMS_SENTINEL = '__hit_all_items__';

// Module-level cache to persist view selection across component remounts
const viewSelectionCache = new Map<string, string>(); // tableId -> viewId | ALL_ITEMS_SENTINEL

// localStorage key for persisting view selection across page refreshes
const getStorageKey = (tableId: string) => `hit:table-view:${tableId}`;

// Read cached view ID from localStorage (sync, safe for SSR)
function getCachedViewId(tableId: string): string | null {
  if (typeof window === 'undefined') return null;
  
  // First check in-memory cache (for remounts within same session)
  const memCached = viewSelectionCache.get(tableId);
  if (memCached) return memCached;
  
  // Then check localStorage (for page refreshes)
  try {
    return localStorage.getItem(getStorageKey(tableId));
  } catch {
    return null;
  }
}

// Save view selection to both caches.
// Passing null means "All Items" (we persist it explicitly so it survives remounts/refreshes).
function setCachedViewId(tableId: string, viewId: string | null): void {
  if (typeof window === 'undefined') return;
  
  const valueToStore = viewId ?? ALL_ITEMS_SENTINEL;
  viewSelectionCache.set(tableId, valueToStore);
  try {
    localStorage.setItem(getStorageKey(tableId), valueToStore);
  } catch {
    // Ignore localStorage errors
  }
}

function isAllItemsSentinel(value: string | null | undefined): boolean {
  return value === ALL_ITEMS_SENTINEL;
}

function clearCachedViewId(tableId: string): void {
  if (typeof window === 'undefined') return;
  viewSelectionCache.delete(tableId);
  try {
    localStorage.removeItem(getStorageKey(tableId));
  } catch {
    // Ignore localStorage errors
  }
}

function getViewToRestoreFromCache(tableId: string, fetchedViews: TableView[]): TableView | null {
  const cached = getCachedViewId(tableId);

  // Explicit "All Items" selection (or nothing cached yet) => restore to All Items.
  if (cached === null || isAllItemsSentinel(cached)) {
    return null;
  }

  const cachedView = fetchedViews.find((v) => v.id === cached) || null;
  // If the cached ID doesn't exist anymore, fall back to All Items.
  if (!cachedView) {
    // Remove invalid cached id so we don't keep trying to restore it
    clearCachedViewId(tableId);
    return null;
  }
  return cachedView;
}

function persistCurrentSelection(tableId: string, view: TableView | null): void {
  setCachedViewId(tableId, view?.id ?? null);
}

function getSystemDefaultView(fetchedViews: TableView[]): TableView | null {
  // A "default view" is a system-provided view marked isDefault.
  // We only want to auto-apply it on the user's true first visit (no cached selection).
  return (
    fetchedViews.find((v) => Boolean(v?.isSystem) && Boolean(v?.isDefault)) ||
    fetchedViews.find((v) => Boolean(v?.isSystem)) ||
    null
  );
}

export interface TableViewFilter {
  id?: string;
  field: string;
  operator: string;
  value: string | number | boolean | null;
  valueType?: string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
}

export interface TableViewGroupBy {
  field: string;
  sortOrder?: string[];
}

export interface TableViewShare {
  id: string;
  viewId: string;
  principalType: 'user' | 'group' | 'role';
  principalId: string;
  sharedBy: string;
  sharedByName?: string | null;
  createdAt: string;
}

export interface TableView {
  id: string;
  userId: string;
  tableId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isSystem: boolean;
  isShared: boolean;
  columnVisibility?: Record<string, boolean> | null;
  sorting?: Array<{ id: string; desc: boolean }> | null;
  groupBy?: TableViewGroupBy | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
  filters: TableViewFilter[];
  // Categories returned by API
  _category?: 'system' | 'user' | 'shared';
  _sharedBy?: string;
  _sharedByName?: string | null;
}

interface UseTableViewOptions {
  tableId: string;
  onViewChange?: (view: TableView | null) => void;
}

/**
 * Hook for managing table views
 * 
 * Requires the table-views feature pack to be installed for API endpoints.
 * If the feature pack is not installed, API calls will gracefully fail.
 * 
 * @example
 * ```tsx
 * const { views, currentView, selectView, createView } = useTableView({
 *   tableId: 'projects',
 *   onViewChange: (view) => console.log('View changed:', view),
 * });
 * ```
 */
export function useTableView({ tableId, onViewChange }: UseTableViewOptions) {
  const [views, setViews] = useState<TableView[]>([]);
  const [currentView, setCurrentView] = useState<TableView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [available, setAvailable] = useState(true); // Whether the API is available
  const [viewReady, setViewReady] = useState(false); // True once initial view is applied
  const onViewChangeRef = useRef(onViewChange);
  const hasInitialized = useRef(false);
  const tableIdRef = useRef(tableId);
  
  // Keep ref in sync
  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  // Notify consumer only after the view system is "ready" (prevents setState-in-render warnings).
  // This guarantees callbacks run post-commit rather than during nested state updates.
  useEffect(() => {
    if (!viewReady) return;
    onViewChangeRef.current?.(currentView);
  }, [currentView, viewReady]);

  const fetchViews = useCallback(async (resetToDefault = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/table-views?tableId=${encodeURIComponent(tableId)}`);
      
      // If 404, the feature pack isn't installed
      if (res.status === 404) {
        setAvailable(false);
        setViews([]);
        setError(null);
        setViewReady(true); // Mark as ready even if no views available
        return;
      }
      
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || 'Failed to fetch views');
      }
      
      const json = await res.json();
      const fetchedViews = json.data || [];
      setViews(fetchedViews);
      setAvailable(true);
      setError(null);

      // On initial load, restore cached selection or default to "All Items"
      // (We persist "All Items" explicitly so it can be re-selected even once views exist.)
      if (resetToDefault) {
        const cachedRaw = getCachedViewId(tableId);
        // True first visit: nothing cached yet (not even an explicit "All Items" sentinel)
        const isFirstVisit = cachedRaw === null;

        // If user previously chose "All Items" we must respect it (sentinel),
        // and if they previously chose a view id we restore it.
        let restored = getViewToRestoreFromCache(tableId, fetchedViews);

        // Only on true first visit (no cached selection at all):
        // auto-select the system default view (if any).
        if (isFirstVisit && restored === null) {
          restored = getSystemDefaultView(fetchedViews);
        }

        setCurrentView(restored);
        // Persist what we restored so remounts don't re-apply a default view
        persistCurrentSelection(tableId, restored);
      }
      
      // Mark as ready once initial view is applied
      setViewReady(true);
    } catch (err) {
      // Network errors or other issues - mark as unavailable
      if ((err as any)?.name === 'TypeError') {
        setAvailable(false);
      } else {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
      setViewReady(true); // Mark ready even on error so UI isn't stuck
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  // Only fetch views and set default on FIRST mount
  useEffect(() => {
    // Only reset to default if this is first initialization
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchViews(true);
    }
  }, [fetchViews]);

  const createView = useCallback(async (viewData: {
    name: string;
    description?: string;
    filters?: TableViewFilter[];
    columnVisibility?: Record<string, boolean>;
    sorting?: Array<{ id: string; desc: boolean }>;
    groupBy?: TableViewGroupBy;
    metadata?: Record<string, unknown> | null;
    isDefault?: boolean;
    isSystem?: boolean; // If true, creates a system view visible to all users
  }) => {
    const res = await fetch('/api/table-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId,
        ...viewData,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || 'Failed to create view');
    }
    const json = await res.json();
    const newView = json.data;
    setViews((prev: TableView[]) => [...prev, newView]);
    return newView;
  }, [tableId]);

  const updateView = useCallback(async (viewId: string, updates: Partial<TableView>) => {
    const res = await fetch(`/api/table-views/${viewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || 'Failed to update view');
    }
    const json = await res.json();
    const updatedView = json.data;
    setViews((prev: TableView[]) => prev.map((v: TableView) => (v.id === viewId ? updatedView : v)));
    setCurrentView((current: TableView | null) => (current?.id === viewId ? updatedView : current));
    return updatedView;
  }, []);

  const deleteView = useCallback(async (viewId: string) => {
    const res = await fetch(`/api/table-views/${viewId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || 'Failed to delete view');
    }
    setViews((prev: TableView[]) => prev.filter((v: TableView) => v.id !== viewId));
    setCurrentView((current: TableView | null) => {
      if (current?.id !== viewId) return current;
      // Don't auto-fall back to any "default" view. If the selected view was deleted,
      // return to "All Items" and let the user explicitly pick another view.
      persistCurrentSelection(tableId, null);
      return null;
    });
  }, [tableId]);

  const selectView = useCallback(async (view: TableView | null) => {
    setCurrentView(view);
    
    // Cache the selection so it persists across remounts AND page refreshes
    persistCurrentSelection(tableId, view);

    // Update lastUsedAt if view is selected
    if (view && !view.isSystem) {
      try {
        await fetch(`/api/table-views/${view.id}/use`, {
          method: 'PATCH',
        });
      } catch {
        // Ignore errors for usage tracking
      }
    }
  }, [tableId]);

  // Refresh without resetting view
  const refresh = useCallback(() => fetchViews(false), [fetchViews]);

  // Get share entries for a view
  const getShares = useCallback(async (viewId: string): Promise<TableViewShare[]> => {
    const res = await fetch(`/api/table-views/${viewId}/shares`);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || 'Failed to fetch shares');
    }
    const json = await res.json();
    return json.data || [];
  }, []);

  // Add a share entry
  const addShare = useCallback(async (viewId: string, principalType: 'user' | 'group' | 'role', principalId: string): Promise<TableViewShare> => {
    const res = await fetch(`/api/table-views/${viewId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalType, principalId }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || 'Failed to share view');
    }
    const json = await res.json();
    // Update view's isShared flag locally
    setViews((prev: TableView[]) => prev.map((v: TableView) => (v.id === viewId ? { ...v, isShared: true } : v)));
    return json.data;
  }, []);

  // Remove a share entry
  const removeShare = useCallback(async (viewId: string, principalType: 'user' | 'group' | 'role', principalId: string): Promise<void> => {
    const res = await fetch(`/api/table-views/${viewId}/shares?principalType=${encodeURIComponent(principalType)}&principalId=${encodeURIComponent(principalId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || 'Failed to remove share');
    }
  }, []);

  return {
    views,
    currentView,
    loading,
    error,
    available, // Whether the table-views feature pack is installed
    viewReady, // True once initial view is loaded and applied (use to prevent flash)
    createView,
    updateView,
    deleteView,
    selectView,
    refresh,
    // Sharing functions
    getShares,
    addShare,
    removeShare,
  };
}

