'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const initialLoadDone = useRef(false);
  const onViewChangeRef = useRef(onViewChange);
  
  // Keep ref in sync
  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  const fetchViews = useCallback(async () => {
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
      setViews(fetchedViews);
      setAvailable(true);
      setError(null);

      // On initial load, set the default view
      if (!initialLoadDone.current && fetchedViews.length > 0) {
        initialLoadDone.current = true;
        const defaultView = fetchedViews.find((v: TableView) => v.isDefault) || fetchedViews[0];
        setCurrentView(defaultView);
        onViewChangeRef.current?.(defaultView);
      }
    } catch (err) {
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

  useEffect(() => {
    initialLoadDone.current = false;
    fetchViews();
  }, [fetchViews]);

  const createView = async (viewData: {
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
  };

  const updateView = async (viewId: string, updates: Partial<TableView>) => {
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
    if (currentView?.id === viewId) {
      setCurrentView(updatedView);
      onViewChange?.(updatedView);
    }
    return updatedView;
  };

  const deleteView = async (viewId: string) => {
    const res = await fetch(`/api/table-views/${viewId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || 'Failed to delete view');
    }
    setViews((prev) => prev.filter((v) => v.id !== viewId));
    if (currentView?.id === viewId) {
      const remainingViews = views.filter((v) => v.id !== viewId);
      const newCurrentView = remainingViews.find((v) => v.isDefault) || remainingViews[0] || null;
      setCurrentView(newCurrentView);
      onViewChange?.(newCurrentView);
    }
  };

  const selectView = async (view: TableView | null) => {
    setCurrentView(view);
    onViewChange?.(view);

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
  };

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
    refresh: fetchViews,
  };
}

