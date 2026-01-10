'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Autocomplete } from './Autocomplete';
/**
 * GlobalFilterBar - Renders a horizontal bar of filter controls
 *
 * Supports multiple filter types:
 * - string: text input with search icon
 * - number: number input
 * - date: single date picker
 * - daterange: from/to date pickers
 * - select: single select dropdown
 * - multiselect: multi-select dropdown
 * - autocomplete: autocomplete with search
 * - boolean: yes/no select
 */
export function GlobalFilterBar({ filters, values, onChange, columns }) {
    const { colors, spacing, radius, textStyles: ts, componentSpacing } = useThemeTokens();
    const [localValues, setLocalValues] = useState(values);
    // Sync external values
    useEffect(() => {
        setLocalValues(values);
    }, [values]);
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
    const getColumnConfig = (filter) => {
        const col = columns.find((c) => c.key === filter.columnKey);
        return {
            label: filter.label || col?.label || filter.columnKey,
            filterType: filter.filterType || col?.filterType || 'string',
            filterOptions: filter.filterOptions || col?.filterOptions || [],
            onSearch: filter.onSearch || col?.onSearch,
            resolveValue: filter.resolveValue || col?.resolveValue,
        };
    };
    // Compact input styling
    const inputStyle = styles({
        height: '36px',
        padding: `0 ${spacing.sm}`,
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.sm,
        color: colors.text.primary,
        fontSize: ts.body.fontSize,
        outline: 'none',
        boxSizing: 'border-box',
        width: '100%',
    });
    const labelStyle = styles({
        display: 'block',
        fontSize: '11px',
        fontWeight: '500',
        color: colors.text.muted,
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    });
    const renderFilter = (filter) => {
        const config = getColumnConfig(filter);
        const currentValue = localValues[filter.columnKey];
        const key = filter.columnKey;
        // String filter with search icon
        if (config.filterType === 'string') {
            return (_jsxs("div", { style: { minWidth: '160px', flex: '1 1 160px', maxWidth: '220px' }, children: [_jsx("label", { style: labelStyle, children: config.label }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Search, { size: 14, style: {
                                    position: 'absolute',
                                    left: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: colors.text.muted,
                                    pointerEvents: 'none',
                                } }), _jsx("input", { type: "text", value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), placeholder: `Search...`, style: {
                                    ...inputStyle,
                                    paddingLeft: '32px',
                                } })] })] }, key));
        }
        // Number filter
        if (config.filterType === 'number') {
            return (_jsxs("div", { style: { minWidth: '100px', flex: '0 1 120px' }, children: [_jsx("label", { style: labelStyle, children: config.label }), _jsx("input", { type: "number", value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), placeholder: "0", style: inputStyle })] }, key));
        }
        // Date filter (single)
        if (config.filterType === 'date') {
            return (_jsxs("div", { style: { minWidth: '140px', flex: '0 1 160px' }, children: [_jsx("label", { style: labelStyle, children: config.label }), _jsx("input", { type: "date", value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), style: inputStyle })] }, key));
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
            return (_jsxs("div", { style: { display: 'flex', gap: spacing.xs, alignItems: 'flex-end' }, children: [_jsxs("div", { style: { minWidth: '130px', flex: '0 1 140px' }, children: [_jsxs("label", { style: labelStyle, children: [config.label, " From"] }), _jsx("input", { type: "date", value: fromDate || '', onChange: (e) => updateRange(e.target.value, toDate || ''), style: inputStyle })] }), _jsxs("div", { style: { minWidth: '130px', flex: '0 1 140px' }, children: [_jsxs("label", { style: labelStyle, children: [config.label, " To"] }), _jsx("input", { type: "date", value: toDate || '', onChange: (e) => updateRange(fromDate || '', e.target.value), style: inputStyle })] })] }, key));
        }
        // Boolean filter
        if (config.filterType === 'boolean') {
            return (_jsxs("div", { style: { minWidth: '100px', flex: '0 1 120px' }, children: [_jsx("label", { style: labelStyle, children: config.label }), _jsxs("select", { value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), style: inputStyle, children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "true", children: "Yes" }), _jsx("option", { value: "false", children: "No" })] })] }, key));
        }
        // Select filter
        if (config.filterType === 'select') {
            return (_jsxs("div", { style: { minWidth: '140px', flex: '0 1 180px' }, children: [_jsx("label", { style: labelStyle, children: config.label }), _jsxs("select", { value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), style: inputStyle, children: [_jsx("option", { value: "", children: "All" }), config.filterOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] }, key));
        }
        // Multiselect filter
        if (config.filterType === 'multiselect') {
            const selectedValues = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
            return (_jsxs("div", { style: { minWidth: '180px', flex: '1 1 200px', maxWidth: '280px' }, children: [_jsx("label", { style: labelStyle, children: config.label }), selectedValues.length > 0 && (_jsx("div", { style: styles({ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }), children: selectedValues.map((val) => {
                            const opt = config.filterOptions.find((o) => o.value === val);
                            return (_jsxs("span", { style: styles({
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    backgroundColor: colors.primary.default,
                                    color: '#fff',
                                    borderRadius: radius.full,
                                    fontSize: '11px',
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
                        }, style: inputStyle, children: [_jsxs("option", { value: "", children: ["Add ", config.label.toLowerCase(), "..."] }), config.filterOptions
                                .filter((opt) => !selectedValues.includes(opt.value))
                                .map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] }, key));
        }
        // Autocomplete filter
        if (config.filterType === 'autocomplete') {
            if (!config.onSearch) {
                // Fallback to select if no search function provided
                return (_jsxs("div", { style: { minWidth: '160px', flex: '1 1 180px', maxWidth: '240px' }, children: [_jsx("label", { style: labelStyle, children: config.label }), _jsxs("select", { value: typeof currentValue === 'string' ? currentValue : '', onChange: (e) => updateFilter(key, e.target.value), style: inputStyle, children: [_jsx("option", { value: "", children: "All" }), config.filterOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] }, key));
            }
            return (_jsxs("div", { style: { minWidth: '180px', flex: '1 1 200px', maxWidth: '280px' }, children: [_jsx("label", { style: labelStyle, children: config.label }), _jsx(Autocomplete, { value: typeof currentValue === 'string' ? currentValue : '', onChange: (value) => updateFilter(key, value), onSearch: config.onSearch, resolveValue: config.resolveValue, placeholder: `Search ${config.label.toLowerCase()}...`, clearable: true })] }, key));
        }
        return null;
    };
    if (!filters || filters.length === 0) {
        return null;
    }
    const hasActiveFilters = Object.keys(localValues).length > 0;
    return (_jsxs("div", { style: styles({
            display: 'flex',
            gap: spacing.md,
            alignItems: 'flex-end',
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.bg.elevated,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: radius.md,
            flexWrap: 'wrap',
        }), children: [filters.map((filter) => renderFilter(filter)), hasActiveFilters && (_jsxs("button", { onClick: () => {
                    setLocalValues({});
                    onChange({});
                }, style: styles({
                    height: '36px',
                    padding: `0 ${spacing.md}`,
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.sm,
                    color: colors.text.muted,
                    cursor: 'pointer',
                    fontSize: ts.bodySmall.fontSize,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    whiteSpace: 'nowrap',
                }), children: [_jsx(X, { size: 14 }), "Clear all"] }))] }));
}
//# sourceMappingURL=GlobalFilterBar.js.map