import React from 'react';
import type { AlertDialogProps } from '../types';
export interface AlertDialogOptions {
    variant?: 'success' | 'warning' | 'error' | 'info';
    title?: string;
    confirmText?: string;
    cancelText?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}
export interface AlertDialogState extends AlertDialogOptions {
    open: boolean;
    message: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
}
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
export declare function useAlertDialog(): {
    showAlert: (message: React.ReactNode, options?: AlertDialogOptions) => Promise<void>;
    showConfirm: (message: React.ReactNode, options?: AlertDialogOptions) => Promise<boolean>;
    close: () => void;
    props: AlertDialogProps;
};
//# sourceMappingURL=useAlertDialog.d.ts.map