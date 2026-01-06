/**
 * useEntityResolver Hook
 * 
 * Batch resolves entity IDs to their display labels for reference columns.
 * Uses an in-memory cache to avoid redundant API calls.
 * 
 * @example
 * const { resolveEntities, getLabel, isLoading } = useEntityResolver();
 * 
 * // Batch resolve IDs (called once per page of data)
 * await resolveEntities([
 *   { entityType: 'crm.contact', ids: ['uuid1', 'uuid2'] },
 *   { entityType: 'crm.opportunity', ids: ['uuid3'] },
 * ]);
 * 
 * // Get cached label
 * const label = getLabel('crm.contact', 'uuid1'); // "John Doe"
 */

import { useState, useCallback, useRef } from 'react';
import { getEntityDefinition } from '../config/entityRegistry';

export interface ResolveRequest {
  entityType: string;
  ids: string[];
}

export interface ResolvedEntity {
  id: string;
  label: string;
}

interface EntityCache {
  [entityType: string]: {
    [id: string]: string;
  };
}

// Global cache shared across all hook instances (survives re-renders)
const globalCache: EntityCache = {};

// Track in-flight requests to avoid duplicate fetches
const inFlightRequests: Map<string, Promise<void>> = new Map();

export function useEntityResolver() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local cache ref for reactive updates within component
  const cacheVersion = useRef(0);
  const [, forceUpdate] = useState(0);

  /**
   * Get a cached label for an entity
   */
  const getLabel = useCallback((entityType: string, id: string): string | null => {
    if (!id) return null;
    return globalCache[entityType]?.[id] || null;
  }, []);

  /**
   * Check if an entity is cached
   */
  const isCached = useCallback((entityType: string, id: string): boolean => {
    if (!id) return true; // Empty IDs don't need resolution
    return Boolean(globalCache[entityType]?.[id]);
  }, []);

  /**
   * Resolve a batch of entity IDs
   */
  const resolveEntities = useCallback(async (requests: ResolveRequest[]): Promise<void> => {
    if (!requests.length) return;

    // Filter to only IDs not already cached
    const toFetch: ResolveRequest[] = [];
    for (const req of requests) {
      const def = getEntityDefinition(req.entityType);
      if (!def) continue;

      const uncachedIds = req.ids.filter((id) => {
        if (!id) return false;
        return !globalCache[req.entityType]?.[id];
      });

      if (uncachedIds.length > 0) {
        toFetch.push({ entityType: req.entityType, ids: uncachedIds });
      }
    }

    if (toFetch.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch each entity type in parallel
      await Promise.all(
        toFetch.map(async (req) => {
          const def = getEntityDefinition(req.entityType);
          if (!def) return;

          // Deduplicate by creating a unique key for this request
          const requestKey = `${req.entityType}:${req.ids.sort().join(',')}`;
          
          // If this exact request is already in-flight, wait for it
          if (inFlightRequests.has(requestKey)) {
            await inFlightRequests.get(requestKey);
            return;
          }

          const fetchPromise = (async () => {
            // For small batches, fetch individually
            // For larger batches, use search with IDs filter if supported
            const results: Record<string, string> = {};

            if (req.ids.length <= 5) {
              // Fetch individually in parallel
              await Promise.all(
                req.ids.map(async (id) => {
                  try {
                    const res = await fetch(`${def.resolveEndpoint}/${encodeURIComponent(id)}`);
                    if (!res.ok) return;
                    const data = await res.json();
                    const label = data?.[def.labelField] || data?.data?.[def.labelField];
                    if (label) {
                      results[id] = String(label);
                    }
                  } catch {
                    // Ignore individual failures
                  }
                })
              );
            } else {
              // Use search endpoint with IDs filter
              try {
                const params = new URLSearchParams();
                params.set('ids', req.ids.join(','));
                params.set('pageSize', String(req.ids.length));
                const res = await fetch(`${def.searchEndpoint}?${params.toString()}`);
                if (res.ok) {
                  const data = await res.json();
                  const items = data?.[def.itemsPath] || data?.data?.[def.itemsPath] || [];
                  for (const item of items) {
                    const id = item?.[def.valueField];
                    const label = item?.[def.labelField];
                    if (id && label) {
                      results[String(id)] = String(label);
                    }
                  }
                }
              } catch {
                // Ignore batch failure
              }
            }

            // Update global cache
            if (!globalCache[req.entityType]) {
              globalCache[req.entityType] = {};
            }
            for (const [id, label] of Object.entries(results)) {
              globalCache[req.entityType][id] = label;
            }
          })();

          inFlightRequests.set(requestKey, fetchPromise);
          
          try {
            await fetchPromise;
          } finally {
            inFlightRequests.delete(requestKey);
          }
        })
      );

      // Force re-render to reflect cache updates
      cacheVersion.current += 1;
      forceUpdate((v) => v + 1);
    } catch (e: any) {
      setError(e?.message || 'Failed to resolve entities');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Pre-populate cache from row data (when backend has joined related names)
   */
  const populateFromRowData = useCallback((
    entityType: string,
    idField: string,
    labelField: string,
    rows: Record<string, unknown>[]
  ): void => {
    if (!globalCache[entityType]) {
      globalCache[entityType] = {};
    }
    
    for (const row of rows) {
      const id = row[idField];
      const label = row[labelField];
      if (id && label) {
        globalCache[entityType][String(id)] = String(label);
      }
    }
  }, []);

  /**
   * Clear cache for an entity type (useful after mutations)
   */
  const clearCache = useCallback((entityType?: string): void => {
    if (entityType) {
      delete globalCache[entityType];
    } else {
      for (const key of Object.keys(globalCache)) {
        delete globalCache[key];
      }
    }
    forceUpdate((v) => v + 1);
  }, []);

  return {
    resolveEntities,
    getLabel,
    isCached,
    populateFromRowData,
    clearCache,
    isLoading,
    error,
  };
}
