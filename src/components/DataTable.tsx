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
  // Server-side pagination
  total,
  page: externalPage,
  onPageChange,
  manualPagination = false,
  // Refresh
  onRefresh,
  refreshing = false,
  // Grouping
  groupBy,
  // View system
  tableId,
  enableViews = false,
  onViewFiltersChange,
}: DataTableProps<TData>) {
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
      const groups = new Set<string>();
      for (const row of data) {
        const groupValue = row[groupBy.field] ?? null;
        const groupKey = groupValue === null ? '__null__' : String(groupValue);
        groups.add(groupKey);
      }
      setCollapsedGroups(groups);
    }
  }, [groupBy?.defaultCollapsed, groupBy?.field, data]);

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
  type GroupedRow = { type: 'group'; groupValue: unknown; groupData: TData[]; groupKey: string } | { type: 'row'; data: TData; index: number };
  
  const groupedRows = useMemo<GroupedRow[]>(() => {
    if (!groupBy) {
      // No grouping - return flat rows
      return table.getRowModel().rows.map((row: any, index: number) => ({
        type: 'row' as const,
        data: row.original,
        index: row.index,
      }));
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

    // Sort groups according to sortOrder
    if (groupBy.sortOrder) {
      if (Array.isArray(groupBy.sortOrder)) {
        // Array-based sort order
        const orderMap = new Map(groupBy.sortOrder.map((val, idx) => [String(val), idx]));
        groupEntries.sort((a, b) => {
          const aOrder = orderMap.get(a.key) ?? Infinity;
          const bOrder = orderMap.get(b.key) ?? Infinity;
          if (aOrder !== Infinity || bOrder !== Infinity) {
            return aOrder - bOrder;
          }
          // If not in sort order array, sort by key
          return String(a.groupValue ?? '').localeCompare(String(b.groupValue ?? ''));
        });
      } else if (typeof groupBy.sortOrder === 'function') {
        // Function-based sort order
        const sortFn = groupBy.sortOrder;
        groupEntries.sort((a, b) => {
          const aOrder = sortFn(a.groupValue, a.groupData);
          const bOrder = sortFn(b.groupValue, b.groupData);
          return aOrder - bOrder;
        });
      }
    } else {
      // Default: sort by group value
      groupEntries.sort((a, b) => {
        if (a.groupValue === null && b.groupValue === null) return 0;
        if (a.groupValue === null) return 1;
        if (b.groupValue === null) return -1;
        return String(a.groupValue).localeCompare(String(b.groupValue));
      });
    }

    // Build flat structure with group headers and rows
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
        groupData.forEach((rowData, idx) => {
          result.push({
            type: 'row',
            data: rowData,
            index: filteredRows.findIndex((r: any) => r.original === rowData),
          });
        });
      }
    }

    return result;
  }, [groupBy, table, collapsedGroups, globalFilter, sorting, pagination]);

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
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* Toolbar */}
      {(searchable || exportable || showColumnVisibility || onRefresh || enableViews) && (
        <div style={styles({
          display: 'flex',
          gap: spacing.md,
          alignItems: 'center',
          flexWrap: 'wrap',
        })}>
          {enableViews && tableId && (
            <ViewSelector 
              tableId={tableId} 
              availableColumns={columns.map((col) => ({ key: col.key, label: col.label, type: 'string' }))}
              onViewChange={(view: TableView | null) => {
                if (onViewFiltersChange) {
                  onViewFiltersChange(view?.filters || []);
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
            {onRefresh && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onRefresh}
                disabled={refreshing || loading}
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
              {groupBy ? (
                // Render grouped rows
                groupedRows.map((item, idx) => {
                  if (item.type === 'group') {
                    const isCollapsed = collapsedGroups.has(item.groupKey);
                    const groupLabel = groupBy.renderLabel 
                      ? groupBy.renderLabel(item.groupValue, item.groupData)
                      : item.groupValue === null 
                        ? 'No Stage' 
                        : String(item.groupValue);
                    
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
                              ({item.groupData.length})
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  } else {
                    // Regular row - find the corresponding table row
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
      {hasData && (manualPagination ? (total !== undefined && total > pageSize) : table.getPageCount() > 1) && (
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
