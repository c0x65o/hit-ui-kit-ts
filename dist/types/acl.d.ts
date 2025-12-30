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
    id: string;
    displayName: string;
    metadata?: Record<string, unknown>;
}
/**
 * A permission definition for hierarchical mode
 */
export interface HierarchicalPermission {
    key: string;
    label: string;
    description?: string;
    priority: number;
    includes?: string[];
}
/**
 * A permission definition for granular mode
 */
export interface GranularPermission {
    key: string;
    label: string;
    description?: string;
    group?: string;
}
/**
 * An ACL entry (what gets stored)
 */
export interface AclEntry {
    id?: string;
    principalType: PrincipalType;
    principalId: string;
    permissions: string[];
}
/**
 * Configuration for the ACL Picker
 */
export interface AclPickerConfig {
    principals: {
        users?: boolean | {
            enabled: boolean;
            label?: string;
        };
        groups?: boolean | {
            enabled: boolean;
            label?: string;
        };
        roles?: boolean | {
            enabled: boolean;
            label?: string;
        };
    };
    mode: 'hierarchical' | 'granular';
    hierarchicalPermissions?: HierarchicalPermission[];
    granularPermissions?: GranularPermission[];
    labels?: {
        title?: string;
        addButton?: string;
        removeButton?: string;
        emptyMessage?: string;
    };
}
/**
 * Props for the AclPicker component
 */
export interface AclPickerProps {
    config: AclPickerConfig;
    entries: AclEntry[];
    loading?: boolean;
    onAdd: (entry: Omit<AclEntry, 'id'>) => void | Promise<void>;
    onRemove: (entry: AclEntry) => void | Promise<void>;
    onUpdate?: (entry: AclEntry) => void | Promise<void>;
    filterPrincipals?: (principal: Principal) => boolean;
    validateEntry?: (entry: Omit<AclEntry, 'id'>) => string | null;
    fetchPrincipals?: (type: PrincipalType, search?: string) => Promise<Principal[]>;
    disabled?: boolean;
    /**
     * Whether to prompt for confirmation before removing an entry.
     * Defaults to true.
     */
    confirmRemove?: boolean;
    /**
     * Optional custom confirmation message shown when removing an entry.
     * If omitted, a default message is used.
     */
    confirmRemoveMessage?: string;
    error?: string | null;
}
//# sourceMappingURL=acl.d.ts.map