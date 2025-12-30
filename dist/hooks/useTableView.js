'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
// Sentinel value stored in cache/localStorage to represent "All <table>" selected
// (i.e. no saved view applied, show unfiltered/un-grouped table)
const ALL_ITEMS_SENTINEL = '__hit_all_items__';
// Module-level cache to persist view selection across component remounts
const viewSelectionCache = new Map(); // tableId -> viewId | ALL_ITEMS_SENTINEL
// localStorage key for persisting view selection across page refreshes
const getStorageKey = (tableId) => `hit:table-view:${tableId}`;
// Read cached view ID from localStorage (sync, safe for SSR)
function getCachedViewId(tableId) {
    if (typeof window === 'undefined')
        return null;
    // First check in-memory cache (for remounts within same session)
    const memCached = viewSelectionCache.get(tableId);
    if (memCached)
        return memCached;
    // Then check localStorage (for page refreshes)
    try {
        return localStorage.getItem(getStorageKey(tableId));
    }
    catch {
        return null;
    }
}
// Save view selection to both caches.
// Passing null means "All Items" (we persist it explicitly so it survives remounts/refreshes).
function setCachedViewId(tableId, viewId) {
    if (typeof window === 'undefined')
        return;
    const valueToStore = viewId ?? ALL_ITEMS_SENTINEL;
    viewSelectionCache.set(tableId, valueToStore);
    try {
        localStorage.setItem(getStorageKey(tableId), valueToStore);
    }
    catch {
        // Ignore localStorage errors
    }
}
function isAllItemsSentinel(value) {
    return value === ALL_ITEMS_SENTINEL;
}
function clearCachedViewId(tableId) {
    if (typeof window === 'undefined')
        return;
    viewSelectionCache.delete(tableId);
    try {
        localStorage.removeItem(getStorageKey(tableId));
    }
    catch {
        // Ignore localStorage errors
    }
}
function getViewToRestoreFromCache(tableId, fetchedViews) {
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
function persistCurrentSelection(tableId, view) {
    setCachedViewId(tableId, view?.id ?? null);
}
function getSystemDefaultView(fetchedViews) {
    // A "default view" is a system-provided view marked isDefault.
    // We only want to auto-apply it on the user's true first visit (no cached selection).
    return (fetchedViews.find((v) => Boolean(v?.isSystem) && Boolean(v?.isDefault)) ||
        fetchedViews.find((v) => Boolean(v?.isSystem)) ||
        null);
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
export function useTableView({ tableId, onViewChange }) {
    const [views, setViews] = useState([]);
    const [currentView, setCurrentView] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            // On initial load, restore cached selection or default to "All Items"
            // (We persist "All Items" explicitly so it can be re-selected even once views exist.)
            if (resetToDefault) {
                const cachedRaw = getCachedViewId(tableId);
                // True first visit: nothing cached yet (not even an explicit "All Items" sentinel)
                const isFirstVisit = cachedRaw === null;
                // If user previously chose "All Items" we must respect it (sentinel),
                // and if they previously chose a view id we restore it.
                let restored = getViewToRestoreFromCache(tableId, fetchedViews);
                // Only on true first visit: use the system default as a TEMPLATE, not as the persisted selection.
                // We create a personal copy (owned by the user) and select that. This makes "default views"
                // effectively one-time bootstrap only.
                if (isFirstVisit && restored === null) {
                    const systemDefault = getSystemDefaultView(fetchedViews);
                    if (systemDefault) {
                        try {
                            const createRes = await fetch('/api/table-views', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    tableId,
                                    name: systemDefault.name,
                                    description: systemDefault.description || undefined,
                                    filters: Array.isArray(systemDefault?.filters) ? systemDefault.filters : [],
                                    columnVisibility: systemDefault.columnVisibility || undefined,
                                    sorting: systemDefault.sorting || undefined,
                                    groupBy: systemDefault.groupBy || undefined,
                                    metadata: systemDefault.metadata || undefined,
                                }),
                            });
                            if (createRes.ok) {
                                const createdJson = await createRes.json().catch(() => ({}));
                                const newView = createdJson?.data || null;
                                if (newView?.id) {
                                    restored = newView;
                                    // Ensure list includes the newly created view immediately
                                    setViews([...fetchedViews, newView]);
                                }
                            }
                        }
                        catch {
                            // Ignore bootstrap failures; fall back to All Items
                        }
                    }
                }
                if (restored) {
                    console.log(`[useTableView ${instanceId.current}] Restoring cached view: ${restored.name}`);
                }
                else {
                    console.log(`[useTableView ${instanceId.current}] Restoring to All Items`);
                }
                setCurrentView(restored);
                onViewChangeRef.current?.(restored);
                // Persist what we restored so remounts don't re-apply a default view
                persistCurrentSelection(tableId, restored);
            }
            // Mark as ready once initial view is applied
            setViewReady(true);
        }
        catch (err) {
            console.error(`[useTableView ${instanceId.current}] error:`, err);
            // Network errors or other issues - mark as unavailable
            if (err?.name === 'TypeError') {
                setAvailable(false);
            }
            else {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            }
            setViewReady(true); // Mark ready even on error so UI isn't stuck
        }
        finally {
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
    const createView = useCallback(async (viewData) => {
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
    const updateView = useCallback(async (viewId, updates) => {
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
    const deleteView = useCallback(async (viewId) => {
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
                    // Don't auto-fall back to any "default" view. If the selected view was deleted,
                    // return to "All Items" and let the user explicitly pick another view.
                    const newCurrentView = null;
                    onViewChangeRef.current?.(newCurrentView);
                    persistCurrentSelection(tableId, newCurrentView);
                    return newCurrentView;
                }
                return current;
            });
            return remaining;
        });
    }, [tableId]);
    const selectView = useCallback(async (view) => {
        console.log(`[useTableView ${instanceId.current}] selectView called - selecting: ${view?.name}`);
        setCurrentView(view);
        onViewChangeRef.current?.(view);
        // Cache the selection so it persists across remounts AND page refreshes
        persistCurrentSelection(tableId, view);
        if (view) {
            console.log(`[useTableView ${instanceId.current}] Cached view selection: ${view.name} for table ${tableId}`);
        }
        // Update lastUsedAt if view is selected
        if (view && !view.isSystem) {
            try {
                await fetch(`/api/table-views/${view.id}/use`, {
                    method: 'PATCH',
                });
            }
            catch {
                // Ignore errors for usage tracking
            }
        }
    }, [tableId]);
    // Refresh without resetting view
    const refresh = useCallback(() => fetchViews(false), [fetchViews]);
    // Get share entries for a view
    const getShares = useCallback(async (viewId) => {
        const res = await fetch(`/api/table-views/${viewId}/shares`);
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json?.error || 'Failed to fetch shares');
        }
        const json = await res.json();
        return json.data || [];
    }, []);
    // Add a share entry
    const addShare = useCallback(async (viewId, principalType, principalId) => {
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
    const removeShare = useCallback(async (viewId, principalType, principalId) => {
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
//# sourceMappingURL=useTableView.js.map