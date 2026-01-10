'use client';
import { useState, useCallback } from 'react';
/**
 * Hook for programmatically showing alert dialogs.
 *
 * Returns state and props that can be used with AlertDialog component from useUi().
 *
 * @example
 * ```tsx
 * const { AlertDialog } = useUi();
 * const alertDialog = useAlertDialog();
 *
 * // Simple alert
 * await alertDialog.showAlert('Operation completed successfully!', { variant: 'success' });
 *
 * // Confirmation dialog
 * const confirmed = await alertDialog.showConfirm('Are you sure you want to delete this?');
 * if (confirmed) {
 *   // User confirmed
 * }
 *
 * // Render the dialog
 * <AlertDialog {...alertDialog.props} />
 * ```
 */
export function useAlertDialog() {
    const [state, setState] = useState({
        open: false,
        message: '',
    });
    const showAlert = useCallback((message, options) => {
        return new Promise((resolve) => {
            setState({
                open: true,
                message,
                variant: options?.variant || 'info',
                title: options?.title,
                confirmText: options?.confirmText || 'OK',
                size: options?.size || 'sm',
                onConfirm: () => {
                    resolve();
                },
            });
        });
    }, []);
    const showConfirm = useCallback((message, options) => {
        return new Promise((resolve) => {
            setState({
                open: true,
                message,
                variant: options?.variant || 'warning',
                title: options?.title,
                confirmText: options?.confirmText || 'OK',
                cancelText: options?.cancelText || 'Cancel',
                size: options?.size || 'sm',
                onConfirm: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                },
            });
        });
    }, []);
    const close = useCallback(() => {
        setState((prev) => ({
            ...prev,
            open: false,
            onConfirm: undefined,
            onCancel: undefined,
        }));
    }, []);
    const props = {
        open: state.open,
        onClose: close,
        variant: state.variant,
        title: state.title,
        message: state.message,
        confirmText: state.confirmText,
        cancelText: state.cancelText,
        onConfirm: state.onConfirm,
        onCancel: state.onCancel,
        size: state.size,
    };
    return {
        showAlert,
        showConfirm,
        close,
        props,
    };
}
//# sourceMappingURL=useAlertDialog.js.map