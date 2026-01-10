'use client';
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * UiKit Context
 *
 * Provides the UiKit context without importing any components.
 * Use this for lazy loading the kit.
 */
import { createContext, useContext } from 'react';
// =============================================================================
// UI KIT CONTEXT
// =============================================================================
const UiKitContext = createContext(null);
/**
 * Hook to access UI Kit components.
 * Must be used within a UiKitProvider.
 */
export function useUi() {
    const context = useContext(UiKitContext);
    if (!context) {
        throw new Error('useUi must be used within a UiKitProvider. ' +
            'Make sure your app is wrapped with <UiKitProvider kit={yourKit}>.');
    }
    return context;
}
/**
 * Provider for UI Kit components.
 */
export function UiKitProvider({ kit, children, }) {
    return _jsx(UiKitContext.Provider, { value: kit, children: children });
}
// =============================================================================
// HELPER TO CREATE PARTIAL KITS
// =============================================================================
function notImplemented(name) {
    const NotImplemented = () => {
        throw new Error(`UiKit component "${name}" is not implemented. ` +
            'Please provide an implementation in your kit.');
    };
    NotImplemented.displayName = `NotImplemented(${name})`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NotImplemented;
}
/**
 * Creates a complete UiKit from a partial implementation.
 * Missing components will throw errors when used.
 */
export function createKit(partial) {
    return {
        fetchPrincipals: partial.fetchPrincipals,
        Page: partial.Page ?? notImplemented('Page'),
        Card: partial.Card ?? notImplemented('Card'),
        Button: partial.Button ?? notImplemented('Button'),
        Input: partial.Input ?? notImplemented('Input'),
        ColorPicker: partial.ColorPicker ?? notImplemented('ColorPicker'),
        TextArea: partial.TextArea ?? notImplemented('TextArea'),
        Select: partial.Select ?? notImplemented('Select'),
        Checkbox: partial.Checkbox ?? notImplemented('Checkbox'),
        Autocomplete: partial.Autocomplete ?? notImplemented('Autocomplete'),
        Table: partial.Table ?? notImplemented('Table'),
        DataTable: partial.DataTable ?? notImplemented('DataTable'),
        Badge: partial.Badge ?? notImplemented('Badge'),
        Avatar: partial.Avatar ?? notImplemented('Avatar'),
        Alert: partial.Alert ?? notImplemented('Alert'),
        Modal: partial.Modal ?? notImplemented('Modal'),
        AlertDialog: partial.AlertDialog ?? notImplemented('AlertDialog'),
        Spinner: partial.Spinner ?? notImplemented('Spinner'),
        EmptyState: partial.EmptyState ?? notImplemented('EmptyState'),
        Tabs: partial.Tabs ?? notImplemented('Tabs'),
        Dropdown: partial.Dropdown ?? notImplemented('Dropdown'),
        Breadcrumb: partial.Breadcrumb ?? notImplemented('Breadcrumb'),
        Help: partial.Help ?? notImplemented('Help'),
    };
}
//# sourceMappingURL=context.js.map