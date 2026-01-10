'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Breadcrumb } from './Breadcrumb';
export function Page({ title, description, actions, breadcrumbs, onNavigate, children }) {
    const { colors, textStyles: ts, spacing } = useThemeTokens();
    return (_jsxs("div", { style: styles({ display: 'flex', flexDirection: 'column', gap: spacing['2xl'] }), children: [breadcrumbs && breadcrumbs.length > 0 && (_jsx(Breadcrumb, { items: breadcrumbs, onNavigate: onNavigate, showHome: false })), (title || actions) && (_jsxs("div", { style: styles({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: breadcrumbs ? `-${spacing.lg}` : 0 }), children: [_jsxs("div", { children: [title && (_jsx("h1", { style: styles({
                                    fontSize: ts.heading1.fontSize,
                                    fontWeight: ts.heading1.fontWeight,
                                    lineHeight: ts.heading1.lineHeight,
                                    letterSpacing: ts.heading1.letterSpacing,
                                    color: colors.text.primary,
                                    margin: 0,
                                }), children: title })), description && (_jsx("p", { style: styles({
                                    marginTop: spacing.xs,
                                    fontSize: ts.body.fontSize,
                                    color: colors.text.secondary,
                                    margin: title ? `${spacing.xs} 0 0 0` : 0,
                                }), children: description }))] }), actions && (_jsx("div", { style: styles({ display: 'flex', alignItems: 'center', gap: spacing.md }), children: actions }))] })), children] }));
}
//# sourceMappingURL=Page.js.map