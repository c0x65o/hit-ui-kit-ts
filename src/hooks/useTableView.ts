'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Module-level cache to persist view selection across component remounts
const viewSelectionCache = new Map<string, string>(); // tableId -> viewId

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

// Save view ID to both caches
function setCachedViewId(tableId: string, viewId: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (viewId) {
    viewSelectionCache.set(tableId, viewId);
    try {
      localStorage.setItem(getStorageKey(tableId), viewId);
    } catch {
      // Ignore localStorage errors
    }
  } else {
    viewSelectionCache.delete(tableId);
    try {
      localStorage.removeItem(getStorageKey(tableId));
    } catch {
      // Ignore localStorage errors
    }
  }
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
  const instanceId = useRef(Math.random().toString(36).slice(2, 8));
  
  console.log(`[useTableView ${instanceId.current}] render - tableId=${tableId}, currentView=${currentView?.name}, hasInitialized=${hasInitialized.current}`);
  
  // Keep ref in sync
  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  const fetchViews = useCallback(async (resetToDefault = false) => {
    console.log(`[useTableView ${instanceId.current}] fetchViews called - resetToDefault=${resetToDefault}, hasInitialized=${hasInitialized.current}`);
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
      console.log(`[useTableView ${instanceId.current}] fetched ${fetchedViews.length} views, resetToDefault=${resetToDefault}`);
      setViews(fetchedViews);
      setAvailable(true);
      setError(null);

      // On initial load, restore cached view or set default
      if (resetToDefault && fetchedViews.length > 0) {
        // Check if we have a cached view selection for this table (localStorage + memory)
        const cachedViewId = getCachedViewId(tableId);
        const cachedView = cachedViewId ? fetchedViews.find((v: TableView) => v.id === cachedViewId) : null;
        const defaultView = fetchedViews.find((v: TableView) => v.isDefault) || fetchedViews[0];
        
        const viewToSelect = cachedView || defaultView;
        
        if (cachedView) {
          console.log(`[useTableView ${instanceId.current}] Restoring cached view: ${cachedView.name}`);
        } else {
          console.log(`[useTableView ${instanceId.current}] Setting default view: ${defaultView.name}`);
        }
        
        setCurrentView(viewToSelect);
        onViewChangeRef.current?.(viewToSelect);
      }
      
      // Mark as ready once initial view is applied
      setViewReady(true);
    } catch (err) {
      console.error(`[useTableView ${instanceId.current}] error:`, err);
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
    console.log(`[useTableView ${instanceId.current}] useEffect triggered - hasInitialized=${hasInitialized.current}`);
    
    // Only reset to default if this is first initialization
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log(`[useTableView ${instanceId.current}] First init - calling fetchViews(true)`);
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
    setViews((prev) => [...prev, newView]);
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
    setViews((prev) => prev.map((v) => (v.id === viewId ? updatedView : v)));
    setCurrentView((current) => {
      if (current?.id === viewId) {
        onViewChangeRef.current?.(updatedView);
        return updatedView;
      }
      return current;
    });
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
    setViews((prev) => {
      const remaining = prev.filter((v) => v.id !== viewId);
      setCurrentView((current) => {
        if (current?.id === viewId) {
          const newCurrentView = remaining.find((v) => v.isDefault) || remaining[0] || null;
          onViewChangeRef.current?.(newCurrentView);
          return newCurrentView;
        }
        return current;
      });
      return remaining;
    });
  }, []);

  const selectView = useCallback(async (view: TableView | null) => {
    console.log(`[useTableView ${instanceId.current}] selectView called - selecting: ${view?.name}`);
    setCurrentView(view);
    onViewChangeRef.current?.(view);
    
    // Cache the selection so it persists across remounts AND page refreshes
    setCachedViewId(tableId, view?.id ?? null);
    if (view) {
      console.log(`[useTableView ${instanceId.current}] Cached view selection: ${view.name} for table ${tableId}`);
    }

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
    setViews((prev) => prev.map((v) => (v.id === viewId ? { ...v, isShared: true } : v)));
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

