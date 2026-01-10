/**
 * Entity Registry
 *
 * Centralized configuration for entity types that can be referenced in DataTable columns.
 * This enables automatic ID-to-label resolution and link generation for foreign key columns.
 *
 * @example
 * // In column definition:
 * {
 *   key: 'relatedContactId',
 *   label: 'Contact',
 *   reference: { entityType: 'crm.contact' }, // Looks up config from registry
 * }
 */
export interface EntityDefinition {
    /** API endpoint to resolve single ID (appends /{id}) */
    resolveEndpoint: string;
    /** API endpoint for search/autocomplete */
    searchEndpoint: string;
    /** Field in API response to use as display label (default: 'name') */
    labelField: string;
    /** Field in API response to use as value (default: 'id') */
    valueField: string;
    /** Path to extract items array from search response (default: 'items') */
    itemsPath: string;
    /** URL path to detail page (uses :id placeholder) */
    detailPath?: string;
    /**
     * Row field that may contain pre-resolved label from backend join.
     * If the row already has this field populated, no API call is needed.
     * Maps columnKey -> rowFieldWithLabel
     */
    labelFromRowMap?: Record<string, string>;
}
/**
 * Registry of all entity types with their resolution configuration.
 * Add new entity types here to enable reference columns for them.
 */
export declare const ENTITY_REGISTRY: Record<string, EntityDefinition>;
/**
 * Get entity definition by type
 */
export declare function getEntityDefinition(entityType: string): EntityDefinition | null;
/**
 * Check if an entity type is registered
 */
export declare function hasEntityDefinition(entityType: string): boolean;
/**
 * Get the row field that contains pre-resolved label for a given column
 */
export declare function getLabelFromRowField(entityType: string, columnKey: string): string | null;
/**
 * Generate detail path for an entity
 */
export declare function getEntityDetailPath(entityType: string, id: string): string | null;
//# sourceMappingURL=entityRegistry.d.ts.map