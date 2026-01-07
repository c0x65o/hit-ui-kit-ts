'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  Download, 
  Eye, 
  EyeOff, 
  Lock,
  Settings,
  Trash2,
  Unlock,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Button } from './Button';
import { Input } from './Input';
import { Dropdown } from './Dropdown';
import { ViewSelector } from './ViewSelector';
import { FilterDropdown } from './FilterDropdown';
import { useAlertDialog } from '../hooks/useAlertDialog.js';
import { AlertDialog } from './AlertDialog.js';
import { useTableFilters } from '../hooks/useTableFilters';
import { useDebounce } from '../hooks/useDebounce';
import { useEntityResolver } from '../hooks/useEntityResolver';
import { getEntityDefinition, getLabelFromRowField, getEntityDetailPath } from '../config/entityRegistry';
import type { DataTableProps, GlobalFilterConfig, ColumnReferenceConfig } from '../types';
import type { TableView } from '../hooks/useTableView';
import { formatDateTimeCellIfApplicable } from '../utils/datetime';

type BucketColumnDef = {
  columnKey: string;
  columnLabel: string;
  entityKind: string | null;
  entityIdField: string;
  buckets: Array<{ segmentKey: string; bucketLabel: string; sortOrder: number }>;
};

type MetricColumnDef = {
  columnKey: string;
  columnLabel: string;
  entityKind: string | null;
  entityIdField: string;
  metricKey: string;
  agg: string;
  window: string | null;
  format: string | null;
  decimals: number | null;
  sortOrder: number;
};

function formatMetricValue(value: unknown, meta?: MetricColumnDef | null): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  const decimals = meta?.decimals;
  const maxFrac = decimals === null || decimals === undefined ? 2 : Math.max(0, Math.min(12, Math.floor(decimals)));
  const minFrac = maxFrac;

  const fmt = (meta?.format || '').toLowerCase();
  if (fmt === 'usd' || fmt === 'currency_usd' || fmt === 'currency') {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
      }).format(n);
    } catch {
      // fallback
      return `$${n.toFixed(maxFrac)}`;
    }
  }

  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    }).format(n);
  } catch {
    return String(n);
  }
}

/**
 * DataTable Component
 * 
 * A powerful, feature-rich data table built on TanStack Table v8.
 * 
 * Features:
 * - Sorting (click column headers)
 * - Global search/filtering
 * - Column visibility toggle
 * - Export to CSV
 * - Pagination
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   searchable
 *   exportable
 *   showColumnVisibility
 * />
 * ```
 */
