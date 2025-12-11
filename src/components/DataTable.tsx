'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Button } from './Button';
import { Input } from './Input';
import { Dropdown } from './Dropdown';
import type { DataTableProps } from '../types';

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
  initialSorting,
  initialColumnVisibility,
}: DataTableProps<TData>) {
  const { colors, textStyles: ts, spacing } = useThemeTokens();
  
  const [sorting, setSorting] = useState<SortingState>(
    initialSorting?.map((s) => ({ id: s.id, desc: s.desc ?? false })) || []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility || {});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  // Convert columns to TanStack Table format
  const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
    return columns.map((col) => ({
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
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  });

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

  if (loading) {
    return (
      <div style={styles({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['5xl'],
      })}>
        <div style={{ color: colors.text.muted }}>
          Loading...
        </div>
      </div>
    );
  }

  const visibleColumns = table.getVisibleFlatColumns();
  const hasData = data.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Toolbar */}
      {(searchable || exportable || showColumnVisibility) && (
        <div style={styles({
          display: 'flex',
          gap: spacing.md,
          alignItems: 'center',
          flexWrap: 'wrap',
        })}>
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
                  padding: `0 ${spacing.md} 0 ${spacing['2xl']}`,
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
        {!hasData ? (
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
              {table.getRowModel().rows.map((row: any) => (
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {hasData && table.getPageCount() > 1 && (
        <div style={styles({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          flexWrap: 'wrap',
        })}>
          <div style={{ fontSize: ts.bodySmall.fontSize, color: colors.text.muted }}>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </div>

          <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
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
  );
}
