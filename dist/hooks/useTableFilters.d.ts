import type { GlobalFilterConfig } from '../types';
/**
 * Hook that automatically builds filter configurations from the centralized registry.
 *
 * Features:
 * - Automatically fetches options for select/multiselect filters
 * - Smart switching: autocomplete filters with <= 20 options become dropdowns
 * - Handles both path-based (/endpoint/{id}) and query-based (/endpoint?id=) resolve
 *
 * Usage:
 * ```tsx
 * const { filters, loading } = useTableFilters('crm.activities');
 *
 * <DataTable
 *   tableId="crm.activities"
 *   showGlobalFilters
 *   globalFilters={filters}  // Auto-configured filters!
 *   ...
 * />
 * ```
 */
export declare function useTableFilters(tableId: string | undefined): {
    filters: GlobalFilterConfig[];
    loading: boolean;
    hasFilters: boolean;
};
//# sourceMappingURL=useTableFilters.d.ts.map