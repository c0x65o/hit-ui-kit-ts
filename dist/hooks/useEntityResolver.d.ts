/**
 * useEntityResolver Hook
 *
 * Batch resolves entity IDs to their display labels for reference columns.
 * Uses an in-memory cache to avoid redundant API calls.
 *
 * @example
 * const { resolveEntities, getLabel, isLoading } = useEntityResolver();
 *
 * // Batch resolve IDs (called once per page of data)
 * await resolveEntities([
 *   { entityType: 'crm.contact', ids: ['uuid1', 'uuid2'] },
 *   { entityType: 'crm.opportunity', ids: ['uuid3'] },
 * ]);
 *
 * // Get cached label
 * const label = getLabel('crm.contact', 'uuid1'); // "John Doe"
 */
export interface ResolveRequest {
    entityType: string;
    ids: string[];
}
export interface ResolvedEntity {
    id: string;
    label: string;
}
export declare function useEntityResolver(): {
    resolveEntities: (requests: ResolveRequest[]) => Promise<void>;
    getLabel: (entityType: string, id: string) => string | null;
    isCached: (entityType: string, id: string) => boolean;
    populateFromRowData: (entityType: string, idField: string, labelField: string, rows: Record<string, unknown>[]) => void;
    clearCache: (entityType?: string) => void;
    isLoading: boolean;
    error: string | null;
};
//# sourceMappingURL=useEntityResolver.d.ts.map