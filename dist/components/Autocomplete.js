'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Autocomplete({ label, placeholder = 'Search…', value, onChange, disabled = false, required = false, minQueryLength = 2, debounceMs = 300, limit = 10, onSearch, resolveValue, emptyMessage = 'No results', searchingMessage = 'Searching…', clearable = true, }) {
    const { colors, radius, componentSpacing, textStyles: ts, spacing, shadows } = useThemeTokens();
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const timeoutRef = useRef(null);
    const requestIdRef = useRef(0);
    const [inputValue, setInputValue] = useState('');
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const listboxId = useMemo(() => `hit-autocomplete-${Math.random().toString(36).slice(2, 8)}`, []);
    // Sync external value -> selected + inputValue
    useEffect(() => {
        if (!value) {
            setSelected(null);
            setInputValue('');
            return;
        }
        if (selected?.value === value)
            return;
        let cancelled = false;
        (async () => {
            if (!resolveValue) {
                // Best-effort fallback: if we don't have a resolver, just show the raw value.
                if (!cancelled)
                    setInputValue(value);
                return;
            }
            try {
                const opt = await resolveValue(value);
                if (cancelled)
                    return;
                setSelected(opt);
                setInputValue(opt?.label ?? '');
            }
            catch {
                if (cancelled)
                    return;
                setSelected(null);
                setInputValue('');
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
    // Close on outside click
    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (!containerRef.current)
                return;
            if (!containerRef.current.contains(e.target)) {
                setOpen(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, []);
    // Debounced search when typing
    useEffect(() => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current);
        const q = inputValue.trim();
        // If user hasn't changed text beyond selected label, don't search.
        if (selected && q === selected.label) {
            setOpen(false);
            setHighlightedIndex(-1);
            return;
        }
        if (q.length < minQueryLength) {
            setOptions([]);
            setOpen(false);
            setHighlightedIndex(-1);
            return;
        }
        timeoutRef.current = setTimeout(async () => {
            const reqId = ++requestIdRef.current;
            setLoading(true);
            setOpen(true);
            setHighlightedIndex(-1);
            try {
                const next = await onSearch(q, limit);
                if (requestIdRef.current !== reqId)
                    return; // stale
                setOptions(Array.isArray(next) ? next : []);
            }
            catch {
                if (requestIdRef.current !== reqId)
                    return;
                setOptions([]);
            }
            finally {
                if (requestIdRef.current === reqId)
                    setLoading(false);
            }
        }, debounceMs);
        return () => {
            if (timeoutRef.current)
                clearTimeout(timeoutRef.current);
        };
    }, [debounceMs, inputValue, limit, minQueryLength, onSearch, selected]);
    // Keep highlighted item in view
    useEffect(() => {
        if (highlightedIndex < 0)
            return;
        const el = listRef.current?.children?.[highlightedIndex];
        el?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex]);
    const selectOption = (opt) => {
        if (opt.disabled)
            return;
        setSelected(opt);
        setInputValue(opt.label);
        onChange(opt.value);
        setOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
    };
    const clearSelection = () => {
        setSelected(null);
        setInputValue('');
        setOptions([]);
        setOpen(false);
        setHighlightedIndex(-1);
        onChange('');
        inputRef.current?.focus();
    };
    const onKeyDown = (e) => {
        if (!open)
            return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, -1));
            return;
        }
        if (e.key === 'Enter') {
            if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                e.preventDefault();
                selectOption(options[highlightedIndex]);
            }
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            setHighlightedIndex(-1);
            inputRef.current?.blur();
        }
    };
    return (_jsxs("div", { ref: containerRef, style: styles({ position: 'relative' }), children: [label && (_jsx("label", { style: styles({
                    display: 'block',
                    fontSize: ts.label.fontSize,
                    fontWeight: ts.label.fontWeight,
                    color: colors.text.primary,
                    marginBottom: spacing.xs,
                }), children: label })), _jsxs("div", { style: styles({ position: 'relative' }), children: [_jsx("input", { ref: inputRef, type: "text", value: inputValue, onChange: (e) => {
                            const next = e.target.value;
                            setInputValue(next);
                            if (selected && next !== selected.label) {
                                setSelected(null);
                                onChange('');
                            }
                            if (!next) {
                                setOpen(false);
                                setHighlightedIndex(-1);
                            }
                        }, onKeyDown: onKeyDown, placeholder: placeholder, disabled: disabled, required: required, role: "combobox", "aria-required": required, "aria-autocomplete": "list", "aria-expanded": open, "aria-controls": listboxId, "aria-activedescendant": highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined, style: styles({
                            width: '100%',
                            height: componentSpacing.input.height,
                            padding: `0 ${componentSpacing.input.paddingX}`,
                            paddingRight: clearable ? 70 : componentSpacing.input.paddingX,
                            backgroundColor: colors.bg.elevated,
                            border: `1px solid ${colors.border.default}`,
                            borderRadius: radius.md,
                            color: colors.text.primary,
                            fontSize: ts.body.fontSize,
                            outline: 'none',
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'text',
                            boxSizing: 'border-box',
                        }) }), loading && (_jsx("div", { "aria-hidden": true, style: styles({
                            position: 'absolute',
                            right: clearable ? 42 : 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                        }), children: _jsx(Loader2, { size: 16, color: colors.text.muted, className: "animate-spin" }) })), clearable && (selected || inputValue) && (_jsx("button", { type: "button", onClick: clearSelection, disabled: disabled, "aria-label": "Clear", style: styles({
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'transparent',
                            color: colors.text.muted,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }), children: _jsx(X, { size: 16 }) }))] }), open && (_jsx("div", { ref: listRef, id: listboxId, role: "listbox", "aria-label": "Suggestions", style: styles({
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    marginTop: spacing.xs,
                    backgroundColor: colors.bg.elevated,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.md,
                    boxShadow: shadows.md,
                    maxHeight: 280,
                    overflowY: 'auto',
                }), children: loading ? (_jsx("div", { style: styles({ padding: `${spacing.sm} ${spacing.md}`, color: colors.text.muted }), children: searchingMessage })) : options.length === 0 ? (_jsx("div", { style: styles({ padding: `${spacing.sm} ${spacing.md}`, color: colors.text.muted }), children: emptyMessage })) : (options.map((opt, idx) => {
                    const highlighted = idx === highlightedIndex;
                    return (_jsxs("div", { id: `${listboxId}-opt-${idx}`, role: "option", "aria-selected": highlighted, onMouseEnter: () => setHighlightedIndex(idx), onMouseLeave: () => setHighlightedIndex(-1), onMouseDown: (e) => {
                            // Prevent input blur before click handler runs
                            e.preventDefault();
                        }, onClick: () => selectOption(opt), style: styles({
                            padding: `${spacing.sm} ${spacing.md}`,
                            cursor: opt.disabled ? 'not-allowed' : 'pointer',
                            backgroundColor: highlighted ? colors.bg.muted : 'transparent',
                            color: opt.disabled ? colors.text.muted : colors.text.primary,
                            borderBottom: idx < options.length - 1 ? `1px solid ${colors.border.default}` : 'none',
                        }), children: [_jsx("div", { style: styles({ fontWeight: 500 }), children: opt.label }), opt.description && (_jsx("div", { style: styles({ marginTop: 2, fontSize: ts.bodySmall.fontSize, color: colors.text.muted }), children: opt.description }))] }, opt.value));
                })) }))] }));
}
//# sourceMappingURL=Autocomplete.js.map