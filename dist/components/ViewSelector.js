'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Star, Filter, Trash, Eye, EyeOff, Columns } from 'lucide-react';
import { useTableView } from '../hooks/useTableView.js';
import { useThemeTokens } from '../theme/index.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { Input } from './Input.js';
import { TextArea } from './TextArea.js';
import { Select } from './Select.js';
import { styles } from './utils.js';
/**
 * Filter operators for table views
 */
export const FILTER_OPERATORS = {
    EQUALS: 'equals',
    NOT_EQUALS: 'notEquals',
    CONTAINS: 'contains',
    NOT_CONTAINS: 'notContains',
    STARTS_WITH: 'startsWith',
    ENDS_WITH: 'endsWith',
    GREATER_THAN: 'greaterThan',
    LESS_THAN: 'lessThan',
    GREATER_THAN_OR_EQUAL: 'greaterThanOrEqual',
    LESS_THAN_OR_EQUAL: 'lessThanOrEqual',
    DATE_EQUALS: 'dateEquals',
    DATE_BEFORE: 'dateBefore',
    DATE_AFTER: 'dateAfter',
    IS_NULL: 'isNull',
    IS_NOT_NULL: 'isNotNull',
    IS_TRUE: 'isTrue',
    IS_FALSE: 'isFalse',
};
/**
 * ViewSelector - Dropdown for selecting and managing table views
 *
 * Provides a dropdown menu showing:
 * - Default (system) views
 * - User's custom views
 * - Option to create new views
 *
 * Requires the table-views feature pack for the API backend.
 * If not installed, the component will not render.
 *
 * @example
 * ```tsx
 * <ViewSelector
 *   tableId="projects"
 *   availableColumns={columns}
 *   onViewChange={(view) => applyFilters(view?.filters || [])}
 * />
 * ```
 */
