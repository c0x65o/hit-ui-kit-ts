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
}
export interface TableProps {
    columns: TableColumn[];
    data: Record<string, unknown>[];
    onRowClick?: (row: Record<string, unknown>, index: number) => void;
    emptyMessage?: string;
    loading?: boolean;
}
/** Option for select/multiselect fields in view builder */
export interface FilterOption {
    value: string;
    label: string;
    /** Sort order for grouping - lower numbers appear first */
    sortOrder?: number;
}
export interface DataTableColumn<TData = Record<string, unknown>> extends Omit<TableColumn, 'render'> {
    sortable?: boolean;
    hideable?: boolean;
    render?: (value: any, row?: TData, index?: number) => React.ReactNode;
    /** Field type for view builder (affects filter operators and value input) */
    filterType?: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
    /** Options for select/multiselect fields in view builder */
    filterOptions?: FilterOption[];
}
export interface GroupConfig<TData = Record<string, unknown>> {
    /** Field key to group by */
    field: string;
    /** Custom sort order for groups. Can be an array of group values in desired order, or a function that returns sort order */
    sortOrder?: string[] | ((groupValue: unknown, groupData: TData[]) => number);
    /** Custom label renderer for group headers */
    renderLabel?: (groupValue: unknown, groupData: TData[]) => React.ReactNode;
    /** Whether groups are collapsed by default */
    defaultCollapsed?: boolean;
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
    /** Optional page-size selector options (only shown when onPageSizeChange is provided) */
    pageSizeOptions?: number[];
    /** Called when the user selects a different page size */
    onPageSizeChange?: (pageSize: number) => void;
    initialSorting?: Array<{
        id: string;
        desc?: boolean;
    }>;
    initialColumnVisibility?: Record<string, boolean>;
    total?: number;
    page?: number;
    onPageChange?: (page: number) => void;
    manualPagination?: boolean;
    onRefresh?: () => void;
    refreshing?: boolean;
    showRefresh?: boolean;
    groupBy?: GroupConfig<TData>;
    /** Number of items to show per group initially (enables per-group pagination) */
    groupPageSize?: number;
    tableId?: string;
    enableViews?: boolean;
    onViewFiltersChange?: (filters: Array<{
        field: string;
        operator: string;
        value: any;
    }>) => void;
    /** How to combine view filters in queries: 'all' (AND) or 'any' (OR). Defaults to 'all'. */
    onViewFilterModeChange?: (mode: 'all' | 'any') => void;
    onViewGroupByChange?: (groupBy: {
        field: string;
        sortOrder?: string[];
    } | null) => void;
    /** Default sort stored on the view (multi-sort supported). */
    onViewSortingChange?: (sorting: Array<{
        id: string;
        desc: boolean;
    }>) => void;
    /** Receive the full selected view object (includes metadata) when the user changes views */
    onViewChange?: (view: any | null) => void;
}
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    children: React.ReactNode;
}
export interface AvatarProps {
    src?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
}
export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
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
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    children: React.ReactNode;
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
    size?: 'sm' | 'md' | 'lg' | 'xl';
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
export interface TabsProps {
    tabs: {
        id?: string;
        value?: string;
        label: string;
        content?: React.ReactNode;
    }[];
    activeTab?: string;
    onChange?: (tabId: string) => void;
    value?: string;
    onValueChange?: (tabId: string) => void;
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
export interface HelpProps {
    content: React.ReactNode;
    title?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    trigger?: 'hover' | 'click';
    icon?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}
export interface UiKit {
    Page: React.ComponentType<PageProps>;
    Card: React.ComponentType<CardProps>;
    Button: React.ComponentType<ButtonProps>;
    Input: React.ComponentType<InputProps>;
    TextArea: React.ComponentType<TextAreaProps>;
    Select: React.ComponentType<SelectProps>;
    Checkbox: React.ComponentType<CheckboxProps>;
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