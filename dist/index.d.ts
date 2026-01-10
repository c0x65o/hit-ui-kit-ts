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
import React from 'react';
import type { UiKit } from './types';
/**
 * Hook to access UI Kit components.
 * Must be used within a UiKitProvider.
 */
export declare function useUi(): UiKit;
/**
 * Provider for UI Kit components.
 */
export declare function UiKitProvider({ kit, children, }: {
    kit: UiKit;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Creates a complete UiKit from a partial implementation.
 * Missing components will throw errors when used.
 */
export declare function createKit(partial: Partial<UiKit>): UiKit;
export type { UiKit, PageProps, CardProps, ButtonProps, InputProps, ColorPickerProps, TextAreaProps, SelectProps, SelectOption, CheckboxProps, AutocompleteProps, AutocompleteOption, TableProps, TableColumn, BadgeProps, AvatarProps, AlertProps, ModalProps, SpinnerProps, EmptyStateProps, TabsProps, DropdownProps, BreadcrumbProps, BreadcrumbItem, HelpProps, } from './types';
export type { PrincipalType, Principal, HierarchicalPermission, GranularPermission, AclEntry, AclPickerConfig, AclPickerProps, } from './types/acl';
export { ThemeProvider, ConditionalThemeProvider, useTheme, useThemeContext, useThemeTokens, getConfiguredTheme, darkTheme, lightTheme, type Theme, } from './theme';
export * from './tokens';
export { defaultKit } from './kit';
export { useAlertDialog } from './hooks/useAlertDialog';
export type { AlertDialogOptions, AlertDialogState } from './hooks/useAlertDialog';
export { useTableView, type TableView, type TableViewFilter, type TableViewShare } from './hooks/useTableView';
export { useServerDataTableState } from './hooks/useServerDataTableState';
export type { ServerDataTableQuery, ServerDataTableSort } from './hooks/useServerDataTableState';
export { useFormSubmit, parseError, parseResponseError } from './hooks/useFormSubmit';
export type { ParsedFormError, FormSubmitState, FormSubmitActions, UseFormSubmitOptions, } from './hooks/useFormSubmit';
export { ErrorLogProvider, useErrorLog, useCurrentUserEmail, getCurrentPageUrl, } from './hooks/useErrorLog';
export type { ErrorLogEntry, ErrorLogState, ErrorLogActions } from './hooks/useErrorLog';
export { useTrackedFetch, installGlobalFetchInterceptor } from './hooks/useTrackedFetch';
export type { TrackedFetchOptions } from './hooks/useTrackedFetch';
export { LatencyLogProvider, useLatencyLog, getCurrentPageUrl as getLatencyPageUrl, formatDuration, getLatencySeverity, } from './hooks/useLatencyLog';
export type { LatencyLogEntry, LatencyLogState, LatencyLogActions, LatencySource, } from './hooks/useLatencyLog';
export { useLatencyTrackedFetch, createLatencyTrackedFetch } from './hooks/useLatencyTrackedFetch';
export type { LatencyTrackedFetchOptions, LatencyTrackerConfig } from './hooks/useLatencyTrackedFetch';
export { Page, Card, Button, Input, ColorPicker, TextArea, Select, Checkbox, Autocomplete, Table, DataTable, Badge, Avatar, UserAvatar, clearUserAvatarCache, setUserAvatarCache, Alert, Modal, AlertDialog, Spinner, EmptyState, Tabs, Dropdown, Breadcrumb, Help, AuthLayout, AuthCard, FormInput, AclPicker, ViewSelector, FILTER_OPERATORS, type ViewColumnDefinition, TableViewSharingPanel, type TableViewShareRecipient, GlobalFilterBar, type GlobalFilterBarProps, Stack, Row, Grid, GridItem, Box, Text, Heading, cn, styles, } from './components';
export type { AuthLayoutProps, AuthCardProps, FormInputProps, UserAvatarProps } from './components';
export type { GlobalFilterConfig, ColumnReferenceConfig } from './types';
export type { GlobalFilterValues, ServerTableFilter } from './utils/tableQuery';
export { globalFilterValuesToServerFilters, mergeViewAndQuickServerFilters } from './utils/tableQuery';
export { ENTITY_REGISTRY, getEntityDefinition, hasEntityDefinition, getLabelFromRowField, getEntityDetailPath, type EntityDefinition, } from './config/entityRegistry';
export { useEntityResolver } from './hooks/useEntityResolver';
export type { ResolveRequest, ResolvedEntity } from './hooks/useEntityResolver';
export type { StackProps, StackGap, RowProps, RowGap, GridProps, GridItemProps, GridGap, BoxProps, BoxSpacing, TextProps, HeadingProps, } from './components';
//# sourceMappingURL=index.d.ts.map