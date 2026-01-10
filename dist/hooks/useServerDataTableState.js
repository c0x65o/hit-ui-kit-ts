import { useCallback, useMemo, useState } from 'react';
import { globalFilterValuesToServerFilters, mergeViewAndQuickServerFilters } from '../utils/tableQuery';
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
export function useServerDataTableState(options) {
    const { tableId, pageSize: initialPageSize = 25, initialPage = 1, initialSearch = '', initialViewFilterMode = 'all', initialSort = { sortBy: 'createdOnTimestamp', sortOrder: 'desc' }, sortWhitelist, } = options;
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [search, setSearch] = useState(initialSearch);
    const [viewFilters, setViewFilters] = useState([]);
    const [viewFilterMode, setViewFilterMode] = useState(initialViewFilterMode);
    const [quickFilterValues, setQuickFilterValues] = useState({});
    const [sort, setSort] = useState(initialSort);
    const quickFilters = useMemo(() => {
        return globalFilterValuesToServerFilters({ tableId, values: quickFilterValues });
    }, [tableId, quickFilterValues]);
    const merged = useMemo(() => {
        return mergeViewAndQuickServerFilters({
            viewFilters,
            viewFilterMode,
            quickFilters,
        });
    }, [viewFilters, viewFilterMode, quickFilters]);
    const query = useMemo(() => {
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
    const onPageChange = useCallback((next) => setPage(next), []);
    const onSearchChange = useCallback((q) => {
        setPage(1);
        setSearch(q);
    }, []);
    const onGlobalFiltersChange = useCallback((values) => {
        setPage(1);
        setQuickFilterValues(values);
    }, []);
    const onViewFiltersChange = useCallback((filters) => {
        setPage(1);
        setViewFilters((filters || []));
    }, []);
    const onViewFilterModeChange = useCallback((mode) => {
        if (mode === 'all' || mode === 'any') {
            setPage(1);
            setViewFilterMode(mode);
        }
    }, []);
    const onViewSortingChange = useCallback((sorting) => {
        const first = Array.isArray(sorting) ? sorting[0] : null;
        if (!first?.id)
            return;
        setPage(1);
        setSort({ sortBy: first.id, sortOrder: first.desc ? 'desc' : 'asc' });
    }, []);
    const onSortingChange = useCallback((sorting) => {
        const first = Array.isArray(sorting) ? sorting[0] : null;
        if (!first?.id)
            return;
        if (Array.isArray(sortWhitelist) && sortWhitelist.length > 0 && !sortWhitelist.includes(first.id)) {
            return;
        }
        setPage(1);
        setSort({ sortBy: first.id, sortOrder: first.desc ? 'desc' : 'asc' });
    }, [sortWhitelist]);
    const onPageSizeChange = useCallback((next) => {
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
            manualPagination: true,
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
//# sourceMappingURL=useServerDataTableState.js.map