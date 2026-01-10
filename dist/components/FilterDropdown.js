'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Filter, X, Search, Plus, Trash2 } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Button } from './Button';
import { Autocomplete } from './Autocomplete';
/**
 * FilterDropdown - A button + popover component for managing table filters
 *
 * Features:
 * - Button shows "Filters" with badge when filters are active
 * - Clicking opens a popover with all available filters
 * - Add/remove active filters
 * - Persists filter state to localStorage per tableId
 * - Supports all filter types: string, number, date, daterange, boolean, select, multiselect, autocomplete
 */
export function FilterDropdown({ tableId, persistenceKey, resetCounter, filters, values, onChange, columns }) {
    const { colors, radius, spacing, textStyles: ts, shadows } = useThemeTokens();
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    // Track which filters are currently enabled/visible
    const [enabledFilters, setEnabledFilters] = useState(new Set());
    const [localValues, setLocalValues] = useState(values);
    const legacyStorageKey = tableId ? `hit:table-filters:${tableId}` : null;
    const storageKey = persistenceKey || legacyStorageKey;
    // Force-reset from parent (used by DataTable gear menu "Reset table")
    useEffect(() => {
        if (!storageKey)
            return;
        // Clear UI state and notify parent immediately.
        setEnabledFilters(new Set());
        setLocalValues({});
        onChange({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, resetCounter]);
    // Load from localStorage on mount / when key changes
    useEffect(() => {
        if (!storageKey)
            return;
        try {
            const tryRead = (key) => {
                const raw = localStorage.getItem(key);
                if (!raw)
                    return null;
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' ? parsed : null;
            };
            // Prefer the explicit key; if missing and it differs from legacy, fall back once to legacy for migration.
            let parsed = tryRead(storageKey);
            if (!parsed && legacyStorageKey && legacyStorageKey !== storageKey) {
                parsed = tryRead(legacyStorageKey);
                // Migrate forward so future loads are per-view
                if (parsed) {
                    try {
                        localStorage.setItem(storageKey, JSON.stringify(parsed));
                    }
                    catch {
                        // ignore
                    }
                }
            }
            if (parsed) {
                if (parsed.enabledFilters && Array.isArray(parsed.enabledFilters)) {
                    setEnabledFilters(new Set(parsed.enabledFilters));
                }
                else {
                    setEnabledFilters(new Set());
                }
                if (parsed.values && typeof parsed.values === 'object') {
                    setLocalValues(parsed.values);
                    onChange(parsed.values);
                }
                else {
                    setLocalValues({});
                    onChange({});
                }
            }
            else {
                // No saved state for this key -> reset to empty (per-view behavior).
                setEnabledFilters(new Set());
                setLocalValues({});
                onChange({});
            }
        }
        catch {
            // Ignore localStorage errors
        }
    }, [storageKey]);
    // Save to localStorage when values or enabled filters change
    useEffect(() => {
        if (!storageKey)
            return;
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                enabledFilters: Array.from(enabledFilters),
                values: localValues,
                updatedAt: new Date().toISOString(),
            }));
        }
        catch {
            // Ignore localStorage errors
        }
    }, [storageKey, enabledFilters, localValues]);
    // Sync external values
    useEffect(() => {
        setLocalValues(values);
        // Auto-enable filters that have values
        const newEnabled = new Set(enabledFilters);
        let changed = false;
        for (const key of Object.keys(values)) {
            if (values[key] && !newEnabled.has(key)) {
                newEnabled.add(key);
                changed = true;
            }
        }
        if (changed) {
            setEnabledFilters(newEnabled);
        }
    }, [values]);
    // Calculate dropdown position
    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const dropdownWidth = 380;
            const spacingValue = 8;
            let left = rect.left;
            let right;
            // Ensure dropdown doesn't go off-screen
            if (left + dropdownWidth > window.innerWidth) {
                right = window.innerWidth - rect.right;
                left = undefined;
            }
            setPosition({
                top: rect.bottom + spacingValue,
                ...(right !== undefined ? { right } : { left }),
            });
        }
        else {
            setPosition(null);
        }
    }, [open]);
    const getColumnConfig = (filter) => {
        const col = columns.find((c) => c.key === filter.columnKey);
        return {
            label: filter.label || col?.label || filter.columnKey,
            filterType: filter.filterType || col?.filterType || 'string',
            filterOptions: filter.filterOptions || col?.filterOptions || [],
            onSearch: filter.onSearch || col?.onSearch,
            resolveValue: filter.resolveValue || col?.resolveValue,
            showOperator: filter.showOperator ?? false,
            defaultOperator: filter.defaultOperator,
        };
    };
    // Helper to parse operator:value format
    const parseOperatorValue = (value, defaultOp) => {
        if (!value)
            return { operator: defaultOp, value: '' };
        const colonIdx = value.indexOf(':');
        if (colonIdx > 0) {
            const op = value.substring(0, colonIdx);
            const validOps = ['equals', 'notEquals', 'contains', 'notContains', 'startsWith', 'endsWith', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'];
            if (validOps.includes(op)) {
                return { operator: op, value: value.substring(colonIdx + 1) };
            }
        }
        return { operator: defaultOp, value: value };
    };
    // Helper to format operator:value
    const formatOperatorValue = (operator, value) => {
        if (!value)
            return '';
        return `${operator}:${value}`;
    };
    // Operator options for string filters
    const stringOperatorOptions = [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'notContains', label: 'Does not contain' },
        { value: 'notEquals', label: 'Not equals' },
    ];
    const updateFilter = (columnKey, value) => {
        const next = { ...localValues };
        if (value === '' || (Array.isArray(value) && value.length === 0)) {
            delete next[columnKey];
        }
        else {
            next[columnKey] = value;
        }
        setLocalValues(next);
        onChange(next);
    };
    const toggleFilterEnabled = (columnKey) => {
        const newEnabled = new Set(enabledFilters);
        if (newEnabled.has(columnKey)) {
            newEnabled.delete(columnKey);
            // Also clear the value when removing filter
            const next = { ...localValues };
            delete next[columnKey];
            setLocalValues(next);
            onChange(next);
        }
        else {
            newEnabled.add(columnKey);
        }
        setEnabledFilters(newEnabled);
    };
    const clearAllFilters = () => {
        setLocalValues({});
        setEnabledFilters(new Set());
        onChange({});
    };
    // Count active filters (filters with actual values)
    const activeFilterCount = Object.keys(localValues).filter((key) => {
        const val = localValues[key];
        return val && (typeof val === 'string' ? val.length > 0 : val.length > 0);
    }).length;
    // Compact input styling
    const inputStyle = styles({
        height: '32px',
        padding: `0 ${spacing.sm}`,
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.sm,
        color: colors.text.primary,
        fontSize: ts.bodySmall.fontSize,
        outline: 'none',
        boxSizing: 'border-box',
        width: '100%',
    });
    const labelStyle = styles({
        display: 'block',
        fontSize: '11px',
        fontWeight: '500',
        color: colors.text.muted,
        marginBottom: '2px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    });
    const renderFilterControl = (filter) => {
        const config = getColumnConfig(filter);
        const currentValue = localValues[filter.columnKey];
        const key = filter.columnKey;
        // String filter with optional operator support
        if (config.filterType === 'string') {
            const defaultOp = config.defaultOperator || 'contains';
            // Check if operator mode is enabled for this filter
            if (config.showOperator) {
                const parsed = parseOperatorValue(typeof currentValue === 'string' ? currentValue : undefined, defaultOp);
                return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px' }, children: [_jsx("select", { value: parsed.operator, onChange: (e) => {
                                const newOp = e.target.value;
                                if (parsed.value) {
                                    updateFilter(key, formatOperatorValue(newOp, parsed.value));
                                }
                            }, style: { ...inputStyle, height: '28px', fontSize: '11px' }, children: stringOperatorOptions.map((op) => (_jsx("option", { value: op.value, children: op.label }, op.value))) }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Search, { size: 12, style: {
                                        position: 'absolute',
                                        left: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: colors.text.muted,
                                        pointerEvents: 'none',
                                    } }), _jsx("input", { type: "text", value: parsed.value, onChange: (e) => {
                                        const newVal = e.target.value;
                                        if (newVal) {
                                            updateFilter(key, formatOperatorValue(parsed.operator, newVal));
                                        }
                                        else {
                                            updateFilter(key, '');
                                        }
                                    }, placeholder: "Search...", style: {
                                        ...inputStyle,
                                        paddingLeft: '28px',
                                    } })] })] }));
            }
            // Simple string filter without operator (default behavior)
            return (_jsxs("div", { style: { position: 'relative' }, children: [_jsx(Search, { size: 12, style: {
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: colors.text.muted,
                            pointerEvents: 'none',
                        } }), _jsx("input", { type: "text", value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), placeholder: `Search...`, style: {
                            ...inputStyle,
                            paddingLeft: '28px',
                        } })] }));
        }
        // Number filter
        if (config.filterType === 'number') {
            return (_jsx("input", { type: "number", value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), placeholder: "0", style: inputStyle }));
        }
        // Date filter (single)
        if (config.filterType === 'date') {
            return (_jsx("input", { type: "date", value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), style: inputStyle }));
        }
        // Date range filter (from/to)
        if (config.filterType === 'daterange') {
            const rangeValue = typeof currentValue === 'string' ? currentValue : '';
            const [fromDate, toDate] = rangeValue.split('|');
            const updateRange = (from, to) => {
                if (!from && !to) {
                    updateFilter(key, '');
                }
                else {
                    updateFilter(key, `${from || ''}|${to || ''}`);
                }
            };
            return (_jsxs("div", { style: { display: 'flex', gap: '4px', alignItems: 'center' }, children: [_jsx("input", { type: "date", value: fromDate || '', onChange: (e) => updateRange(e.target.value, toDate || ''), style: { ...inputStyle, flex: 1 } }), _jsx("span", { style: { color: colors.text.muted, fontSize: '11px' }, children: "to" }), _jsx("input", { type: "date", value: toDate || '', onChange: (e) => updateRange(fromDate || '', e.target.value), style: { ...inputStyle, flex: 1 } })] }));
        }
        // Boolean filter
        if (config.filterType === 'boolean') {
            return (_jsxs("select", { value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), style: inputStyle, children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "true", children: "Yes" }), _jsx("option", { value: "false", children: "No" })] }));
        }
        // Select filter
        if (config.filterType === 'select') {
            return (_jsxs("select", { value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), style: inputStyle, children: [_jsx("option", { value: "", children: "All" }), config.filterOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }));
        }
        // Multiselect filter
        if (config.filterType === 'multiselect') {
            const selectedValues = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
            return (_jsxs("div", { children: [selectedValues.length > 0 && (_jsx("div", { style: styles({ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '4px' }), children: selectedValues.map((val) => {
                            const opt = config.filterOptions.find((o) => o.value === val);
                            return (_jsxs("span", { style: styles({
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    backgroundColor: colors.primary.default,
                                    color: '#fff',
                                    borderRadius: radius.full,
                                    fontSize: '10px',
                                    fontWeight: '500',
                                }), children: [opt?.label || val, _jsx("button", { onClick: () => updateFilter(key, selectedValues.filter((v) => v !== val)), style: styles({
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: 'rgba(255,255,255,0.8)',
                                        }), children: _jsx(X, { size: 10 }) })] }, val));
                        }) })), _jsxs("select", { value: "", onChange: (e) => {
                            if (e.target.value && !selectedValues.includes(e.target.value)) {
                                updateFilter(key, [...selectedValues, e.target.value]);
                            }
                        }, style: inputStyle, children: [_jsx("option", { value: "", children: "Add..." }), config.filterOptions
                                .filter((opt) => !selectedValues.includes(opt.value))
                                .map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] }));
        }
        // Autocomplete filter
        if (config.filterType === 'autocomplete') {
            if (!config.onSearch) {
                // Fallback to select if no search function provided
                return (_jsxs("select", { value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), style: inputStyle, children: [_jsx("option", { value: "", children: "All" }), config.filterOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }));
            }
            return (_jsx(Autocomplete, { value: typeof currentValue === 'string' ? currentValue : '', onChange: (value) => updateFilter(key, value), onSearch: config.onSearch, resolveValue: config.resolveValue, placeholder: `Search...`, clearable: true }));
        }
        return null;
    };
    if (!filters || filters.length === 0) {
        return null;
    }
    // Get enabled filters that exist in filters array
    const visibleFilters = filters.filter((f) => enabledFilters.has(f.columnKey));
    const availableFilters = filters.filter((f) => !enabledFilters.has(f.columnKey));
    return (_jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { ref: triggerRef, children: _jsxs(Button, { variant: "secondary", size: "sm", onClick: () => setOpen(!open), style: {
                        position: 'relative',
                    }, children: [_jsx(Filter, { size: 16, style: { marginRight: spacing.xs } }), "Filters", activeFilterCount > 0 && (_jsx("span", { style: styles({
                                marginLeft: spacing.xs,
                                backgroundColor: colors.primary.default,
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: '600',
                                padding: '1px 6px',
                                borderRadius: radius.full,
                                minWidth: '18px',
                                textAlign: 'center',
                            }), children: activeFilterCount }))] }) }), open && position && (_jsxs(_Fragment, { children: [_jsx("div", { onClick: () => setOpen(false), style: styles({
                            position: 'fixed',
                            inset: 0,
                            zIndex: 40,
                        }) }), _jsxs("div", { ref: dropdownRef, style: styles({
                            position: 'fixed',
                            zIndex: 50,
                            top: `${position.top}px`,
                            ...(position.right !== undefined ? { right: `${position.right}px` } : { left: `${position.left}px` }),
                            width: '380px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            backgroundColor: colors.bg.surface,
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: radius.lg,
                            boxShadow: shadows.xl,
                        }), children: [_jsxs("div", { style: styles({
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: `${spacing.sm} ${spacing.md}`,
                                    borderBottom: `1px solid ${colors.border.subtle}`,
                                }), children: [_jsx("span", { style: { fontSize: ts.body.fontSize, fontWeight: '600', color: colors.text.primary }, children: "Filters" }), activeFilterCount > 0 && (_jsxs("button", { onClick: clearAllFilters, style: styles({
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            color: colors.text.muted,
                                            fontSize: ts.bodySmall.fontSize,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }), children: [_jsx(Trash2, { size: 12 }), "Clear all"] }))] }), visibleFilters.length > 0 && (_jsx("div", { style: styles({ padding: spacing.md, borderBottom: `1px solid ${colors.border.subtle}` }), children: _jsx("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing.sm }), children: visibleFilters.map((filter) => {
                                        const config = getColumnConfig(filter);
                                        return (_jsxs("div", { style: styles({
                                                backgroundColor: colors.bg.elevated,
                                                borderRadius: radius.md,
                                                padding: spacing.sm,
                                            }), children: [_jsxs("div", { style: styles({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }), children: [_jsx("label", { style: labelStyle, children: config.label }), _jsx("button", { onClick: () => toggleFilterEnabled(filter.columnKey), style: styles({
                                                                border: 'none',
                                                                background: 'none',
                                                                cursor: 'pointer',
                                                                padding: '2px',
                                                                color: colors.text.muted,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                            }), title: "Remove filter", children: _jsx(X, { size: 14 }) })] }), renderFilterControl(filter)] }, filter.columnKey));
                                    }) }) })), availableFilters.length > 0 && (_jsxs("div", { style: styles({ padding: spacing.md }), children: [_jsx("div", { style: styles({ marginBottom: spacing.xs }), children: _jsx("span", { style: { fontSize: ts.bodySmall.fontSize, color: colors.text.muted, fontWeight: '500' }, children: "Add filter" }) }), _jsx("div", { style: styles({ display: 'flex', flexWrap: 'wrap', gap: '6px' }), children: availableFilters.map((filter) => {
                                            const config = getColumnConfig(filter);
                                            return (_jsxs("button", { onClick: () => toggleFilterEnabled(filter.columnKey), style: styles({
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 10px',
                                                    backgroundColor: colors.bg.elevated,
                                                    border: `1px solid ${colors.border.default}`,
                                                    borderRadius: radius.full,
                                                    cursor: 'pointer',
                                                    fontSize: ts.bodySmall.fontSize,
                                                    color: colors.text.secondary,
                                                    transition: 'all 150ms ease',
                                                }), onMouseEnter: (e) => {
                                                    e.currentTarget.style.backgroundColor = colors.bg.surface;
                                                    e.currentTarget.style.borderColor = colors.primary.default;
                                                    e.currentTarget.style.color = colors.primary.default;
                                                }, onMouseLeave: (e) => {
                                                    e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                                    e.currentTarget.style.borderColor = colors.border.default;
                                                    e.currentTarget.style.color = colors.text.secondary;
                                                }, children: [_jsx(Plus, { size: 12 }), config.label] }, filter.columnKey));
                                        }) })] })), visibleFilters.length === 0 && availableFilters.length === 0 && (_jsx("div", { style: styles({ padding: spacing.lg, textAlign: 'center', color: colors.text.muted }), children: "No filters available" }))] })] }))] }));
}
//# sourceMappingURL=FilterDropdown.js.map