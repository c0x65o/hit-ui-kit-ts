'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Dropdown({ trigger, items, align = 'left' }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const triggerRef = useRef(null);
    const { colors, radius, textStyles: ts, spacing, shadows } = useThemeTokens();
    // Calculate dropdown position when opened
    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const dropdownWidth = 224; // 14rem = 224px
            // Parse spacing.sm (could be "8px" or number)
            const spacingValue = typeof spacing.sm === 'string'
                ? parseFloat(spacing.sm.replace('px', '')) || 8
                : spacing.sm || 8;
            let left = rect.left;
            let right;
            if (align === 'right') {
                right = window.innerWidth - rect.right;
                left = undefined;
            }
            // Ensure dropdown doesn't go off-screen
            if (align === 'left' && left !== undefined && left + dropdownWidth > window.innerWidth) {
                // Flip to right side if it would overflow
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
    }, [open, align, spacing.sm]);
    return (_jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { ref: triggerRef, onClick: () => setOpen(!open), children: trigger }), open && position && (_jsxs(_Fragment, { children: [_jsx("div", { onClick: () => setOpen(false), style: styles({
                            position: 'fixed',
                            inset: 0,
                            zIndex: 40,
                        }) }), _jsx("div", { style: styles({
                            position: 'fixed',
                            zIndex: 50,
                            top: `${position.top}px`,
                            ...(position.right !== undefined ? { right: `${position.right}px` } : { left: `${position.left}px` }),
                            width: '14rem',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            backgroundColor: colors.bg.surface,
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: radius.lg,
                            boxShadow: shadows.xl,
                        }), children: _jsx("div", { style: styles({ padding: spacing.xs }), children: items.map((item, idx) => (_jsxs("button", { onClick: () => {
                                    setOpen(false);
                                    item.onClick();
                                }, disabled: item.disabled, style: styles({
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing.md,
                                    padding: `${spacing.sm} ${spacing.md}`,
                                    fontSize: ts.body.fontSize,
                                    textAlign: 'left',
                                    color: item.danger ? colors.error.default : colors.text.secondary,
                                    background: 'none',
                                    border: 'none',
                                    borderRadius: radius.md,
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    opacity: item.disabled ? 0.5 : 1,
                                    transition: 'background-color 150ms ease',
                                }), onMouseEnter: (e) => {
                                    if (!item.disabled) {
                                        e.currentTarget.style.backgroundColor = colors.bg.elevated;
                                    }
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }, children: [item.icon, item.label] }, idx))) }) })] }))] }));
}
//# sourceMappingURL=Dropdown.js.map