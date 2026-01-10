'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FileQuestion } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function EmptyState({ icon, title, description, action }) {
    const { colors, textStyles: ts, spacing } = useThemeTokens();
    return (_jsxs("div", { style: styles({
            textAlign: 'center',
            padding: spacing['5xl'],
        }), children: [_jsx("div", { style: styles({
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                    color: colors.text.muted,
                }), children: icon || _jsx(FileQuestion, { size: 48 }) }), _jsx("h3", { style: styles({
                    fontSize: ts.heading2.fontSize,
                    fontWeight: ts.heading2.fontWeight,
                    color: colors.text.primary,
                    margin: 0,
                }), children: title }), description && (_jsx("p", { style: styles({
                    marginTop: spacing.sm,
                    fontSize: ts.body.fontSize,
                    color: colors.text.muted,
                }), children: description })), action && (_jsx("div", { style: styles({ marginTop: spacing.lg }), children: action }))] }));
}
//# sourceMappingURL=EmptyState.js.map