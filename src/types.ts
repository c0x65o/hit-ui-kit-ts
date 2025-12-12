/**
 * Component Prop Types
 * 
 * Type definitions for all UI Kit components.
 */

import React from 'react';

// =============================================================================
// LAYOUT
// =============================================================================

export interface PageProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export interface CardProps {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

// =============================================================================
// FORMS
// =============================================================================

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export interface TextAreaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// =============================================================================
// DATA DISPLAY
// =============================================================================

export interface TableColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export interface DataTableColumn<TData = Record<string, unknown>> extends TableColumn {
  sortable?: boolean;
  hideable?: boolean;
}

export interface DataTableProps<TData extends Record<string, unknown> = Record<string, unknown>> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  searchable?: boolean;
  exportable?: boolean;
  showColumnVisibility?: boolean;
  onRowClick?: (row: TData, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  pageSize?: number;
  initialSorting?: Array<{ id: string; desc?: boolean }>;
  initialColumnVisibility?: Record<string, boolean>;
  // Server-side pagination
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  manualPagination?: boolean;
}

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// FEEDBACK
// =============================================================================

export interface AlertProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// =============================================================================
// NAVIGATION
// =============================================================================

export interface TabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    danger?: boolean;
    disabled?: boolean;
  }[];
  align?: 'left' | 'right';
}

// =============================================================================
// UI KIT INTERFACE
// =============================================================================

export interface UiKit {
  // Layout
  Page: React.ComponentType<PageProps>;
  Card: React.ComponentType<CardProps>;

  // Forms
  Button: React.ComponentType<ButtonProps>;
  Input: React.ComponentType<InputProps>;
  TextArea: React.ComponentType<TextAreaProps>;
  Select: React.ComponentType<SelectProps>;
  Checkbox: React.ComponentType<CheckboxProps>;

  // Data Display
  Table: React.ComponentType<TableProps>;
  DataTable: React.ComponentType<DataTableProps<any>>;
  Badge: React.ComponentType<BadgeProps>;
  Avatar: React.ComponentType<AvatarProps>;

  // Feedback
  Alert: React.ComponentType<AlertProps>;
  Modal: React.ComponentType<ModalProps>;
  Spinner: React.ComponentType<SpinnerProps>;
  EmptyState: React.ComponentType<EmptyStateProps>;

  // Navigation
  Tabs: React.ComponentType<TabsProps>;
  Dropdown: React.ComponentType<DropdownProps>;
}

