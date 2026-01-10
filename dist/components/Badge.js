'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Badge({ variant = 'default', children, ...rest }) {
    const { colors, radius, textStyles: ts, spacing } = useThemeTokens();
    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return {
                    backgroundColor: `${colors.success.default}20`,
                    color: colors.success.default,
                    border: `1px solid ${colors.success.default}40`,
                };
            case 'warning':
                return {
                    backgroundColor: `${colors.warning.default}20`,
                    color: colors.warning.default,
                    border: `1px solid ${colors.warning.default}40`,
                };
            case 'error':
                return {
                    backgroundColor: `${colors.error.default}20`,
                    color: colors.error.default,
                    border: `1px solid ${colors.error.default}40`,
                };
            case 'info':
                return {
                    backgroundColor: `${colors.info.default}20`,
                    color: colors.info.default,
                    border: `1px solid ${colors.info.default}40`,
                };
            default:
                return {
                    backgroundColor: colors.bg.elevated,
                    color: colors.text.secondary,
                    border: 'none',
                };
        }
    };
    return (_jsx("span", { ...rest, style: styles({
            display: 'inline-flex',
            alignItems: 'center',
            padding: `${spacing.px} ${spacing.sm}`,
            borderRadius: radius.sm,
            fontSize: ts.bodySmall.fontSize,
            fontWeight: ts.label.fontWeight,
            ...getVariantStyles(),
        }), children: children }));
}
//# sourceMappingURL=Badge.js.map