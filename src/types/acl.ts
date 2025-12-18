/**
 * ACL (Access Control List) Types
 * 
 * Type definitions for the Global ACL Picker component.
 * These types are shared across feature packs for consistent ACL management.
 */

/**
 * Principal types that can be granted access
 */
export type PrincipalType = 'user' | 'group' | 'role';

/**
 * A principal is an entity that can be granted access
 */
export interface Principal {
  type: PrincipalType;
  id: string;           // User email, group ID, or role name
  displayName: string;  // Human-readable name
  metadata?: Record<string, unknown>;
}

/**
 * A permission definition for hierarchical mode
 */
export interface HierarchicalPermission {
  key: string;          // e.g., 'full', 'read_write', 'read_only'
  label: string;        // e.g., 'Full Control'
  description?: string; // e.g., 'Can read, write, delete, and manage access'
  priority: number;     // Higher = more permissive (used for resolution)
  includes?: string[];  // Permissions this level includes (optional, for display)
}

/**
 * A permission definition for granular mode
 */
export interface GranularPermission {
  key: string;          // e.g., 'READ', 'WRITE', 'DELETE'
  label: string;        // e.g., 'Read'
  description?: string; // e.g., 'Can view items'
  group?: string;       // Optional grouping for UI organization
}

/**
 * An ACL entry (what gets stored)
 */
export interface AclEntry {
  id?: string;           // Optional - set when entry exists in storage
  principalType: PrincipalType;
  principalId: string;
  permissions: string[]; // Array of permission keys
}

/**
 * Configuration for the ACL Picker
 */
export interface AclPickerConfig {
  // Principal configuration
  principals: {
    users?: boolean | { enabled: boolean; label?: string };
    groups?: boolean | { enabled: boolean; label?: string };
    roles?: boolean | { enabled: boolean; label?: string };
  };
  
  // Permission mode
  mode: 'hierarchical' | 'granular';
  
  // For hierarchical mode: ordered list of permission levels
  hierarchicalPermissions?: HierarchicalPermission[];
  
  // For granular mode: list of toggleable permissions
  granularPermissions?: GranularPermission[];
  
  // Customization
  labels?: {
    title?: string;           // "Access Control" (default)
    addButton?: string;       // "Add Access" (default)
    removeButton?: string;    // "Remove" (default)
    emptyMessage?: string;    // "No access permissions set" (default)
  };
}

/**
 * Props for the AclPicker component
 */
export interface AclPickerProps {
  config: AclPickerConfig;
  
  // Current ACL entries
  entries: AclEntry[];
  
  // Loading state
  loading?: boolean;
  
  // Callbacks
  onAdd: (entry: Omit<AclEntry, 'id'>) => void | Promise<void>;
  onRemove: (entry: AclEntry) => void | Promise<void>;
  onUpdate?: (entry: AclEntry) => void | Promise<void>;
  
  // Optional: filter available principals (e.g., exclude owner)
  filterPrincipals?: (principal: Principal) => boolean;
  
  // Optional: validation before add
  validateEntry?: (entry: Omit<AclEntry, 'id'>) => string | null;
  
  // Optional: custom principal fetcher (override default auth-core hooks)
  fetchPrincipals?: (type: PrincipalType, search?: string) => Promise<Principal[]>;
  
  // Disabled state (e.g., when user doesn't have permission to modify ACLs)
  disabled?: boolean;
  
  // Error state
  error?: string | null;
}

