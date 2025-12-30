'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import type { DataTableProps } from '../types';
import type { TableView } from '../hooks/useTableView';

type BucketColumnDef = {
  columnKey: string;
  columnLabel: string;
  entityKind: string | null;
  entityIdField: string;
  buckets: Array<{ segmentKey: string; bucketLabel: string; sortOrder: number }>;
};

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
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  initialSorting,
  initialColumnVisibility,
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
  const { colors, textStyles: ts, spacing } = useThemeTokens();
  
  const [sorting, setSorting] = useState<SortingState>(
    initialSorting?.map((s) => ({ id: s.id, desc: s.desc ?? false })) || []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility || {});
  const [globalFilter, setGlobalFilter] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    // Initialize collapsed groups if defaultCollapsed is true
    // We'll populate this after we have data
    return new Set();
  });
  
  // View-based groupBy (overrides prop when set by view)
  const [viewGroupBy, setViewGroupBy] = useState<{ field: string; sortOrder?: string[] } | null>(null);
  
  // Per-group pagination state: { groupKey: currentPage }
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});
  
  // Track if view system is ready (to prevent flash before view is applied)
  const [viewSystemReady, setViewSystemReady] = useState(!viewsEnabled);

  // Segment bucket columns (discovered via metrics-core, keyed by columnKey)
  const [bucketColumns, setBucketColumns] = useState<Record<string, BucketColumnDef>>({});
  const [bucketColumnsLoaded, setBucketColumnsLoaded] = useState(false);

  // Per-row evaluated bucket values for current page: { [columnKey]: { [entityId]: bucketLabel } }
  const [bucketValues, setBucketValues] = useState<Record<string, Record<string, string>>>({});

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
        const res = await fetch(`/api/metrics/segments/table-buckets?tableId=${encodeURIComponent(tableId)}`, { method: 'GET' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setBucketColumns({});
            setBucketColumnsLoaded(true);
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
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewsEnabled, tableId]);

  // Ensure newly discovered bucket columns default to hidden unless already specified.
  useEffect(() => {
    if (!bucketColumnsLoaded) return;
    const keys = Object.keys(bucketColumns || {});
    if (!keys.length) return;
    setColumnVisibility((prev) => {
      const next = { ...(prev || {}) } as any;
      let changed = false;
      for (const k of keys) {
        if (next[k] === undefined) {
          next[k] = false;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [bucketColumnsLoaded, bucketColumns]);

  // Evaluate bucket labels for visible bucket columns on current page rows (best-effort, non-sorting).
  useEffect(() => {
    if (!tableId) return;
    const visibleBucketKeys = Object.keys(bucketColumns || {}).filter((k) => (columnVisibility as any)?.[k] === true);
    if (!visibleBucketKeys.length) return;

    const MAX = 500;
    const idsByCol: Record<string, string[]> = {};
    for (const k of visibleBucketKeys) {
      const meta = bucketColumns[k];
      const idField = meta?.entityIdField || 'id';
      const ids = (data || [])
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
  }, [tableId, data, bucketColumns, columnVisibility]);

  const augmentedData = useMemo(() => {
    const dynKeys = Object.keys(bucketColumns || {});
    if (!dynKeys.length) return data;
    const activeCols = Object.keys(bucketValues || {});
    if (!activeCols.length) return data;
    return (data || []).map((row: any) => {
      const next = { ...(row as any) };
      for (const colKey of activeCols) {
        const meta = bucketColumns[colKey];
        const idField = meta?.entityIdField || 'id';
        const id = String((row as any)?.[idField] ?? '').trim();
        if (!id) continue;
        const label = bucketValues[colKey]?.[id];
        if (label) next[colKey] = label;
      }
      return next as TData;
    });
  }, [data, bucketColumns, bucketValues]);

  const bucketGroupMeta = groupBy && tableId ? bucketColumns[groupBy.field] : null;
  const isServerBucketGroup = Boolean(groupBy && tableId && bucketGroupMeta && bucketGroupMeta.entityKind);

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
    if (groupBy?.defaultCollapsed && isServerBucketGroup) {
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
  }, [groupBy?.defaultCollapsed, groupBy?.field, data, isServerBucketGroup, bucketGroupOrder, bucketGroupBySeg]);

  // Convert columns to TanStack Table format
  const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
    const base = columns.map((col) => ({
      id: col.key,
      accessorKey: col.key,
      header: col.label,
      cell: ({ row, getValue }: { row: any; getValue: () => any }) => {
        const value = getValue();
        if (col.render) {
          return col.render(value, row.original, row.index);
        }
        return value as React.ReactNode;
      },
      enableSorting: col.sortable !== false,
      enableHiding: col.hideable !== false,
    }));

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

    return [...base, ...dyn] as any;
  }, [columns, bucketColumns]);

  const table = useReactTable({
    data: augmentedData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
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
    if (isServerBucketGroup) {
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
  }, [groupBy, table, collapsedGroups, globalFilter, sorting, pagination, groupPages, groupPageSize, isServerBucketGroup, bucketGroupBySeg, bucketGroupOrder, bucketGroupPages]);

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
  const shouldShowPagination =
    !showLoadingState &&
    hasData &&
    (manualPagination ? total !== undefined : table.getPageCount() > 1 || showPageSizeSelector);

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* Toolbar */}
      {(searchable || exportable || showColumnVisibility || showRefresh || viewsEnabled) && (
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
                  type: col.filterType || 'string',
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
              ]}
              onReady={setViewSystemReady}
              onViewChange={(view: TableView | null) => {
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
                // Apply sorting from view (as default sort)
                if (view?.sorting && Array.isArray(view.sorting)) {
                  setSorting(view.sorting.map((s: any) => ({ id: String(s?.id || ''), desc: Boolean(s?.desc) })).filter((s: any) => s.id));
                }
                // Apply column visibility from view
                if (view?.columnVisibility) {
                  setColumnVisibility(view.columnVisibility);
                }
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
            {showRefresh && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onRefresh || (() => {})}
                disabled={!onRefresh || refreshing || loading}
                title={!onRefresh ? 'Refresh handler not provided' : undefined}
              >
                <RefreshCw 
                  size={16} 
                  style={{ 
                    marginRight: spacing.xs,
                    animation: (refreshing || loading) ? 'spin 1s linear infinite' : undefined,
                  }} 
                />
                Refresh
              </Button>
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
                  .map((col: any) => ({
                    label: String(col.columnDef.header),
                    icon: col.getIsVisible() ? <Eye size={14} /> : <EyeOff size={14} />,
                    onClick: () => col.toggleVisibility(),
                  }))}
              />
            )}

            {exportable && hasData && (
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download size={16} style={{ marginRight: spacing.xs }} />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      )}

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
                            const content = baseCol?.render ? baseCol.render(value, rowData, idx) : (value == null ? '' : String(value));
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
