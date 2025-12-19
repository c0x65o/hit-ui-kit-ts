'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Module-level cache to persist view selection across component remounts
const viewSelectionCache = new Map<string, string>(); // tableId -> viewId

export interface TableViewFilter {
  id?: string;
  field: string;
  operator: string;
  value: string | number | boolean | null;
  valueType?: string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
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
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
  filters: TableViewFilter[];
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
        // Check if we have a cached view selection for this table
        const cachedViewId = viewSelectionCache.get(tableId);
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
    } catch (err) {
      console.error(`[useTableView ${instanceId.current}] error:`, err);
      // Network errors or other issues - mark as unavailable
      if ((err as any)?.name === 'TypeError') {
        setAvailable(false);
      } else {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
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
    isDefault?: boolean;
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
    
    // Cache the selection so it persists across remounts
    if (view) {
      viewSelectionCache.set(tableId, view.id);
      console.log(`[useTableView ${instanceId.current}] Cached view selection: ${view.name} for table ${tableId}`);
    } else {
      viewSelectionCache.delete(tableId);
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

  return {
    views,
    currentView,
    loading,
    error,
    available, // Whether the table-views feature pack is installed
    createView,
    updateView,
    deleteView,
    selectView,
    refresh,
  };
}

