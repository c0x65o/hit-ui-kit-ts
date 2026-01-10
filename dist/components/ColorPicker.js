'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function ColorPicker({ label, value, onChange, placeholder = '#3b82f6', error, disabled, required, }) {
    const { colors, radius, componentSpacing, textStyles: ts, spacing } = useThemeTokens();
    // Normalize color value - ensure it's a valid hex color or empty string
    const normalizedValue = value || '';
    const handleColorInputChange = (e) => {
        onChange(e.target.value);
    };
    const handleTextInputChange = (textValue) => {
        // Allow empty string or valid hex color
        if (textValue === '' || /^#[0-9A-Fa-f]{0,6}$/.test(textValue)) {
            onChange(textValue);
        }
    };
    return (_jsxs("div", { style: styles({ marginBottom: spacing.md }), children: [label && (_jsxs("label", { style: styles({
                    display: 'block',
                    fontSize: ts.label.fontSize,
                    fontWeight: ts.label.fontWeight,
                    color: colors.text.primary,
                    marginBottom: spacing.xs,
                }), children: [label, required && _jsx("span", { style: { color: colors.error.default, marginLeft: spacing.xs }, children: "*" })] })), _jsxs("div", { style: styles({
                    display: 'flex',
                    gap: spacing.sm,
                    alignItems: 'center',
                }), children: [_jsx("input", { type: "color", value: normalizedValue || '#000000', onChange: handleColorInputChange, disabled: disabled, style: styles({
                            width: '60px',
                            height: componentSpacing.input.height,
                            padding: '2px',
                            backgroundColor: colors.bg.elevated,
                            border: `1px solid ${error ? colors.error.default : colors.border.default}`,
                            borderRadius: radius.md,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.5 : 1,
                            boxSizing: 'border-box',
                            flexShrink: 0,
                        }) }), _jsx("input", { type: "text", value: normalizedValue, onChange: (e) => handleTextInputChange(e.target.value), placeholder: placeholder, disabled: disabled, style: styles({
                            flex: 1,
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
                            fontFamily: 'monospace',
                        }) })] }), error && (_jsx("p", { style: styles({
                    marginTop: spacing.xs,
                    fontSize: ts.bodySmall.fontSize,
                    color: colors.error.default,
                }), children: error }))] }));
}
//# sourceMappingURL=ColorPicker.js.map