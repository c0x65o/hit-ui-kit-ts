'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
/**
 * Full-screen centered layout for auth pages (login, signup, etc.)
 */
export function AuthLayout({ children }) {
    const { colors, spacing } = useThemeTokens();
    return (_jsx("div", { style: styles({
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg.page,
            padding: spacing.lg,
            overflow: 'auto',
        }), children: children }));
}
//# sourceMappingURL=AuthLayout.js.map