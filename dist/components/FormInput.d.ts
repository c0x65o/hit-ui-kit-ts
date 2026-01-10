import React from 'react';
export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label?: string;
    error?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
/**
 * Compact form input for auth forms.
 * Includes password visibility toggle.
 */
export declare function FormInput({ label, error, type, className, onChange, ...props }: FormInputProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FormInput.d.ts.map