'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Alert({ variant, title, onClose, children, ...rest }) {
    const { colors, radius, textStyles: ts, spacing } = useThemeTokens();
    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return {
                    bg: `${colors.success.default}15`,
                    border: `${colors.success.default}40`,
                    icon: _jsx(CheckCircle, { size: 20, style: { color: colors.success.default } }),
                    title: colors.success.default,
                };
            case 'warning':
                return {
                    bg: `${colors.warning.default}15`,
                    border: `${colors.warning.default}40`,
                    icon: _jsx(AlertTriangle, { size: 20, style: { color: colors.warning.default } }),
                    title: colors.warning.default,
                };
            case 'error':
                return {
                    bg: `${colors.error.default}15`,
                    border: `${colors.error.default}40`,
                    icon: _jsx(AlertCircle, { size: 20, style: { color: colors.error.default } }),
                    title: colors.error.default,
                };
            case 'info':
            default:
                return {
                    bg: `${colors.info.default}15`,
                    border: `${colors.info.default}40`,
                    icon: _jsx(Info, { size: 20, style: { color: colors.info.default } }),
                    title: colors.info.default,
                };
        }
    };
    const variantStyles = getVariantStyles();
    return (_jsx("div", { ...rest, style: styles({
            backgroundColor: variantStyles.bg,
            border: `1px solid ${variantStyles.border}`,
            borderRadius: radius.lg,
            padding: spacing.lg,
        }), children: _jsxs("div", { style: styles({ display: 'flex', gap: spacing.md }), children: [_jsx("div", { style: { flexShrink: 0 }, children: variantStyles.icon }), _jsxs("div", { style: { flex: 1 }, children: [title && (_jsx("h3", { style: styles({
                                fontSize: ts.body.fontSize,
                                fontWeight: ts.label.fontWeight,
                                color: variantStyles.title,
                                margin: 0,
                            }), children: title })), _jsx("div", { style: styles({
                                fontSize: ts.body.fontSize,
                                color: colors.text.secondary,
                                marginTop: title ? spacing.xs : 0,
                            }), children: children })] }), onClose && (_jsx("button", { onClick: onClose, style: styles({
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: colors.text.muted,
                    }), children: _jsx(X, { size: 16 }) }))] }) }));
}
//# sourceMappingURL=Alert.js.map