'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Dropdown({ trigger, items, align = 'left' }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const triggerRef = useRef(null);
    const { colors, radius, textStyles: ts, spacing, shadows } = useThemeTokens();
    const computePosition = useCallback(() => {
        if (!triggerRef.current)
            return;
        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownWidth = 224; // 14rem = 224px
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const margin = 8;
        // Parse spacing.sm (could be "8px" or number)
        const spacingValue = typeof spacing.sm === 'string' ? parseFloat(spacing.sm.replace('px', '')) || 8 : spacing.sm || 8;
        // Horizontal positioning (clamped)
        let left = rect.left;
        let right;
        if (align === 'right') {
            right = viewportW - rect.right;
            left = undefined;
        }
        // If left-align would overflow, flip to right
        if (align === 'left' && left !== undefined && left + dropdownWidth > viewportW - margin) {
            right = viewportW - rect.right;
            left = undefined;
        }
        if (left !== undefined) {
            left = Math.max(margin, Math.min(left, viewportW - dropdownWidth - margin));
        }
        if (right !== undefined) {
            right = Math.max(margin, Math.min(right, viewportW - dropdownWidth - margin));
        }
        // Vertical positioning: open down if there's room, otherwise open up.
        const spaceBelow = viewportH - rect.bottom - margin;
        const spaceAbove = rect.top - margin;
        const minUsable = 160;
        const openUp = spaceBelow < minUsable && spaceAbove > spaceBelow;
        const maxHeightCap = Math.max(120, Math.floor(viewportH * 0.8));
        const available = Math.max(120, Math.floor((openUp ? spaceAbove : spaceBelow) - Math.max(0, spacingValue)));
        const maxHeight = Math.min(maxHeightCap, available);
        if (openUp) {
            setPosition({
                bottom: viewportH - rect.top + spacingValue,
                ...(right !== undefined ? { right } : { left }),
                maxHeight,
            });
        }
        else {
            setPosition({
                top: rect.bottom + spacingValue,
                ...(right !== undefined ? { right } : { left }),
                maxHeight,
            });
        }
    }, [align, spacing.sm]);
    // Calculate dropdown position when opened + keep it in view on scroll/resize
    useEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }
        computePosition();
        const onMove = () => computePosition();
        window.addEventListener('resize', onMove);
        window.addEventListener('scroll', onMove, true);
        return () => {
            window.removeEventListener('resize', onMove);
            window.removeEventListener('scroll', onMove, true);
        };
    }, [open, computePosition, items.length]);
    return (_jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { ref: triggerRef, onClick: () => setOpen(!open), children: trigger }), open && position && (_jsxs(_Fragment, { children: [_jsx("div", { onClick: () => setOpen(false), style: styles({
                            position: 'fixed',
                            inset: 0,
                            zIndex: 40,
                        }) }), _jsx("div", { style: styles({
                            position: 'fixed',
                            zIndex: 50,
                            ...(position.top !== undefined ? { top: `${position.top}px` } : {}),
                            ...(position.bottom !== undefined ? { bottom: `${position.bottom}px` } : {}),
                            ...(position.right !== undefined ? { right: `${position.right}px` } : { left: `${position.left}px` }),
                            width: '14rem',
                            maxHeight: `${position.maxHeight}px`,
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