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
    TextArea: partial.TextArea ?? notImplemented('TextArea'),
    Select: partial.Select ?? notImplemented('Select'),
    Checkbox: partial.Checkbox ?? notImplemented('Checkbox'),
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
  TextAreaProps,
  SelectProps,
  SelectOption,
  CheckboxProps,
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
} from './types';

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

// Components (for direct imports)
export {
  Page,
  Card,
  Button,
  Input,
  TextArea,
  Select,
  Checkbox,
  Table,
  DataTable,
  Badge,
  Avatar,
  Alert,
  Modal,
  AlertDialog,
  Spinner,
  EmptyState,
  Tabs,
  Dropdown,
  // Auth-specific
  AuthLayout,
  AuthCard,
  FormInput,
  // Utils
  cn,
  styles,
} from './components';

export type { AuthLayoutProps, AuthCardProps, FormInputProps } from './components';
