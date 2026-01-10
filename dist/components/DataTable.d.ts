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
export declare function DataTable<TData extends Record<string, unknown>>({ columns, data, searchable, exportable, showColumnVisibility, searchDebounceMs, onSearchChange, onRowClick, emptyMessage, loading, pageSize, pageSizeOptions, onPageSizeChange, initialSorting, initialColumnVisibility, onSortingChange: onSortingChangeProp, showGlobalFilters, globalFilters, onGlobalFiltersChange, total, page: externalPage, onPageChange, manualPagination, onRefresh, refreshing, showRefresh, // Default to showing refresh button
groupBy: groupByProp, groupPageSize, tableId, enableViews, onViewFiltersChange, onViewFilterModeChange, onViewGroupByChange, onViewSortingChange, onViewChange, fetchPrincipals, }: DataTableProps<TData>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DataTable.d.ts.map