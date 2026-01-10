'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Input({ label, type = 'text', placeholder, value, onChange, error, disabled, required, ...rest }) {
    const { colors, radius, componentSpacing, textStyles: ts, spacing } = useThemeTokens();
    return (_jsxs("div", { style: styles({ marginBottom: spacing.md }), children: [label && (_jsxs("label", { style: styles({
                    display: 'block',
                    fontSize: ts.label.fontSize,
                    fontWeight: ts.label.fontWeight,
                    color: colors.text.primary,
                    marginBottom: spacing.xs,
                }), children: [label, required && _jsx("span", { style: { color: colors.error.default, marginLeft: spacing.xs }, children: "*" })] })), _jsx("input", { type: type, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, disabled: disabled, ...rest, style: styles({
                    width: '100%',
                    height: componentSpacing.input.height,
                    padding: `0 ${componentSpacing.input.paddingX}`,
                    backgroundColor: colors.bg.elevated,
                    border: `1px solid ${error ? colors.error.default : colors.border.default}`,
                    borderRadius: radius.md,
                    color: colors.text.primary,
                    fontSize: ts.body.fontSize,
                    outline: 'none',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'text',
                    boxSizing: 'border-box',
                }) }), error && (_jsx("p", { style: styles({
                    marginTop: spacing.xs,
                    fontSize: ts.bodySmall.fontSize,
                    color: colors.error.default,
                }), children: error }))] }));
}
//# sourceMappingURL=Input.js.map