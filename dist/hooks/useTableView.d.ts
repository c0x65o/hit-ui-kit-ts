export interface TableViewFilter {
    id?: string;
    field: string;
    operator: string;
    value: string | number | boolean | null;
    valueType?: string;
    metadata?: Record<string, unknown>;
    sortOrder?: number;
}
export interface TableViewGroupBy {
    field: string;
    sortOrder?: string[];
}
export interface TableViewShare {
    id: string;
    viewId: string;
    principalType: 'user' | 'group' | 'role';
    principalId: string;
    sharedBy: string;
    sharedByName?: string | null;
    createdAt: string;
}
export interface TableView {
    id: string;
    userId: string;
    tableId: string;
    name: string;
    description?: string | null;
    isDefault: boolean;
    isSystem: boolean;
    isShared: boolean;
    columnVisibility?: Record<string, boolean> | null;
    sorting?: Array<{
        id: string;
        desc: boolean;
    }> | null;
    groupBy?: TableViewGroupBy | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    lastUsedAt?: string | null;
    filters: TableViewFilter[];
    _category?: 'system' | 'user' | 'shared';
    _sharedBy?: string;
    _sharedByName?: string | null;
}
interface UseTableViewOptions {
    tableId: string;
    onViewChange?: (view: TableView | null) => void;
}
/**
 * Hook for managing table views
 *
 * Requires the table-views feature pack to be installed for API endpoints.
 * If the feature pack is not installed, API calls will gracefully fail.
 *
 * @example
 * ```tsx
 * const { views, currentView, selectView, createView } = useTableView({
 *   tableId: 'projects',
 *   onViewChange: (view) => console.log('View changed:', view),
 * });
 * ```
 */
export declare function useTableView({ tableId, onViewChange }: UseTableViewOptions): {
    views: TableView[];
    currentView: TableView | null;
    loading: boolean;
    error: Error | null;
    available: boolean;
    viewReady: boolean;
    createView: (viewData: {
        name: string;
        description?: string;
        filters?: TableViewFilter[];
        columnVisibility?: Record<string, boolean>;
        sorting?: Array<{
            id: string;
            desc: boolean;
        }>;
        groupBy?: TableViewGroupBy;
        metadata?: Record<string, unknown> | null;
        isDefault?: boolean;
        isSystem?: boolean;
    }) => Promise<any>;
    updateView: (viewId: string, updates: Partial<TableView>) => Promise<any>;
    deleteView: (viewId: string) => Promise<void>;
    selectView: (view: TableView | null) => Promise<void>;
    refresh: () => Promise<void>;
    getShares: (viewId: string) => Promise<TableViewShare[]>;
    addShare: (viewId: string, principalType: "user" | "group" | "role", principalId: string) => Promise<TableViewShare>;
    removeShare: (viewId: string, principalType: "user" | "group" | "role", principalId: string) => Promise<void>;
};
export {};
//# sourceMappingURL=useTableView.d.ts.map