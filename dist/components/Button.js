'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Button({ variant = 'primary', size = 'md', loading, disabled, type = 'button', onClick, children, ...rest }) {
    const { colors, radius, componentSpacing, textStyles: ts } = useThemeTokens();
    const isDisabled = disabled || loading;
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: colors.primary.default,
                    color: colors.text.inverse,
                    border: 'none',
                };
            case 'secondary':
                return {
                    backgroundColor: colors.bg.elevated,
                    color: colors.text.primary,
                    border: `1px solid ${colors.border.default}`,
                };
            case 'danger':
                return {
                    backgroundColor: colors.error.default,
                    color: colors.text.inverse,
                    border: 'none',
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    color: colors.text.secondary,
                    border: 'none',
                };
            case 'link':
                return {
                    backgroundColor: 'transparent',
                    color: colors.primary.default,
                    border: 'none',
                    textDecoration: 'underline',
                };
            default:
                return {};
        }
    };
    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    height: componentSpacing.button.heightSm,
                    padding: `0 ${componentSpacing.button.paddingX}`,
                    fontSize: ts.bodySmall.fontSize,
                };
            case 'lg':
                return {
                    height: '2.75rem',
                    padding: `0 1.25rem`,
                    fontSize: ts.body.fontSize,
                };
            default:
                return {
                    height: componentSpacing.button.height,
                    padding: `0 ${componentSpacing.button.paddingX}`,
                    fontSize: ts.body.fontSize,
                };
        }
    };
    return (_jsxs("button", { type: type, disabled: isDisabled, onClick: onClick, ...rest, style: styles({
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: componentSpacing.button.gap,
            fontWeight: ts.label.fontWeight,
            borderRadius: radius.md,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.5 : 1,
            transition: 'all 150ms ease',
            whiteSpace: 'nowrap',
            ...getVariantStyles(),
            ...getSizeStyles(),
        }), children: [loading && _jsx(Loader2, { size: 16, style: { animation: 'spin 1s linear infinite' } }), children] }));
}
//# sourceMappingURL=Button.js.map