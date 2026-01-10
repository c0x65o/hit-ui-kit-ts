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
// UI KIT CONTEXT - SINGLETON PATTERN
// =============================================================================
// 
// CRITICAL: This module may be bundled multiple times by webpack (once per chunk).
// Each bundle would create its own React Context, causing "useUi must be used within
// UiKitProvider" errors because provider and consumer use different context instances.
//
// Solution: Store the context on window/__HIT_UI_KIT_CONTEXT__ so all bundles share it.
// We use a string key (not Symbol.for) because webpack optimizes away Symbol.for.
// The IIFE and typeof checks prevent webpack from inlining/optimizing this away.
const CONTEXT_KEY = '__HIT_UI_KIT_CONTEXT__';
// Use an IIFE to prevent webpack from optimizing this away
const UiKitContext = (() => {
    // Must check typeof to avoid SSR issues where window doesn't exist
    if (typeof window !== 'undefined') {
        // Check if context already exists from another bundle
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window;
        if (win[CONTEXT_KEY]) {
            return win[CONTEXT_KEY];
        }
        // Create and store the context
        const ctx = createContext(null);
        win[CONTEXT_KEY] = ctx;
        return ctx;
    }
    // SSR: use globalThis for server-side
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalObj = globalThis;
    if (globalObj[CONTEXT_KEY]) {
        return globalObj[CONTEXT_KEY];
    }
    const ctx = createContext(null);
    globalObj[CONTEXT_KEY] = ctx;
    return ctx;
})();
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