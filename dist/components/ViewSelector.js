'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Star, Filter, Trash, Eye, EyeOff, Columns, Layers, Share2, Users, ArrowUpDown, Check } from 'lucide-react';
import { useTableView } from '../hooks/useTableView';
import { useThemeTokens } from '../theme/index.js';
import { useAlertDialog } from '../hooks/useAlertDialog.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { AlertDialog } from './AlertDialog.js';
import { Input } from './Input.js';
import { Select } from './Select.js';
import { TableViewSharingPanel } from './TableViewSharingPanel.js';
import { styles } from './utils.js';
import { Autocomplete } from './Autocomplete.js';
import { getTableFilters } from '../config/tableFilters.js';
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
    DATE_BETWEEN: 'dateBetween',
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
export function ViewSelector({ tableId, onViewChange, onReady, availableColumns = [], fetchPrincipals }) {
    const { colors, radius, spacing, textStyles: ts, shadows } = useThemeTokens();
    const { views, currentView, loading, available, viewReady, selectView, deleteView, createView, updateView, getShares, addShare, removeShare } = useTableView({
        tableId,
        onViewChange,
    });
    const alertDialog = useAlertDialog();
    // Cache dynamic select options for view builder (optionsEndpoint from TABLE_FILTER_REGISTRY)
    const [registryOptionsCache, setRegistryOptionsCache] = useState({});
    const [registryOptionsLoading, setRegistryOptionsLoading] = useState(false);
    // Use ref for onReady to avoid infinite loops when parent passes new function reference
    const onReadyRef = useRef(onReady);
    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);
    // SINGLE SOURCE OF TRUTH: Merge registry filters with passed-in columns
    // Registry takes priority, then fall back to passed-in columns
    const effectiveColumns = useMemo(() => {
        const registryFilters = getTableFilters(tableId);
        // Build a map of registry filters by columnKey
        const registryMap = new Map();
        for (const filter of registryFilters) {
            const cachedOptions = registryOptionsCache[filter.columnKey];
            // Convert TableFilterDefinition to ViewColumnDefinition
            // Keep 'autocomplete' type so we can render the right component
            registryMap.set(filter.columnKey, {
                key: filter.columnKey,
                label: filter.label,
                type: filter.filterType,
                // For select/multiselect, prefer staticOptions, else use fetched options.
                options: filter.staticOptions || cachedOptions,
                // Preserve autocomplete endpoints
                searchEndpoint: filter.searchEndpoint,
                resolveEndpoint: filter.resolveEndpoint,
                itemsPath: filter.itemsPath,
                valueField: filter.valueField,
                labelField: filter.labelField,
            });
        }
        // If registry has filters, use them as base and merge with passed columns
        if (registryMap.size > 0) {
            // Start with registry columns
            const merged = new Map(registryMap);
            // Add any passed columns that aren't in registry (e.g., columns without filter config)
            for (const col of availableColumns) {
                if (!merged.has(col.key)) {
                    merged.set(col.key, col);
                }
                else {
                    // Merge options from passed columns into registry columns
                    const existing = merged.get(col.key);
                    if (col.options && !existing.options) {
                        existing.options = col.options;
                    }
                    if (col.hideable !== undefined && existing.hideable === undefined) {
                        existing.hideable = col.hideable;
                    }
                }
            }
            return Array.from(merged.values());
        }
        // No registry, use passed columns
        return availableColumns;
    }, [tableId, availableColumns, registryOptionsCache]);
    // Fetch dynamic options for select/multiselect fields used in view builder.
    // Without this, view filters fall back to a free-text input even when quick-filters show a dropdown.
    useEffect(() => {
        const registryFilters = getTableFilters(tableId);
        const dynamicSelects = registryFilters.filter((f) => (f.filterType === 'select' || f.filterType === 'multiselect') && !!f.optionsEndpoint);
        if (dynamicSelects.length === 0)
            return;
        let cancelled = false;
        setRegistryOptionsLoading(true);
        const fetchOptions = async (f) => {
            try {
                // Be generous on pageSize so we can build a complete dropdown for view builder.
                const url = f.optionsEndpoint.includes('?')
                    ? `${f.optionsEndpoint}&pageSize=500`
                    : `${f.optionsEndpoint}?pageSize=500`;
                const res = await fetch(url);
                if (!res.ok)
                    return { key: f.columnKey, options: [] };
                const json = await res.json();
                // Extract items from response
                const itemsPath = f.itemsPath;
                let items = json;
                if (itemsPath) {
                    for (const part of itemsPath.split('.')) {
                        items = items?.[part];
                    }
                }
                if (!Array.isArray(items))
                    items = [];
                const valueField = f.valueField || 'id';
                const labelField = f.labelField || 'name';
                const options = items
                    .map((item) => {
                    const value = String(item?.[valueField] ?? item?.id ?? '');
                    const label = String(item?.[labelField] ?? item?.name ?? value);
                    return value ? { value, label } : null;
                })
                    .filter(Boolean);
                return { key: f.columnKey, options };
            }
            catch {
                return { key: f.columnKey, options: [] };
            }
        };
        Promise.all(dynamicSelects.map(fetchOptions))
            .then((results) => {
            if (cancelled)
                return;
            setRegistryOptionsCache((prev) => {
                const next = { ...prev };
                for (const r of results)
                    next[r.key] = r.options;
                return next;
            });
        })
            .finally(() => {
            if (!cancelled)
                setRegistryOptionsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [tableId]);
    // Notify parent when view system is ready
    useEffect(() => {
        // If views API isn't available (feature pack not installed), treat as "ready"
        // so tables don't get stuck in Loading state waiting for a view that can't load.
        onReadyRef.current?.(available ? viewReady : true);
    }, [available, viewReady]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingView, setEditingView] = useState(null);
    const [activeTab, setActiveTab] = useState('filters');
    // Builder form state
    const [builderName, setBuilderName] = useState('');
    const [builderFilters, setBuilderFilters] = useState([]);
    const [builderFilterMode, setBuilderFilterMode] = useState('all');
    const [builderColumnVisibility, setBuilderColumnVisibility] = useState({});
    const [builderGroupByField, setBuilderGroupByField] = useState('');
    const [builderSorting, setBuilderSorting] = useState([]);
    const [builderSaving, setBuilderSaving] = useState(false);
    // Share state
    const [shares, setShares] = useState([]);
    const [sharesLoading, setSharesLoading] = useState(false);
    // When creating a new view (no id yet), queue up share recipients and apply after creation
    const [pendingShareRecipients, setPendingShareRecipients] = useState([]);
    // Categorize views
    const systemViews = views.filter((v) => v._category === 'system' || v.isSystem);
    const customViews = views.filter((v) => v._category === 'user' || (!v.isSystem && v._category !== 'shared'));
    const sharedViews = views.filter((v) => v._category === 'shared');
    // Human label for "All <table>" (derived from tableId)
    const tableLabel = String(tableId)
        .split('.')
        .slice(-1)[0]
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    const allLabel = `All ${tableLabel}`;
    // Get hideable columns (all columns are hideable by default unless specified)
    const hideableColumns = effectiveColumns.filter((col) => col.hideable !== false);
    // Reset builder when opening
    useEffect(() => {
        if (showBuilder) {
            if (editingView) {
                setBuilderName(editingView.name);
                setBuilderFilters(editingView.filters || []);
                const modeRaw = editingView.metadata?.filterMode;
                setBuilderFilterMode(modeRaw === 'any' ? 'any' : 'all');
                setBuilderColumnVisibility(editingView.columnVisibility || {});
                setBuilderGroupByField(editingView.groupBy?.field || '');
                setBuilderSorting(editingView.sorting || []);
                // Load shares when editing
                setSharesLoading(true);
                getShares(editingView.id)
                    .then(setShares)
                    .catch(() => setShares([]))
                    .finally(() => setSharesLoading(false));
            }
            else {
                setBuilderName('');
                setBuilderFilters([]);
                setBuilderFilterMode('all');
                // Default: all columns visible
                setBuilderColumnVisibility({});
                setBuilderGroupByField('');
                setBuilderSorting([]);
                setShares([]);
                setPendingShareRecipients([]);
            }
            setActiveTab('filters');
        }
    }, [showBuilder, editingView, getShares]);
    // If API not available (feature pack not installed), don't render
    if (!available) {
        return null;
    }
    const handleDelete = async (view, e) => {
        e.stopPropagation();
        const confirmed = await alertDialog.showConfirm(`Are you sure you want to delete "${view.name}"?`, {
            title: 'Delete View',
            variant: 'warning',
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });
        if (confirmed) {
            try {
                await deleteView(view.id);
            }
            catch (error) {
                await alertDialog.showAlert(error?.message || 'Failed to delete view', {
                    variant: 'error',
                    title: 'Error',
                });
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
        const firstColumn = effectiveColumns[0];
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
        setBuilderFilters((prev) => prev.filter((_, i) => i !== index));
    };
    const handleFilterChange = (index, field, value) => {
        setBuilderFilters((prev) => {
            const newFilters = [...prev];
            newFilters[index] = { ...newFilters[index], [field]: value };
            return newFilters;
        });
    };
    // Update multiple filter fields at once (avoids stale closure issues)
    const handleFilterFieldChange = (index, newField) => {
        const newCol = effectiveColumns.find((c) => c.key === newField);
        const defaultOp = getOperatorOptions(newCol?.type)[0]?.value || 'equals';
        setBuilderFilters((prev) => {
            const newFilters = [...prev];
            newFilters[index] = {
                ...newFilters[index],
                field: newField,
                operator: defaultOp,
                value: '',
            };
            return newFilters;
        });
    };
    const handleAddSort = () => {
        const firstColumn = effectiveColumns[0];
        const nextId = String(firstColumn?.key || 'name');
        setBuilderSorting((prev) => [...prev, { id: nextId, desc: false }]);
    };
    const handleRemoveSort = (index) => {
        setBuilderSorting((prev) => prev.filter((_, i) => i !== index));
    };
    const handleSortChange = (index, patch) => {
        setBuilderSorting((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };
    const handleSaveView = async () => {
        if (!builderName.trim()) {
            await alertDialog.showAlert('Please enter a view name', {
                variant: 'warning',
                title: 'Validation Error',
            });
            return;
        }
        setBuilderSaving(true);
        try {
            // Only include columnVisibility if there are hidden columns
            const hasHiddenColumns = Object.values(builderColumnVisibility).some((v) => v === false);
            // Build groupBy config (canonical: no persisted sort order; ordering should be derived from data)
            let groupByConfig;
            if (builderGroupByField) {
                groupByConfig = { field: builderGroupByField };
            }
            const baseMetadata = editingView?.metadata && typeof editingView.metadata === 'object'
                ? editingView.metadata
                : {};
            const viewData = {
                name: builderName.trim(),
                filters: builderFilters.filter((f) => f.field && f.operator),
                columnVisibility: hasHiddenColumns ? builderColumnVisibility : undefined,
                groupBy: groupByConfig,
                sorting: builderSorting.length > 0 ? builderSorting : undefined,
                metadata: { ...baseMetadata, filterMode: builderFilterMode },
            };
            if (editingView) {
                await updateView(editingView.id, viewData);
            }
            else {
                const newView = await createView(viewData);
                // Apply any queued shares now that we have a view id
                if (pendingShareRecipients.length > 0) {
                    const failures = [];
                    for (const recipient of pendingShareRecipients) {
                        try {
                            await addShare(newView.id, recipient.principalType, recipient.principalId);
                        }
                        catch (err) {
                            failures.push(`${recipient.principalId}${err?.message ? ` (${err.message})` : ''}`);
                        }
                    }
                    if (failures.length > 0) {
                        await alertDialog.showAlert(`View created, but some shares failed:\n${failures.join('\n')}`, { variant: 'warning', title: 'Sharing partially failed' });
                    }
                }
                selectView(newView);
            }
            setShowBuilder(false);
            setEditingView(null);
        }
        catch (error) {
            await alertDialog.showAlert(error?.message || 'Failed to save view', {
                variant: 'error',
                title: 'Error',
            });
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
            case 'datetime':
            case 'daterange':
                return [
                    { value: 'dateBetween', label: 'Between' },
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
        if (fieldType === 'date' || fieldType === 'datetime' || fieldType === 'daterange') {
            // dateBetween stores a JSON string value: {"from":"...","to":"..."}
            if (operator === 'dateBetween') {
                let from = '';
                let to = '';
                const raw = filter.value?.toString() || '';
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed === 'object') {
                            from = String(parsed.from || parsed.start || '');
                            to = String(parsed.to || parsed.end || '');
                        }
                    }
                    catch {
                        // Support legacy "a..b" or "a,b"
                        const sep = raw.includes('..') ? '..' : (raw.includes(',') ? ',' : null);
                        if (sep) {
                            const parts = raw.split(sep).map((s) => s.trim());
                            from = parts[0] || '';
                            to = parts[1] || '';
                        }
                    }
                }
                const inputType = fieldType === 'datetime' ? 'datetime-local' : 'date';
                const setRange = (patch) => {
                    const nextFrom = patch.from !== undefined ? patch.from : from;
                    const nextTo = patch.to !== undefined ? patch.to : to;
                    if (!nextFrom && !nextTo) {
                        handleFilterChange(index, 'value', '');
                        return;
                    }
                    handleFilterChange(index, 'value', JSON.stringify({ from: nextFrom || '', to: nextTo || '' }));
                };
                return (_jsxs("div", { style: { flex: 1, display: 'flex', gap: spacing.sm, alignItems: 'center' }, children: [_jsx(Input, { type: inputType, value: from, onChange: (value) => setRange({ from: value }), placeholder: "Start..." }), _jsx("span", { style: styles({ color: colors.text.muted, fontSize: ts.bodySmall.fontSize }), children: "to" }), _jsx(Input, { type: inputType, value: to, onChange: (value) => setRange({ to: value }), placeholder: "End..." })] }));
            }
            return (_jsx("div", { style: { flex: 1 }, children: _jsx(Input, { type: (fieldType === 'datetime' ? 'datetime-local' : 'date'), value: filter.value?.toString() || '', onChange: (value) => handleFilterChange(index, 'value', value) }) }));
        }
        // Number field
        if (fieldType === 'number') {
            return (_jsx("div", { style: { flex: 1 }, children: _jsx(Input, { type: "number", value: filter.value?.toString() || '', onChange: (value) => handleFilterChange(index, 'value', value ? Number(value) : ''), placeholder: "Enter number..." }) }));
        }
        // Autocomplete field
        if (fieldType === 'autocomplete' && column?.searchEndpoint) {
            const searchEndpoint = column.searchEndpoint;
            const resolveEndpoint = column.resolveEndpoint || searchEndpoint;
            const itemsPath = column.itemsPath; // May be undefined for auth directory
            const valueField = column.valueField || 'id';
            const labelField = column.labelField || 'name';
            const isAuthDirectory = searchEndpoint?.includes('/directory/users');
            const onSearch = async (query, limit) => {
                try {
                    // Auth directory uses ?limit= instead of ?pageSize=
                    const url = `${searchEndpoint}?search=${encodeURIComponent(query)}&pageSize=${limit}&limit=${limit}`;
                    const res = await fetch(url);
                    if (!res.ok)
                        return [];
                    const json = await res.json();
                    let items = json;
                    // If itemsPath is defined, extract items from response
                    if (itemsPath) {
                        for (const part of itemsPath.split('.')) {
                            items = items?.[part];
                        }
                    }
                    // If response is not an array (and we have itemsPath), something went wrong
                    if (!Array.isArray(items))
                        items = [];
                    return items.map((item) => {
                        const value = String(item[valueField] || item.id || '');
                        let label = String(item[labelField] || item.name || item[valueField] || '');
                        // Special handling for user objects with profile_fields
                        if (item.profile_fields) {
                            const pf = item.profile_fields;
                            const displayName = [pf.first_name, pf.last_name].filter(Boolean).join(' ').trim();
                            if (displayName)
                                label = displayName;
                        }
                        return { value, label };
                    });
                }
                catch {
                    return [];
                }
            };
            const resolveValue = async (value) => {
                if (!value)
                    return null;
                try {
                    let url;
                    if (isAuthDirectory) {
                        // Auth directory uses ?search= to find users
                        url = `${resolveEndpoint}?search=${encodeURIComponent(value)}&limit=10`;
                    }
                    else if (value.includes('@') || value.includes('/')) {
                        // Email-based IDs use query param
                        url = `${resolveEndpoint}?id=${encodeURIComponent(value)}`;
                    }
                    else {
                        // UUID-based IDs use path
                        url = `${resolveEndpoint}/${encodeURIComponent(value)}`;
                    }
                    const res = await fetch(url);
                    if (!res.ok)
                        return null;
                    const json = await res.json();
                    // Handle auth directory (plain array) or standard responses
                    let item;
                    if (Array.isArray(json)) {
                        // Auth directory returns plain array - find exact match
                        item = json.find((u) => u[valueField] === value) || json[0];
                    }
                    else if (itemsPath) {
                        let items = json;
                        for (const part of itemsPath.split('.')) {
                            items = items?.[part];
                        }
                        item = Array.isArray(items) ? items[0] : items;
                    }
                    else {
                        item = json.items?.[0] || json;
                    }
                    if (!item)
                        return null;
                    const val = String(item[valueField] || item.id || '');
                    let label = String(item[labelField] || item.name || val);
                    if (item.profile_fields) {
                        const pf = item.profile_fields;
                        const displayName = [pf.first_name, pf.last_name].filter(Boolean).join(' ').trim();
                        if (displayName)
                            label = displayName;
                    }
                    return { value: val, label };
                }
                catch {
                    return null;
                }
            };
            return (_jsx("div", { style: { flex: 1 }, children: _jsx(Autocomplete, { value: filter.value?.toString() || '', onChange: (value) => handleFilterChange(index, 'value', value), onSearch: onSearch, resolveValue: resolveValue, placeholder: `Search ${column.label.toLowerCase()}...` }) }));
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
    return (_jsxs("div", { style: { position: 'relative' }, children: [_jsxs(Button, { variant: "secondary", size: "sm", disabled: loading, onClick: () => setDropdownOpen(!dropdownOpen), children: [_jsx(Filter, { size: 14, style: { marginRight: spacing.xs } }), currentView?.name || allLabel, _jsx(ChevronDown, { size: 14, style: { marginLeft: spacing.xs } })] }), dropdownOpen && (_jsxs(_Fragment, { children: [_jsx("div", { onClick: () => setDropdownOpen(false), style: styles({ position: 'fixed', inset: 0, zIndex: 40 }) }), _jsxs("div", { style: dropdownStyles.container, children: [_jsxs("button", { onClick: () => {
                                    selectView(null);
                                    setDropdownOpen(false);
                                }, style: styles({
                                    ...dropdownStyles.viewItem,
                                    backgroundColor: currentView === null ? colors.bg.elevated : 'transparent',
                                    fontWeight: currentView === null ? ts.label.fontWeight : 'normal',
                                }), onMouseEnter: (e) => {
                                    e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.backgroundColor = currentView === null ? colors.bg.elevated : 'transparent';
                                }, children: [currentView === null && _jsx(Check, { size: 14, style: { color: colors.primary.default } }), _jsx("span", { style: { flex: 1 }, children: allLabel })] }), views.length === 0 && !loading && (_jsx("div", { style: styles({
                                    padding: spacing.md,
                                    textAlign: 'center',
                                    color: colors.text.muted,
                                    fontSize: ts.bodySmall.fontSize,
                                    borderTop: `1px solid ${colors.border.subtle}`,
                                }), children: "No views yet. Create your first view to save filters and column preferences." })), systemViews.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: dropdownStyles.sectionHeader, children: "Default Views" }), systemViews.map((view) => {
                                        const isSelected = currentView?.id === view.id;
                                        return (_jsxs("button", { onClick: () => {
                                                selectView(view);
                                                setDropdownOpen(false);
                                            }, style: styles({
                                                ...dropdownStyles.viewItem,
                                                backgroundColor: isSelected ? colors.bg.elevated : 'transparent',
                                                fontWeight: isSelected ? ts.label.fontWeight : 'normal',
                                            }), onMouseEnter: (e) => {
                                                e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    isSelected ? colors.bg.elevated : 'transparent';
                                            }, children: [isSelected ? (_jsx(Check, { size: 14, style: { color: colors.primary.default } })) : view.isDefault ? (_jsx(Star, { size: 14, style: { color: colors.primary.default } })) : (_jsx("span", { style: { width: 14 } })), _jsx("span", { style: { flex: 1 }, children: view.name }), view.filters?.length > 0 && (_jsxs("span", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted }), children: [view.filters.length, " filter", view.filters.length !== 1 ? 's' : ''] }))] }, view.id));
                                    })] })), customViews.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: styles({
                                            ...dropdownStyles.sectionHeader,
                                            borderTop: systemViews.length > 0 ? `1px solid ${colors.border.subtle}` : undefined,
                                        }), children: "My Views" }), customViews.map((view) => {
                                        const isSelected = currentView?.id === view.id;
                                        return (_jsxs("div", { style: styles({
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: `${spacing.xs} ${spacing.sm} ${spacing.xs} ${spacing.md}`,
                                                backgroundColor: isSelected ? colors.bg.elevated : 'transparent',
                                                transition: 'background-color 150ms ease',
                                            }), onMouseEnter: (e) => {
                                                e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    isSelected ? colors.bg.elevated : 'transparent';
                                            }, children: [isSelected ? (_jsx(Check, { size: 14, style: { color: colors.primary.default, marginRight: spacing.xs } })) : (_jsx("span", { style: { width: 14, marginRight: spacing.xs } })), _jsxs("button", { onClick: () => {
                                                        selectView(view);
                                                        setDropdownOpen(false);
                                                    }, style: styles({
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: spacing.xs,
                                                        padding: `${spacing.xs} 0`,
                                                        fontSize: ts.body.fontSize,
                                                        fontWeight: isSelected ? ts.label.fontWeight : 'normal',
                                                        textAlign: 'left',
                                                        color: colors.text.secondary,
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                    }), children: [_jsx("span", { style: { flex: 1 }, children: view.name }), view.filters?.length > 0 && (_jsxs("span", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted }), children: [view.filters.length, " filter", view.filters.length !== 1 ? 's' : ''] }))] }), _jsx("button", { onClick: (e) => handleEdit(view, e), style: dropdownStyles.iconButton, title: "Edit view", children: _jsx(Edit2, { size: 14 }) }), _jsx("button", { onClick: (e) => handleDelete(view, e), style: styles({ ...dropdownStyles.iconButton, color: colors.error?.default || '#ef4444' }), title: "Delete view", children: _jsx(Trash2, { size: 14 }) })] }, view.id));
                                    })] })), sharedViews.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: styles({
                                            ...dropdownStyles.sectionHeader,
                                            borderTop: `1px solid ${colors.border.subtle}`,
                                        }), children: _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: spacing.xs }, children: [_jsx(Users, { size: 12 }), "Shared with me"] }) }), sharedViews.map((view) => {
                                        const isSelected = currentView?.id === view.id;
                                        return (_jsxs("button", { onClick: () => {
                                                selectView(view);
                                                setDropdownOpen(false);
                                            }, style: styles({
                                                ...dropdownStyles.viewItem,
                                                backgroundColor: isSelected ? colors.bg.elevated : 'transparent',
                                                fontWeight: isSelected ? ts.label.fontWeight : 'normal',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                gap: spacing.xs,
                                            }), onMouseEnter: (e) => {
                                                e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    isSelected ? colors.bg.elevated : 'transparent';
                                            }, children: [_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: spacing.sm, width: '100%' }, children: [isSelected && _jsx(Check, { size: 14, style: { color: colors.primary.default } }), _jsx("span", { style: { flex: 1 }, children: view.name }), view.filters?.length > 0 && (_jsxs("span", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted }), children: [view.filters.length, " filter", view.filters.length !== 1 ? 's' : ''] }))] }), _jsxs("span", { style: styles({
                                                        fontSize: '11px',
                                                        color: colors.text.muted,
                                                        marginLeft: isSelected ? 22 : 0,
                                                    }), children: ["Shared by ", view._sharedByName || view._sharedBy || 'someone'] })] }, view.id));
                                    })] })), _jsx("div", { style: styles({ borderTop: `1px solid ${colors.border.subtle}`, padding: spacing.xs }), children: _jsxs("button", { onClick: handleCreateNew, style: styles({
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
                }, title: editingView ? 'Edit View' : 'Create New View', size: "2xl", children: _jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.lg, padding: spacing.lg }), children: [_jsx(Input, { label: "View Name", value: builderName, onChange: setBuilderName, placeholder: "e.g., Active Projects, High Priority", required: true }), _jsxs("div", { style: styles({ display: 'flex', gap: spacing.xs, borderBottom: `1px solid ${colors.border.subtle}` }), children: [_jsxs("button", { onClick: () => setActiveTab('filters'), style: styles({
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
                                            }), children: [Object.values(builderColumnVisibility).filter((v) => v === false).length, " hidden"] }))] }), _jsxs("button", { onClick: () => setActiveTab('grouping'), style: styles({
                                        padding: `${spacing.sm} ${spacing.md}`,
                                        fontSize: ts.body.fontSize,
                                        fontWeight: activeTab === 'grouping' ? ts.label.fontWeight : 'normal',
                                        color: activeTab === 'grouping' ? colors.primary.default : colors.text.muted,
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'grouping' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                                        marginBottom: '-1px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing.xs,
                                    }), children: [_jsx(Layers, { size: 14 }), "Grouping", builderGroupByField && (_jsx("span", { style: styles({
                                                backgroundColor: colors.info?.default || '#3b82f6',
                                                color: '#fff',
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: radius.full,
                                                fontWeight: '600',
                                            }), children: "1" }))] }), _jsxs("button", { onClick: () => setActiveTab('sorting'), style: styles({
                                        padding: `${spacing.sm} ${spacing.md}`,
                                        fontSize: ts.body.fontSize,
                                        fontWeight: activeTab === 'sorting' ? ts.label.fontWeight : 'normal',
                                        color: activeTab === 'sorting' ? colors.primary.default : colors.text.muted,
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'sorting' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                                        marginBottom: '-1px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing.xs,
                                    }), children: [_jsx(ArrowUpDown, { size: 14 }), "Sorting", builderSorting.length > 0 && (_jsx("span", { style: styles({
                                                backgroundColor: colors.info?.default || '#3b82f6',
                                                color: '#fff',
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: radius.full,
                                                fontWeight: '600',
                                            }), children: builderSorting.length }))] }), (_jsxs("button", { onClick: () => setActiveTab('sharing'), style: styles({
                                        padding: `${spacing.sm} ${spacing.md}`,
                                        fontSize: ts.body.fontSize,
                                        fontWeight: activeTab === 'sharing' ? ts.label.fontWeight : 'normal',
                                        color: activeTab === 'sharing' ? colors.primary.default : colors.text.muted,
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'sharing' ? `2px solid ${colors.primary.default}` : '2px solid transparent',
                                        marginBottom: '-1px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing.xs,
                                    }), children: [_jsx(Share2, { size: 14 }), "Sharing", ((editingView ? shares.length : pendingShareRecipients.length) > 0) && (_jsx("span", { style: styles({
                                                backgroundColor: colors.success?.default || '#22c55e',
                                                color: '#fff',
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: radius.full,
                                                fontWeight: '600',
                                            }), children: editingView ? shares.length : pendingShareRecipients.length }))] }))] }), activeTab === 'filters' && (_jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.md }), children: [_jsxs("div", { style: styles({ display: 'flex', gap: spacing.md, alignItems: 'flex-end' }), children: [_jsx("div", { style: { maxWidth: 280 }, children: _jsx(Select, { label: "Match", value: builderFilterMode, onChange: (v) => setBuilderFilterMode(v === 'any' ? 'any' : 'all'), options: [
                                                    { value: 'all', label: 'All filters (AND)' },
                                                    { value: 'any', label: 'Any filter (OR)' },
                                                ], style: { marginBottom: 0 } }) }), _jsxs(Button, { variant: "secondary", size: "sm", onClick: handleAddFilter, children: [_jsx(Plus, { size: 14, style: { marginRight: spacing.xs } }), "Add Filter"] })] }), builderFilters.length === 0 ? (_jsx("div", { style: styles({
                                        padding: spacing.xl,
                                        textAlign: 'center',
                                        color: colors.text.muted,
                                        fontSize: ts.body.fontSize,
                                        border: `1px dashed ${colors.border.subtle}`,
                                        borderRadius: radius.md,
                                    }), children: "No filters. Add filters to narrow down your view." })) : (_jsx("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.sm }), children: builderFilters.map((filter, index) => {
                                        const col = effectiveColumns.find((c) => c.key === filter.field);
                                        return (_jsxs("div", { style: styles({
                                                display: 'flex',
                                                gap: spacing.sm,
                                                alignItems: 'center',
                                                padding: spacing.md,
                                                backgroundColor: colors.bg.elevated,
                                                borderRadius: radius.md,
                                                border: `1px solid ${colors.border.subtle}`,
                                            }), children: [_jsx(Select, { value: filter.field, onChange: (value) => handleFilterFieldChange(index, value), options: effectiveColumns.length > 0
                                                        ? effectiveColumns.map((c) => ({ value: c.key, label: c.label }))
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
                                            }, children: "Hide All" })] })] })), activeTab === 'grouping' && (_jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.md }), children: [_jsxs("p", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, margin: 0 }), children: ["Group rows by a field. Group order is derived from data when available (e.g. a corresponding ", _jsx("code", { children: "*SortOrder" }), " field); otherwise it falls back to alphabetical."] }), _jsx("div", { style: styles({
                                        padding: spacing.md,
                                        backgroundColor: colors.bg.elevated,
                                        borderRadius: radius.md,
                                        border: `1px solid ${colors.border.subtle}`,
                                    }), children: _jsx(Select, { label: "Group By Field", value: builderGroupByField, onChange: setBuilderGroupByField, options: [
                                            { value: '', label: 'No grouping' },
                                            ...effectiveColumns.map((c) => ({
                                                value: c.key,
                                                label: c.label + (c.type === 'select' && c.options?.some((o) => o.sortOrder !== undefined) ? ' (has sort order)' : ''),
                                            })),
                                        ], placeholder: "Select field to group by..." }) }), builderGroupByField && (_jsx(Button, { variant: "secondary", size: "sm", onClick: () => setBuilderGroupByField(''), style: { alignSelf: 'flex-start' }, children: "Clear Grouping" }))] })), activeTab === 'sorting' && (_jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.md }), children: [_jsx("p", { style: styles({ fontSize: ts.bodySmall.fontSize, color: colors.text.muted, margin: 0 }), children: "Set the default sorting for this view. This affects the initial query/order when the view is selected." }), _jsx("div", { style: styles({ display: 'flex', justifyContent: 'flex-end' }), children: _jsxs(Button, { variant: "secondary", size: "sm", onClick: handleAddSort, children: [_jsx(Plus, { size: 14, style: { marginRight: spacing.xs } }), "Add Sort"] }) }), builderSorting.length === 0 ? (_jsx("div", { style: styles({
                                        padding: spacing.xl,
                                        textAlign: 'center',
                                        color: colors.text.muted,
                                        fontSize: ts.body.fontSize,
                                        border: `1px dashed ${colors.border.subtle}`,
                                        borderRadius: radius.md,
                                    }), children: "No sorting rules. The table default sorting will be used." })) : (_jsx("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.sm, overflowY: 'auto', maxHeight: '38vh' }), children: builderSorting.map((sort, index) => (_jsxs("div", { style: styles({
                                            display: 'flex',
                                            gap: spacing.sm,
                                            alignItems: 'center',
                                            padding: spacing.md,
                                            backgroundColor: colors.bg.elevated,
                                            borderRadius: radius.md,
                                            border: `1px solid ${colors.border.subtle}`,
                                        }), children: [_jsx(Select, { value: sort.id, onChange: (value) => handleSortChange(index, { id: value }), options: effectiveColumns.map((c) => ({ value: c.key, label: c.label })), placeholder: "Field" }), _jsx(Select, { value: sort.desc ? 'desc' : 'asc', onChange: (value) => handleSortChange(index, { desc: value === 'desc' }), options: [
                                                    { value: 'asc', label: 'Ascending' },
                                                    { value: 'desc', label: 'Descending' },
                                                ], placeholder: "Direction" }), _jsx("button", { onClick: () => handleRemoveSort(index), style: styles({
                                                    padding: spacing.sm,
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: colors.error?.default || '#ef4444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }), title: "Remove sort", children: _jsx(Trash, { size: 16 }) })] }, `${sort.id}-${index}`))) }))] })), activeTab === 'sharing' && (_jsx(TableViewSharingPanel, { viewId: editingView?.id || null, shares: shares, setShares: setShares, sharesLoading: sharesLoading, pendingRecipients: pendingShareRecipients, setPendingRecipients: setPendingShareRecipients, addShare: addShare, removeShare: removeShare, fetchPrincipals: fetchPrincipals })), _jsxs("div", { style: styles({
                                display: 'flex',
                                gap: spacing.md,
                                justifyContent: 'flex-end',
                                paddingTop: spacing.lg,
                                borderTop: `1px solid ${colors.border.subtle}`,
                            }), children: [_jsx(Button, { variant: "secondary", onClick: () => {
                                        setShowBuilder(false);
                                        setEditingView(null);
                                    }, disabled: builderSaving, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: handleSaveView, disabled: builderSaving || !builderName.trim(), children: builderSaving ? 'Saving...' : editingView ? 'Update View' : 'Create View' })] })] }) })), _jsx(AlertDialog, { ...alertDialog.props })] }));
}
//# sourceMappingURL=ViewSelector.js.map