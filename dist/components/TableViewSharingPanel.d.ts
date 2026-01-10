import React from 'react';
import type { TableViewShare } from '../hooks/useTableView';
import type { Principal, PrincipalType } from '../types/acl';
export type TableViewShareRecipient = {
    principalType: 'user' | 'group' | 'role';
    principalId: string;
};
interface TableViewSharingPanelProps {
    /** If provided, shares will be added/removed via API immediately. If omitted, shares are queued in `pendingRecipients`. */
    viewId?: string | null;
    /** Existing shares (edit mode). */
    shares: TableViewShare[];
    setShares: React.Dispatch<React.SetStateAction<TableViewShare[]>>;
    sharesLoading?: boolean;
    /** Queued shares (create mode). */
    pendingRecipients: TableViewShareRecipient[];
    setPendingRecipients: React.Dispatch<React.SetStateAction<TableViewShareRecipient[]>>;
    /** API functions from `useTableView`. */
    addShare: (viewId: string, principalType: 'user' | 'group' | 'role', principalId: string) => Promise<TableViewShare>;
    removeShare: (viewId: string, principalType: 'user' | 'group' | 'role', principalId: string) => Promise<void>;
    /** If true, user can choose user/group/role. If false, principalType is forced to 'user'. */
    allowPrincipalTypeSelection?: boolean;
    /** Optional custom principal fetcher. If not provided, uses global fetcher from UI Kit. */
    fetchPrincipals?: (type: PrincipalType, search?: string) => Promise<Principal[]>;
}
export declare function TableViewSharingPanel({ viewId, shares, setShares, sharesLoading, pendingRecipients, setPendingRecipients, addShare, removeShare, allowPrincipalTypeSelection, fetchPrincipals, }: TableViewSharingPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TableViewSharingPanel.d.ts.map