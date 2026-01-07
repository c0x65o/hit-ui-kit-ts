import { useCallback, useMemo, useState } from 'react';
import type { ServerTableFilter } from '../utils/tableQuery';
import { globalFilterValuesToServerFilters, mergeViewAndQuickServerFilters } from '../utils/tableQuery';

export interface ServerDataTableSort {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ServerDataTableQuery {
  page: number;
  pageSize: number;
  search: string;
  filters: ServerTableFilter[];
  filterMode: 'all' | 'any';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface UseServerDataTableStateOptions {
  tableId: string;
  pageSize?: number;
  initialPage?: number;
  initialSearch?: string;
  initialViewFilterMode?: 'all' | 'any';
  initialSort?: ServerDataTableSort;
  /**
   * Optional whitelist for server-side sortable fields.
   * If provided, header-click sorting will be ignored unless the field is in the whitelist.
   */
  sortWhitelist?: string[];
}

/**
 * useServerDataTableState
 *
 * Opinionated state glue for "mostly server-driven" DataTable usage.
 *
 * Responsibilities:
 * - Manage page/search/sort state for server requests
 * - Convert DataTable quick filter values into server filters based on tableId registry
 * - Merge view filters and quick filters with predictable semantics
 * - Provide stable DataTable callback props that reset page to 1 when appropriate
 */
export function useServerDataTableState(options: UseServerDataTableStateOptions) {
  const {
    tableId,
    pageSize: initialPageSize = 25,
    initialPage = 1,
    initialSearch = '',
    initialViewFilterMode = 'all',
    initialSort = { sortBy: 'createdOnTimestamp', sortOrder: 'desc' },
    sortWhitelist,
  } = options;

  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [search, setSearch] = useState<string>(initialSearch);

  const [viewFilters, setViewFilters] = useState<ServerTableFilter[]>([]);
  const [viewFilterMode, setViewFilterMode] = useState<'all' | 'any'>(initialViewFilterMode);

  const [quickFilterValues, setQuickFilterValues] = useState<Record<string, string | string[]>>({});

  const [sort, setSort] = useState<ServerDataTableSort>(initialSort);

  const quickFilters = useMemo<ServerTableFilter[]>(() => {
    return globalFilterValuesToServerFilters({ tableId, values: quickFilterValues });
  }, [tableId, quickFilterValues]);

  const merged = useMemo(() => {
    return mergeViewAndQuickServerFilters({
      viewFilters,
      viewFilterMode,
      quickFilters,
    });
  }, [viewFilters, viewFilterMode, quickFilters]);

  const query: ServerDataTableQuery = useMemo(() => {
    return {
      page,
      pageSize,
      search,
      filters: merged.filters,
      filterMode: merged.filterMode,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    };
  }, [page, pageSize, search, merged.filters, merged.filterMode, sort.sortBy, sort.sortOrder]);

  // DataTable callback props
  const onPageChange = useCallback((next: number) => setPage(next), []);

  const onSearchChange = useCallback((q: string) => {
    setPage(1);
    setSearch(q);
  }, []);

  const onGlobalFiltersChange = useCallback((values: Record<string, string | string[]>) => {
    setPage(1);
    setQuickFilterValues(values);
  }, []);

  const onViewFiltersChange = useCallback((filters: any[]) => {
    setPage(1);
    setViewFilters((filters || []) as ServerTableFilter[]);
  }, []);

  const onViewFilterModeChange = useCallback((mode: string) => {
    if (mode === 'all' || mode === 'any') {
      setPage(1);
      setViewFilterMode(mode);
    }
  }, []);

  const onViewSortingChange = useCallback((sorting: Array<{ id: string; desc?: boolean }>) => {
    const first = Array.isArray(sorting) ? sorting[0] : null;
    if (!first?.id) return;
    setPage(1);
    setSort({ sortBy: first.id, sortOrder: first.desc ? 'desc' : 'asc' });
  }, []);

  const onSortingChange = useCallback(
    (sorting: Array<{ id: string; desc: boolean }>) => {
      const first = Array.isArray(sorting) ? sorting[0] : null;
      if (!first?.id) return;
      if (Array.isArray(sortWhitelist) && sortWhitelist.length > 0 && !sortWhitelist.includes(first.id)) {
        return;
      }
      setPage(1);
      setSort({ sortBy: first.id, sortOrder: first.desc ? 'desc' : 'asc' });
    },
    [sortWhitelist]
  );

  const onPageSizeChange = useCallback((next: number) => {
    setPage(1);
    setPageSize(next);
  }, []);

  return {
    // Query object for server requests
    query,

    // Raw state (for advanced cases)
    page,
    pageSize,
    search,
    sort,
    viewFilters,
    viewFilterMode,
    quickFilterValues,

    // State setters (escape hatches)
    setPage,
    setPageSize,
    setSearch,
    setSort,
    setViewFilters,
    setViewFilterMode,
    setQuickFilterValues,

    // Pre-wired DataTable props
    dataTable: {
      tableId,
      manualPagination: true as const,
      page,
      pageSize,
      onPageChange,
      onPageSizeChange,
      onSearchChange,
      onGlobalFiltersChange,
      onViewFiltersChange,
      onViewFilterModeChange,
      onViewSortingChange,
      onSortingChange,
    },
  };
}

