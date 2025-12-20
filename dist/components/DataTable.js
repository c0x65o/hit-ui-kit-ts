'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from 'react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender, } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Eye, EyeOff, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, ChevronRight as ChevronRightIcon, } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { ViewSelector } from './ViewSelector';
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
export function DataTable({ columns, data, searchable = true, exportable = true, showColumnVisibility = true, onRowClick, emptyMessage = 'No data available', loading = false, pageSize = 10, initialSorting, initialColumnVisibility, 
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
    const { colors, textStyles: ts, spacing } = useThemeTokens();
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
    // Per-group pagination state: { groupKey: currentPage }
    const [groupPages, setGroupPages] = useState({});
    // Track if view system is ready (to prevent flash before view is applied)
    const [viewSystemReady, setViewSystemReady] = useState(!viewsEnabled);
    // Effective groupBy - view setting takes precedence over prop
    const groupBy = viewGroupBy ? {
        field: viewGroupBy.field,
        sortOrder: viewGroupBy.sortOrder,
        renderLabel: groupByProp?.renderLabel,
        defaultCollapsed: groupByProp?.defaultCollapsed,
    } : groupByProp;
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
        if (groupBy?.defaultCollapsed && data.length > 0) {
            const groups = new Set();
            for (const row of data) {
                const groupValue = row[groupBy.field] ?? null;
                const groupKey = groupValue === null ? '__null__' : String(groupValue);
                groups.add(groupKey);
            }
            setCollapsedGroups(groups);
        }
    }, [groupBy?.defaultCollapsed, groupBy?.field, data]);
    // Convert columns to TanStack Table format
    const tableColumns = useMemo(() => {
        return columns.map((col) => ({
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
    }, [columns]);
    const table = useReactTable({
        data,
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
    }, [groupBy, table, collapsedGroups, globalFilter, sorting, pagination, groupPages, groupPageSize]);
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
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: spacing.lg }, children: [(searchable || exportable || showColumnVisibility || showRefresh || viewsEnabled) && (_jsxs("div", { style: styles({
                            display: 'flex',
                            gap: spacing.md,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }), children: [viewsEnabled && tableId && (_jsx(ViewSelector, { tableId: tableId, availableColumns: columns.map((col) => ({
                                    key: col.key,
                                    label: col.label,
                                    type: col.filterType || 'string',
                                    options: col.filterOptions,
                                    hideable: col.hideable !== false,
                                })), onReady: setViewSystemReady, onViewChange: (view) => {
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
                                    // Apply sorting from view (as default sort)
                                    if (view?.sorting && Array.isArray(view.sorting)) {
                                        setSorting(view.sorting.map((s) => ({ id: String(s?.id || ''), desc: Boolean(s?.desc) })).filter((s) => s.id));
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
                                            .map((col) => ({
                                            label: String(col.columnDef.header),
                                            icon: col.getIsVisible() ? _jsx(Eye, { size: 14 }) : _jsx(EyeOff, { size: 14 }),
                                            onClick: () => col.toggleVisibility(),
                                        })) })), exportable && hasData && (_jsxs(Button, { variant: "secondary", size: "sm", onClick: handleExport, children: [_jsx(Download, { size: 16, style: { marginRight: spacing.xs } }), "Export CSV"] }))] })] })), _jsx("div", { style: { overflowX: 'auto', border: `1px solid ${colors.border.subtle}`, borderRadius: spacing.sm }, children: showLoadingState ? (_jsx("div", { style: styles({
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
                                                                } }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: spacing.xs, flex: 1 }, children: typeof groupLabel === 'string' ? _jsx("span", { children: groupLabel }) : groupLabel }), _jsxs("span", { style: { color: colors.text.muted, fontSize: ts.bodySmall.fontSize }, children: ["(", item.groupData.length, ")"] })] }) }) }, `group-${item.groupKey}`));
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
                                                            setGroupPages((prev) => ({
                                                                ...prev,
                                                                [item.groupKey]: (prev[item.groupKey] ?? 0) + 1,
                                                            }));
                                                        }, children: [_jsx(ChevronDown, { size: 14, style: { marginRight: spacing.xs } }), "Show ", Math.min(item.remainingCount, groupPageSize), " more (", item.remainingCount, " remaining)"] }) }) }, `show-more-${item.groupKey}`));
                                        }
                                        else {
                                            // Regular row - find the corresponding table row
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
                                            }), children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id)))) })] })) }), !showLoadingState && hasData && (manualPagination ? (total !== undefined && total > pageSize) : table.getPageCount() > 1) && (_jsxs("div", { style: styles({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: spacing.md,
                            flexWrap: 'wrap',
                        }), children: [_jsx("div", { style: { fontSize: ts.bodySmall.fontSize, color: colors.text.muted }, children: manualPagination && total !== undefined ? (_jsxs(_Fragment, { children: ["Showing ", table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1, " to", ' ', Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, total), ' ', "of ", total, " entries"] })) : (_jsxs(_Fragment, { children: ["Showing ", table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1, " to", ' ', Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length), ' ', "of ", table.getFilteredRowModel().rows.length, " entries"] })) }), _jsxs("div", { style: { display: 'flex', gap: spacing.xs, alignItems: 'center' }, children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage(), children: _jsx(ChevronsLeft, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.previousPage(), disabled: !table.getCanPreviousPage(), children: _jsx(ChevronLeft, { size: 16 }) }), _jsxs("div", { style: { fontSize: ts.bodySmall.fontSize, color: colors.text.secondary, padding: `0 ${spacing.md}` }, children: ["Page ", table.getState().pagination.pageIndex + 1, " of ", table.getPageCount()] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.nextPage(), disabled: !table.getCanNextPage(), children: _jsx(ChevronRight, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage(), children: _jsx(ChevronsRight, { size: 16 }) })] })] }))] })] }));
}
//# sourceMappingURL=DataTable.js.map