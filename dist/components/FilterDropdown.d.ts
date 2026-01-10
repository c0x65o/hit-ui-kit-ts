import type { GlobalFilterConfig } from '../types';
export interface FilterDropdownProps {
    /** Table ID for localStorage persistence */
    tableId?: string;
    /**
     * Optional explicit persistence key for localStorage.
     * When provided, this is used instead of `hit:table-filters:${tableId}`.
     * Useful for persisting quick filters per-view (tableId + viewId) to avoid "fighting"
     * between view filters and quick filters when switching views.
     */
    persistenceKey?: string;
    /**
     * Increment to force a local reset of enabled filters + values.
     * Used by DataTable "Reset table" to immediately reflect cleared localStorage.
     */
    resetCounter?: number;
    /** Filter configurations */
    filters: GlobalFilterConfig[];
    /** Current filter values */
    values: Record<string, string | string[]>;
    /** Called when filter values change */
    onChange: (values: Record<string, string | string[]>) => void;
    /** Column definitions for label/type resolution */
    columns: Array<{
        key: string;
        label: string;
        filterType?: 'string' | 'number' | 'boolean' | 'date' | 'daterange' | 'select' | 'multiselect' | 'autocomplete';
        filterOptions?: Array<{
            value: string;
            label: string;
            sortOrder?: number;
        }>;
        onSearch?: (query: string, limit: number) => Promise<Array<{
            value: string;
            label: string;
            description?: string;
        }>>;
        resolveValue?: (value: string) => Promise<{
            value: string;
            label: string;
            description?: string;
        } | null>;
    }>;
}
/**
 * FilterDropdown - A button + popover component for managing table filters
 *
 * Features:
 * - Button shows "Filters" with badge when filters are active
 * - Clicking opens a popover with all available filters
 * - Add/remove active filters
 * - Persists filter state to localStorage per tableId
 * - Supports all filter types: string, number, date, daterange, boolean, select, multiselect, autocomplete
 */
export declare function FilterDropdown({ tableId, persistenceKey, resetCounter, filters, values, onChange, columns }: FilterDropdownProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=FilterDropdown.d.ts.map