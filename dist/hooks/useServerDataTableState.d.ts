import type { ServerTableFilter } from '../utils/tableQuery';
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
export declare function useServerDataTableState(options: UseServerDataTableStateOptions): {
    query: ServerDataTableQuery;
    page: number;
    pageSize: number;
    search: string;
    sort: ServerDataTableSort;
    viewFilters: ServerTableFilter[];
    viewFilterMode: "all" | "any";
    quickFilterValues: Record<string, string | string[]>;
    setPage: import("react").Dispatch<import("react").SetStateAction<number>>;
    setPageSize: import("react").Dispatch<import("react").SetStateAction<number>>;
    setSearch: import("react").Dispatch<import("react").SetStateAction<string>>;
    setSort: import("react").Dispatch<import("react").SetStateAction<ServerDataTableSort>>;
    setViewFilters: import("react").Dispatch<import("react").SetStateAction<ServerTableFilter[]>>;
    setViewFilterMode: import("react").Dispatch<import("react").SetStateAction<"all" | "any">>;
    setQuickFilterValues: import("react").Dispatch<import("react").SetStateAction<Record<string, string | string[]>>>;
    dataTable: {
        tableId: string;
        manualPagination: true;
        page: number;
        pageSize: number;
        onPageChange: (next: number) => void;
        onPageSizeChange: (next: number) => void;
        onSearchChange: (q: string) => void;
        onGlobalFiltersChange: (values: Record<string, string | string[]>) => void;
        onViewFiltersChange: (filters: any[]) => void;
        onViewFilterModeChange: (mode: string) => void;
        onViewSortingChange: (sorting: Array<{
            id: string;
            desc?: boolean;
        }>) => void;
        onSortingChange: (sorting: Array<{
            id: string;
            desc: boolean;
        }>) => void;
    };
};
//# sourceMappingURL=useServerDataTableState.d.ts.map