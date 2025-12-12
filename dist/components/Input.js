'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export const Input = React.forwardRef(function Input({ label, type = 'text', value, onChange, error, required, ...inputProps }, ref) {
    const { colors, radius, componentSpacing, textStyles: ts, spacing } = useThemeTokens();
    return (_jsxs("div", { style: styles({ marginBottom: spacing.md }), children: [label && (_jsxs("label", { style: styles({
                    display: 'block',
                    fontSize: ts.label.fontSize,
                    fontWeight: ts.label.fontWeight,
                    color: colors.text.primary,
                    marginBottom: spacing.xs,
                }), children: [label, required && _jsx("span", { style: { color: colors.error.default, marginLeft: spacing.xs }, children: "*" })] })), _jsx("input", { ref: ref, type: type, value: value, onChange: (e) => onChange(e.target.value), "aria-invalid": Boolean(error) || undefined, ...inputProps, style: styles({
                    width: '100%',
                    height: componentSpacing.input.height,
                    padding: `0 ${componentSpacing.input.paddingX}`,
                    backgroundColor: colors.bg.elevated,
                    border: `1px solid ${error ? colors.error.default : colors.border.default}`,
                    borderRadius: radius.md,
                    color: colors.text.primary,
                    fontSize: ts.body.fontSize,
                    outline: 'none',
                    opacity: inputProps.disabled ? 0.5 : 1,
                    cursor: inputProps.disabled ? 'not-allowed' : 'text',
                    boxSizing: 'border-box',
                }) }), error && (_jsx("p", { style: styles({
                    marginTop: spacing.xs,
                    fontSize: ts.bodySmall.fontSize,
                    color: colors.error.default,
                }), children: error }))] }));
});
//# sourceMappingURL=Input.js.map