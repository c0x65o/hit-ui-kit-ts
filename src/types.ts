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
  title?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
  children: React.ReactNode;
}

export interface CardProps {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// FORMS
// =============================================================================

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick' | 'disabled'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime' | 'datetime-local' | 'time' | 'month' | 'week' | 'color' | 'range' | 'file' | 'hidden' | 'checkbox' | 'radio' | 'submit' | 'reset' | 'button' | 'image';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
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
  style?: React.CSSProperties;
}

export interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// =============================================================================
// AUTOCOMPLETE
// =============================================================================

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;

  minQueryLength?: number; // default 2
  debounceMs?: number; // default 300
  limit?: number; // default 10

  onSearch: (query: string, limit: number) => Promise<AutocompleteOption[]>;
  resolveValue?: (value: string) => Promise<AutocompleteOption | null>;

  emptyMessage?: string;
  searchingMessage?: string;
  clearable?: boolean;
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
  sortable?: boolean;
}

export interface TableProps {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export interface GlobalFilterConfig {
  /** Column key to filter on */
  columnKey: string;
  /** Override label (defaults to column label) */
  label?: string;
  /** Override filter type (defaults to column filterType) */
  filterType?: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'autocomplete';
  /** Override filter options (for select/multiselect) */
  filterOptions?: Array<{ value: string; label: string; sortOrder?: number }>;
  /** For autocomplete: search function */
  onSearch?: (query: string, limit: number) => Promise<Array<{ value: string; label: string; description?: string }>>;
  /** For autocomplete: resolve value to label */
  resolveValue?: (value: string) => Promise<{ value: string; label: string; description?: string } | null>;
  /** Whether this filter is required */
  required?: boolean;
  /** Default value */
  defaultValue?: string | string[];
  /** Set to false to exclude this column from auto-generated filters */
  enabled?: boolean;
}

export interface DataTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    hideable?: boolean;
    filterType?: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'autocomplete';
    // Flexible shape, commonly: [{ value, label }]
    filterOptions?: Array<{ value: string; label: string; sortOrder?: number }>;
    // For autocomplete: search function
    onSearch?: (query: string, limit: number) => Promise<Array<{ value: string; label: string; description?: string }>>;
    // For autocomplete: resolve value to label
    resolveValue?: (value: string) => Promise<{ value: string; label: string; description?: string } | null>;
  }>;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  // Search and export
  searchable?: boolean;
  exportable?: boolean;
  showColumnVisibility?: boolean;
  // Global filters
  /** Show global filter bar - auto-generates from columns with filterType + filterOptions/onSearch */
  showGlobalFilters?: boolean;
  /** Optional overrides for auto-generated filters, or explicit filter configs */
  globalFilters?: GlobalFilterConfig[];
  onGlobalFiltersChange?: (filters: Record<string, string | string[]>) => void;
  // Pagination
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  initialSorting?: Array<{ id: string; desc?: boolean }>;
  initialColumnVisibility?: Record<string, boolean>;
  // Server-side pagination
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  manualPagination?: boolean;
  // Refresh
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  showRefresh?: boolean;
  // Grouping
  groupBy?: {
    field: string;
    sortOrder?: string[] | ((groupValue: any, groupData: any[]) => number);
    renderLabel?: (groupValue: any, groupData: any[]) => React.ReactNode;
    defaultCollapsed?: boolean;
  } | null;
  groupPageSize?: number;
  // View system
  tableId?: string;
  enableViews?: boolean;
  onViewFiltersChange?: (filters: any[]) => void;
  onViewFilterModeChange?: (mode: string) => void;
  onViewGroupByChange?: (groupBy: any) => void;
  onViewSortingChange?: (sorting: Array<{ id: string; desc?: boolean }>) => void;
  onViewChange?: (view: any) => void;
}

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// =============================================================================
// FEEDBACK
// =============================================================================

export interface AlertProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  footer?: React.ReactNode;
}

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

// =============================================================================
// NAVIGATION
// =============================================================================

export interface TabsProps {
  tabs: Array<{
    id?: string;
    value?: string;
    label: string;
    content?: React.ReactNode;
  }>;

  // Controlled APIs supported by the Tabs component
  activeTab?: string;
  onChange?: (tabId: string) => void;
  value?: string;
  onValueChange?: (tabId: string) => void;

  // Legacy API still used by some packs
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
    danger?: boolean;
  }>;
  align?: 'left' | 'right';
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
  showHome?: boolean;
  homeHref?: string;
}

// =============================================================================
// HELP
// =============================================================================

export interface HelpProps {
  content: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
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
  ColorPicker: React.ComponentType<ColorPickerProps>;
  TextArea: React.ComponentType<TextAreaProps>;
  Select: React.ComponentType<SelectProps>;
  Checkbox: React.ComponentType<CheckboxProps>;
  Autocomplete: React.ComponentType<AutocompleteProps>;

  // Data Display
  Table: React.ComponentType<TableProps>;
  DataTable: React.ComponentType<DataTableProps<any>>;
  Badge: React.ComponentType<BadgeProps>;
  Avatar: React.ComponentType<AvatarProps>;

  // Feedback
  Alert: React.ComponentType<AlertProps>;
  Modal: React.ComponentType<ModalProps>;
  AlertDialog: React.ComponentType<AlertDialogProps>;
  Spinner: React.ComponentType<SpinnerProps>;
  EmptyState: React.ComponentType<EmptyStateProps>;

  // Navigation
  Tabs: React.ComponentType<TabsProps>;
  Dropdown: React.ComponentType<DropdownProps>;
  Breadcrumb: React.ComponentType<BreadcrumbProps>;

  // Help
  Help: React.ComponentType<HelpProps>;
}
