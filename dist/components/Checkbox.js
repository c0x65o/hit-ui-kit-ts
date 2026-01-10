'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Checkbox({ label, checked, onChange, disabled }) {
    const { colors, radius, textStyles: ts, spacing } = useThemeTokens();
    return (_jsxs("label", { style: styles({
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
        }), children: [_jsx("div", { onClick: () => !disabled && onChange(!checked), style: styles({
                    width: '1.25rem',
                    height: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: checked ? colors.primary.default : colors.bg.elevated,
                    border: `1px solid ${checked ? colors.primary.default : colors.border.default}`,
                    borderRadius: radius.sm,
                    transition: 'all 150ms ease',
                }), children: checked && _jsx(Check, { size: 14, style: { color: colors.text.inverse } }) }), label && (_jsx("span", { style: styles({
                    fontSize: ts.body.fontSize,
                    color: colors.text.secondary,
                }), children: label }))] }));
}
//# sourceMappingURL=Checkbox.js.map