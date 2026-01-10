'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils.js';
import { useUi } from '../index.js';
import { AclPicker } from './AclPicker.js';
export function TableViewSharingPanel({ viewId, shares, setShares, sharesLoading = false, pendingRecipients, setPendingRecipients, addShare, removeShare, allowPrincipalTypeSelection = true, fetchPrincipals, }) {
    const { colors, radius, spacing, textStyles: ts } = useThemeTokens();
    const { fetchPrincipals: globalFetchPrincipals } = useUi();
    const isEditing = !!viewId;
    const effectiveFetchPrincipals = fetchPrincipals || globalFetchPrincipals;
    const entries = useMemo(() => {
        const toEntry = (principalType, principalId, id) => ({
            id,
            principalType,
            principalId,
            // Table view shares don't currently encode permission granularity;
            // we map them to a single implied permission for display.
            permissions: ['view'],
        });
        if (isEditing) {
            return shares.map((s) => toEntry(s.principalType, s.principalId, s.id));
        }
        return pendingRecipients.map((r) => toEntry(r.principalType, r.principalId, `pending:${r.principalType}:${r.principalId}`));
    }, [isEditing, shares, pendingRecipients]);
    const aclConfig = useMemo(() => {
        return {
            principals: { users: true, groups: true, roles: true },
            mode: 'hierarchical',
            hierarchicalPermissions: [
                {
                    key: 'view',
                    label: 'Can view',
                    description: 'Can see and use this view',
                    priority: 1,
                },
            ],
            labels: {
                title: 'Sharing',
                addButton: 'Share',
                removeButton: 'Remove',
                emptyMessage: isEditing ? 'This view is not shared with anyone yet.' : 'This view will not be shared with anyone yet.',
            },
        };
    }, [isEditing]);
    const validateDuplicate = useMemo(() => {
        const keys = new Set(entries.map((e) => `${e.principalType}:${e.principalId}`));
        return (entry) => (keys.has(`${entry.principalType}:${entry.principalId}`) ? 'Already shared with this principal' : null);
    }, [entries]);
    async function handleAdd(entry) {
        const principalId = entry.principalId.trim();
        const principalType = entry.principalType;
        if (!principalId)
            return;
        if (isEditing && viewId) {
            const newShare = await addShare(viewId, principalType, principalId);
            setShares((prev) => [...prev, newShare]);
        }
        else {
            setPendingRecipients((prev) => {
                const next = new Map(prev.map((p) => [`${p.principalType}:${p.principalId}`, p]));
                next.set(`${principalType}:${principalId}`, { principalType, principalId });
                return Array.from(next.values());
            });
        }
    }
    async function handleRemoveEntry(entry) {
        const principalId = entry.principalId;
        const principalType = entry.principalType;
        if (isEditing && viewId && entry.id) {
            await removeShare(viewId, principalType, principalId);
            setShares((prev) => prev.filter((s) => s.id !== entry.id));
        }
        else {
            setPendingRecipients((prev) => prev.filter((p) => !(p.principalType === principalType && p.principalId === principalId)));
        }
    }
    return (_jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.md }), children: [_jsx("p", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, margin: 0 }), children: "Share this view with other principals. They will see it in their \"Shared with me\" section." }), _jsx("div", { style: styles({ borderRadius: radius.md }), children: _jsx(AclPicker, { config: aclConfig, entries: entries, loading: isEditing && sharesLoading, validateEntry: validateDuplicate, onAdd: handleAdd, onRemove: handleRemoveEntry, fetchPrincipals: effectiveFetchPrincipals, 
                    // For view sharing, removal should be a single click (no confirm prompt)
                    confirmRemove: false }) })] }));
}
//# sourceMappingURL=TableViewSharingPanel.js.map