'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { Modal } from './Modal';
import { Button } from './Button';
export function AlertDialog({ open, onClose, variant = 'info', title, message, confirmText = 'OK', cancelText, onConfirm, onCancel, size = 'sm', }) {
    const { colors, spacing } = useThemeTokens();
    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return {
                    icon: _jsx(CheckCircle, { size: 24, style: { color: colors.success.default } }),
                    iconColor: colors.success.default,
                };
            case 'warning':
                return {
                    icon: _jsx(AlertTriangle, { size: 24, style: { color: colors.warning.default } }),
                    iconColor: colors.warning.default,
                };
            case 'error':
                return {
                    icon: _jsx(AlertCircle, { size: 24, style: { color: colors.error.default } }),
                    iconColor: colors.error.default,
                };
            case 'info':
            default:
                return {
                    icon: _jsx(Info, { size: 24, style: { color: colors.info.default } }),
                    iconColor: colors.info.default,
                };
        }
    };
    const variantStyles = getVariantStyles();
    const isConfirmation = !!cancelText || !!onCancel;
    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        onClose();
    };
    return (_jsx(Modal, { open: open, onClose: onClose, title: title, size: size, children: _jsxs("div", { style: styles({
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.lg,
            }), children: [_jsxs("div", { style: styles({
                        display: 'flex',
                        gap: spacing.md,
                        alignItems: 'flex-start',
                    }), children: [_jsx("div", { style: { flexShrink: 0 }, children: variantStyles.icon }), _jsx("div", { style: styles({
                                flex: 1,
                                fontSize: '14px',
                                lineHeight: '1.5',
                                color: colors.text.secondary,
                            }), children: message })] }), _jsxs("div", { style: styles({
                        display: 'flex',
                        gap: spacing.md,
                        justifyContent: 'flex-end',
                    }), children: [isConfirmation && (_jsx(Button, { variant: "secondary", onClick: handleCancel, children: cancelText || 'Cancel' })), _jsx(Button, { variant: variant === 'error' ? 'danger' : 'primary', onClick: handleConfirm, children: confirmText })] })] }) }));
}
//# sourceMappingURL=AlertDialog.js.map