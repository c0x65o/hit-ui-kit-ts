/**
 * Component Prop Types
 *
 * Type definitions for all UI Kit components.
 */
import React from 'react';
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
export interface DataTableProps<T = Record<string, unknown>> {
    data: T[];
    columns: Array<{
        key: string;
        label: string;
        render?: (value: unknown, row: T, index: number) => React.ReactNode;
        width?: string;
        align?: 'left' | 'center' | 'right';
        sortable?: boolean;
    }>;
    onRowClick?: (row: T, index: number) => void;
    emptyMessage?: string;
    loading?: boolean;
}
export interface BadgeProps {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'secondary';
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
export interface AlertProps {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
}
export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    footer?: React.ReactNode;
}
export interface AlertDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
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
export interface TabsProps {
    tabs: Array<{
        id: string;
        label: string;
        content: React.ReactNode;
    }>;
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
}
export interface HelpProps {
    content: React.ReactNode;
    title?: string;
    icon?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}
export interface UiKit {
    Page: React.ComponentType<PageProps>;
    Card: React.ComponentType<CardProps>;
    Button: React.ComponentType<ButtonProps>;
    Input: React.ComponentType<InputProps>;
    ColorPicker: React.ComponentType<ColorPickerProps>;
    TextArea: React.ComponentType<TextAreaProps>;
    Select: React.ComponentType<SelectProps>;
    Checkbox: React.ComponentType<CheckboxProps>;
    Autocomplete: React.ComponentType<AutocompleteProps>;
    Table: React.ComponentType<TableProps>;
    DataTable: React.ComponentType<DataTableProps<any>>;
    Badge: React.ComponentType<BadgeProps>;
    Avatar: React.ComponentType<AvatarProps>;
    Alert: React.ComponentType<AlertProps>;
    Modal: React.ComponentType<ModalProps>;
    AlertDialog: React.ComponentType<AlertDialogProps>;
    Spinner: React.ComponentType<SpinnerProps>;
    EmptyState: React.ComponentType<EmptyStateProps>;
    Tabs: React.ComponentType<TabsProps>;
    Dropdown: React.ComponentType<DropdownProps>;
    Breadcrumb: React.ComponentType<BreadcrumbProps>;
    Help: React.ComponentType<HelpProps>;
}
//# sourceMappingURL=types.d.ts.map