export function ViewSelector({ tableId, onViewChange, availableColumns = [] }) {
    const { colors, radius, spacing, textStyles: ts, shadows } = useThemeTokens();
    const { views, currentView, loading, available, selectView, deleteView, createView, updateView } = useTableView({
        tableId,
        onViewChange,
    });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingView, setEditingView] = useState(null);
    const [activeTab, setActiveTab] = useState('filters');
    // Builder form state
    const [builderName, setBuilderName] = useState('');
    const [builderDescription, setBuilderDescription] = useState('');
    const [builderFilters, setBuilderFilters] = useState([]);
    const [builderColumnVisibility, setBuilderColumnVisibility] = useState({});
    const [builderSaving, setBuilderSaving] = useState(false);
    const systemViews = views.filter((v) => v.isSystem);
    const customViews = views.filter((v) => !v.isSystem);
    // Get hideable columns (all columns are hideable by default unless specified)
    const hideableColumns = availableColumns.filter((col) => col.hideable !== false);
    // Reset builder when opening
    useEffect(() => {
        if (showBuilder) {
            if (editingView) {
                setBuilderName(editingView.name);
                setBuilderDescription(editingView.description || '');
                setBuilderFilters(editingView.filters || []);
                setBuilderColumnVisibility(editingView.columnVisibility || {});
            }
            else {
                setBuilderName('');
                setBuilderDescription('');
                setBuilderFilters([]);
                // Default: all columns visible
                setBuilderColumnVisibility({});
            }
            setActiveTab('filters');
        }
    }, [showBuilder, editingView]);
    // If API not available (feature pack not installed), don't render
    if (!available) {
        return null;
    }
    const handleDelete = async (view, e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${view.name}"?`)) {
            try {
                await deleteView(view.id);
            }
            catch (error) {
                alert(error?.message || 'Failed to delete view');
            }
        }
    };
    const handleEdit = (view, e) => {
        e.stopPropagation();
        setDropdownOpen(false);
        setEditingView(view);
        setShowBuilder(true);
    };
    const handleCreateNew = () => {
        setDropdownOpen(false);
        setEditingView(null);
        setShowBuilder(true);
    };
    const handleAddFilter = () => {
        const firstColumn = availableColumns[0];
        setBuilderFilters([
            ...builderFilters,
            {
                field: firstColumn?.key || 'status',
                operator: FILTER_OPERATORS.EQUALS,
                value: '',
                sortOrder: builderFilters.length,
            },
        ]);
    };
    const handleRemoveFilter = (index) => {
        setBuilderFilters(builderFilters.filter((_, i) => i !== index));
    };
    const handleFilterChange = (index, field, value) => {
        const newFilters = [...builderFilters];
        newFilters[index] = { ...newFilters[index], [field]: value };
        setBuilderFilters(newFilters);
    };
    const handleSaveView = async () => {
        if (!builderName.trim()) {
            alert('Please enter a view name');
            return;
        }
        setBuilderSaving(true);
        try {
            // Only include columnVisibility if there are hidden columns
            const hasHiddenColumns = Object.values(builderColumnVisibility).some((v) => v === false);
            const viewData = {
                name: builderName.trim(),
                description: builderDescription.trim() || undefined,
                filters: builderFilters.filter((f) => f.field && f.operator),
                columnVisibility: hasHiddenColumns ? builderColumnVisibility : undefined,
            };
            if (editingView) {
                await updateView(editingView.id, viewData);
            }
            else {
                const newView = await createView(viewData);
                selectView(newView);
            }
            setShowBuilder(false);
            setEditingView(null);
        }
        catch (error) {
            alert(error?.message || 'Failed to save view');
        }
        finally {
            setBuilderSaving(false);
        }
    };
    // Toggle column visibility
    const toggleColumnVisibility = (columnKey) => {
        setBuilderColumnVisibility((prev) => ({
            ...prev,
            [columnKey]: prev[columnKey] === false ? true : false,
        }));
    };
    // Check if column is visible (default true if not specified)
    const isColumnVisible = (columnKey) => {
        return builderColumnVisibility[columnKey] !== false;
    };
    // Get operator options based on field type
    const getOperatorOptions = (fieldType) => {
        switch (fieldType) {
            case 'number':
                return [
                    { value: 'equals', label: 'Equals' },
                    { value: 'notEquals', label: 'Not Equals' },
                    { value: 'greaterThan', label: 'Greater Than' },
                    { value: 'lessThan', label: 'Less Than' },
                    { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
                    { value: 'lessThanOrEqual', label: 'Less Than or Equal' },
                ];
            case 'date':
                return [
                    { value: 'dateEquals', label: 'Equals' },
                    { value: 'dateBefore', label: 'Before' },
                    { value: 'dateAfter', label: 'After' },
                    { value: 'isNull', label: 'Is Empty' },
                    { value: 'isNotNull', label: 'Is Not Empty' },
                ];
            case 'boolean':
                return [
                    { value: 'isTrue', label: 'Is True' },
                    { value: 'isFalse', label: 'Is False' },
                ];
            case 'select':
            case 'multiselect':
                return [
                    { value: 'equals', label: 'Equals' },
                    { value: 'notEquals', label: 'Not Equals' },
                    { value: 'isNull', label: 'Is Empty' },
                    { value: 'isNotNull', label: 'Is Not Empty' },
                ];
            default:
                return [
                    { value: 'equals', label: 'Equals' },
                    { value: 'notEquals', label: 'Not Equals' },
                    { value: 'contains', label: 'Contains' },
                    { value: 'startsWith', label: 'Starts With' },
                    { value: 'endsWith', label: 'Ends With' },
                    { value: 'isNull', label: 'Is Empty' },
                    { value: 'isNotNull', label: 'Is Not Empty' },
                ];
        }
    };
    // Render the appropriate value input based on column type
    const renderValueInput = (filter, index, column) => {
        const fieldType = column?.type || 'string';
        const operator = filter.operator;
        // No value input needed for null checks or boolean operators
        if (['isNull', 'isNotNull', 'isTrue', 'isFalse'].includes(operator)) {
            return (_jsx("div", { style: styles({
                    flex: 1,
                    padding: spacing.sm,
                    color: colors.text.muted,
                    fontSize: ts.bodySmall.fontSize,
                    fontStyle: 'italic',
                }), children: "No value needed" }));
        }
        // Select/Multiselect with options
        if ((fieldType === 'select' || fieldType === 'multiselect') && column?.options) {
            return (_jsx("div", { style: { flex: 1 }, children: _jsx(Select, { value: filter.value?.toString() || '', onChange: (value) => handleFilterChange(index, 'value', value), options: column.options, placeholder: "Select value..." }) }));
        }
        // Boolean field
        if (fieldType === 'boolean') {
            return (_jsx("div", { style: { flex: 1 }, children: _jsx(Select, { value: filter.value?.toString() || '', onChange: (value) => handleFilterChange(index, 'value', value === 'true'), options: [
                        { value: 'true', label: 'Yes / True' },
                        { value: 'false', label: 'No / False' },
                    ], placeholder: "Select..." }) }));
        }
        // Date field
        if (fieldType === 'date') {
            return (_jsx("div", { style: { flex: 1 }, children: _jsx(Input, { type: "date", value: filter.value?.toString() || '', onChange: (value) => handleFilterChange(index, 'value', value) }) }));
        }
        // Number field
        if (fieldType === 'number') {
            return (_jsx("div", { style: { flex: 1 }, children: _jsx(Input, { type: "number", value: filter.value?.toString() || '', onChange: (value) => handleFilterChange(index, 'value', value ? Number(value) : ''), placeholder: "Enter number..." }) }));
        }
        // Default: text input
        return (_jsx("div", { style: { flex: 1 }, children: _jsx(Input, { value: filter.value?.toString() || '', onChange: (value) => handleFilterChange(index, 'value', value), placeholder: "Enter value..." }) }));
    };
    // Inline styles
    const dropdownStyles = {
        container: styles({
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 50,
            marginTop: spacing.xs,
            minWidth: '360px',
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: radius.lg,
            boxShadow: shadows.xl,
            overflow: 'hidden',
        }),
        sectionHeader: styles({
            padding: `${spacing.xs} ${spacing.md}`,
            fontSize: ts.bodySmall.fontSize,
            fontWeight: ts.label.fontWeight,
            color: colors.text.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: `1px solid ${colors.border.subtle}`,
            backgroundColor: colors.bg.elevated,
        }),
        viewItem: styles({
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.sm} ${spacing.md}`,
            fontSize: ts.body.fontSize,
            textAlign: 'left',
            color: colors.text.secondary,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 150ms ease',
        }),
        iconButton: styles({
            padding: spacing.xs,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.text.muted,
            display: 'flex',
            alignItems: 'center',
            borderRadius: radius.sm,
        }),
    };
    return (_jsxs("div", { style: { position: 'relative' }, children: [_jsxs(Button, { variant: "secondary", size: "sm", disabled: loading, onClick: () => setDropdownOpen(!dropdownOpen), children: [_jsx(Filter, { size: 14, style: { marginRight: spacing.xs } }), currentView?.name || 'All Items', _jsx(ChevronDown, { size: 14, style: { marginLeft: spacing.xs } })] }), dropdownOpen && (_jsxs(_Fragment, { children: [_jsx("div", { onClick: () => setDropdownOpen(false), style: styles({ position: 'fixed', inset: 0, zIndex: 40 }) }), _jsxs("div", { style: dropdownStyles.container, children: [systemViews.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: dropdownStyles.sectionHeader, children: "Default Views" }), systemViews.map((view) => (_jsxs("button", { onClick: () => {
                                            selectView(view);
                                            setDropdownOpen(false);
                                        }, style: styles({
                                            ...dropdownStyles.viewItem,
                                            backgroundColor: currentView?.id === view.id ? colors.bg.elevated : 'transparent',
                                        }), onMouseEnter: (e) => {
                                            e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.backgroundColor =
                                                currentView?.id === view.id ? colors.bg.elevated : 'transparent';
                                        }, children: [view.isDefault && _jsx(Star, { size: 14, style: { color: colors.primary.default } }), _jsx("span", { style: { flex: 1 }, children: view.name }), view.filters?.length > 0 && (_jsxs("span", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted }), children: [view.filters.length, " filter", view.filters.length !== 1 ? 's' : ''] }))] }, view.id)))] })), customViews.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: styles({
                                            ...dropdownStyles.sectionHeader,
                                            borderTop: systemViews.length > 0 ? `1px solid ${colors.border.subtle}` : undefined,
                                        }), children: "My Views" }), customViews.map((view) => (_jsxs("div", { style: styles({
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: `${spacing.xs} ${spacing.sm} ${spacing.xs} ${spacing.md}`,
                                            backgroundColor: currentView?.id === view.id ? colors.bg.elevated : 'transparent',
                                            transition: 'background-color 150ms ease',
                                        }), onMouseEnter: (e) => {
                                            e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.backgroundColor =
                                                currentView?.id === view.id ? colors.bg.elevated : 'transparent';
                                        }, children: [_jsxs("button", { onClick: () => {
                                                    selectView(view);
                                                    setDropdownOpen(false);
                                                }, style: styles({
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: spacing.xs,
                                                    padding: `${spacing.xs} 0`,
                                                    fontSize: ts.body.fontSize,
                                                    textAlign: 'left',
                                                    color: colors.text.secondary,
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                }), children: [_jsx("span", { style: { flex: 1 }, children: view.name }), view.filters?.length > 0 && (_jsxs("span", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted }), children: [view.filters.length, " filter", view.filters.length !== 1 ? 's' : ''] }))] }), _jsx("button", { onClick: (e) => handleEdit(view, e), style: dropdownStyles.iconButton, title: "Edit view", children: _jsx(Edit2, { size: 14 }) }), _jsx("button", { onClick: (e) => handleDelete(view, e), style: styles({ ...dropdownStyles.iconButton, color: colors.error?.default || '#ef4444' }), title: "Delete view", children: _jsx(Trash2, { size: 14 }) })] }, view.id)))] })), _jsx("div", { style: styles({ borderTop: `1px solid ${colors.border.subtle}`, padding: spacing.xs }), children: _jsxs("button", { onClick: handleCreateNew, style: styles({
                                        ...dropdownStyles.viewItem,
                                        borderRadius: radius.md,
                                        color: colors.primary.default,
                                    }), onMouseEnter: (e) => {
                                        e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                    }, onMouseLeave: (e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }, children: [_jsx(Plus, { size: 14 }), _jsx("span", { children: "Create New View" })] }) })] })] })), showBuilder && (_jsx(Modal, { open: showBuilder, onClose: () => {
                    setShowBuilder(false);
                    setEditingView(null);
                }, title: editingView ? 'Edit View' : 'Create New View', size: "lg", children: _jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.lg, padding: spacing.lg }), children: [_jsx(Input, { label: "View Name", value: builderName, onChange: setBuilderName, placeholder: "e.g., Active Projects, High Priority", required: true }), _jsx(TextArea, { label: "Description (optional)", value: builderDescription, onChange: setBuilderDescription, placeholder: "Describe what this view shows", rows: 2 }), _jsxs("div", { style: styles({ display: 'flex', gap: spacing.xs, borderBottom: `1px solid ${colors.border.subtle}` }), children: [_jsxs("button", { onClick: () => setActiveTab('filters'), style: styles({
                                        padding: `${spacing.sm} ${spacing.md}`,
                                        fontSize: ts.body.fontSize,
                                        fontWeight: activeTab === 'filters' ? ts.label.fontWeight : 'normal',
                                        color: activeTab === 'filters' ? colors.primary.default : colors.text.muted,
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'filters' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                                        marginBottom: '-1px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing.xs,
                                    }), children: [_jsx(Filter, { size: 14 }), "Filters", builderFilters.length > 0 && (_jsx("span", { style: styles({
                                                backgroundColor: colors.primary.default,
                                                color: '#fff',
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: radius.full,
                                                fontWeight: '600',
                                            }), children: builderFilters.length }))] }), _jsxs("button", { onClick: () => setActiveTab('columns'), style: styles({
                                        padding: `${spacing.sm} ${spacing.md}`,
                                        fontSize: ts.body.fontSize,
                                        fontWeight: activeTab === 'columns' ? ts.label.fontWeight : 'normal',
                                        color: activeTab === 'columns' ? colors.primary.default : colors.text.muted,
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'columns' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                                        marginBottom: '-1px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing.xs,
                                    }), children: [_jsx(Columns, { size: 14 }), "Columns", Object.values(builderColumnVisibility).some((v) => v === false) && (_jsxs("span", { style: styles({
                                                backgroundColor: colors.warning?.default || '#f59e0b',
                                                color: '#fff',
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: radius.full,
                                                fontWeight: '600',
                                            }), children: [Object.values(builderColumnVisibility).filter((v) => v === false).length, " hidden"] }))] })] }), activeTab === 'filters' && (_jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.md }), children: [_jsx("div", { style: styles({ display: 'flex', justifyContent: 'flex-end' }), children: _jsxs(Button, { variant: "secondary", size: "sm", onClick: handleAddFilter, children: [_jsx(Plus, { size: 14, style: { marginRight: spacing.xs } }), "Add Filter"] }) }), builderFilters.length === 0 ? (_jsx("div", { style: styles({
                                        padding: spacing.xl,
                                        textAlign: 'center',
                                        color: colors.text.muted,
                                        fontSize: ts.body.fontSize,
                                        border: `1px dashed ${colors.border.subtle}`,
                                        borderRadius: radius.md,
                                    }), children: "No filters. Add filters to narrow down your view." })) : (_jsx("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.sm }), children: builderFilters.map((filter, index) => {
                                        const col = availableColumns.find((c) => c.key === filter.field);
                                        return (_jsxs("div", { style: styles({
                                                display: 'flex',
                                                gap: spacing.sm,
                                                alignItems: 'center',
                                                padding: spacing.md,
                                                backgroundColor: colors.bg.elevated,
                                                borderRadius: radius.md,
                                                border: `1px solid ${colors.border.subtle}`,
                                            }), children: [_jsx(Select, { value: filter.field, onChange: (value) => {
                                                        // Reset operator and value when field changes
                                                        const newCol = availableColumns.find((c) => c.key === value);
                                                        const defaultOp = getOperatorOptions(newCol?.type)[0]?.value || 'equals';
                                                        handleFilterChange(index, 'field', value);
                                                        handleFilterChange(index, 'operator', defaultOp);
                                                        handleFilterChange(index, 'value', '');
                                                    }, options: availableColumns.length > 0
                                                        ? availableColumns.map((c) => ({ value: c.key, label: c.label }))
                                                        : [{ value: 'status', label: 'Status' }], placeholder: "Field" }), _jsx(Select, { value: filter.operator, onChange: (value) => handleFilterChange(index, 'operator', value), options: getOperatorOptions(col?.type), placeholder: "Operator" }), renderValueInput(filter, index, col), _jsx("button", { onClick: () => handleRemoveFilter(index), style: styles({
                                                        padding: spacing.sm,
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: colors.error?.default || '#ef4444',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }), children: _jsx(Trash, { size: 16 }) })] }, index));
                                    }) }))] })), activeTab === 'columns' && (_jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.md }), children: [_jsx("p", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, margin: 0 }), children: "Select which columns to show in this view. Hidden columns will not appear in the table." }), hideableColumns.length === 0 ? (_jsx("div", { style: styles({
                                        padding: spacing.xl,
                                        textAlign: 'center',
                                        color: colors.text.muted,
                                        fontSize: ts.body.fontSize,
                                        border: `1px dashed ${colors.border.subtle}`,
                                        borderRadius: radius.md,
                                    }), children: "No columns available to configure." })) : (_jsx("div", { style: styles({
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                        gap: spacing.sm,
                                    }), children: hideableColumns.map((col) => {
                                        const visible = isColumnVisible(col.key);
                                        return (_jsxs("button", { onClick: () => toggleColumnVisibility(col.key), style: styles({
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: spacing.sm,
                                                padding: spacing.md,
                                                backgroundColor: visible ? colors.bg.surface : colors.bg.elevated,
                                                border: `1px solid ${visible ? colors.border.subtle : colors.border.default}`,
                                                borderRadius: radius.md,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 150ms ease',
                                                opacity: visible ? 1 : 0.6,
                                            }), children: [visible ? (_jsx(Eye, { size: 16, style: { color: colors.success?.default || '#22c55e' } })) : (_jsx(EyeOff, { size: 16, style: { color: colors.text.muted } })), _jsx("span", { style: styles({
                                                        flex: 1,
                                                        fontSize: ts.body.fontSize,
                                                        color: visible ? colors.text.primary : colors.text.muted,
                                                        textDecoration: visible ? 'none' : 'line-through',
                                                    }), children: col.label })] }, col.key));
                                    }) })), _jsxs("div", { style: styles({ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }), children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: () => {
                                                // Show all columns
                                                setBuilderColumnVisibility({});
                                            }, children: "Show All" }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => {
                                                // Hide all columns (except first one)
                                                const hidden = {};
                                                hideableColumns.forEach((col, i) => {
                                                    if (i > 0)
                                                        hidden[col.key] = false;
                                                });
                                                setBuilderColumnVisibility(hidden);
                                            }, children: "Hide All" })] })] })), _jsxs("div", { style: styles({
                                display: 'flex',
                                gap: spacing.md,
                                justifyContent: 'flex-end',
                                paddingTop: spacing.lg,
                                borderTop: `1px solid ${colors.border.subtle}`,
                            }), children: [_jsx(Button, { variant: "secondary", onClick: () => {
                                        setShowBuilder(false);
                                        setEditingView(null);
                                    }, disabled: builderSaving, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: handleSaveView, disabled: builderSaving || !builderName.trim(), children: builderSaving ? 'Saving...' : editingView ? 'Update View' : 'Create View' })] })] }) }))] }));
}
//# sourceMappingURL=ViewSelector.js.map