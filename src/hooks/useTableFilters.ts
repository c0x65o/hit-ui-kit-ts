'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getTableFilters, type TableFilterDefinition } from '../config/tableFilters';
import type { GlobalFilterConfig } from '../types';

/**
 * Threshold for switching between dropdown and autocomplete.
 * If option count <= threshold, use dropdown. Otherwise use autocomplete.
 */
const DROPDOWN_THRESHOLD = 20;

/**
 * Hook that automatically builds filter configurations from the centralized registry.
 * 
 * Features:
 * - Automatically fetches options for select/multiselect filters
 * - Smart switching: autocomplete filters with <= 20 options become dropdowns
 * - Handles both path-based (/endpoint/{id}) and query-based (/endpoint?id=) resolve
 * 
 * Usage:
 * ```tsx
 * const { filters, loading } = useTableFilters('crm.activities');
 * 
 * <DataTable
 *   tableId="crm.activities"
 *   showGlobalFilters
 *   globalFilters={filters}  // Auto-configured filters!
 *   ...
 * />
 * ```
 */
export function useTableFilters(tableId: string | undefined) {
  const [optionsCache, setOptionsCache] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  // Track which autocomplete filters should be rendered as dropdowns (small option count)
  const [autocompleteAsDropdown, setAutocompleteAsDropdown] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const filterDefs = useMemo(() => {
    if (!tableId) return [];
    return getTableFilters(tableId);
  }, [tableId]);

  // Fetch options for select/multiselect filters AND pre-fetch autocomplete to check count
  useEffect(() => {
    if (!filterDefs.length) return;

    // Get filters that need options fetched
    const selectFilters = filterDefs.filter(
      (f: TableFilterDefinition) => (f.filterType === 'select' || f.filterType === 'multiselect') && f.optionsEndpoint
    );
    
    // Also pre-fetch autocomplete filters to check if they should be dropdowns
    const autocompleteFilters = filterDefs.filter(
      (f: TableFilterDefinition) => f.filterType === 'autocomplete' && f.searchEndpoint
    );

    if (!selectFilters.length && !autocompleteFilters.length) return;

    let cancelled = false;
    setLoading(true);

    const fetchOptions = async (f: TableFilterDefinition, endpoint: string, isAutocomplete: boolean) => {
      try {
        const isAuthDirectoryUsers = isAutocomplete && endpoint.includes('/directory/users');
        // For autocomplete, fetch with large page size to check total count
        const url = isAutocomplete 
          ? `${endpoint}?pageSize=${DROPDOWN_THRESHOLD + 1}` 
          : endpoint;
        const res = await fetch(url);
        if (!res.ok) return { key: f.columnKey, options: [], isAutocomplete, total: 0 };
        const json = await res.json();
        
        // Extract items from response
        const itemsPath = f.itemsPath;
        let items = json;
        if (itemsPath) {
          for (const part of itemsPath.split('.')) {
            items = items?.[part];
          }
        }
        if (!Array.isArray(items)) items = [];

        // Check total from pagination if available
        // Note: auth directory endpoints often return a plain array with no total/pagination.
        // In that case we MUST keep autocomplete (no safe way to infer "small dataset").
        const total = isAuthDirectoryUsers ? Number.POSITIVE_INFINITY : (json.pagination?.total ?? json.total ?? items.length);

        const valueField = f.valueField || 'id';
        const labelField = f.labelField || 'name';

        const options = items.map((item: any) => {
          const value = String(item[valueField] || item.id || '');
          let label = String(item[labelField] || item.name || item[valueField] || '');
          // Special handling for user objects with profile_fields
          if (item.profile_fields) {
            const pf = item.profile_fields as { first_name?: string; last_name?: string };
            const displayName = [pf.first_name, pf.last_name].filter(Boolean).join(' ').trim();
            if (displayName) {
              label = displayName;
            }
          }
          return { value, label };
        });

        return { key: f.columnKey, options, isAutocomplete, total };
      } catch {
        return { key: f.columnKey, options: [], isAutocomplete, total: 0 };
      }
    };

    Promise.all([
      ...selectFilters.map((f: TableFilterDefinition) => fetchOptions(f, f.optionsEndpoint!, false)),
      ...autocompleteFilters.map((f: TableFilterDefinition) => fetchOptions(f, f.searchEndpoint!, true)),
    ]).then((results) => {
      if (cancelled) return;
      
      const cache: Record<string, Array<{ value: string; label: string }>> = {};
      const asDropdown = new Set<string>();
      
      for (const { key, options, isAutocomplete, total } of results) {
        // For autocomplete, check if it should be a dropdown instead
        if (isAutocomplete && total <= DROPDOWN_THRESHOLD) {
          cache[key] = options;
          asDropdown.add(key);
        } else if (!isAutocomplete) {
          cache[key] = options;
        }
        // For autocomplete with many options, don't cache (will search dynamically)
      }
      
      setOptionsCache(cache);
      setAutocompleteAsDropdown(asDropdown);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [filterDefs]);

  // Build GlobalFilterConfig array
  const filters = useMemo<GlobalFilterConfig[]>(() => {
    return filterDefs.map((def: TableFilterDefinition): GlobalFilterConfig => {
      // Smart switching: if autocomplete has few options, render as dropdown instead
      const shouldBeDropdown = def.filterType === 'autocomplete' && autocompleteAsDropdown.has(def.columnKey);
      const effectiveFilterType = shouldBeDropdown ? 'select' : def.filterType;
      
      const base: GlobalFilterConfig = {
        columnKey: def.columnKey,
        label: def.label,
        filterType: effectiveFilterType,
      };

      // Add options for select/multiselect (or autocomplete rendered as dropdown)
      if (effectiveFilterType === 'select' || effectiveFilterType === 'multiselect') {
        if (def.staticOptions) {
          base.filterOptions = def.staticOptions;
        } else if (optionsCache[def.columnKey]) {
          base.filterOptions = optionsCache[def.columnKey];
        }
      }

      // Add onSearch/resolveValue for autocomplete (only if not rendered as dropdown)
      if (effectiveFilterType === 'autocomplete' && def.searchEndpoint) {
        const valueField = def.valueField || 'id';
        const labelField = def.labelField || 'name';
        const itemsPath = def.itemsPath;

        base.onSearch = async (query: string, limit: number) => {
          try {
            const url = `${def.searchEndpoint}?search=${encodeURIComponent(query)}&pageSize=${limit}&limit=${limit}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const json = await res.json();
            
            let items = json;
            // If itemsPath is empty/undefined, use the response directly
            if (itemsPath) {
              for (const part of itemsPath.split('.')) {
                items = items?.[part];
              }
            }
            if (!Array.isArray(items)) items = [];

            return items.map((item: any) => {
              // Handle profile_fields for user objects
              let label = String(item[labelField] || item[valueField] || '');
              if (item.profile_fields) {
                const pf = item.profile_fields as { first_name?: string; last_name?: string };
                const displayName = [pf.first_name, pf.last_name].filter(Boolean).join(' ').trim();
                if (displayName) {
                  label = displayName;
                }
              }
              return {
                value: String(item[valueField] || ''),
                label,
              };
            });
          } catch {
            return [];
          }
        };

        if (def.resolveEndpoint) {
          base.resolveValue = async (value: string) => {
            if (!value) return null;
            try {
              // Check if this is an auth directory endpoint (returns plain array, uses ?search=)
              const isAuthDirectory = def.resolveEndpoint?.includes('/directory/users');
              
              let url: string;
              if (isAuthDirectory) {
                // Auth directory uses ?search= to find users
                url = `${def.resolveEndpoint}?search=${encodeURIComponent(value)}&limit=1`;
              } else if (value.includes('@') || value.includes('/')) {
                // Email-based IDs use query param
                url = `${def.resolveEndpoint}?id=${encodeURIComponent(value)}`;
              } else {
                // UUID-based IDs use path
                url = `${def.resolveEndpoint}/${encodeURIComponent(value)}`;
              }
              
              const res = await fetch(url);
              if (!res.ok) return null;
              const json = await res.json();
              
              // Handle auth directory (plain array) or standard (items array or single object)
              let item: any;
              if (Array.isArray(json)) {
                // Auth directory returns plain array - find exact match
                item = json.find((u: any) => u[valueField] === value) || json[0];
              } else {
                item = json.items?.[0] || json;
              }
              
              if (!item) return null;
              
              // Build display label - handle profile_fields for users
              let displayLabel = String(item[labelField] || item[valueField] || value);
              if (item.profile_fields) {
                const pf = item.profile_fields as { first_name?: string; last_name?: string };
                const displayName = [pf.first_name, pf.last_name].filter(Boolean).join(' ').trim();
                if (displayName) {
                  displayLabel = displayName;
                }
              }
              
              return {
                value: String(item[valueField] || value),
                label: displayLabel,
              };
            } catch {
              return null;
            }
          };
        }
      }

      return base;
    });
  }, [filterDefs, optionsCache, autocompleteAsDropdown]);

  return { filters, loading, hasFilters: filterDefs.length > 0 };
}
