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
  staticOptions?: Array<{ value: string; label: string }>;
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
export const TABLE_FILTER_REGISTRY: Record<string, TableFilterDefinition[]> = {
  // CRM Activities
  'crm.activities': [
    {
      columnKey: 'activityType',
      label: 'Type',
      filterType: 'select',
      optionsEndpoint: '/api/crm/activity-types',
      itemsPath: 'items',
      valueField: 'name',
      labelField: 'name',
    },
    {
      columnKey: 'taskDescription',
      label: 'Description',
      filterType: 'string',
    },
    {
      columnKey: 'relatedContactId',
      label: 'Contact',
      filterType: 'autocomplete',
      searchEndpoint: '/api/crm/contacts',
      resolveEndpoint: '/api/crm/contacts',
      itemsPath: 'items',
      valueField: 'id',
      labelField: 'name',
    },
    {
      columnKey: 'relatedOpportunityId',
      label: 'Opportunity',
      filterType: 'autocomplete',
      searchEndpoint: '/api/crm/opportunities',
      resolveEndpoint: '/api/crm/opportunities',
      itemsPath: 'items',
      valueField: 'id',
      labelField: 'name',
    },
    {
      columnKey: 'likelihoodTypeName',
      label: 'Likelihood',
      filterType: 'select',
      optionsEndpoint: '/api/crm/opportunity-likelihood-types',
      itemsPath: 'items',
      valueField: 'name',
      labelField: 'name',
    },
    {
      columnKey: 'userId',
      label: 'Assignee',
      filterType: 'autocomplete',
      searchEndpoint: '/api/proxy/auth/directory/users',
      resolveEndpoint: '/api/proxy/auth/directory/users',
      // No itemsPath - auth endpoint returns plain array
      valueField: 'email',
      labelField: 'email', // Display name is derived from profile_fields automatically
    },
    {
      columnKey: 'activityDate',
      label: 'Activity Date',
      filterType: 'daterange',
    },
  ],

  // CRM Prospects/Companies
  'crm.prospects': [
    {
      columnKey: 'name',
      label: 'Name',
      filterType: 'string',
    },
    {
      columnKey: 'website',
      label: 'Website',
      filterType: 'string',
    },
    {
      columnKey: 'companyEmail',
      label: 'Email',
      filterType: 'string',
    },
    {
      columnKey: 'companyPhone',
      label: 'Phone',
      filterType: 'string',
    },
    {
      columnKey: 'ownerUserId',
      label: 'Owner',
      filterType: 'autocomplete',
      searchEndpoint: '/api/proxy/auth/directory/users',
      resolveEndpoint: '/api/proxy/auth/directory/users',
      valueField: 'email',
      labelField: 'email',
    },
  ],

  // CRM Contacts
  'crm.contacts': [
    {
      columnKey: 'name',
      label: 'Name',
      filterType: 'string',
    },
    {
      columnKey: 'email',
      label: 'Email',
      filterType: 'string',
    },
    {
      columnKey: 'phone',
      label: 'Phone',
      filterType: 'string',
    },
    {
      columnKey: 'title',
      label: 'Title',
      filterType: 'string',
    },
    {
      columnKey: 'companyId',
      label: 'Company',
      filterType: 'autocomplete',
      searchEndpoint: '/api/crm/prospects',
      resolveEndpoint: '/api/crm/prospects',
      itemsPath: 'items',
      valueField: 'id',
      labelField: 'name',
    },
    {
      columnKey: 'ownerUserId',
      label: 'Owner',
      filterType: 'autocomplete',
      searchEndpoint: '/api/proxy/auth/directory/users',
      resolveEndpoint: '/api/proxy/auth/directory/users',
      valueField: 'email',
      labelField: 'email',
    },
  ],

  // CRM Opportunities
  'crm.opportunities': [
    {
      columnKey: 'name',
      label: 'Name',
      filterType: 'string',
    },
    {
      columnKey: 'pipelineStage',
      label: 'Stage',
      filterType: 'select',
      optionsEndpoint: '/api/crm/pipeline-stages',
      itemsPath: 'items',
      valueField: 'id',
      labelField: 'name',
    },
    {
      columnKey: 'likelihoodTypeId',
      label: 'Likelihood',
      filterType: 'select',
      optionsEndpoint: '/api/crm/opportunity-likelihood-types',
      itemsPath: 'items',
      valueField: 'id',
      labelField: 'name',
    },
    {
      columnKey: 'primaryContactId',
      label: 'Contact',
      filterType: 'autocomplete',
      searchEndpoint: '/api/crm/contacts',
      resolveEndpoint: '/api/crm/contacts',
      itemsPath: 'items',
      valueField: 'id',
      labelField: 'name',
    },
    {
      columnKey: 'companyId',
      label: 'Company',
      filterType: 'autocomplete',
      searchEndpoint: '/api/crm/prospects',
      resolveEndpoint: '/api/crm/prospects',
      itemsPath: 'items',
      valueField: 'id',
      labelField: 'name',
    },
    {
      columnKey: 'ownerUserId',
      label: 'Owner',
      filterType: 'autocomplete',
      searchEndpoint: '/api/proxy/auth/directory/users',
      resolveEndpoint: '/api/proxy/auth/directory/users',
      valueField: 'email',
      labelField: 'email',
    },
  ],

  // Projects
  'projects': [
    {
      columnKey: 'name',
      label: 'Name',
      filterType: 'string',
    },
    {
      columnKey: 'statusId',
      label: 'Status',
      filterType: 'select',
      optionsEndpoint: '/api/projects/statuses',
      itemsPath: 'items',
      valueField: 'id',
      labelField: 'name',
    },
  ],
};

/**
 * Get filter configuration for a table
 */
export function getTableFilters(tableId: string): TableFilterDefinition[] {
  return TABLE_FILTER_REGISTRY[tableId] || [];
}

/**
 * Check if a table has filter configuration
 */
export function hasTableFilters(tableId: string): boolean {
  return tableId in TABLE_FILTER_REGISTRY && TABLE_FILTER_REGISTRY[tableId].length > 0;
}
