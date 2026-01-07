'use client';

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

import React, { createContext, useContext } from 'react';
import type { UiKit } from './types';

// =============================================================================
// UI KIT CONTEXT
// =============================================================================

const UiKitContext = createContext<UiKit | null>(null);

/**
 * Hook to access UI Kit components.
 * Must be used within a UiKitProvider.
 */
export function useUi(): UiKit {
  const context = useContext(UiKitContext);
  if (!context) {
    throw new Error(
      'useUi must be used within a UiKitProvider. ' +
        'Make sure your app is wrapped with <UiKitProvider kit={yourKit}>.'
    );
  }
  return context;
}

/**
 * Provider for UI Kit components.
 */
export function UiKitProvider({
  kit,
  children,
}: {
  kit: UiKit;
  children: React.ReactNode;
}) {
  return <UiKitContext.Provider value={kit}>{children}</UiKitContext.Provider>;
}

// =============================================================================
// HELPER TO CREATE PARTIAL KITS
// =============================================================================

function notImplemented(name: string) {
  const NotImplemented = (): React.ReactElement => {
    throw new Error(
      `UiKit component "${name}" is not implemented. ` +
        'Please provide an implementation in your kit.'
    );
  };
  NotImplemented.displayName = `NotImplemented(${name})`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NotImplemented as any;
}

/**
 * Creates a complete UiKit from a partial implementation.
 * Missing components will throw errors when used.
 */
export function createKit(partial: Partial<UiKit>): UiKit {
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

// =============================================================================
// EXPORTS
// =============================================================================

// Types
export type {
  UiKit,
  PageProps,
  CardProps,
  ButtonProps,
  InputProps,
  ColorPickerProps,
  TextAreaProps,
  SelectProps,
  SelectOption,
  CheckboxProps,
  AutocompleteProps,
  AutocompleteOption,
  TableProps,
  TableColumn,
  BadgeProps,
  AvatarProps,
  AlertProps,
  ModalProps,
  SpinnerProps,
  EmptyStateProps,
  TabsProps,
  DropdownProps,
  BreadcrumbProps,
  BreadcrumbItem,
  HelpProps,
} from './types';

// ACL Types
export type {
  PrincipalType,
  Principal,
  HierarchicalPermission,
  GranularPermission,
  AclEntry,
  AclPickerConfig,
  AclPickerProps,
} from './types/acl';

// Theme
export {
  ThemeProvider,
  ConditionalThemeProvider,
  useTheme,
  useThemeContext,
  useThemeTokens,
  getConfiguredTheme,
  darkTheme,
  lightTheme,
  type Theme,
} from './theme';

// Tokens
export * from './tokens';

// Default Kit
export { defaultKit } from './kit';

// Hooks
export { useAlertDialog } from './hooks/useAlertDialog';
export type { AlertDialogOptions, AlertDialogState } from './hooks/useAlertDialog';
export { useTableView, type TableView, type TableViewFilter, type TableViewShare } from './hooks/useTableView';
export { useServerDataTableState } from './hooks/useServerDataTableState';
export type { ServerDataTableQuery, ServerDataTableSort } from './hooks/useServerDataTableState';
export { useFormSubmit, parseError, parseResponseError } from './hooks/useFormSubmit';
export type {
  ParsedFormError,
  FormSubmitState,
  FormSubmitActions,
  UseFormSubmitOptions,
} from './hooks/useFormSubmit';

// Error Logging
export {
  ErrorLogProvider,
  useErrorLog,
  useCurrentUserEmail,
  getCurrentPageUrl,
} from './hooks/useErrorLog';
export type { ErrorLogEntry, ErrorLogState, ErrorLogActions } from './hooks/useErrorLog';

export { useTrackedFetch, installGlobalFetchInterceptor } from './hooks/useTrackedFetch';
export type { TrackedFetchOptions } from './hooks/useTrackedFetch';

// Latency Logging
export {
  LatencyLogProvider,
  useLatencyLog,
  getCurrentPageUrl as getLatencyPageUrl,
  formatDuration,
  getLatencySeverity,
} from './hooks/useLatencyLog';
export type {
  LatencyLogEntry,
  LatencyLogState,
  LatencyLogActions,
  LatencySource,
} from './hooks/useLatencyLog';

export { useLatencyTrackedFetch, createLatencyTrackedFetch } from './hooks/useLatencyTrackedFetch';
export type { LatencyTrackedFetchOptions, LatencyTrackerConfig } from './hooks/useLatencyTrackedFetch';

// Components (for direct imports)
export {
  Page,
  Card,
  Button,
  Input,
  ColorPicker,
  TextArea,
  Select,
  Checkbox,
  Autocomplete,
  Table,
  DataTable,
  Badge,
  Avatar,
  UserAvatar,
  clearUserAvatarCache,
  setUserAvatarCache,
  Alert,
  Modal,
  AlertDialog,
  Spinner,
  EmptyState,
  Tabs,
  Dropdown,
  Breadcrumb,
  Help,
  // Auth-specific
  AuthLayout,
  AuthCard,
  FormInput,
  // ACL
  AclPicker,
  // Views
  ViewSelector,
  FILTER_OPERATORS,
  type ViewColumnDefinition,
  TableViewSharingPanel,
  type TableViewShareRecipient,
  // Global Filters
  GlobalFilterBar,
  type GlobalFilterBarProps,
  // Layout Primitives
  Stack,
  Row,
  Grid,
  GridItem,
  Box,
  // Typography
  Text,
  Heading,
  // Utils
  cn,
  styles,
} from './components';

export type { AuthLayoutProps, AuthCardProps, FormInputProps, UserAvatarProps } from './components';
export type { GlobalFilterConfig, ColumnReferenceConfig } from './types';

// Table query helpers (server-driven tables)
export type { GlobalFilterValues, ServerTableFilter } from './utils/tableQuery';
export { globalFilterValuesToServerFilters, mergeViewAndQuickServerFilters } from './utils/tableQuery';

// Entity Registry (for reference column configuration)
export {
  ENTITY_REGISTRY,
  getEntityDefinition,
  hasEntityDefinition,
  getLabelFromRowField,
  getEntityDetailPath,
  type EntityDefinition,
} from './config/entityRegistry';

// Entity Resolver Hook
export { useEntityResolver } from './hooks/useEntityResolver';
export type { ResolveRequest, ResolvedEntity } from './hooks/useEntityResolver';

// Layout Primitive Types
export type {
  StackProps,
  StackGap,
  RowProps,
  RowGap,
  GridProps,
  GridItemProps,
  GridGap,
  BoxProps,
  BoxSpacing,
  TextProps,
  HeadingProps,
} from './components';
