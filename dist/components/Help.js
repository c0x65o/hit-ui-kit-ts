'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Help({ content, title, position = 'top', trigger = 'hover', icon, size = 'md', }) {
    const { colors, spacing, shadows, radius } = useThemeTokens();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 20,
    };
    const handleToggle = () => {
        if (trigger === 'click') {
            setIsOpen(!isOpen);
        }
    };
    const handleMouseEnter = () => {
        if (trigger === 'hover') {
            setIsOpen(true);
        }
    };
    const handleMouseLeave = () => {
        if (trigger === 'hover') {
            setIsOpen(false);
        }
    };
    // Close on outside click for click trigger
    useEffect(() => {
        if (trigger !== 'click' || !isOpen)
            return;
        const handleClickOutside = (e) => {
            if (triggerRef.current &&
                !triggerRef.current.contains(e.target) &&
                tooltipRef.current &&
                !tooltipRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [trigger, isOpen]);
    // Close on Escape key
    useEffect(() => {
        if (!isOpen)
            return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);
    const getPositionStyles = () => {
        const base = {
            position: 'absolute',
            zIndex: 1000,
        };
        switch (position) {
            case 'top':
                return { ...base, bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: spacing.xs };
            case 'bottom':
                return { ...base, top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: spacing.xs };
            case 'left':
                return { ...base, right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: spacing.xs };
            case 'right':
                return { ...base, left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: spacing.xs };
            default:
                return base;
        }
    };
    return (_jsxs("span", { style: styles({
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
        }), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, children: [_jsx("button", { ref: triggerRef, type: "button", onClick: handleToggle, "aria-label": "Help", "aria-expanded": isOpen, style: styles({
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: spacing.xs,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.text.muted,
                    borderRadius: radius.full,
                    transition: 'color 0.15s ease, background-color 0.15s ease',
                }), onMouseEnter: (e) => {
                    e.currentTarget.style.color = colors.primary.default;
                    e.currentTarget.style.backgroundColor = colors.primary.light;
                }, onMouseLeave: (e) => {
                    e.currentTarget.style.color = colors.text.muted;
                    e.currentTarget.style.backgroundColor = 'transparent';
                }, children: icon || _jsx(HelpCircle, { size: iconSizes[size] }) }), isOpen && (_jsxs("div", { ref: tooltipRef, role: "tooltip", style: styles({
                    ...getPositionStyles(),
                    backgroundColor: colors.bg.surface,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.lg,
                    boxShadow: shadows.lg,
                    padding: spacing.md,
                    minWidth: '200px',
                    maxWidth: '320px',
                }), children: [title && (_jsxs("div", { style: styles({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: spacing.sm,
                            paddingBottom: spacing.sm,
                            borderBottom: `1px solid ${colors.border.subtle}`,
                        }), children: [_jsx("span", { style: styles({
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: colors.text.primary,
                                }), children: title }), trigger === 'click' && (_jsx("button", { type: "button", onClick: () => setIsOpen(false), style: styles({
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: colors.text.muted,
                                    borderRadius: radius.sm,
                                }), "aria-label": "Close", children: _jsx(X, { size: 14 }) }))] })), _jsx("div", { style: styles({
                            fontSize: '0.8125rem',
                            lineHeight: 1.5,
                            color: colors.text.secondary,
                        }), children: content })] }))] }));
}
//# sourceMappingURL=Help.js.map