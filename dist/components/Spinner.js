'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
export function Spinner({ size = 'md' }) {
    const { colors } = useThemeTokens();
    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 32,
    };
    return (_jsx(Loader2, { size: sizeMap[size], style: {
            color: colors.primary.default,
            animation: 'spin 1s linear infinite',
        } }));
}
//# sourceMappingURL=Spinner.js.map