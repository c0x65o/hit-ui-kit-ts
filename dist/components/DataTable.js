'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from 'react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender, } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Eye, EyeOff, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
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
total, page: externalPage, onPageChange, manualPagination = false, }) {
    const { colors, textStyles: ts, spacing } = useThemeTokens();
    const [sorting, setSorting] = useState(initialSorting?.map((s) => ({ id: s.id, desc: s.desc ?? false })) || []);
    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility || {});
    const [globalFilter, setGlobalFilter] = useState('');
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
    if (loading) {
        return (_jsx("div", { style: styles({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing['5xl'],
            }), children: _jsx("div", { style: { color: colors.text.muted }, children: "Loading..." }) }));
    }
    const visibleColumns = table.getVisibleFlatColumns();
    const hasData = data.length > 0;
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: spacing.lg }, children: [(searchable || exportable || showColumnVisibility) && (_jsxs("div", { style: styles({
                    display: 'flex',
                    gap: spacing.md,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }), children: [searchable && (_jsxs("div", { style: { flex: '1', minWidth: '200px', maxWidth: '400px', position: 'relative' }, children: [_jsx(Search, { size: 16, style: {
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
                                }) })] })), _jsxs("div", { style: { display: 'flex', gap: spacing.sm }, children: [showColumnVisibility && (_jsx(Dropdown, { trigger: _jsxs(Button, { variant: "secondary", size: "sm", children: [_jsx(Eye, { size: 16, style: { marginRight: spacing.xs } }), "Columns"] }), items: table
                                    .getAllColumns()
                                    .filter((col) => col.getCanHide())
                                    .map((col) => ({
                                    label: String(col.columnDef.header),
                                    icon: col.getIsVisible() ? _jsx(Eye, { size: 14 }) : _jsx(EyeOff, { size: 14 }),
                                    onClick: () => col.toggleVisibility(),
                                })) })), exportable && hasData && (_jsxs(Button, { variant: "secondary", size: "sm", onClick: handleExport, children: [_jsx(Download, { size: 16, style: { marginRight: spacing.xs } }), "Export CSV"] }))] })] })), _jsx("div", { style: { overflowX: 'auto', border: `1px solid ${colors.border.subtle}`, borderRadius: spacing.sm }, children: !hasData ? (_jsx("div", { style: styles({
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
                                }) }, headerGroup.id))) }), _jsx("tbody", { children: table.getRowModel().rows.map((row) => (_jsx("tr", { onClick: () => onRowClick?.(row.original, row.index), style: styles({
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
                                    }), children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] })) }), hasData && (manualPagination ? (total !== undefined && total > pageSize) : table.getPageCount() > 1) && (_jsxs("div", { style: styles({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                    flexWrap: 'wrap',
                }), children: [_jsx("div", { style: { fontSize: ts.bodySmall.fontSize, color: colors.text.muted }, children: manualPagination && total !== undefined ? (_jsxs(_Fragment, { children: ["Showing ", table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1, " to", ' ', Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, total), ' ', "of ", total, " entries"] })) : (_jsxs(_Fragment, { children: ["Showing ", table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1, " to", ' ', Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length), ' ', "of ", table.getFilteredRowModel().rows.length, " entries"] })) }), _jsxs("div", { style: { display: 'flex', gap: spacing.xs, alignItems: 'center' }, children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage(), children: _jsx(ChevronsLeft, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.previousPage(), disabled: !table.getCanPreviousPage(), children: _jsx(ChevronLeft, { size: 16 }) }), _jsxs("div", { style: { fontSize: ts.bodySmall.fontSize, color: colors.text.secondary, padding: `0 ${spacing.md}` }, children: ["Page ", table.getState().pagination.pageIndex + 1, " of ", table.getPageCount()] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.nextPage(), disabled: !table.getCanNextPage(), children: _jsx(ChevronRight, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage(), children: _jsx(ChevronsRight, { size: 16 }) })] })] }))] }));
}
//# sourceMappingURL=DataTable.js.map