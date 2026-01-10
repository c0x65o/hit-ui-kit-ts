'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
/**
 * Compact card for auth forms (login, signup, forgot password, etc.)
 */
export function AuthCard({ children, maxWidth = '380px' }) {
    const { colors, radius, shadows, spacing } = useThemeTokens();
    return (_jsx("div", { style: styles({
            width: '100%',
            maxWidth,
            padding: spacing['2xl'],
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: radius.xl,
            boxShadow: shadows.lg,
        }), children: children }));
}
//# sourceMappingURL=AuthCard.js.map