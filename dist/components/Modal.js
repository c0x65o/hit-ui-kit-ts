'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Modal({ open, onClose, title, description, size = 'md', children }) {
    const { colors, radius, textStyles: ts, spacing, shadows } = useThemeTokens();
    if (!open)
        return null;
    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return { maxWidth: '24rem' };
            case 'lg':
                return { maxWidth: '32rem' };
            case 'xl':
                return { maxWidth: '40rem' };
            case '2xl':
                return { maxWidth: '56rem' };
            case 'full':
                return { maxWidth: '90vw' };
            default:
                return { maxWidth: '28rem' };
        }
    };
    return (_jsx("div", { style: styles({
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            overflowY: 'auto',
        }), children: _jsxs("div", { style: styles({
                display: 'flex',
                minHeight: '100vh',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '5rem',
                paddingBottom: spacing.lg,
                paddingLeft: spacing.lg,
                paddingRight: spacing.lg,
            }), children: [_jsx("div", { onClick: onClose, style: styles({
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    }) }), _jsxs("div", { style: styles({
                        position: 'relative',
                        width: '100%',
                        backgroundColor: colors.bg.surface,
                        border: `1px solid ${colors.border.subtle}`,
                        borderRadius: radius.lg,
                        boxShadow: shadows.xl,
                        ...getSizeStyles(),
                    }), children: [(title || description) && (_jsxs("div", { style: styles({
                                padding: spacing['2xl'],
                                borderBottom: `1px solid ${colors.border.subtle}`,
                            }), children: [_jsxs("div", { style: styles({
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }), children: [title && (_jsx("h2", { style: styles({
                                                fontSize: ts.heading2.fontSize,
                                                fontWeight: ts.heading2.fontWeight,
                                                color: colors.text.primary,
                                                margin: 0,
                                            }), children: title })), _jsx("button", { onClick: onClose, style: styles({
                                                background: 'none',
                                                border: 'none',
                                                padding: spacing.xs,
                                                cursor: 'pointer',
                                                color: colors.text.muted,
                                            }), children: _jsx(X, { size: 20 }) })] }), description && (_jsx("p", { style: styles({
                                        marginTop: spacing.xs,
                                        fontSize: ts.body.fontSize,
                                        color: colors.text.secondary,
                                    }), children: description }))] })), _jsx("div", { style: styles({ padding: spacing['2xl'] }), children: children })] })] }) }));
}
//# sourceMappingURL=Modal.js.map