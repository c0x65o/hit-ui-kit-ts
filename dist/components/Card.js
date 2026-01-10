'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Card({ title, description, footer, children, className }) {
    const { colors, radius, componentSpacing, textStyles: ts, spacing } = useThemeTokens();
    return (_jsxs("div", { className: className, style: styles({
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: radius.lg,
            overflow: 'hidden',
        }), children: [(title || description) && (_jsxs("div", { style: styles({
                    padding: componentSpacing.card.padding,
                    borderBottom: `1px solid ${colors.border.subtle}`,
                }), children: [title && (_jsx("h2", { style: styles({
                            fontSize: ts.heading2.fontSize,
                            fontWeight: ts.heading2.fontWeight,
                            color: colors.text.primary,
                            margin: 0,
                        }), children: title })), description && (_jsx("p", { style: styles({
                            marginTop: spacing.xs,
                            fontSize: ts.body.fontSize,
                            color: colors.text.secondary,
                            margin: title ? `${spacing.xs} 0 0 0` : 0,
                        }), children: description }))] })), _jsx("div", { style: styles({ padding: componentSpacing.card.padding }), children: children }), footer && (_jsx("div", { style: styles({
                    padding: componentSpacing.card.padding,
                    backgroundColor: colors.bg.muted,
                    borderTop: `1px solid ${colors.border.subtle}`,
                }), children: footer }))] }));
}
//# sourceMappingURL=Card.js.map