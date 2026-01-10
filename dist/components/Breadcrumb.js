'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronRight, Home } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Breadcrumb({ items, onNavigate, showHome = true, homeHref = '/' }) {
    const { colors, spacing } = useThemeTokens();
    const handleClick = (href, e) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate(href);
        }
        else if (typeof window !== 'undefined') {
            window.location.href = href;
        }
    };
    const allItems = showHome
        ? [{ label: 'Home', href: homeHref, icon: _jsx(Home, { size: 14 }) }, ...items]
        : items;
    return (_jsx("nav", { "aria-label": "Breadcrumb", style: styles({ marginBottom: spacing.md }), children: _jsx("ol", { style: styles({
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                listStyle: 'none',
                margin: 0,
                padding: 0,
                flexWrap: 'wrap',
            }), children: allItems.map((item, index) => {
                const isLast = index === allItems.length - 1;
                return (_jsxs("li", { style: styles({
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                    }), children: [index > 0 && (_jsx(ChevronRight, { size: 14, style: { color: colors.text.muted, flexShrink: 0 } })), isLast ? (_jsxs("span", { style: styles({
                                fontSize: '0.875rem',
                                color: colors.text.primary,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.xs,
                            }), "aria-current": "page", children: [item.icon, item.label] })) : (_jsxs("a", { href: item.href, onClick: (e) => item.href && handleClick(item.href, e), style: styles({
                                fontSize: '0.875rem',
                                color: colors.text.secondary,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.xs,
                                transition: 'color 0.15s ease',
                            }), onMouseEnter: (e) => {
                                e.target.style.color = colors.primary.default;
                            }, onMouseLeave: (e) => {
                                e.target.style.color = colors.text.secondary;
                            }, children: [item.icon, item.label] }))] }, item.href || index));
            }) }) }));
}
//# sourceMappingURL=Breadcrumb.js.map