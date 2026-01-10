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
// Solution: Access the context through a getter function at RUNTIME, not module load.
// This prevents webpack from inlining the createContext call.
const CONTEXT_KEY = '__HIT_UI_KIT_CONTEXT__';
/**
 * Get or create the shared context. Called at runtime, not bundle time.
 * The dynamic property access prevents webpack optimization.
 */
function getContext() {
    // Use bracket notation with a variable to prevent webpack inlining
    const key = CONTEXT_KEY;
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window;
        if (!win[key]) {
            win[key] = createContext(null);
        }
        return win[key];
    }
    // SSR fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis;
    if (!g[key]) {
        g[key] = createContext(null);
    }
    return g[key];
}
/**
 * Hook to access UI Kit components.
 * Must be used within a UiKitProvider.
 */
export function useUi() {
    const ctx = getContext();
    const context = useContext(ctx);
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
    const ctx = getContext();
    return _jsx(ctx.Provider, { value: kit, children: children });
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