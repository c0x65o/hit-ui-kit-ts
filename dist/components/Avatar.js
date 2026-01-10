'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Avatar({ src, name, size = 'md' }) {
    const { colors, textStyles: ts } = useThemeTokens();
    const sizeMap = {
        sm: { size: '2rem', fontSize: ts.bodySmall.fontSize },
        md: { size: '2.5rem', fontSize: ts.body.fontSize },
        lg: { size: '3rem', fontSize: ts.heading3.fontSize },
    };
    const sizeStyles = sizeMap[size];
    const initials = name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return (_jsx("div", { style: styles({
            width: sizeStyles.size,
            height: sizeStyles.size,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.primary.default}, ${colors.accent.default})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        }), children: src ? (_jsx("img", { src: src, alt: name || 'Avatar', style: { width: '100%', height: '100%', objectFit: 'cover' } })) : (_jsx("span", { style: styles({
                color: colors.text.inverse,
                fontSize: sizeStyles.fontSize,
                fontWeight: 500,
            }), children: initials || '?' })) }));
}
//# sourceMappingURL=Avatar.js.map