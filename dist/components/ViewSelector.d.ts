import { type TableView } from '../hooks/useTableView';
import type { Principal, PrincipalType } from '../types/acl.js';
/**
 * Filter operators for table views
 */
export declare const FILTER_OPERATORS: {
    readonly EQUALS: "equals";
    readonly NOT_EQUALS: "notEquals";
    readonly CONTAINS: "contains";
    readonly NOT_CONTAINS: "notContains";
    readonly STARTS_WITH: "startsWith";
    readonly ENDS_WITH: "endsWith";
    readonly GREATER_THAN: "greaterThan";
    readonly LESS_THAN: "lessThan";
    readonly GREATER_THAN_OR_EQUAL: "greaterThanOrEqual";
    readonly LESS_THAN_OR_EQUAL: "lessThanOrEqual";
    readonly DATE_EQUALS: "dateEquals";
    readonly DATE_BEFORE: "dateBefore";
    readonly DATE_AFTER: "dateAfter";
    readonly DATE_BETWEEN: "dateBetween";
    readonly IS_NULL: "isNull";
    readonly IS_NOT_NULL: "isNotNull";
    readonly IS_TRUE: "isTrue";
    readonly IS_FALSE: "isFalse";
};
/**
 * Column definition for ViewSelector
 * Supports various field types with options for select fields
 */
export interface ViewColumnDefinition {
    key: string;
    label: string;
    /** Field type: 'string' | 'number' | 'date' | 'daterange' | 'boolean' | 'select' | 'multiselect' | 'autocomplete' */
    type?: 'string' | 'number' | 'date' | 'datetime' | 'daterange' | 'boolean' | 'select' | 'multiselect' | 'autocomplete';
    /** Options for select/multiselect fields (with optional sortOrder for grouping) */
    options?: Array<{
        value: string;
        label: string;
        sortOrder?: number;
    }>;
    /** Whether this column can be hidden (default: true) */
    hideable?: boolean;
    /** For autocomplete: search endpoint (appends ?search=query&pageSize=limit) */
    searchEndpoint?: string;
    /** For autocomplete: resolve endpoint (appends /{id} or ?id=value) */
    resolveEndpoint?: string;
    /** For autocomplete: items path in response (e.g., 'items') */
    itemsPath?: string;
    /** For autocomplete: field to use as value (default: 'id') */
    valueField?: string;
    /** For autocomplete: field to use as label (default: 'name') */
    labelField?: string;
}
interface ViewSelectorProps {
    tableId: string;
    onViewChange?: (view: TableView | null) => void;
    /** Called when view system is ready (views loaded and initial view applied) */
    onReady?: (ready: boolean) => void;
    /** Column definitions with type info and options for select fields */
    availableColumns?: ViewColumnDefinition[];
    /** Optional custom principal fetcher. If not provided, uses global fetcher from UI Kit. */
    fetchPrincipals?: (type: PrincipalType, search?: string) => Promise<Principal[]>;
}
/**
 * ViewSelector - Dropdown for selecting and managing table views
 *
 * Provides a dropdown menu showing:
 * - Default (system) views
 * - User's custom views
 * - Option to create new views
 *
 * Requires the table-views feature pack for the API backend.
 * If not installed, the component will not render.
 *
 * @example
 * ```tsx
 * <ViewSelector
 *   tableId="projects"
 *   availableColumns={columns}
 *   onViewChange={(view) => applyFilters(view?.filters || [])}
 * />
 * ```
 */
export declare function ViewSelector({ tableId, onViewChange, onReady, availableColumns, fetchPrincipals }: ViewSelectorProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ViewSelector.d.ts.map