export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  exportable = true,
  showColumnVisibility = true,
  searchDebounceMs = 300,
  onSearchChange,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  initialSorting,
  initialColumnVisibility,
  onSortingChange: onSortingChangeProp,
  // Global filters
  showGlobalFilters = false,
  globalFilters,
  onGlobalFiltersChange,
  // Server-side pagination
  total,
  page: externalPage,
  onPageChange,
  manualPagination = false,
  // Refresh
  onRefresh,
  refreshing = false,
  showRefresh = true, // Default to showing refresh button
  // Grouping
  groupBy: groupByProp,
  groupPageSize = 5,
  // View system
  tableId,
  enableViews,
  onViewFiltersChange,
  onViewFilterModeChange,
  onViewGroupByChange,
  onViewSortingChange,
  onViewChange,
}: DataTableProps<TData>) {
  // Auto-enable views if tableId is provided (unless explicitly disabled)
  const viewsEnabled = enableViews !== undefined ? enableViews : !!tableId;
  const { colors, textStyles: ts, spacing, radius } = useThemeTokens();

  // Track current selected view id for per-view quick filter persistence.
  // (null = "All Items")
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);

  // When pinned, quick filters + local modifiers persist across view switches (no "fighting").
  // When not pinned, they persist per view.
  const [overlayPinned, setOverlayPinned] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const alertDialog = useAlertDialog();
  const overlayPinnedKey = tableId ? `hit:table-overlay-pinned:${tableId}` : null;
  useEffect(() => {
    if (!overlayPinnedKey) return;
    try {
      const raw = localStorage.getItem(overlayPinnedKey);
      if (raw === 'true') setOverlayPinned(true);
      if (raw === 'false') setOverlayPinned(false);
    } catch {
      // ignore
    }
  }, [overlayPinnedKey]);
  
  const [sorting, setSorting] = useState<SortingState>(
    initialSorting?.map((s) => ({ id: s.id, desc: s.desc ?? false })) || []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const deriveInitialVisibility = useMemo(() => {
    // QoL default: hide audit-y timestamp columns by default across tables,
    // unless the page/view explicitly opts them visible.
    const base: VisibilityState = { ...(initialColumnVisibility || {}) };
    const defaultHiddenKeys = ['createdOnTimestamp', 'lastUpdatedOnTimestamp', 'createdAt', 'updatedAt'];

    const present = new Set(columns.map((c) => String((c as any)?.key || '')));
    for (const k of defaultHiddenKeys) {
      if (!present.has(k)) continue;
      if (base[k] === undefined) base[k] = false;
    }
    return base;
  }, [initialColumnVisibility, columns]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(deriveInitialVisibility);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Debounced search for server-side filtering
  const debouncedSearchTerm = useDebounce(globalFilter, searchDebounceMs);
  
  // Notify parent of search changes (for server-side filtering)
  const prevDebouncedRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Only call onSearchChange if manualPagination is enabled and value changed
    if (!manualPagination || !onSearchChange) return;
    // Avoid calling on initial mount with empty string
    if (prevDebouncedRef.current === undefined && debouncedSearchTerm === '') {
      prevDebouncedRef.current = '';
      return;
    }
    if (prevDebouncedRef.current !== debouncedSearchTerm) {
      prevDebouncedRef.current = debouncedSearchTerm;
      onSearchChange(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, manualPagination, onSearchChange]);
  
  // Get filters from centralized registry (if tableId is provided)
  const { filters: registryFilters, hasFilters: hasRegistryFilters } = useTableFilters(tableId);
  
  // Entity resolver for reference columns - destructure to get stable function references
  const { 
    resolveEntities: resolverResolveEntities, 
    getLabel: resolverGetLabel, 
    isCached: resolverIsCached, 
    populateFromRowData: resolverPopulateFromRowData 
  } = useEntityResolver();
  
  // Track columns with reference config
  const referenceColumns = useMemo(() => {
    return columns.filter((col) => col.reference?.entityType);
  }, [columns]);
  
  // Resolved entity labels cache (triggers re-render when updated)
  const [resolvedLabels, setResolvedLabels] = useState<Record<string, Record<string, string>>>({});
  
  // Resolve reference column IDs when data changes
  useEffect(() => {
    if (referenceColumns.length === 0 || !data || data.length === 0) return;
    
    const newLabels: Record<string, Record<string, string>> = {};
    const toResolve: Array<{ entityType: string; ids: string[] }> = [];
    
    for (const col of referenceColumns) {
      const ref = col.reference!;
      const entityDef = getEntityDefinition(ref.entityType);
      if (!entityDef) continue;
      
      // Determine the row field that might have pre-resolved label
      const labelField = ref.labelFromRow || getLabelFromRowField(ref.entityType, ref.idField || col.key);
      
      // Determine the field containing the ID (default to column key)
      const idFieldName = ref.idField || col.key;
      
      const idsNeedingResolution: string[] = [];
      
      for (const row of data) {
        const id = (row as any)[idFieldName];
        if (!id) continue;
        
        const idStr = String(id);
        
        // Check if label is already in row data
        if (labelField && (row as any)[labelField]) {
          if (!newLabels[col.key]) newLabels[col.key] = {};
          newLabels[col.key][idStr] = String((row as any)[labelField]);
          // Also populate the resolver cache
          resolverPopulateFromRowData(ref.entityType, idFieldName, labelField, [row as Record<string, unknown>]);
        } else if (!resolverIsCached(ref.entityType, idStr)) {
          // Need to resolve this ID
          idsNeedingResolution.push(idStr);
        } else {
          // Already cached
          const cachedLabel = resolverGetLabel(ref.entityType, idStr);
          if (cachedLabel) {
            if (!newLabels[col.key]) newLabels[col.key] = {};
            newLabels[col.key][idStr] = cachedLabel;
          }
        }
      }
      
      if (idsNeedingResolution.length > 0) {
        toResolve.push({ entityType: ref.entityType, ids: [...new Set(idsNeedingResolution)] });
      }
    }
    
    // Update local state with pre-resolved labels
    if (Object.keys(newLabels).length > 0) {
      setResolvedLabels((prev) => ({ ...prev, ...newLabels }));
    }
    
    // Resolve missing IDs via API
    if (toResolve.length > 0) {
      resolverResolveEntities(toResolve).then(() => {
        // After resolution, update local state with newly resolved labels
        const updatedLabels: Record<string, Record<string, string>> = {};
        for (const col of referenceColumns) {
          const ref = col.reference!;
          const idFieldName = ref.idField || col.key;
          for (const row of data) {
            const id = (row as any)[idFieldName];
            if (!id) continue;
            const idStr = String(id);
            const label = resolverGetLabel(ref.entityType, idStr);
            if (label) {
              if (!updatedLabels[col.key]) updatedLabels[col.key] = {};
              updatedLabels[col.key][idStr] = label;
            }
          }
        }
        if (Object.keys(updatedLabels).length > 0) {
          setResolvedLabels((prev) => ({ ...prev, ...updatedLabels }));
        }
      });
    }
  }, [data, referenceColumns, resolverResolveEntities, resolverGetLabel, resolverIsCached, resolverPopulateFromRowData]);
  
  // Auto-enable filters if registry has filters for this tableId (unless explicitly disabled)
  const filtersEnabled = showGlobalFilters || hasRegistryFilters;
  
  // Auto-generate filter configs: Registry > Column definitions > Explicit globalFilters
  const effectiveGlobalFilters = useMemo(() => {
    if (!filtersEnabled && (!globalFilters || globalFilters.length === 0)) {
      return [];
    }
    
    // Build overrides map from explicit globalFilters
    const overrides = new Map<string, GlobalFilterConfig>();
    if (globalFilters) {
      for (const f of globalFilters) {
        overrides.set(f.columnKey, f);
      }
    }
    
    // Priority 1: Use registry filters if available
    if (filtersEnabled && hasRegistryFilters && registryFilters.length > 0) {
      // Merge registry filters with any explicit overrides
      return registryFilters.map((regFilter) => {
        const override = overrides.get(regFilter.columnKey);
        if (override?.enabled === false) {
          return null;
        }
        return {
          ...regFilter,
          ...override, // Explicit overrides win
        };
      }).filter(Boolean) as GlobalFilterConfig[];
    }
    
    // Priority 2: Auto-discover from column definitions
    if (filtersEnabled) {
      const autoFilters: GlobalFilterConfig[] = [];
      for (const col of columns) {
        const override = overrides.get(col.key);
        // Skip if explicitly disabled
        if (override?.enabled === false) {
          continue;
        }
        
        const filterType = override?.filterType || col.filterType;
        const filterOptions = override?.filterOptions || col.filterOptions;
        const onSearch = override?.onSearch || col.onSearch;
        
        // Auto-include if:
        // 1. Has select/multiselect filterType with filterOptions
        // 2. Has autocomplete filterType with onSearch
        // 3. Has string/date/daterange/number/boolean filterType explicitly set
        // 4. Has explicit override
        const isFilterable = 
          (filterType === 'select' && filterOptions && filterOptions.length > 0) ||
          (filterType === 'multiselect' && filterOptions && filterOptions.length > 0) ||
          (filterType === 'autocomplete' && onSearch) ||
          filterType === 'string' ||
          filterType === 'date' ||
          filterType === 'daterange' ||
          filterType === 'number' ||
          filterType === 'boolean' ||
          override;
        
        if (isFilterable) {
          autoFilters.push({
            columnKey: col.key,
            label: override?.label,
            filterType: filterType,
            filterOptions: filterOptions,
            onSearch: onSearch,
            resolveValue: override?.resolveValue || col.resolveValue,
            defaultValue: override?.defaultValue,
            enabled: true,
          });
        }
      }
      return autoFilters;
    }
    
    // Priority 3: Use explicit globalFilters only
    return globalFilters || [];
  }, [filtersEnabled, globalFilters, columns, hasRegistryFilters, registryFilters]);

  // Global filter values (from GlobalFilterBar)
  const [globalFilterValues, setGlobalFilterValues] = useState<Record<string, string | string[]>>(() => {
    const defaults: Record<string, string | string[]> = {};
    if (globalFilters) {
      for (const filter of globalFilters) {
        if (filter.defaultValue !== undefined) {
          defaults[filter.columnKey] = filter.defaultValue;
        }
      }
    }
    return defaults;
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    // Initialize collapsed groups if defaultCollapsed is true
    // We'll populate this after we have data
    return new Set();
  });
  
  // View-based groupBy (overrides prop when set by view)
  const [viewGroupBy, setViewGroupBy] = useState<{ field: string; sortOrder?: string[] } | null>(null);

  // Persist per-table+per-view "modifiers" (column visibility + sorting) in localStorage.
  // This is intentionally local-only so it can apply on top of public/system/shared views.
  const currentViewIdRef = useRef<string | null>(null); // null = "All Items"
  const hasInitializedSelectionRef = useRef(false);
  const getModifiersKey = (tid: string, vid: string | null) => `hit:table-modifiers:${tid}:${vid ?? '__all__'}`;
  const getQuickFiltersKey = (tid: string, vid: string | null) => `hit:table-filters:${tid}:${vid ?? '__all__'}`;
  const readModifiers = (tid: string, vid: string | null): { sorting?: SortingState; columnVisibility?: VisibilityState } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(getModifiersKey(tid, vid));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  };
  const writeModifiers = (tid: string, vid: string | null, mods: { sorting: SortingState; columnVisibility: VisibilityState }) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        getModifiersKey(tid, vid),
        JSON.stringify({ sorting: mods.sorting, columnVisibility: mods.columnVisibility, updatedAt: new Date().toISOString() })
      );
    } catch {
      // Ignore localStorage failures
    }
  };
  
  // Per-group pagination state: { groupKey: currentPage }
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});
  
  // Track if view system is ready (to prevent flash before view is applied)
  const [viewSystemReady, setViewSystemReady] = useState(!viewsEnabled);

  // If views are disabled but tableId exists, still restore/persist local modifiers
  // so column visibility + sorting survive refreshes.
  useEffect(() => {
    if (!tableId) return;
    if (viewsEnabled) return;
    // Only run once per tableId.
    if (hasInitializedSelectionRef.current) return;
    currentViewIdRef.current = null;
    setCurrentViewId(null);
    const mods = readModifiers(tableId, null);
    if (mods?.sorting) setSorting(mods.sorting);
    if (mods?.columnVisibility) setColumnVisibility(mods.columnVisibility);
    hasInitializedSelectionRef.current = true;
  }, [tableId, viewsEnabled]);

  // Persist modifiers whenever the user changes sorting/columns after initial view selection
  // (or immediately for non-views tables once initialized).
  useEffect(() => {
    if (!tableId) return;
    // When views are enabled, don't persist until the view system is ready and a selection is applied.
    if (viewsEnabled) {
      if (!viewSystemReady) return;
      if (!hasInitializedSelectionRef.current) return;
    } else {
      // No views: don't write before we finish the one-time restore.
      if (!hasInitializedSelectionRef.current) return;
    }
    const keyViewId = overlayPinned ? '__pinned__' : currentViewIdRef.current;
    writeModifiers(tableId, keyViewId, { sorting, columnVisibility });
  }, [viewsEnabled, tableId, viewSystemReady, sorting, columnVisibility, overlayPinned]);

  // For now, we only enforce "no best-effort + auto-show" on projects.
  // Easy to extend later (e.g. CRM) without changing domain feature packs.
  const strictDynamicColumns = tableId === 'projects';
  const autoShowDynamicColumns = tableId === 'projects';
  const [dynamicColumnsError, setDynamicColumnsError] = useState<string | null>(null);

  // Segment bucket columns (discovered via metrics-core, keyed by columnKey)
  const [bucketColumns, setBucketColumns] = useState<Record<string, BucketColumnDef>>({});
  const [bucketColumnsLoaded, setBucketColumnsLoaded] = useState(false);

  // Per-row evaluated bucket values for current page: { [columnKey]: { [entityId]: bucketLabel } }
  const [bucketValues, setBucketValues] = useState<Record<string, Record<string, string>>>({});

  // Metric computed columns (discovered via metrics-core, keyed by columnKey)
  const [metricColumns, setMetricColumns] = useState<Record<string, MetricColumnDef>>({});
  const [metricColumnsLoaded, setMetricColumnsLoaded] = useState(false);

  // Per-row evaluated metric values for current page: { [columnKey]: { [entityId]: number } }
  const [metricValues, setMetricValues] = useState<Record<string, Record<string, number>>>({});

  // Server-side bucket grouping state (only used when grouping by a bucket column)
  const [bucketGroupLoading, setBucketGroupLoading] = useState(false);
  const [bucketGroupError, setBucketGroupError] = useState<string | null>(null);
  const [bucketGroupPages, setBucketGroupPages] = useState<Record<string, number>>({});
  const [bucketGroupBySeg, setBucketGroupBySeg] = useState<Record<string, { segmentKey: string; bucketLabel: string; sortOrder: number; total: number; pageSize: number; rows: any[] }>>({});
  const [bucketGroupOrder, setBucketGroupOrder] = useState<string[]>([]);
  
  // Effective groupBy - view setting takes precedence over prop
  const groupBy = viewGroupBy ? {
    field: viewGroupBy.field,
    sortOrder: viewGroupBy.sortOrder,
    renderLabel: groupByProp?.renderLabel,
    defaultCollapsed: groupByProp?.defaultCollapsed,
  } : groupByProp;

  // Discover bucket columns for this tableId (best-effort; failures are silent).
  useEffect(() => {
    if (!viewsEnabled || !tableId) return;
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled && strictDynamicColumns) setDynamicColumnsError(null);
        const res = await fetch(`/api/metrics/segments/table-buckets?tableId=${encodeURIComponent(tableId)}`, { method: 'GET' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setBucketColumns({});
            setBucketColumnsLoaded(true);
            if (strictDynamicColumns) {
              setDynamicColumnsError((prev) => prev || (json?.error ? String(json.error) : `Failed to load bucket columns (${res.status})`));
            }
          }
          return;
        }
        const cols = Array.isArray(json?.data?.columns) ? json.data.columns : [];
        const next: Record<string, BucketColumnDef> = {};
        for (const c of cols as any[]) {
          const columnKey = typeof c?.columnKey === 'string' ? c.columnKey.trim() : '';
          if (!columnKey) continue;
          const columnLabel = typeof c?.columnLabel === 'string' && c.columnLabel.trim() ? c.columnLabel.trim() : columnKey;
          const entityKind = typeof c?.entityKind === 'string' ? c.entityKind.trim() : null;
          const entityIdField = typeof c?.entityIdField === 'string' && c.entityIdField.trim() ? c.entityIdField.trim() : 'id';
          const buckets = Array.isArray(c?.buckets) ? c.buckets : [];
          next[columnKey] = {
            columnKey,
            columnLabel,
            entityKind,
            entityIdField,
            buckets: buckets
              .map((b: any) => ({
                segmentKey: String(b?.segmentKey || '').trim(),
                bucketLabel: String(b?.bucketLabel || '').trim(),
                sortOrder: Number(b?.sortOrder ?? 0) || 0,
              }))
              .filter((b: any) => b.segmentKey && b.bucketLabel),
          };
        }
        if (!cancelled) {
          setBucketColumns(next);
          setBucketColumnsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setBucketColumns({});
          setBucketColumnsLoaded(true);
          if (strictDynamicColumns) setDynamicColumnsError((prev) => prev || 'Failed to load bucket columns');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewsEnabled, tableId]);

  // Discover metric columns for this tableId (best-effort; failures are silent).
  useEffect(() => {
    if (!viewsEnabled || !tableId) return;
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled && strictDynamicColumns) setDynamicColumnsError(null);
        const res = await fetch(`/api/metrics/segments/table-metrics?tableId=${encodeURIComponent(tableId)}`, { method: 'GET' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setMetricColumns({});
            setMetricColumnsLoaded(true);
            if (strictDynamicColumns) {
              setDynamicColumnsError((prev) => prev || (json?.error ? String(json.error) : `Failed to load metric columns (${res.status})`));
            }
          }
          return;
        }
        const cols = Array.isArray(json?.data?.columns) ? json.data.columns : [];
        const next: Record<string, MetricColumnDef> = {};
        for (const c of cols as any[]) {
          const columnKey = typeof c?.columnKey === 'string' ? c.columnKey.trim() : '';
          if (!columnKey) continue;
          const columnLabel = typeof c?.columnLabel === 'string' && c.columnLabel.trim() ? c.columnLabel.trim() : columnKey;
          const entityKind = typeof c?.entityKind === 'string' ? c.entityKind.trim() : null;
          const entityIdField = typeof c?.entityIdField === 'string' && c.entityIdField.trim() ? c.entityIdField.trim() : 'id';
          const metricKey = typeof c?.metricKey === 'string' ? c.metricKey.trim() : '';
          if (!metricKey) continue;
          const agg = typeof c?.agg === 'string' && c.agg.trim() ? c.agg.trim() : 'sum';
          const window = typeof c?.window === 'string' && c.window.trim() ? c.window.trim() : null;
          const format = typeof c?.format === 'string' && c.format.trim() ? c.format.trim() : null;
          const decimals = c?.decimals === null || c?.decimals === undefined ? null : Number(c.decimals);
          const sortOrder = Number(c?.sortOrder ?? 0) || 0;
          next[columnKey] = {
            columnKey,
            columnLabel,
            entityKind,
            entityIdField,
            metricKey,
            agg,
            window,
            format,
            decimals: Number.isFinite(decimals as any) ? (decimals as number) : null,
            sortOrder,
          };
        }
        if (!cancelled) {
          setMetricColumns(next);
          setMetricColumnsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setMetricColumns({});
          setMetricColumnsLoaded(true);
          if (strictDynamicColumns) setDynamicColumnsError((prev) => prev || 'Failed to load metric columns');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewsEnabled, tableId]);

  // Ensure newly discovered bucket columns default to hidden (or visible for strict tables) unless already specified.
  useEffect(() => {
    if (!bucketColumnsLoaded) return;
    const keys = Object.keys(bucketColumns || {});
    if (!keys.length) return;
    setColumnVisibility((prev) => {
      const next = { ...(prev || {}) } as any;
      let changed = false;
      for (const k of keys) {
        if (next[k] === undefined) {
          next[k] = autoShowDynamicColumns ? true : false;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [bucketColumnsLoaded, bucketColumns]);

  // Ensure newly discovered metric columns default to hidden (or visible for strict tables) unless already specified.
  useEffect(() => {
    if (!metricColumnsLoaded) return;
    const keys = Object.keys(metricColumns || {});
    if (!keys.length) return;
    setColumnVisibility((prev) => {
      const next = { ...(prev || {}) } as any;
      let changed = false;
      for (const k of keys) {
        if (next[k] === undefined) {
          next[k] = autoShowDynamicColumns ? true : false;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [metricColumnsLoaded, metricColumns]);

  // Evaluate bucket labels for visible bucket columns on current page rows (best-effort, non-sorting).
  useEffect(() => {
    if (!tableId) return;
    const visibleBucketKeys = Object.keys(bucketColumns || {}).filter((k) => (columnVisibility as any)?.[k] === true);
    // Ensure we evaluate the groupBy bucket column even when it's hidden so client-side grouping can still work.
    const groupField = groupBy?.field;
    if (groupField && (bucketColumns as any)?.[groupField] && !visibleBucketKeys.includes(groupField)) {
      visibleBucketKeys.push(groupField);
    }
    if (!visibleBucketKeys.length) return;

    const bucketGroupMetaLocal = groupBy && tableId ? bucketColumns[groupBy.field] : null;
    const isServerBucketGroupLocal = Boolean(groupBy && tableId && bucketGroupMetaLocal && bucketGroupMetaLocal.entityKind && !bucketGroupError);
    const serverRows = isServerBucketGroupLocal
      ? Object.values((bucketGroupBySeg as any) || {}).flatMap((g: any) => (Array.isArray(g?.rows) ? g.rows : []))
      : [];
    const sourceRows = isServerBucketGroupLocal ? serverRows : (data || []);

    const MAX = 500;
    const idsByCol: Record<string, string[]> = {};
    for (const k of visibleBucketKeys) {
      const meta = bucketColumns[k];
      const idField = meta?.entityIdField || 'id';
      const ids = (sourceRows || [])
        .map((row: any) => String(row?.[idField] ?? '').trim())
        .filter(Boolean)
        .slice(0, MAX);
      if (ids.length) idsByCol[k] = ids;
    }
    const colKeys = Object.keys(idsByCol);
    if (!colKeys.length) return;

    let cancelled = false;
    (async () => {
      for (const colKey of colKeys) {
        const meta = bucketColumns[colKey];
        const entityKind = meta?.entityKind || '';
        if (!entityKind) continue;
        try {
          const res = await fetch('/api/metrics/segments/table-buckets/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableId, columnKey: colKey, entityKind, entityIds: idsByCol[colKey] }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) continue;
          const values = json?.data?.values && typeof json.data.values === 'object' ? json.data.values : {};
          const map: Record<string, string> = {};
          for (const [id, val] of Object.entries(values)) {
            const x: any = val;
            const label = x && typeof x === 'object' && typeof x.bucketLabel === 'string' ? x.bucketLabel : '';
            if (label) map[String(id)] = label;
          }
          if (!cancelled) {
            setBucketValues((prev) => ({ ...(prev || {}), [colKey]: map }));
          }
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tableId, data, bucketColumns, columnVisibility, groupBy?.field, bucketGroupBySeg, bucketGroupError]);

  // Evaluate metric values for visible metric columns on current page rows (best-effort, non-sorting).
  useEffect(() => {
    if (!tableId) return;
    const visibleMetricKeys = Object.keys(metricColumns || {}).filter((k) => (columnVisibility as any)?.[k] === true);
    if (!visibleMetricKeys.length) return;

    const bucketGroupMetaLocal = groupBy && tableId ? bucketColumns[groupBy.field] : null;
    const isServerBucketGroupLocal = Boolean(groupBy && tableId && bucketGroupMetaLocal && bucketGroupMetaLocal.entityKind && !bucketGroupError);
    const serverRows = isServerBucketGroupLocal
      ? Object.values((bucketGroupBySeg as any) || {}).flatMap((g: any) => (Array.isArray(g?.rows) ? g.rows : []))
      : [];
    const sourceRows = isServerBucketGroupLocal ? serverRows : (data || []);

    const MAX = 500;
    const idsByCol: Record<string, string[]> = {};
    for (const k of visibleMetricKeys) {
      const meta = metricColumns[k];
      const idField = meta?.entityIdField || 'id';
      const ids = (sourceRows || [])
        .map((row: any) => String(row?.[idField] ?? '').trim())
        .filter(Boolean)
        .slice(0, MAX);
      if (ids.length) idsByCol[k] = ids;
    }
    const colKeys = Object.keys(idsByCol);
    if (!colKeys.length) return;

    let cancelled = false;
    (async () => {
      for (const colKey of colKeys) {
        const meta = metricColumns[colKey];
        const entityKind = meta?.entityKind || '';
        if (!entityKind) continue;
        try {
          const res = await fetch('/api/metrics/segments/table-metrics/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableId, columnKey: colKey, entityKind, entityIds: idsByCol[colKey] }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) continue;
          const values = json?.data?.values && typeof json.data.values === 'object' ? json.data.values : {};
          const map: Record<string, number> = {};
          for (const [id, val] of Object.entries(values)) {
            const n = typeof val === 'number' ? val : Number(val);
            if (!Number.isFinite(n)) continue;
            map[String(id)] = n;
          }
          if (!cancelled) {
            setMetricValues((prev) => ({ ...(prev || {}), [colKey]: map }));
          }
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tableId, data, metricColumns, columnVisibility, groupBy?.field, bucketColumns, bucketGroupBySeg, bucketGroupError]);

  const augmentedData = useMemo(() => {
    const bucketKeys = Object.keys(bucketColumns || {});
    const metricKeys = Object.keys(metricColumns || {});
    if (!bucketKeys.length && !metricKeys.length) return data;

    const activeBucketCols = Object.keys(bucketValues || {});
    const activeMetricCols = Object.keys(metricValues || {});
    if (!activeBucketCols.length && !activeMetricCols.length) return data;

    return (data || []).map((row: any) => {
      const next = { ...(row as any) };
      for (const colKey of activeBucketCols) {
        const meta = bucketColumns[colKey];
        const idField = meta?.entityIdField || 'id';
        const id = String((row as any)?.[idField] ?? '').trim();
        if (!id) continue;
        const label = bucketValues[colKey]?.[id];
        if (label) next[colKey] = label;
      }
      for (const colKey of activeMetricCols) {
        const meta = metricColumns[colKey];
        const idField = meta?.entityIdField || 'id';
        const id = String((row as any)?.[idField] ?? '').trim();
        if (!id) continue;
        const v = metricValues[colKey]?.[id];
        if (v === undefined) continue;
        next[colKey] = v;
      }
      return next as TData;
    });
  }, [data, bucketColumns, bucketValues, metricColumns, metricValues]);

  const bucketGroupMeta = groupBy && tableId ? bucketColumns[groupBy.field] : null;
  const isServerBucketGroup = Boolean(groupBy && tableId && bucketGroupMeta && bucketGroupMeta.entityKind);
  // If server-side bucket grouping fails (common for non-admin users), fall back to client-side rows
  // rather than rendering an empty table.
  const isServerBucketGroupActive = isServerBucketGroup && !bucketGroupError;

  async function fetchBucketGroups(pages: Record<string, number>) {
    if (!tableId || !groupBy || !bucketGroupMeta?.entityKind) return;
    setBucketGroupLoading(true);
    setBucketGroupError(null);
    try {
      const res = await fetch('/api/table-data/grouped-buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          columnKey: groupBy.field,
          entityKind: bucketGroupMeta.entityKind,
          pageSize: groupPageSize,
          bucketPages: pages,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `grouped-buckets ${res.status}`);
      const buckets = Array.isArray(json?.data?.buckets) ? json.data.buckets : [];

      // Merge pages into accumulated rows.
      setBucketGroupBySeg((prev) => {
        const next = { ...(prev || {}) } as any;
        for (const b of buckets as any[]) {
          const segmentKey = String(b?.segmentKey || '').trim();
          if (!segmentKey) continue;
          const bucketLabel = String(b?.bucketLabel || '').trim() || segmentKey;
          const sortOrder = Number(b?.sortOrder ?? 0) || 0;
          const total = Number(b?.total ?? 0) || 0;
          const pageSizeResp = Number(b?.pageSize ?? groupPageSize) || groupPageSize;
          const page = Number(b?.page ?? 1) || 1;
          const rows = Array.isArray(b?.rows) ? b.rows : [];

          const prior = next[segmentKey];
          const idField = bucketGroupMeta.entityIdField || 'id';
          const normId = (r: any) => String(r?.[idField] ?? r?.id ?? '').trim();

          let mergedRows: any[] = rows;
          if (page > 1 && prior && Array.isArray(prior.rows)) {
            const seen = new Set(prior.rows.map(normId).filter(Boolean));
            mergedRows = [...prior.rows];
            for (const r of rows) {
              const id = normId(r);
              if (!id || seen.has(id)) continue;
              seen.add(id);
              mergedRows.push(r);
            }
          }
          if (page === 1) mergedRows = rows;

          next[segmentKey] = { segmentKey, bucketLabel, sortOrder, total, pageSize: pageSizeResp, rows: mergedRows };
        }
        return next;
      });

      const order = (buckets as any[])
        .map((b: any) => ({ segmentKey: String(b?.segmentKey || '').trim(), sortOrder: Number(b?.sortOrder ?? 0) || 0, bucketLabel: String(b?.bucketLabel || '').trim() }))
        .filter((b: any) => b.segmentKey)
        .sort((a: any, b: any) => (a.sortOrder - b.sortOrder) || a.bucketLabel.localeCompare(b.bucketLabel) || a.segmentKey.localeCompare(b.segmentKey))
        .map((b: any) => b.segmentKey);
      setBucketGroupOrder(order);
    } catch (e: any) {
      setBucketGroupError(String(e?.message || 'Failed to load bucket groups'));
    } finally {
      setBucketGroupLoading(false);
    }
  }

  // Load server-side bucket grouping when grouping by a bucket column.
  useEffect(() => {
    if (!isServerBucketGroup) return;
    setBucketGroupBySeg({});
    setBucketGroupOrder([]);
    setBucketGroupPages({});
    fetchBucketGroups({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServerBucketGroup, tableId, groupBy?.field, groupPageSize]);

  // When a bucket group's page changes, fetch more rows.
  useEffect(() => {
    if (!isServerBucketGroup) return;
    fetchBucketGroups(bucketGroupPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketGroupPages]);
  
  // Use external page if provided (server-side), otherwise use internal state (client-side)
  const [internalPage, setInternalPage] = useState(0);
  const currentPage = manualPagination && externalPage !== undefined ? externalPage - 1 : internalPage;
  
  const [pagination, setPagination] = useState({
    pageIndex: currentPage,
    pageSize,
  });
  
  // Update pagination when external page changes
  useEffect(() => {
    if (manualPagination && externalPage !== undefined) {
      setPagination({
        pageIndex: externalPage - 1,
        pageSize,
      });
    }
  }, [externalPage, manualPagination, pageSize]);

  // Initialize collapsed groups if defaultCollapsed is true
  useEffect(() => {
    if (groupBy?.defaultCollapsed && isServerBucketGroupActive) {
      const keys = bucketGroupOrder.length ? bucketGroupOrder : Object.keys(bucketGroupBySeg || {});
      if (keys.length > 0) {
        setCollapsedGroups(new Set(keys));
      }
      return;
    }
    if (groupBy?.defaultCollapsed && data.length > 0) {
      const groups = new Set<string>();
      for (const row of data) {
        const groupValue = row[groupBy.field] ?? null;
        const groupKey = groupValue === null ? '__null__' : String(groupValue);
        groups.add(groupKey);
      }
      setCollapsedGroups(groups);
    }
  }, [groupBy?.defaultCollapsed, groupBy?.field, data, isServerBucketGroupActive, bucketGroupOrder, bucketGroupBySeg]);

  // Helper function to get filter function based on filter type
  // TanStack Table v8 filterFn signature: (row, columnId, filterValue) => boolean
  const getFilterFn = (filterType?: string) => {
    switch (filterType) {
      case 'multiselect':
        return (row: any, columnId: string, filterValue: any) => {
          if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;
          const rowValue = String(row.getValue(columnId) ?? '');
          const filterValues = Array.isArray(filterValue) ? filterValue : [filterValue];
          return filterValues.some((fv) => String(fv) === rowValue || String(fv).toLowerCase() === rowValue.toLowerCase());
        };
      case 'number':
        return (row: any, columnId: string, filterValue: any) => {
          if (!filterValue) return true;
          const rowValue = Number(row.getValue(columnId));
          const filterNum = Number(Array.isArray(filterValue) ? filterValue[0] : filterValue);
          if (!Number.isFinite(rowValue) || !Number.isFinite(filterNum)) return false;
          return rowValue === filterNum;
        };
      case 'boolean':
        return (row: any, columnId: string, filterValue: any) => {
          if (!filterValue) return true;
          const rowValue = Boolean(row.getValue(columnId));
          const filterBool = Array.isArray(filterValue) ? filterValue[0] === 'true' : filterValue === 'true';
          return rowValue === filterBool;
        };
      case 'date':
        return (row: any, columnId: string, filterValue: any) => {
          if (!filterValue) return true;
          const rowValue = row.getValue(columnId);
          const filterDate = Array.isArray(filterValue) ? filterValue[0] : filterValue;
          return String(rowValue) === String(filterDate);
        };
      case 'daterange':
        // Date range filter - filterValue is "fromDate|toDate"
        return (row: any, columnId: string, filterValue: any) => {
          if (!filterValue) return true;
          const rangeStr = String(Array.isArray(filterValue) ? filterValue[0] : filterValue);
          const [fromStr, toStr] = rangeStr.split('|');
          if (!fromStr && !toStr) return true;
          
          const rowValue = row.getValue(columnId);
          if (!rowValue) return false;
          
          // Parse row date
          const rowDate = new Date(String(rowValue));
          if (isNaN(rowDate.getTime())) return false;
          const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
          
          // Check from date
          if (fromStr) {
            const fromDate = new Date(fromStr);
            if (!isNaN(fromDate.getTime())) {
              const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
              if (rowDateOnly < fromDateOnly) return false;
            }
          }
          
          // Check to date
          if (toStr) {
            const toDate = new Date(toStr);
            if (!isNaN(toDate.getTime())) {
              const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
              if (rowDateOnly > toDateOnly) return false;
            }
          }
          
          return true;
        };
      case 'select':
        // Exact match for select (case-insensitive)
        return (row: any, columnId: string, filterValue: any) => {
          if (!filterValue) return true;
          const rowValue = String(row.getValue(columnId) ?? '').toLowerCase();
          const filterStr = String(Array.isArray(filterValue) ? filterValue[0] : filterValue).toLowerCase();
          return rowValue === filterStr;
        };
      default:
        // String - supports operator:value format (e.g., "contains:john")
        // Falls back to includes match for backwards compatibility
        return (row: any, columnId: string, filterValue: any) => {
          if (!filterValue) return true;
          const rowValue = String(row.getValue(columnId) ?? '').toLowerCase();
          const filterStr = String(Array.isArray(filterValue) ? filterValue[0] : filterValue);
          
          // Check for operator:value format
          const colonIdx = filterStr.indexOf(':');
          if (colonIdx > 0) {
            const op = filterStr.substring(0, colonIdx);
            const val = filterStr.substring(colonIdx + 1).toLowerCase();
            if (!val) return true;
            
            switch (op) {
              case 'equals':
                return rowValue === val;
              case 'notEquals':
                return rowValue !== val;
              case 'contains':
                return rowValue.includes(val);
              case 'notContains':
                return !rowValue.includes(val);
              case 'startsWith':
                return rowValue.startsWith(val);
              case 'endsWith':
                return rowValue.endsWith(val);
              default:
                // Unknown operator, fall through to default behavior
                break;
            }
          }
          
          // Default: includes match (case-insensitive)
          return rowValue.includes(filterStr.toLowerCase());
        };
    }
  };

  // Convert columns to TanStack Table format
  const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
    const base = columns.map((col) => {
      const filterFn = getFilterFn(col.filterType);
      return {
        id: col.key,
        accessorKey: col.key,
        header: col.label,
        cell: ({ row, getValue }: { row: any; getValue: () => any }) => {
          const value = getValue();
          
          // If custom render is provided, always use it
          if (col.render) {
            return col.render(value, row.original, row.index);
          }
          
          // Handle reference columns (auto-resolve ID to label and render link)
          if (col.reference?.entityType) {
            const ref = col.reference;
            const entityDef = getEntityDefinition(ref.entityType);
            
            // Get the ID from either the specified idField or the column key
            const idValue = ref.idField ? (row.original as any)[ref.idField] : value;
            if (!idValue) return '' as React.ReactNode;
            
            const idStr = String(idValue);
            
            // Get the label from resolved cache
            const label = resolvedLabels[col.key]?.[idStr] || resolverGetLabel(ref.entityType, idStr);
            
            // If no label resolved yet, show ID as fallback
            const displayText = label || idStr;
            
            // Determine if we should render as a link
            const detailPath = ref.detailPath || (entityDef ? getEntityDetailPath(ref.entityType, idStr) : null);
            const shouldLink = ref.linkable !== false && detailPath;
            
            if (shouldLink && detailPath) {
              return (
                <a
                  href={detailPath}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Allow default navigation
                  }}
                  style={{
                    color: 'inherit',
                    textDecoration: 'underline',
                    textDecorationColor: colors.text.muted,
                    textUnderlineOffset: '2px',
                  }}
                >
                  {displayText}
                </a>
              );
            }
            
            return displayText as React.ReactNode;
          }

          // Auto-format ISO datetime strings for datetime-like columns
          // (prevents raw "....Z" UTC strings from leaking into the UI).
          const formatted = formatDateTimeCellIfApplicable(col.key, value);
          if (formatted) return formatted as React.ReactNode;

          return value as React.ReactNode;
        },
        enableSorting: col.sortable !== false,
        enableHiding: col.hideable !== false,
        filterFn,
      };
    });

    const dyn = Object.values(bucketColumns || {}).map((c) => ({
      id: c.columnKey,
      accessorKey: c.columnKey,
      header: c.columnLabel || c.columnKey,
      cell: ({ getValue }: { getValue: () => any }) => {
        const v = getValue();
        return (v ? String(v) : '') as React.ReactNode;
      },
      enableSorting: false,
      enableHiding: true,
    })) as any[];

    const metricDyn = Object.values(metricColumns || {}).map((c) => ({
      id: c.columnKey,
      accessorKey: c.columnKey,
      header: c.columnLabel || c.columnKey,
      cell: ({ getValue }: { getValue: () => any }) => {
        const v = getValue();
        return formatMetricValue(v, c) as React.ReactNode;
      },
      enableSorting: true,
      enableHiding: true,
    })) as any[];

    return [...base, ...dyn, ...metricDyn] as any;
  }, [columns, bucketColumns, metricColumns, resolvedLabels, resolverGetLabel, colors.text.muted]);

  // Convert globalFilterValues to columnFilters format
  const globalFiltersAsColumnFilters = useMemo<ColumnFiltersState>(() => {
    if (effectiveGlobalFilters.length === 0 || Object.keys(globalFilterValues).length === 0) {
      return [];
    }
    const filters: ColumnFiltersState = [];
    for (const [columnKey, value] of Object.entries(globalFilterValues)) {
      if (value === '' || (Array.isArray(value) && value.length === 0)) {
        continue;
      }
      const filter = effectiveGlobalFilters.find((f) => f.columnKey === columnKey);
      const col = columns.find((c) => c.key === columnKey);
      const filterType = filter?.filterType || col?.filterType || 'string';
      
      if (filterType === 'multiselect' && Array.isArray(value)) {
        // For multiselect, use arrayContains filter
        filters.push({
          id: columnKey,
          value: value,
        });
      } else if (filterType === 'string' && typeof value === 'string') {
        // For string, use includesString filter
        filters.push({
          id: columnKey,
          value: value,
        });
      } else {
        // For other types, use exact match
        filters.push({
          id: columnKey,
          value: Array.isArray(value) ? value : [value],
        });
      }
    }
    return filters;
  }, [globalFilterValues, effectiveGlobalFilters, columns]);

  // Merge global filters with column filters (global filters take precedence)
  const effectiveColumnFilters = useMemo<ColumnFiltersState>(() => {
    const globalFilterKeys = new Set(globalFiltersAsColumnFilters.map((f) => f.id));
    const otherFilters = columnFilters.filter((f) => !globalFilterKeys.has(f.id));
    return [...globalFiltersAsColumnFilters, ...otherFilters];
  }, [globalFiltersAsColumnFilters, columnFilters]);

  // Handle global filter changes
  const handleGlobalFiltersChange = (values: Record<string, string | string[]>) => {
    setGlobalFilterValues(values);
    if (onGlobalFiltersChange) {
      onGlobalFiltersChange(values);
    }
  };

  const resetLocalTableState = async () => {
    if (typeof window === 'undefined') return;
    if (!tableId) return;
    const confirmed = await alertDialog.showConfirm(
      'Reset this table back to defaults? This clears locally saved filters, columns, and sorting.',
      { title: 'Reset table', variant: 'warning', confirmText: 'Reset', cancelText: 'Cancel' }
    );
    if (!confirmed) return;

    try {
      // Clear any local per-table keys.
      const prefixes = [
        `hit:table-filters:${tableId}`,
        `hit:table-modifiers:${tableId}`,
        `hit:table-overlay-pinned:${tableId}`,
      ];
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (prefixes.some((p) => k.startsWith(p))) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // ignore localStorage failures
    }

    // Reset UI state immediately
    setOverlayPinned(false);
    setGlobalFilter('');
    setGlobalFilterValues({});
    setColumnFilters([]);
    // Sorting/column visibility: fall back to view defaults on next selection; otherwise initial props.
    setSorting(initialSorting?.map((s) => ({ id: s.id, desc: s.desc ?? false })) || []);
    setColumnVisibility(initialColumnVisibility || {});
    setResetCounter((c) => c + 1);
  };

  const table = useReactTable({
    data: augmentedData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters: effectiveColumnFilters,
      columnVisibility,
      globalFilter,
      pagination,
    },
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // Notify consumer for server-side sorting (if desired)
        if (onSortingChangeProp) {
          onSortingChangeProp(next as Array<{ id: string; desc: boolean }>);
        }
        return next;
      });
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPagination);
      
      // If using server-side pagination, notify parent
      if (manualPagination && onPageChange) {
        onPageChange(newPagination.pageIndex + 1);
      } else {
        setInternalPage(newPagination.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    manualPagination,
    pageCount: manualPagination && total !== undefined ? Math.ceil(total / pageSize) : undefined,
    globalFilterFn: 'includesString',
  });

  // Grouping logic
  type GroupedRow = 
    | { type: 'group'; groupValue: unknown; groupData: TData[]; groupKey: string } 
    | { type: 'row'; data: TData; index: number }
    | { type: 'show-more'; groupKey: string; remainingCount: number; currentPage: number; totalPages: number };
  
  const groupedRows = useMemo<GroupedRow[]>(() => {
    if (!groupBy) {
      // No grouping - return flat rows
      return table.getRowModel().rows.map((row: any, index: number) => ({
        type: 'row' as const,
        data: row.original,
        index: row.index,
      }));
    }

    // Server-side grouping for bucket columns
    if (isServerBucketGroupActive) {
      const result: GroupedRow[] = [];
      const order = bucketGroupOrder.length ? bucketGroupOrder : Object.keys(bucketGroupBySeg || {});
      for (const segmentKey of order) {
        const g: any = (bucketGroupBySeg as any)?.[segmentKey];
        if (!g) continue;
        const groupKey = segmentKey;
        const groupValue = g.bucketLabel || segmentKey;
        const groupData: TData[] = Array.isArray(g.rows) ? (g.rows as TData[]) : [];

        result.push({ type: 'group', groupValue, groupData, groupKey });

        const isCollapsed = collapsedGroups.has(groupKey);
        if (!isCollapsed) {
          groupData.forEach((rowData, idx) => {
            result.push({ type: 'row', data: rowData, index: idx });
          });

          const total = Number(g.total || 0) || 0;
          const loaded = groupData.length;
          if (loaded < total) {
            const currentPage = Math.max(1, Number(bucketGroupPages[groupKey] || 1) || 1);
            const pageSizeEff = Number(g.pageSize || groupPageSize) || groupPageSize;
            const totalPages = Math.max(1, Math.ceil(total / pageSizeEff));
            result.push({
              type: 'show-more',
              groupKey,
              remainingCount: Math.max(0, total - loaded),
              currentPage,
              totalPages,
            });
          }
        }
      }
      return result;
    }

    const filteredRows = table.getRowModel().rows;
    
    // Group by field
    const groups = new Map<string, { groupValue: unknown; groupData: TData[] }>();
    for (const row of filteredRows) {
      const groupValue = row.original[groupBy.field] ?? null;
      const groupKey = groupValue === null ? '__null__' : String(groupValue);
      if (!groups.has(groupKey)) {
        groups.set(groupKey, { groupValue, groupData: [] });
      }
      groups.get(groupKey)!.groupData.push(row.original);
    }

    // Convert to array and sort groups
    const groupEntries = Array.from(groups.entries()).map(([key, { groupValue, groupData }]) => {
      return { key, groupValue, groupData };
    });

    // Sort groups.
    // Canonical behavior:
    // - If a function sortOrder is provided, it wins.
    // - Otherwise, prefer a corresponding "*SortOrder" field in the row data (ex: statusId -> statusSortOrder).
    // - Fallback: alphabetical by group value (nulls last).
    if (typeof groupBy.sortOrder === 'function') {
      const sortFn = groupBy.sortOrder;
      groupEntries.sort((a, b) => {
        const aOrder = sortFn(a.groupValue, a.groupData);
        const bOrder = sortFn(b.groupValue, b.groupData);
        return aOrder - bOrder;
      });
    } else {
      const field = groupBy.field;
      const baseField = field.endsWith('Id') ? field.slice(0, -2) : field;
      const candidateSortKeys = [`${field}SortOrder`, `${baseField}SortOrder`];

      const groupSortValue = (groupData: TData[]): number | null => {
        for (const sortKey of candidateSortKeys) {
          let best: number | null = null;
          for (const row of groupData) {
            const v = (row as any)?.[sortKey];
            const n = typeof v === 'number' ? v : Number(v);
            if (Number.isFinite(n)) {
              best = best === null ? n : Math.min(best, n);
            }
          }
          if (best !== null) return best;
        }
        return null;
      };

      const anyHasSort = groupEntries.some((g) => groupSortValue(g.groupData) !== null);

      groupEntries.sort((a, b) => {
        if (anyHasSort) {
          const aSort = groupSortValue(a.groupData) ?? Infinity;
          const bSort = groupSortValue(b.groupData) ?? Infinity;
          if (aSort !== bSort) return aSort - bSort;
        }
        if (a.groupValue === null && b.groupValue === null) return 0;
        if (a.groupValue === null) return 1;
        if (b.groupValue === null) return -1;
        return String(a.groupValue).localeCompare(String(b.groupValue));
      });
    }

    // Build flat structure with group headers, paginated rows, and show-more buttons
    const result: GroupedRow[] = [];
    for (const { key, groupValue, groupData } of groupEntries) {
      result.push({
        type: 'group',
        groupValue,
        groupData,
        groupKey: key,
      });
      
      // Add rows if group is not collapsed
      if (!collapsedGroups.has(key)) {
        const currentGroupPage = groupPages[key] ?? 0;
        const totalItems = groupData.length;
        const totalPages = Math.ceil(totalItems / groupPageSize);
        const startIdx = 0;
        const endIdx = (currentGroupPage + 1) * groupPageSize;
        const visibleItems = groupData.slice(startIdx, endIdx);
        const remainingCount = totalItems - endIdx;
        
        visibleItems.forEach((rowData, idx) => {
          result.push({
            type: 'row',
            data: rowData,
            index: filteredRows.findIndex((r: any) => r.original === rowData),
          });
        });
        
        // Add "show more" row if there are more items
        if (remainingCount > 0) {
          result.push({
            type: 'show-more',
            groupKey: key,
            remainingCount,
            currentPage: currentGroupPage,
            totalPages,
          });
        }
      }
    }

    return result;
  }, [groupBy, table, collapsedGroups, globalFilter, sorting, pagination, groupPages, groupPageSize, isServerBucketGroupActive, bucketGroupBySeg, bucketGroupOrder, bucketGroupPages]);

  // Export to CSV
  const handleExport = () => {
    const visibleColumns = table.getVisibleFlatColumns();
    const headers = visibleColumns
      .map((col: any) => col.columnDef.header)
      .filter(Boolean) as string[];

    const rows = table.getFilteredRowModel().rows.map((row: any) =>
      visibleColumns.map((col: any) => {
        const value = row.getValue(col.id!);
        // Handle complex values
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show loading state until both data is loaded AND view system is ready
  // This prevents the flash where data renders before the view is applied
  const showLoadingState = loading || !viewSystemReady;

  const visibleColumns = table.getVisibleFlatColumns();
  const hasData = data.length > 0;
  const showPageSizeSelector = Boolean(onPageSizeChange) && (pageSizeOptions?.length || 0) > 0;
  // Always show pagination footer when there's data (to display count)
  // The controls will be disabled if there's only one page
  const shouldShowPagination = !showLoadingState && hasData;

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {dynamicColumnsError && (
          <div
            style={styles({
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: radius.md,
              border: `1px solid ${colors.border.subtle}`,
              background: colors.bg.muted,
              color: colors.text.primary,
              fontSize: 13,
            })}
          >
            <strong style={{ marginRight: 8 }}>Dynamic columns error:</strong>
            {dynamicColumnsError}
          </div>
        )}
        {/* Toolbar */}
      {(searchable || exportable || showColumnVisibility || showRefresh || viewsEnabled || effectiveGlobalFilters.length > 0) && (
        <div style={styles({
          display: 'flex',
          gap: spacing.md,
          alignItems: 'center',
          flexWrap: 'wrap',
        })}>
          {viewsEnabled && tableId && (
            <ViewSelector 
              tableId={tableId} 
              availableColumns={[
                ...columns.map((col) => ({ 
                  key: col.key, 
                  label: col.label, 
                  // Best-effort inference so view filters "just work" even without registry entries.
                  // Particularly helpful for date-ish fields like createdAt/updatedAt/*Timestamp.
                  type:
                    col.filterType ||
                    (/(?:At|_at|On|_on|Date|_date|Timestamp|_timestamp)$/i.test(String(col.key))
                      ? ('date' as const)
                      : ('string' as const)),
                  options: col.filterOptions,
                  hideable: col.hideable !== false,
                })),
                ...Object.values(bucketColumns || {}).map((c) => ({
                  key: c.columnKey,
                  label: c.columnLabel || c.columnKey,
                  type: 'select' as const,
                  options: (c.buckets || []).map((b) => ({ value: b.bucketLabel, label: b.bucketLabel, sortOrder: b.sortOrder })),
                  hideable: true,
                })),
                ...Object.values(metricColumns || {})
                  .slice()
                  .sort((a, b) => (Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0)) || String(a?.columnLabel || a?.columnKey || '').localeCompare(String(b?.columnLabel || b?.columnKey || '')))
                  .map((c) => ({
                    key: c.columnKey,
                    label: c.columnLabel || c.columnKey,
                    type: 'number' as const,
                    hideable: true,
                  })),
              ]}
              onReady={setViewSystemReady}
              onViewChange={(view: TableView | null) => {
                currentViewIdRef.current = view?.id ?? null;
                setCurrentViewId(view?.id ?? null);
                hasInitializedSelectionRef.current = true;

                if (onViewChange) {
                  onViewChange(view as any);
                }
                if (onViewFiltersChange) {
                  onViewFiltersChange(view?.filters || []);
                }
                if (onViewFilterModeChange) {
                  const modeRaw = (view as any)?.metadata?.filterMode;
                  const mode: 'all' | 'any' = modeRaw === 'any' ? 'any' : 'all';
                  onViewFilterModeChange(mode);
                }
                if (onViewSortingChange) {
                  onViewSortingChange((view?.sorting as any) || []);
                }

                // Apply view defaults, then overlay local modifiers (per-view or pinned).
                const baseSorting: SortingState =
                  view?.sorting && Array.isArray(view.sorting)
                    ? view.sorting
                        .map((s: any) => ({ id: String(s?.id || ''), desc: Boolean(s?.desc) }))
                        .filter((s: any) => s.id)
                    : initialSorting?.map((s) => ({ id: s.id, desc: s.desc ?? false })) || [];

                const baseColumnVisibility: VisibilityState =
                  (view?.columnVisibility as any) ?? (initialColumnVisibility || {});

                const mods = readModifiers(tableId, overlayPinned ? '__pinned__' : (view?.id ?? null));
                if (mods?.sorting) setSorting(mods.sorting);
                else setSorting(baseSorting);

                if (mods?.columnVisibility) setColumnVisibility(mods.columnVisibility);
                else setColumnVisibility(baseColumnVisibility);

                // Apply groupBy from view
                const newGroupBy = view?.groupBy || null;
                setViewGroupBy(newGroupBy);
                // Reset per-group pagination when view changes
                setGroupPages({});
                if (onViewGroupByChange) {
                  onViewGroupByChange(newGroupBy);
                }
              }}
            />
          )}
          {searchable && (
            <div style={{ flex: '1', minWidth: '200px', maxWidth: '400px', position: 'relative' }}>
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  left: spacing.md,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.text.muted,
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="search"
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                style={styles({
                  width: '100%',
                  height: '36px',
                  padding: `0 ${spacing.md} 0 calc(${spacing.md} + 20px)`,
                  backgroundColor: colors.bg.elevated,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: spacing.sm,
                  color: colors.text.primary,
                  fontSize: ts.body.fontSize,
                  outline: 'none',
                  boxSizing: 'border-box',
                })}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: spacing.sm }}>
            {effectiveGlobalFilters.length > 0 && (
              <FilterDropdown
                tableId={tableId}
                persistenceKey={tableId ? getQuickFiltersKey(tableId, overlayPinned ? '__pinned__' : currentViewId) : undefined}
                resetCounter={resetCounter}
                filters={effectiveGlobalFilters}
                values={globalFilterValues}
                onChange={handleGlobalFiltersChange}
                columns={columns}
              />
            )}

            {showColumnVisibility && (
              <Dropdown
                trigger={
                  <Button variant="secondary" size="sm">
                    <Eye size={16} style={{ marginRight: spacing.xs }} />
                    Columns
                  </Button>
                }
                items={table
                  .getAllColumns()
                  .filter((col: any) => col.getCanHide())
                  .map((col: any) => {
                    // Hide "action" columns (often have empty header/label) from the column picker.
                    const header = col?.columnDef?.header;
                    const label =
                      typeof header === 'string'
                        ? header.trim()
                        : typeof header === 'number'
                          ? String(header)
                          : '';
                    if (!label) return null;
                    return {
                      label,
                      icon: col.getIsVisible() ? <Eye size={14} /> : <EyeOff size={14} />,
                      onClick: () => col.toggleVisibility(),
                    };
                  })
                  .filter(Boolean) as any}
              />
            )}

            {/* Icon-only controls grouped together on the far right */}
            <div style={styles({ display: 'flex', gap: spacing.xs, alignItems: 'center' })}>
              {showRefresh && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={onRefresh || (() => {})}
                  disabled={!onRefresh || refreshing || loading}
                  title={
                    !onRefresh
                      ? 'Refresh handler not provided'
                      : refreshing || loading
                        ? 'Refreshing…'
                        : 'Refresh'
                  }
                >
                  <RefreshCw 
                    size={16} 
                    style={{ 
                      animation: (refreshing || loading) ? 'spin 1s linear infinite' : undefined,
                    }} 
                  />
                </Button>
              )}

              {/* Overlay lock toggle: controls whether quick filters/columns/sort persist across view switches */}
              {tableId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const next = !overlayPinned;
                    setOverlayPinned(next);
                    if (overlayPinnedKey) {
                      try {
                        localStorage.setItem(overlayPinnedKey, next ? 'true' : 'false');
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  title={overlayPinned ? 'Pinned: keep filters/columns/sort across views' : 'Per-view: keep filters/columns/sort per view'}
                >
                  {overlayPinned ? <Lock size={16} /> : <Unlock size={16} />}
                </Button>
              )}

              {/* Settings dropdown (kept far-right, after refresh/lock) */}
              {exportable && (
                <Dropdown
                  align="right"
                  trigger={
                    <Button variant="secondary" size="sm" title="Settings">
                      <Settings size={16} />
                    </Button>
                  }
                  items={[
                    {
                      label: 'Reset table (local)',
                      icon: <Trash2 size={14} />,
                      onClick: () => void resetLocalTableState(),
                      disabled: !tableId,
                      danger: true,
                    },
                    {
                      label: 'Export CSV',
                      icon: <Download size={14} />,
                      onClick: handleExport,
                      disabled: !hasData,
                    },
                  ]}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert dialog (used for reset confirmation, etc.) */}
      <AlertDialog {...alertDialog.props} />

      {/* Table */}
      <div style={{ overflowX: 'auto', border: `1px solid ${colors.border.subtle}`, borderRadius: spacing.sm }}>
        {showLoadingState ? (
          <div style={styles({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing['5xl'],
            color: colors.text.muted,
            minHeight: '140px',
            backgroundColor: colors.bg.surface,
          })}>
            Loading...
          </div>
        ) : !hasData ? (
          <div style={styles({
            textAlign: 'center',
            padding: spacing['5xl'],
            color: colors.text.muted,
            fontSize: ts.body.fontSize,
          })}>
            {emptyMessage}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id} style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                  {headerGroup.headers.map((header: any) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    
                    return (
                      <th
                        key={header.id}
                        style={styles({
                          padding: `${spacing.md} ${spacing.lg}`,
                          textAlign: (header.column.columnDef.meta as any)?.align || 'left',
                          fontSize: ts.bodySmall.fontSize,
                          fontWeight: ts.label.fontWeight,
                          color: colors.text.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          cursor: canSort ? 'pointer' : 'default',
                          userSelect: 'none',
                          backgroundColor: colors.bg.surface,
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span style={{ display: 'inline-flex', flexDirection: 'column' }}>
                              {sortDirection === 'asc' ? (
                                <ChevronUp size={14} style={{ color: colors.primary.default }} />
                              ) : sortDirection === 'desc' ? (
                                <ChevronDown size={14} style={{ color: colors.primary.default }} />
                              ) : (
                                <ChevronsUpDown size={14} style={{ opacity: 0.3 }} />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {groupBy ? (
                // Render grouped rows
                groupedRows.map((item, idx) => {
                  if (item.type === 'group') {
                    const isCollapsed = collapsedGroups.has(item.groupKey);
                    const groupLabel = groupBy.renderLabel 
                      ? groupBy.renderLabel(item.groupValue, item.groupData)
                      : (() => {
                          if (item.groupValue === null) return `No ${groupBy.field}`;
                          const col: any = (columns as any[]).find((c) => c?.key === groupBy.field);
                          const opts: any[] | undefined = col?.filterOptions;
                          if (Array.isArray(opts)) {
                            const hit = opts.find((o) => String(o?.value) === String(item.groupValue));
                            if (hit?.label) return String(hit.label);
                          }
                          return String(item.groupValue);
                        })();
                    
                    return (
                      <tr
                        key={`group-${item.groupKey}`}
                        style={styles({
                          backgroundColor: colors.bg.elevated,
                          borderBottom: `2px solid ${colors.border.default}`,
                          cursor: 'pointer',
                        })}
                        onClick={() => {
                          const newCollapsed = new Set(collapsedGroups);
                          if (isCollapsed) {
                            newCollapsed.delete(item.groupKey);
                          } else {
                            newCollapsed.add(item.groupKey);
                          }
                          setCollapsedGroups(newCollapsed);
                        }}
                      >
                        <td
                          colSpan={table.getVisibleFlatColumns().length}
                          style={styles({
                            padding: `${spacing.md} ${spacing.lg}`,
                            fontSize: ts.body.fontSize,
                            fontWeight: ts.label.fontWeight,
                            color: colors.text.primary,
                          })}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                            <ChevronRightIcon
                              size={16}
                              style={{
                                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                                transition: 'transform 150ms ease',
                                color: colors.text.muted,
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
                              {typeof groupLabel === 'string' ? <span>{groupLabel}</span> : groupLabel}
                            </div>
                            <span style={{ color: colors.text.muted, fontSize: ts.bodySmall.fontSize }}>
                              {isServerBucketGroup
                                ? (() => {
                                    const total = Number((bucketGroupBySeg as any)?.[item.groupKey]?.total || 0) || 0;
                                    return `(${item.groupData.length} of ${total || item.groupData.length})`;
                                  })()
                                : `(${item.groupData.length})`}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  } else if (item.type === 'show-more') {
                    // "Show more" row for per-group pagination
                    return (
                      <tr
                        key={`show-more-${item.groupKey}`}
                        style={styles({
                          borderBottom: `1px solid ${colors.border.subtle}`,
                          backgroundColor: colors.bg.surface,
                        })}
                      >
                        <td
                          colSpan={table.getVisibleFlatColumns().length}
                          style={styles({
                            padding: `${spacing.sm} ${spacing.lg}`,
                            textAlign: 'center',
                          })}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (isServerBucketGroup) {
                                setBucketGroupPages((prev) => ({
                                  ...(prev || {}),
                                  [item.groupKey]: (prev?.[item.groupKey] ?? 1) + 1,
                                }));
                              } else {
                                setGroupPages((prev) => ({
                                  ...prev,
                                  [item.groupKey]: (prev[item.groupKey] ?? 0) + 1,
                                }));
                              }
                            }}
                          >
                            <ChevronDown size={14} style={{ marginRight: spacing.xs }} />
                            Show {Math.min(item.remainingCount, groupPageSize)} more ({item.remainingCount} remaining)
                          </Button>
                        </td>
                      </tr>
                    );
                  } else {
                    // Regular row
                    if (isServerBucketGroup) {
                      const rowData: any = item.data as any;
                      const rowKey = String(rowData?.id || rowData?.key || '') || `row-${idx}`;
                      return (
                        <tr
                          key={`row-${rowKey}-${idx}`}
                          onClick={() => onRowClick?.(rowData, idx)}
                          style={styles({
                            borderBottom: `1px solid ${colors.border.subtle}`,
                            cursor: onRowClick ? 'pointer' : 'default',
                            transition: 'background-color 150ms ease',
                          })}
                          onMouseEnter={(e) => {
                            if (onRowClick) {
                              e.currentTarget.style.backgroundColor = colors.bg.elevated;
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {table.getVisibleFlatColumns().map((col: any) => {
                            const colId = String(col?.id || '');
                            const baseCol: any = (columns as any[]).find((c) => c?.key === colId) || null;
                            const value = rowData?.[colId];
                            const content = (() => {
                              // 1) Explicit column render (feature-pack provided)
                              if (baseCol?.render) return baseCol.render(value, rowData, idx);

                              // 2) Dynamic bucket columns (segment bucket label)
                              const bucketMeta: any = (bucketColumns as any)?.[colId] || null;
                              if (bucketMeta) {
                                const idField = bucketMeta?.entityIdField || 'id';
                                const id = String(rowData?.[idField] ?? rowData?.id ?? '').trim();
                                const label = id ? (bucketValues as any)?.[colId]?.[id] : '';
                                if (label) return String(label);
                                // If the server already included a value, fall back to it
                                return value == null ? '' : String(value);
                              }

                              // 3) Dynamic metric columns (computed metric value)
                              const metricMeta: any = (metricColumns as any)?.[colId] || null;
                              if (metricMeta) {
                                const idField = metricMeta?.entityIdField || 'id';
                                const id = String(rowData?.[idField] ?? rowData?.id ?? '').trim();
                                const v = id ? (metricValues as any)?.[colId]?.[id] : undefined;
                                if (v === undefined || v === null) return '';
                                return formatMetricValue(v, metricMeta) as any;
                              }

                              // 4) Default: stringify
                              return value == null ? '' : String(value);
                            })();
                            return (
                              <td
                                key={`${rowKey}-${colId}-${idx}`}
                                style={styles({
                                  padding: `${spacing.md} ${spacing.lg}`,
                                  textAlign: (col.columnDef.meta as any)?.align || 'left',
                                  fontSize: ts.body.fontSize,
                                  color: colors.text.secondary,
                                })}
                              >
                                {content as any}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }

                    // Client row - find the corresponding table row
                    const tableRow = table.getRowModel().rows.find((r: any) => {
                      // Compare by reference or by ID if available
                      return r.original === item.data || 
                             (item.data.id && r.original.id === item.data.id);
                    });
                    
                    if (!tableRow) return null;
                    
                    return (
                      <tr
                        key={`row-${tableRow.id}-${idx}`}
                        onClick={() => onRowClick?.(tableRow.original, tableRow.index)}
                        style={styles({
                          borderBottom: `1px solid ${colors.border.subtle}`,
                          cursor: onRowClick ? 'pointer' : 'default',
                          transition: 'background-color 150ms ease',
                        })}
                        onMouseEnter={(e) => {
                          if (onRowClick) {
                            e.currentTarget.style.backgroundColor = colors.bg.elevated;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {tableRow.getVisibleCells().map((cell: any) => (
                          <td
                            key={cell.id}
                            style={styles({
                              padding: `${spacing.md} ${spacing.lg}`,
                              textAlign: (cell.column.columnDef.meta as any)?.align || 'left',
                              fontSize: ts.body.fontSize,
                              color: colors.text.secondary,
                            })}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  }
                })
              ) : (
                // Render non-grouped rows (original behavior)
                table.getRowModel().rows.map((row: any) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original, row.index)}
                    style={styles({
                      borderBottom: `1px solid ${colors.border.subtle}`,
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 150ms ease',
                    })}
                    onMouseEnter={(e) => {
                      if (onRowClick) {
                        e.currentTarget.style.backgroundColor = colors.bg.elevated;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <td
                        key={cell.id}
                        style={styles({
                          padding: `${spacing.md} ${spacing.lg}`,
                          textAlign: (cell.column.columnDef.meta as any)?.align || 'left',
                          fontSize: ts.body.fontSize,
                          color: colors.text.secondary,
                        })}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {shouldShowPagination && (
        <div style={styles({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          flexWrap: 'wrap',
        })}>
          <div style={{ fontSize: ts.bodySmall.fontSize, color: colors.text.muted }}>
            {manualPagination && total !== undefined ? (
              <>
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  total
                )}{' '}
                of {total} entries
              </>
            ) : (
              <>
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length} entries
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
            {showPageSizeSelector && (
              <Dropdown
                align="right"
                trigger={
                  <Button variant="ghost" size="sm">
                    {pageSize} / page <ChevronDown size={14} style={{ marginLeft: spacing.xs }} />
                  </Button>
                }
                items={pageSizeOptions.map((opt) => ({
                  label: `${opt} / page`,
                  onClick: () => {
                    // Reset to first page when page size changes
                    setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize: opt }));
                    if (manualPagination && onPageChange) onPageChange(1);
                    if (onPageSizeChange) onPageSizeChange(opt);
                  },
                  disabled: opt === pageSize,
                }))}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} />
            </Button>
            <div style={{ fontSize: ts.bodySmall.fontSize, color: colors.text.secondary, padding: `0 ${spacing.md}` }}>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

