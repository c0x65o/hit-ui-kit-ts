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
export const ENTITY_REGISTRY: Record<string, EntityDefinition> = {
  // CRM Contacts
  'crm.contact': {
    resolveEndpoint: '/api/crm/contacts',
    searchEndpoint: '/api/crm/contacts',
    labelField: 'name',
    valueField: 'id',
    itemsPath: 'items',
    detailPath: '/crm/contacts/:id',
    labelFromRowMap: {
      relatedContactId: 'contactName',
      primaryContactId: 'contactName',
      contactId: 'contactName',
    },
  },

  // CRM Opportunities
  'crm.opportunity': {
    resolveEndpoint: '/api/crm/opportunities',
    searchEndpoint: '/api/crm/opportunities',
    labelField: 'name',
    valueField: 'id',
    itemsPath: 'items',
    detailPath: '/crm/opportunities/:id',
    labelFromRowMap: {
      relatedOpportunityId: 'opportunityName',
      opportunityId: 'opportunityName',
    },
  },

  // CRM Prospects/Companies
  'crm.prospect': {
    resolveEndpoint: '/api/crm/prospects',
    searchEndpoint: '/api/crm/prospects',
    labelField: 'name',
    valueField: 'id',
    itemsPath: 'items',
    detailPath: '/crm/prospects/:id',
    labelFromRowMap: {
      companyId: 'companyName',
      prospectId: 'prospectName',
    },
  },

  // Auth Users
  'auth.user': {
    resolveEndpoint: '/api/crm/users',
    searchEndpoint: '/api/crm/users',
    labelField: 'name',
    valueField: 'email',
    itemsPath: 'items',
    detailPath: undefined, // No detail page for users
    labelFromRowMap: {
      userId: 'userName',
      ownerUserId: 'ownerName',
      assigneeUserId: 'assigneeName',
      createdByUserId: 'createdByName',
    },
  },

  // Projects
  'project': {
    resolveEndpoint: '/api/projects',
    searchEndpoint: '/api/projects',
    labelField: 'name',
    valueField: 'id',
    itemsPath: 'items',
    detailPath: '/projects/:id',
    labelFromRowMap: {
      projectId: 'projectName',
    },
  },
};

/**
 * Get entity definition by type
 */
export function getEntityDefinition(entityType: string): EntityDefinition | null {
  return ENTITY_REGISTRY[entityType] || null;
}

/**
 * Check if an entity type is registered
 */
export function hasEntityDefinition(entityType: string): boolean {
  return entityType in ENTITY_REGISTRY;
}

/**
 * Get the row field that contains pre-resolved label for a given column
 */
export function getLabelFromRowField(entityType: string, columnKey: string): string | null {
  const def = ENTITY_REGISTRY[entityType];
  if (!def?.labelFromRowMap) return null;
  return def.labelFromRowMap[columnKey] || null;
}

/**
 * Generate detail path for an entity
 */
export function getEntityDetailPath(entityType: string, id: string): string | null {
  const def = ENTITY_REGISTRY[entityType];
  if (!def?.detailPath) return null;
  return def.detailPath.replace(':id', encodeURIComponent(id));
}
