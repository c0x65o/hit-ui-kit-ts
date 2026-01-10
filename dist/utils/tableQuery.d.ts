export type GlobalFilterValues = Record<string, string | string[]>;
/**
 * The minimal filter shape used by the table views system and server-side filter parsing.
 */
export interface ServerTableFilter {
    field: string;
    operator: string;
    value: any;
}
/**
 * Convert DataTable "quick filter" values (from `onGlobalFiltersChange`) into server-compatible filters.
 *
 * Behavior:
 * - string filters -> `contains`
 * - select/autocomplete -> `equals`
 * - multiselect -> `in` with array value
 * - date -> `dateEquals`
 * - daterange -> splits "from|to" into `dateAfter` + `dateBefore`
 * - boolean -> `isTrue` / `isFalse`
 * - number -> `equals` (number when parseable)
 *
 * Notes:
 * - For best results, pass a `tableId` that exists in `TABLE_FILTER_REGISTRY` so types are known.
 * - Unknown keys fall back to:
 *   - array => `in`
 *   - string => `contains`
 */
export declare function globalFilterValuesToServerFilters(args: {
    tableId?: string;
    values: GlobalFilterValues;
}): ServerTableFilter[];
/**
 * Merge server/view filters with quick filters.
 *
 * Rules:
 * - Quick filters override view filters on the same field
 * - If any quick filters exist, use AND semantics ('all') for predictability
 */
export declare function mergeViewAndQuickServerFilters(args: {
    viewFilters: ServerTableFilter[];
    viewFilterMode: 'all' | 'any';
    quickFilters: ServerTableFilter[];
}): {
    filters: ServerTableFilter[];
    filterMode: 'all' | 'any';
};
//# sourceMappingURL=tableQuery.d.ts.map