'use client';
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * HIT UI Kit
 *
 * A themeable component library with design tokens.
 *
 * ## Quick Start
 *
 * ```tsx
 * import {
 *   ThemeProvider,
 *   UiKitProvider,
 *   defaultKit,
 *   useUi
 * } from '@hit/ui-kit';
 *
 * // Wrap your app
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="dark">
 *       <UiKitProvider kit={defaultKit}>
 *         <MyApp />
 *       </UiKitProvider>
 *     </ThemeProvider>
 *   );
 * }
 *
 * // Use components
 * function MyPage() {
 *   const { Page, Card, Button } = useUi();
 *   return (
 *     <Page title="Dashboard">
 *       <Card>
 *         <Button variant="primary">Click me</Button>
 *       </Card>
 *     </Page>
 *   );
 * }
 * ```
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
// Theme
export { ThemeProvider, ConditionalThemeProvider, useTheme, useThemeContext, useThemeTokens, getConfiguredTheme, darkTheme, lightTheme, } from './theme';
// Tokens
export * from './tokens';
// Default Kit
export { defaultKit } from './kit';
// Hooks
export { useAlertDialog } from './hooks/useAlertDialog';
export { useTableView } from './hooks/useTableView';
export { useServerDataTableState } from './hooks/useServerDataTableState';
export { useFormSubmit, parseError, parseResponseError } from './hooks/useFormSubmit';
// Error Logging
export { ErrorLogProvider, useErrorLog, useCurrentUserEmail, getCurrentPageUrl, } from './hooks/useErrorLog';
export { useTrackedFetch, installGlobalFetchInterceptor } from './hooks/useTrackedFetch';
// Latency Logging
export { LatencyLogProvider, useLatencyLog, getCurrentPageUrl as getLatencyPageUrl, formatDuration, getLatencySeverity, } from './hooks/useLatencyLog';
export { useLatencyTrackedFetch, createLatencyTrackedFetch } from './hooks/useLatencyTrackedFetch';
// Components (for direct imports)
export { Page, Card, Button, Input, ColorPicker, TextArea, Select, Checkbox, Autocomplete, Table, DataTable, Badge, Avatar, UserAvatar, clearUserAvatarCache, setUserAvatarCache, Alert, Modal, AlertDialog, Spinner, EmptyState, Tabs, Dropdown, Breadcrumb, Help, 
// Auth-specific
AuthLayout, AuthCard, FormInput, 
// ACL
AclPicker, 
// Views
ViewSelector, FILTER_OPERATORS, TableViewSharingPanel, 
// Global Filters
GlobalFilterBar, 
// Layout Primitives
Stack, Row, Grid, GridItem, Box, 
// Typography
Text, Heading, 
// Utils
cn, styles, } from './components';
export { globalFilterValuesToServerFilters, mergeViewAndQuickServerFilters } from './utils/tableQuery';
// Entity Registry (for reference column configuration)
export { ENTITY_REGISTRY, getEntityDefinition, hasEntityDefinition, getLabelFromRowField, getEntityDetailPath, } from './config/entityRegistry';
// Entity Resolver Hook
export { useEntityResolver } from './hooks/useEntityResolver';
//# sourceMappingURL=index.js.map