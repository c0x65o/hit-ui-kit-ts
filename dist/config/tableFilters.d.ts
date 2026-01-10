/**
 * Centralized Table Filter Configuration
 *
 * Define filters once per tableId, and all DataTables using that tableId
 * will automatically have access to those filters.
 *
 * This avoids repeating filter configuration across 30+ pages.
 */
export interface TableFilterDefinition {
    columnKey: string;
    label: string;
    filterType: 'string' | 'number' | 'boolean' | 'date' | 'daterange' | 'select' | 'multiselect' | 'autocomplete';
    /** For select/multiselect: API endpoint to fetch options, or static options */
    optionsEndpoint?: string;
    /** For select/multiselect: static options (used if optionsEndpoint not provided) */
    staticOptions?: Array<{
        value: string;
        label: string;
    }>;
    /** For autocomplete: search endpoint (appends ?search=query&pageSize=limit) */
    searchEndpoint?: string;
    /** For autocomplete: resolve endpoint (appends /{id}) */
    resolveEndpoint?: string;
    /** Field to use as value from API response (default: 'id') */
    valueField?: string;
    /** Field to use as label from API response (default: 'name') */
    labelField?: string;
    /** Field path to extract items from API response (default: 'items') */
    itemsPath?: string;
}
export interface TableFilterConfig {
    tableId: string;
    filters: TableFilterDefinition[];
}
/**
 * Registry of all table filter configurations
 */
export declare const TABLE_FILTER_REGISTRY: Record<string, TableFilterDefinition[]>;
/**
 * Get filter configuration for a table
 */
export declare function getTableFilters(tableId: string): TableFilterDefinition[];
/**
 * Check if a table has filter configuration
 */
export declare function hasTableFilters(tableId: string): boolean;
//# sourceMappingURL=tableFilters.d.ts.map