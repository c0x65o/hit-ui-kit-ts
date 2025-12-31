'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect, useRef } from 'react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender, } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Eye, EyeOff, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, ChevronRight as ChevronRightIcon, } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { ViewSelector } from './ViewSelector';
function formatMetricValue(value, meta) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n))
        return '';
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
        }
        catch {
            // fallback
            return `$${n.toFixed(maxFrac)}`;
        }
    }
    try {
        return new Intl.NumberFormat(undefined, {
            minimumFractionDigits: minFrac,
            maximumFractionDigits: maxFrac,
        }).format(n);
    }
    catch {
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
export function DataTable({ columns, data, searchable = true, exportable = true, showColumnVisibility = true, onRowClick, emptyMessage = 'No data available', loading = false, pageSize = 10, pageSizeOptions = [10, 25, 50, 100], onPageSizeChange, initialSorting, initialColumnVisibility, 
// Server-side pagination
total, page: externalPage, onPageChange, manualPagination = false, 
// Refresh
onRefresh, refreshing = false, showRefresh = true, // Default to showing refresh button
// Grouping
groupBy: groupByProp, groupPageSize = 5, 
// View system
tableId, enableViews, onViewFiltersChange, onViewFilterModeChange, onViewGroupByChange, onViewSortingChange, onViewChange, }) {
    // Auto-enable views if tableId is provided (unless explicitly disabled)
    const viewsEnabled = enableViews !== undefined ? enableViews : !!tableId;
    const { colors, textStyles: ts, spacing, radius } = useThemeTokens();
    const [sorting, setSorting] = useState(initialSorting?.map((s) => ({ id: s.id, desc: s.desc ?? false })) || []);
    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility || {});
    const [globalFilter, setGlobalFilter] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState(() => {
        // Initialize collapsed groups if defaultCollapsed is true
        // We'll populate this after we have data
        return new Set();
    });
    // View-based groupBy (overrides prop when set by view)
    const [viewGroupBy, setViewGroupBy] = useState(null);
    // Persist per-table+per-view "modifiers" (column visibility + sorting) in localStorage.
    // This is intentionally local-only so it can apply on top of public/system/shared views.
    const currentViewIdRef = useRef(null); // null = "All Items"
    const hasInitializedSelectionRef = useRef(false);
    const getModifiersKey = (tid, vid) => `hit:table-modifiers:${tid}:${vid ?? '__all__'}`;
    const readModifiers = (tid, vid) => {
        if (typeof window === 'undefined')
            return null;
        try {
            const raw = localStorage.getItem(getModifiersKey(tid, vid));
            if (!raw)
                return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        }
        catch {
            return null;
        }
    };
    const writeModifiers = (tid, vid, mods) => {
        if (typeof window === 'undefined')
            return;
        try {
            localStorage.setItem(getModifiersKey(tid, vid), JSON.stringify({ sorting: mods.sorting, columnVisibility: mods.columnVisibility, updatedAt: new Date().toISOString() }));
        }
        catch {
            // Ignore localStorage failures
        }
    };
    // Per-group pagination state: { groupKey: currentPage }
    const [groupPages, setGroupPages] = useState({});
    // Track if view system is ready (to prevent flash before view is applied)
    const [viewSystemReady, setViewSystemReady] = useState(!viewsEnabled);
    // Persist modifiers whenever the user changes sorting/columns after initial view selection.
    useEffect(() => {
        if (!viewsEnabled || !tableId)
            return;
        if (!viewSystemReady)
            return;
        if (!hasInitializedSelectionRef.current)
            return;
        writeModifiers(tableId, currentViewIdRef.current, { sorting, columnVisibility });
    }, [viewsEnabled, tableId, viewSystemReady, sorting, columnVisibility]);
    // For now, we only enforce "no best-effort + auto-show" on projects.
    // Easy to extend later (e.g. CRM) without changing domain feature packs.
    const strictDynamicColumns = tableId === 'projects';
    const autoShowDynamicColumns = tableId === 'projects';
    const [dynamicColumnsError, setDynamicColumnsError] = useState(null);
    // Segment bucket columns (discovered via metrics-core, keyed by columnKey)
    const [bucketColumns, setBucketColumns] = useState({});
    const [bucketColumnsLoaded, setBucketColumnsLoaded] = useState(false);
    // Per-row evaluated bucket values for current page: { [columnKey]: { [entityId]: bucketLabel } }
    const [bucketValues, setBucketValues] = useState({});
    // Metric computed columns (discovered via metrics-core, keyed by columnKey)
    const [metricColumns, setMetricColumns] = useState({});
    const [metricColumnsLoaded, setMetricColumnsLoaded] = useState(false);
    // Per-row evaluated metric values for current page: { [columnKey]: { [entityId]: number } }
    const [metricValues, setMetricValues] = useState({});
    // Server-side bucket grouping state (only used when grouping by a bucket column)
    const [bucketGroupLoading, setBucketGroupLoading] = useState(false);
    const [bucketGroupError, setBucketGroupError] = useState(null);
    const [bucketGroupPages, setBucketGroupPages] = useState({});
    const [bucketGroupBySeg, setBucketGroupBySeg] = useState({});
    const [bucketGroupOrder, setBucketGroupOrder] = useState([]);
    // Effective groupBy - view setting takes precedence over prop
    const groupBy = viewGroupBy ? {
        field: viewGroupBy.field,
        sortOrder: viewGroupBy.sortOrder,
        renderLabel: groupByProp?.renderLabel,
        defaultCollapsed: groupByProp?.defaultCollapsed,
    } : groupByProp;
    // Discover bucket columns for this tableId (best-effort; failures are silent).
    useEffect(() => {
        if (!viewsEnabled || !tableId)
            return;
        let cancelled = false;
        (async () => {
            try {
                if (!cancelled && strictDynamicColumns)
                    setDynamicColumnsError(null);
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
                const next = {};
                for (const c of cols) {
                    const columnKey = typeof c?.columnKey === 'string' ? c.columnKey.trim() : '';
                    if (!columnKey)
                        continue;
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
                            .map((b) => ({
                            segmentKey: String(b?.segmentKey || '').trim(),
                            bucketLabel: String(b?.bucketLabel || '').trim(),
                            sortOrder: Number(b?.sortOrder ?? 0) || 0,
                        }))
                            .filter((b) => b.segmentKey && b.bucketLabel),
                    };
                }
                if (!cancelled) {
                    setBucketColumns(next);
                    setBucketColumnsLoaded(true);
                }
            }
            catch {
                if (!cancelled) {
                    setBucketColumns({});
                    setBucketColumnsLoaded(true);
                    if (strictDynamicColumns)
                        setDynamicColumnsError((prev) => prev || 'Failed to load bucket columns');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [viewsEnabled, tableId]);
    // Discover metric columns for this tableId (best-effort; failures are silent).
    useEffect(() => {
        if (!viewsEnabled || !tableId)
            return;
        let cancelled = false;
        (async () => {
            try {
                if (!cancelled && strictDynamicColumns)
                    setDynamicColumnsError(null);
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
                const next = {};
                for (const c of cols) {
                    const columnKey = typeof c?.columnKey === 'string' ? c.columnKey.trim() : '';
                    if (!columnKey)
                        continue;
                    const columnLabel = typeof c?.columnLabel === 'string' && c.columnLabel.trim() ? c.columnLabel.trim() : columnKey;
                    const entityKind = typeof c?.entityKind === 'string' ? c.entityKind.trim() : null;
                    const entityIdField = typeof c?.entityIdField === 'string' && c.entityIdField.trim() ? c.entityIdField.trim() : 'id';
                    const metricKey = typeof c?.metricKey === 'string' ? c.metricKey.trim() : '';
                    if (!metricKey)
                        continue;
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
                        decimals: Number.isFinite(decimals) ? decimals : null,
                        sortOrder,
                    };
                }
                if (!cancelled) {
                    setMetricColumns(next);
                    setMetricColumnsLoaded(true);
                }
            }
            catch {
                if (!cancelled) {
                    setMetricColumns({});
                    setMetricColumnsLoaded(true);
                    if (strictDynamicColumns)
                        setDynamicColumnsError((prev) => prev || 'Failed to load metric columns');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [viewsEnabled, tableId]);
    // Ensure newly discovered bucket columns default to hidden (or visible for strict tables) unless already specified.
    useEffect(() => {
        if (!bucketColumnsLoaded)
            return;
        const keys = Object.keys(bucketColumns || {});
        if (!keys.length)
            return;
        setColumnVisibility((prev) => {
            const next = { ...(prev || {}) };
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
        if (!metricColumnsLoaded)
            return;
        const keys = Object.keys(metricColumns || {});
        if (!keys.length)
            return;
        setColumnVisibility((prev) => {
            const next = { ...(prev || {}) };
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
        if (!tableId)
            return;
        const visibleBucketKeys = Object.keys(bucketColumns || {}).filter((k) => columnVisibility?.[k] === true);
        // Ensure we evaluate the groupBy bucket column even when it's hidden so client-side grouping can still work.
        const groupField = groupBy?.field;
        if (groupField && bucketColumns?.[groupField] && !visibleBucketKeys.includes(groupField)) {
            visibleBucketKeys.push(groupField);
        }
        if (!visibleBucketKeys.length)
            return;
        const bucketGroupMetaLocal = groupBy && tableId ? bucketColumns[groupBy.field] : null;
        const isServerBucketGroupLocal = Boolean(groupBy && tableId && bucketGroupMetaLocal && bucketGroupMetaLocal.entityKind && !bucketGroupError);
        const serverRows = isServerBucketGroupLocal
            ? Object.values(bucketGroupBySeg || {}).flatMap((g) => (Array.isArray(g?.rows) ? g.rows : []))
            : [];
        const sourceRows = isServerBucketGroupLocal ? serverRows : (data || []);
        const MAX = 500;
        const idsByCol = {};
        for (const k of visibleBucketKeys) {
            const meta = bucketColumns[k];
            const idField = meta?.entityIdField || 'id';
            const ids = (sourceRows || [])
                .map((row) => String(row?.[idField] ?? '').trim())
                .filter(Boolean)
                .slice(0, MAX);
            if (ids.length)
                idsByCol[k] = ids;
        }
        const colKeys = Object.keys(idsByCol);
        if (!colKeys.length)
            return;
        let cancelled = false;
        (async () => {
            for (const colKey of colKeys) {
                const meta = bucketColumns[colKey];
                const entityKind = meta?.entityKind || '';
                if (!entityKind)
                    continue;
                try {
                    const res = await fetch('/api/metrics/segments/table-buckets/evaluate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tableId, columnKey: colKey, entityKind, entityIds: idsByCol[colKey] }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok)
                        continue;
                    const values = json?.data?.values && typeof json.data.values === 'object' ? json.data.values : {};
                    const map = {};
                    for (const [id, val] of Object.entries(values)) {
                        const x = val;
                        const label = x && typeof x === 'object' && typeof x.bucketLabel === 'string' ? x.bucketLabel : '';
                        if (label)
                            map[String(id)] = label;
                    }
                    if (!cancelled) {
                        setBucketValues((prev) => ({ ...(prev || {}), [colKey]: map }));
                    }
                }
                catch {
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
        if (!tableId)
            return;
        const visibleMetricKeys = Object.keys(metricColumns || {}).filter((k) => columnVisibility?.[k] === true);
        if (!visibleMetricKeys.length)
            return;
        const bucketGroupMetaLocal = groupBy && tableId ? bucketColumns[groupBy.field] : null;
        const isServerBucketGroupLocal = Boolean(groupBy && tableId && bucketGroupMetaLocal && bucketGroupMetaLocal.entityKind && !bucketGroupError);
        const serverRows = isServerBucketGroupLocal
            ? Object.values(bucketGroupBySeg || {}).flatMap((g) => (Array.isArray(g?.rows) ? g.rows : []))
            : [];
        const sourceRows = isServerBucketGroupLocal ? serverRows : (data || []);
        const MAX = 500;
        const idsByCol = {};
        for (const k of visibleMetricKeys) {
            const meta = metricColumns[k];
            const idField = meta?.entityIdField || 'id';
            const ids = (sourceRows || [])
                .map((row) => String(row?.[idField] ?? '').trim())
                .filter(Boolean)
                .slice(0, MAX);
            if (ids.length)
                idsByCol[k] = ids;
        }
        const colKeys = Object.keys(idsByCol);
        if (!colKeys.length)
            return;
        let cancelled = false;
        (async () => {
            for (const colKey of colKeys) {
                const meta = metricColumns[colKey];
                const entityKind = meta?.entityKind || '';
                if (!entityKind)
                    continue;
                try {
                    const res = await fetch('/api/metrics/segments/table-metrics/evaluate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tableId, columnKey: colKey, entityKind, entityIds: idsByCol[colKey] }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok)
                        continue;
                    const values = json?.data?.values && typeof json.data.values === 'object' ? json.data.values : {};
                    const map = {};
                    for (const [id, val] of Object.entries(values)) {
                        const n = typeof val === 'number' ? val : Number(val);
                        if (!Number.isFinite(n))
                            continue;
                        map[String(id)] = n;
                    }
                    if (!cancelled) {
                        setMetricValues((prev) => ({ ...(prev || {}), [colKey]: map }));
                    }
                }
                catch {
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
        if (!bucketKeys.length && !metricKeys.length)
            return data;
        const activeBucketCols = Object.keys(bucketValues || {});
        const activeMetricCols = Object.keys(metricValues || {});
        if (!activeBucketCols.length && !activeMetricCols.length)
            return data;
        return (data || []).map((row) => {
            const next = { ...row };
            for (const colKey of activeBucketCols) {
                const meta = bucketColumns[colKey];
                const idField = meta?.entityIdField || 'id';
                const id = String(row?.[idField] ?? '').trim();
                if (!id)
                    continue;
                const label = bucketValues[colKey]?.[id];
                if (label)
                    next[colKey] = label;
            }
            for (const colKey of activeMetricCols) {
                const meta = metricColumns[colKey];
                const idField = meta?.entityIdField || 'id';
                const id = String(row?.[idField] ?? '').trim();
                if (!id)
                    continue;
                const v = metricValues[colKey]?.[id];
                if (v === undefined)
                    continue;
                next[colKey] = v;
            }
            return next;
        });
    }, [data, bucketColumns, bucketValues, metricColumns, metricValues]);
    const bucketGroupMeta = groupBy && tableId ? bucketColumns[groupBy.field] : null;
    const isServerBucketGroup = Boolean(groupBy && tableId && bucketGroupMeta && bucketGroupMeta.entityKind);
    // If server-side bucket grouping fails (common for non-admin users), fall back to client-side rows
    // rather than rendering an empty table.
    const isServerBucketGroupActive = isServerBucketGroup && !bucketGroupError;
    async function fetchBucketGroups(pages) {
        if (!tableId || !groupBy || !bucketGroupMeta?.entityKind)
            return;
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
            if (!res.ok)
                throw new Error(json?.error || `grouped-buckets ${res.status}`);
            const buckets = Array.isArray(json?.data?.buckets) ? json.data.buckets : [];
            // Merge pages into accumulated rows.
            setBucketGroupBySeg((prev) => {
                const next = { ...(prev || {}) };
                for (const b of buckets) {
                    const segmentKey = String(b?.segmentKey || '').trim();
                    if (!segmentKey)
                        continue;
                    const bucketLabel = String(b?.bucketLabel || '').trim() || segmentKey;
                    const sortOrder = Number(b?.sortOrder ?? 0) || 0;
                    const total = Number(b?.total ?? 0) || 0;
                    const pageSizeResp = Number(b?.pageSize ?? groupPageSize) || groupPageSize;
                    const page = Number(b?.page ?? 1) || 1;
                    const rows = Array.isArray(b?.rows) ? b.rows : [];
                    const prior = next[segmentKey];
                    const idField = bucketGroupMeta.entityIdField || 'id';
                    const normId = (r) => String(r?.[idField] ?? r?.id ?? '').trim();
                    let mergedRows = rows;
                    if (page > 1 && prior && Array.isArray(prior.rows)) {
                        const seen = new Set(prior.rows.map(normId).filter(Boolean));
                        mergedRows = [...prior.rows];
                        for (const r of rows) {
                            const id = normId(r);
                            if (!id || seen.has(id))
                                continue;
                            seen.add(id);
                            mergedRows.push(r);
                        }
                    }
                    if (page === 1)
                        mergedRows = rows;
                    next[segmentKey] = { segmentKey, bucketLabel, sortOrder, total, pageSize: pageSizeResp, rows: mergedRows };
                }
                return next;
            });
            const order = buckets
                .map((b) => ({ segmentKey: String(b?.segmentKey || '').trim(), sortOrder: Number(b?.sortOrder ?? 0) || 0, bucketLabel: String(b?.bucketLabel || '').trim() }))
                .filter((b) => b.segmentKey)
                .sort((a, b) => (a.sortOrder - b.sortOrder) || a.bucketLabel.localeCompare(b.bucketLabel) || a.segmentKey.localeCompare(b.segmentKey))
                .map((b) => b.segmentKey);
            setBucketGroupOrder(order);
        }
        catch (e) {
            setBucketGroupError(String(e?.message || 'Failed to load bucket groups'));
        }
        finally {
            setBucketGroupLoading(false);
        }
    }
    // Load server-side bucket grouping when grouping by a bucket column.
    useEffect(() => {
        if (!isServerBucketGroup)
            return;
        setBucketGroupBySeg({});
        setBucketGroupOrder([]);
        setBucketGroupPages({});
        fetchBucketGroups({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isServerBucketGroup, tableId, groupBy?.field, groupPageSize]);
    // When a bucket group's page changes, fetch more rows.
    useEffect(() => {
        if (!isServerBucketGroup)
            return;
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
            const groups = new Set();
            for (const row of data) {
                const groupValue = row[groupBy.field] ?? null;
                const groupKey = groupValue === null ? '__null__' : String(groupValue);
                groups.add(groupKey);
            }
            setCollapsedGroups(groups);
        }
    }, [groupBy?.defaultCollapsed, groupBy?.field, data, isServerBucketGroupActive, bucketGroupOrder, bucketGroupBySeg]);
    // Convert columns to TanStack Table format
    const tableColumns = useMemo(() => {
        const base = columns.map((col) => ({
            id: col.key,
            accessorKey: col.key,
            header: col.label,
            cell: ({ row, getValue }) => {
                const value = getValue();
                if (col.render) {
                    return col.render(value, row.original, row.index);
                }
                return value;
            },
            enableSorting: col.sortable !== false,
            enableHiding: col.hideable !== false,
        }));
        const dyn = Object.values(bucketColumns || {}).map((c) => ({
            id: c.columnKey,
            accessorKey: c.columnKey,
            header: c.columnLabel || c.columnKey,
            cell: ({ getValue }) => {
                const v = getValue();
                return (v ? String(v) : '');
            },
            enableSorting: false,
            enableHiding: true,
        }));
        const metricDyn = Object.values(metricColumns || {}).map((c) => ({
            id: c.columnKey,
            accessorKey: c.columnKey,
            header: c.columnLabel || c.columnKey,
            cell: ({ getValue }) => {
                const v = getValue();
                return formatMetricValue(v, c);
            },
            enableSorting: true,
            enableHiding: true,
        }));
        return [...base, ...dyn, ...metricDyn];
    }, [columns, bucketColumns, metricColumns]);
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
            }
            else {
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
    const groupedRows = useMemo(() => {
        if (!groupBy) {
            // No grouping - return flat rows
            return table.getRowModel().rows.map((row, index) => ({
                type: 'row',
                data: row.original,
                index: row.index,
            }));
        }
        // Server-side grouping for bucket columns
        if (isServerBucketGroupActive) {
            const result = [];
            const order = bucketGroupOrder.length ? bucketGroupOrder : Object.keys(bucketGroupBySeg || {});
            for (const segmentKey of order) {
                const g = bucketGroupBySeg?.[segmentKey];
                if (!g)
                    continue;
                const groupKey = segmentKey;
                const groupValue = g.bucketLabel || segmentKey;
                const groupData = Array.isArray(g.rows) ? g.rows : [];
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
        const groups = new Map();
        for (const row of filteredRows) {
            const groupValue = row.original[groupBy.field] ?? null;
            const groupKey = groupValue === null ? '__null__' : String(groupValue);
            if (!groups.has(groupKey)) {
                groups.set(groupKey, { groupValue, groupData: [] });
            }
            groups.get(groupKey).groupData.push(row.original);
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
        }
        else {
            const field = groupBy.field;
            const baseField = field.endsWith('Id') ? field.slice(0, -2) : field;
            const candidateSortKeys = [`${field}SortOrder`, `${baseField}SortOrder`];
            const groupSortValue = (groupData) => {
                for (const sortKey of candidateSortKeys) {
                    let best = null;
                    for (const row of groupData) {
                        const v = row?.[sortKey];
                        const n = typeof v === 'number' ? v : Number(v);
                        if (Number.isFinite(n)) {
                            best = best === null ? n : Math.min(best, n);
                        }
                    }
                    if (best !== null)
                        return best;
                }
                return null;
            };
            const anyHasSort = groupEntries.some((g) => groupSortValue(g.groupData) !== null);
            groupEntries.sort((a, b) => {
                if (anyHasSort) {
                    const aSort = groupSortValue(a.groupData) ?? Infinity;
                    const bSort = groupSortValue(b.groupData) ?? Infinity;
                    if (aSort !== bSort)
                        return aSort - bSort;
                }
                if (a.groupValue === null && b.groupValue === null)
                    return 0;
                if (a.groupValue === null)
                    return 1;
                if (b.groupValue === null)
                    return -1;
                return String(a.groupValue).localeCompare(String(b.groupValue));
            });
        }
        // Build flat structure with group headers, paginated rows, and show-more buttons
        const result = [];
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
                        index: filteredRows.findIndex((r) => r.original === rowData),
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
            .map((col) => col.columnDef.header)
            .filter(Boolean);
        const rows = table.getFilteredRowModel().rows.map((row) => visibleColumns.map((col) => {
            const value = row.getValue(col.id);
            // Handle complex values
            if (value === null || value === undefined)
                return '';
            if (typeof value === 'object')
                return JSON.stringify(value);
            return String(value);
        }));
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
    const shouldShowPagination = !showLoadingState &&
        hasData &&
        (manualPagination ? total !== undefined : table.getPageCount() > 1 || showPageSizeSelector);
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: spacing.lg }, children: [dynamicColumnsError && (_jsxs("div", { style: styles({
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderRadius: radius.md,
                            border: `1px solid ${colors.border.subtle}`,
                            background: colors.bg.muted,
                            color: colors.text.primary,
                            fontSize: 13,
                        }), children: [_jsx("strong", { style: { marginRight: 8 }, children: "Dynamic columns error:" }), dynamicColumnsError] })), (searchable || exportable || showColumnVisibility || showRefresh || viewsEnabled) && (_jsxs("div", { style: styles({
                            display: 'flex',
                            gap: spacing.md,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }), children: [viewsEnabled && tableId && (_jsx(ViewSelector, { tableId: tableId, availableColumns: [
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
                                        type: 'select',
                                        options: (c.buckets || []).map((b) => ({ value: b.bucketLabel, label: b.bucketLabel, sortOrder: b.sortOrder })),
                                        hideable: true,
                                    })),
                                    ...Object.values(metricColumns || {})
                                        .slice()
                                        .sort((a, b) => (Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0)) || String(a?.columnLabel || a?.columnKey || '').localeCompare(String(b?.columnLabel || b?.columnKey || '')))
                                        .map((c) => ({
                                        key: c.columnKey,
                                        label: c.columnLabel || c.columnKey,
                                        type: 'number',
                                        hideable: true,
                                    })),
                                ], onReady: setViewSystemReady, onViewChange: (view) => {
                                    currentViewIdRef.current = view?.id ?? null;
                                    hasInitializedSelectionRef.current = true;
                                    if (onViewChange) {
                                        onViewChange(view);
                                    }
                                    if (onViewFiltersChange) {
                                        onViewFiltersChange(view?.filters || []);
                                    }
                                    if (onViewFilterModeChange) {
                                        const modeRaw = view?.metadata?.filterMode;
                                        const mode = modeRaw === 'any' ? 'any' : 'all';
                                        onViewFilterModeChange(mode);
                                    }
                                    if (onViewSortingChange) {
                                        onViewSortingChange(view?.sorting || []);
                                    }
                                    // Apply view defaults, then overlay local modifiers (per-view).
                                    const baseSorting = view?.sorting && Array.isArray(view.sorting)
                                        ? view.sorting
                                            .map((s) => ({ id: String(s?.id || ''), desc: Boolean(s?.desc) }))
                                            .filter((s) => s.id)
                                        : initialSorting?.map((s) => ({ id: s.id, desc: s.desc ?? false })) || [];
                                    const baseColumnVisibility = view?.columnVisibility ?? (initialColumnVisibility || {});
                                    const mods = readModifiers(tableId, view?.id ?? null);
                                    if (mods?.sorting)
                                        setSorting(mods.sorting);
                                    else
                                        setSorting(baseSorting);
                                    if (mods?.columnVisibility)
                                        setColumnVisibility(mods.columnVisibility);
                                    else
                                        setColumnVisibility(baseColumnVisibility);
                                    // Apply groupBy from view
                                    const newGroupBy = view?.groupBy || null;
                                    setViewGroupBy(newGroupBy);
                                    // Reset per-group pagination when view changes
                                    setGroupPages({});
                                    if (onViewGroupByChange) {
                                        onViewGroupByChange(newGroupBy);
                                    }
                                } })), searchable && (_jsxs("div", { style: { flex: '1', minWidth: '200px', maxWidth: '400px', position: 'relative' }, children: [_jsx(Search, { size: 16, style: {
                                            position: 'absolute',
                                            left: spacing.md,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: colors.text.muted,
                                            zIndex: 1,
                                            pointerEvents: 'none',
                                        } }), _jsx("input", { type: "search", placeholder: "Search...", value: globalFilter, onChange: (e) => setGlobalFilter(e.target.value), style: styles({
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
                                        }) })] })), _jsxs("div", { style: { display: 'flex', gap: spacing.sm }, children: [showRefresh && (_jsxs(Button, { variant: "secondary", size: "sm", onClick: onRefresh || (() => { }), disabled: !onRefresh || refreshing || loading, title: !onRefresh ? 'Refresh handler not provided' : undefined, children: [_jsx(RefreshCw, { size: 16, style: {
                                                    marginRight: spacing.xs,
                                                    animation: (refreshing || loading) ? 'spin 1s linear infinite' : undefined,
                                                } }), "Refresh"] })), showColumnVisibility && (_jsx(Dropdown, { trigger: _jsxs(Button, { variant: "secondary", size: "sm", children: [_jsx(Eye, { size: 16, style: { marginRight: spacing.xs } }), "Columns"] }), items: table
                                            .getAllColumns()
                                            .filter((col) => col.getCanHide())
                                            .map((col) => {
                                            // Hide "action" columns (often have empty header/label) from the column picker.
                                            const header = col?.columnDef?.header;
                                            const label = typeof header === 'string'
                                                ? header.trim()
                                                : typeof header === 'number'
                                                    ? String(header)
                                                    : '';
                                            if (!label)
                                                return null;
                                            return {
                                                label,
                                                icon: col.getIsVisible() ? _jsx(Eye, { size: 14 }) : _jsx(EyeOff, { size: 14 }),
                                                onClick: () => col.toggleVisibility(),
                                            };
                                        })
                                            .filter(Boolean) })), exportable && hasData && (_jsxs(Button, { variant: "secondary", size: "sm", onClick: handleExport, children: [_jsx(Download, { size: 16, style: { marginRight: spacing.xs } }), "Export CSV"] }))] })] })), _jsx("div", { style: { overflowX: 'auto', border: `1px solid ${colors.border.subtle}`, borderRadius: spacing.sm }, children: showLoadingState ? (_jsx("div", { style: styles({
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: spacing['5xl'],
                                color: colors.text.muted,
                                minHeight: '140px',
                                backgroundColor: colors.bg.surface,
                            }), children: "Loading..." })) : !hasData ? (_jsx("div", { style: styles({
                                textAlign: 'center',
                                padding: spacing['5xl'],
                                color: colors.text.muted,
                                fontSize: ts.body.fontSize,
                            }), children: emptyMessage })) : (_jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: table.getHeaderGroups().map((headerGroup) => (_jsx("tr", { style: { borderBottom: `1px solid ${colors.border.subtle}` }, children: headerGroup.headers.map((header) => {
                                            const canSort = header.column.getCanSort();
                                            const sortDirection = header.column.getIsSorted();
                                            return (_jsx("th", { style: styles({
                                                    padding: `${spacing.md} ${spacing.lg}`,
                                                    textAlign: header.column.columnDef.meta?.align || 'left',
                                                    fontSize: ts.bodySmall.fontSize,
                                                    fontWeight: ts.label.fontWeight,
                                                    color: colors.text.muted,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    cursor: canSort ? 'pointer' : 'default',
                                                    userSelect: 'none',
                                                    backgroundColor: colors.bg.surface,
                                                }), onClick: header.column.getToggleSortingHandler(), children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: spacing.xs }, children: [flexRender(header.column.columnDef.header, header.getContext()), canSort && (_jsx("span", { style: { display: 'inline-flex', flexDirection: 'column' }, children: sortDirection === 'asc' ? (_jsx(ChevronUp, { size: 14, style: { color: colors.primary.default } })) : sortDirection === 'desc' ? (_jsx(ChevronDown, { size: 14, style: { color: colors.primary.default } })) : (_jsx(ChevronsUpDown, { size: 14, style: { opacity: 0.3 } })) }))] }) }, header.id));
                                        }) }, headerGroup.id))) }), _jsx("tbody", { children: groupBy ? (
                                    // Render grouped rows
                                    groupedRows.map((item, idx) => {
                                        if (item.type === 'group') {
                                            const isCollapsed = collapsedGroups.has(item.groupKey);
                                            const groupLabel = groupBy.renderLabel
                                                ? groupBy.renderLabel(item.groupValue, item.groupData)
                                                : (() => {
                                                    if (item.groupValue === null)
                                                        return `No ${groupBy.field}`;
                                                    const col = columns.find((c) => c?.key === groupBy.field);
                                                    const opts = col?.filterOptions;
                                                    if (Array.isArray(opts)) {
                                                        const hit = opts.find((o) => String(o?.value) === String(item.groupValue));
                                                        if (hit?.label)
                                                            return String(hit.label);
                                                    }
                                                    return String(item.groupValue);
                                                })();
                                            return (_jsx("tr", { style: styles({
                                                    backgroundColor: colors.bg.elevated,
                                                    borderBottom: `2px solid ${colors.border.default}`,
                                                    cursor: 'pointer',
                                                }), onClick: () => {
                                                    const newCollapsed = new Set(collapsedGroups);
                                                    if (isCollapsed) {
                                                        newCollapsed.delete(item.groupKey);
                                                    }
                                                    else {
                                                        newCollapsed.add(item.groupKey);
                                                    }
                                                    setCollapsedGroups(newCollapsed);
                                                }, children: _jsx("td", { colSpan: table.getVisibleFlatColumns().length, style: styles({
                                                        padding: `${spacing.md} ${spacing.lg}`,
                                                        fontSize: ts.body.fontSize,
                                                        fontWeight: ts.label.fontWeight,
                                                        color: colors.text.primary,
                                                    }), children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: spacing.sm }, children: [_jsx(ChevronRightIcon, { size: 16, style: {
                                                                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                                                                    transition: 'transform 150ms ease',
                                                                    color: colors.text.muted,
                                                                } }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: spacing.xs, flex: 1 }, children: typeof groupLabel === 'string' ? _jsx("span", { children: groupLabel }) : groupLabel }), _jsx("span", { style: { color: colors.text.muted, fontSize: ts.bodySmall.fontSize }, children: isServerBucketGroup
                                                                    ? (() => {
                                                                        const total = Number(bucketGroupBySeg?.[item.groupKey]?.total || 0) || 0;
                                                                        return `(${item.groupData.length} of ${total || item.groupData.length})`;
                                                                    })()
                                                                    : `(${item.groupData.length})` })] }) }) }, `group-${item.groupKey}`));
                                        }
                                        else if (item.type === 'show-more') {
                                            // "Show more" row for per-group pagination
                                            return (_jsx("tr", { style: styles({
                                                    borderBottom: `1px solid ${colors.border.subtle}`,
                                                    backgroundColor: colors.bg.surface,
                                                }), children: _jsx("td", { colSpan: table.getVisibleFlatColumns().length, style: styles({
                                                        padding: `${spacing.sm} ${spacing.lg}`,
                                                        textAlign: 'center',
                                                    }), children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => {
                                                            if (isServerBucketGroup) {
                                                                setBucketGroupPages((prev) => ({
                                                                    ...(prev || {}),
                                                                    [item.groupKey]: (prev?.[item.groupKey] ?? 1) + 1,
                                                                }));
                                                            }
                                                            else {
                                                                setGroupPages((prev) => ({
                                                                    ...prev,
                                                                    [item.groupKey]: (prev[item.groupKey] ?? 0) + 1,
                                                                }));
                                                            }
                                                        }, children: [_jsx(ChevronDown, { size: 14, style: { marginRight: spacing.xs } }), "Show ", Math.min(item.remainingCount, groupPageSize), " more (", item.remainingCount, " remaining)"] }) }) }, `show-more-${item.groupKey}`));
                                        }
                                        else {
                                            // Regular row
                                            if (isServerBucketGroup) {
                                                const rowData = item.data;
                                                const rowKey = String(rowData?.id || rowData?.key || '') || `row-${idx}`;
                                                return (_jsx("tr", { onClick: () => onRowClick?.(rowData, idx), style: styles({
                                                        borderBottom: `1px solid ${colors.border.subtle}`,
                                                        cursor: onRowClick ? 'pointer' : 'default',
                                                        transition: 'background-color 150ms ease',
                                                    }), onMouseEnter: (e) => {
                                                        if (onRowClick) {
                                                            e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                                        }
                                                    }, onMouseLeave: (e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }, children: table.getVisibleFlatColumns().map((col) => {
                                                        const colId = String(col?.id || '');
                                                        const baseCol = columns.find((c) => c?.key === colId) || null;
                                                        const value = rowData?.[colId];
                                                        const content = (() => {
                                                            // 1) Explicit column render (feature-pack provided)
                                                            if (baseCol?.render)
                                                                return baseCol.render(value, rowData, idx);
                                                            // 2) Dynamic bucket columns (segment bucket label)
                                                            const bucketMeta = bucketColumns?.[colId] || null;
                                                            if (bucketMeta) {
                                                                const idField = bucketMeta?.entityIdField || 'id';
                                                                const id = String(rowData?.[idField] ?? rowData?.id ?? '').trim();
                                                                const label = id ? bucketValues?.[colId]?.[id] : '';
                                                                if (label)
                                                                    return String(label);
                                                                // If the server already included a value, fall back to it
                                                                return value == null ? '' : String(value);
                                                            }
                                                            // 3) Dynamic metric columns (computed metric value)
                                                            const metricMeta = metricColumns?.[colId] || null;
                                                            if (metricMeta) {
                                                                const idField = metricMeta?.entityIdField || 'id';
                                                                const id = String(rowData?.[idField] ?? rowData?.id ?? '').trim();
                                                                const v = id ? metricValues?.[colId]?.[id] : undefined;
                                                                if (v === undefined || v === null)
                                                                    return '';
                                                                return formatMetricValue(v, metricMeta);
                                                            }
                                                            // 4) Default: stringify
                                                            return value == null ? '' : String(value);
                                                        })();
                                                        return (_jsx("td", { style: styles({
                                                                padding: `${spacing.md} ${spacing.lg}`,
                                                                textAlign: col.columnDef.meta?.align || 'left',
                                                                fontSize: ts.body.fontSize,
                                                                color: colors.text.secondary,
                                                            }), children: content }, `${rowKey}-${colId}-${idx}`));
                                                    }) }, `row-${rowKey}-${idx}`));
                                            }
                                            // Client row - find the corresponding table row
                                            const tableRow = table.getRowModel().rows.find((r) => {
                                                // Compare by reference or by ID if available
                                                return r.original === item.data ||
                                                    (item.data.id && r.original.id === item.data.id);
                                            });
                                            if (!tableRow)
                                                return null;
                                            return (_jsx("tr", { onClick: () => onRowClick?.(tableRow.original, tableRow.index), style: styles({
                                                    borderBottom: `1px solid ${colors.border.subtle}`,
                                                    cursor: onRowClick ? 'pointer' : 'default',
                                                    transition: 'background-color 150ms ease',
                                                }), onMouseEnter: (e) => {
                                                    if (onRowClick) {
                                                        e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                                    }
                                                }, onMouseLeave: (e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }, children: tableRow.getVisibleCells().map((cell) => (_jsx("td", { style: styles({
                                                        padding: `${spacing.md} ${spacing.lg}`,
                                                        textAlign: cell.column.columnDef.meta?.align || 'left',
                                                        fontSize: ts.body.fontSize,
                                                        color: colors.text.secondary,
                                                    }), children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, `row-${tableRow.id}-${idx}`));
                                        }
                                    })) : (
                                    // Render non-grouped rows (original behavior)
                                    table.getRowModel().rows.map((row) => (_jsx("tr", { onClick: () => onRowClick?.(row.original, row.index), style: styles({
                                            borderBottom: `1px solid ${colors.border.subtle}`,
                                            cursor: onRowClick ? 'pointer' : 'default',
                                            transition: 'background-color 150ms ease',
                                        }), onMouseEnter: (e) => {
                                            if (onRowClick) {
                                                e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                            }
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }, children: row.getVisibleCells().map((cell) => (_jsx("td", { style: styles({
                                                padding: `${spacing.md} ${spacing.lg}`,
                                                textAlign: cell.column.columnDef.meta?.align || 'left',
                                                fontSize: ts.body.fontSize,
                                                color: colors.text.secondary,
                                            }), children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id)))) })] })) }), shouldShowPagination && (_jsxs("div", { style: styles({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: spacing.md,
                            flexWrap: 'wrap',
                        }), children: [_jsx("div", { style: { fontSize: ts.bodySmall.fontSize, color: colors.text.muted }, children: manualPagination && total !== undefined ? (_jsxs(_Fragment, { children: ["Showing ", table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1, " to", ' ', Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, total), ' ', "of ", total, " entries"] })) : (_jsxs(_Fragment, { children: ["Showing ", table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1, " to", ' ', Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length), ' ', "of ", table.getFilteredRowModel().rows.length, " entries"] })) }), _jsxs("div", { style: { display: 'flex', gap: spacing.xs, alignItems: 'center' }, children: [showPageSizeSelector && (_jsx(Dropdown, { align: "right", trigger: _jsxs(Button, { variant: "ghost", size: "sm", children: [pageSize, " / page ", _jsx(ChevronDown, { size: 14, style: { marginLeft: spacing.xs } })] }), items: pageSizeOptions.map((opt) => ({
                                            label: `${opt} / page`,
                                            onClick: () => {
                                                // Reset to first page when page size changes
                                                setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize: opt }));
                                                if (manualPagination && onPageChange)
                                                    onPageChange(1);
                                                if (onPageSizeChange)
                                                    onPageSizeChange(opt);
                                            },
                                            disabled: opt === pageSize,
                                        })) })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage(), children: _jsx(ChevronsLeft, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.previousPage(), disabled: !table.getCanPreviousPage(), children: _jsx(ChevronLeft, { size: 16 }) }), _jsxs("div", { style: { fontSize: ts.bodySmall.fontSize, color: colors.text.secondary, padding: `0 ${spacing.md}` }, children: ["Page ", table.getState().pagination.pageIndex + 1, " of ", table.getPageCount()] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.nextPage(), disabled: !table.getCanNextPage(), children: _jsx(ChevronRight, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage(), children: _jsx(ChevronsRight, { size: 16 }) })] })] }))] })] }));
}
//# sourceMappingURL=DataTable.js.map