'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
const sizeMap = {
    xs: { fontSize: '0.75rem', lineHeight: '1rem' }, // 12px
    sm: { fontSize: '0.875rem', lineHeight: '1.25rem' }, // 14px
    base: { fontSize: '1rem', lineHeight: '1.5rem' }, // 16px
    lg: { fontSize: '1.125rem', lineHeight: '1.75rem' }, // 18px
    xl: { fontSize: '1.25rem', lineHeight: '1.75rem' }, // 20px
    '2xl': { fontSize: '1.5rem', lineHeight: '2rem' }, // 24px
    '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' }, // 30px
};
const weightMap = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
};
/**
 * Text - Typography with consistent sizing and colors
 *
 * Replaces Tailwind's `text-sm font-medium text-muted-foreground` patterns.
 *
 * @example
 * <Text size="sm" color="muted">Helper text</Text>
 *
 * @example
 * <Text size="2xl" weight="bold">Page Title</Text>
 *
 * @example
 * <Text size="base" truncate>This is a very long text that will be truncated...</Text>
 */
export function Text({ size = 'base', weight = 'normal', color = 'primary', align, truncate = false, nowrap = false, inline = false, style: customStyle, className, as, children, }) {
    const { colors } = useThemeTokens();
    // Resolve color
    let textColor;
    switch (color) {
        case 'primary':
            textColor = colors.text.primary;
            break;
        case 'secondary':
            textColor = colors.text.secondary;
            break;
        case 'muted':
            textColor = colors.text.muted;
            break;
        case 'inverse':
            textColor = colors.text.inverse;
            break;
        case 'error':
            textColor = colors.error.default;
            break;
        case 'success':
            textColor = colors.success.default;
            break;
        case 'warning':
            textColor = colors.warning.default;
            break;
        case 'info':
            textColor = colors.info.default;
            break;
        default:
            textColor = colors.text.primary;
    }
    const sizeStyle = sizeMap[size];
    const fontWeight = weightMap[weight];
    // Determine element
    const Component = as || (inline ? 'span' : 'p');
    return (_jsx(Component, { className: className, style: styles({
            fontSize: sizeStyle.fontSize,
            lineHeight: sizeStyle.lineHeight,
            fontWeight,
            color: textColor,
            textAlign: align,
            margin: Component === 'p' ? 0 : undefined,
            overflow: truncate ? 'hidden' : undefined,
            textOverflow: truncate ? 'ellipsis' : undefined,
            whiteSpace: truncate || nowrap ? 'nowrap' : undefined,
            ...customStyle,
        }), children: children }));
}
const levelDefaults = {
    1: { size: '3xl', weight: 'bold' },
    2: { size: '2xl', weight: 'bold' },
    3: { size: 'xl', weight: 'semibold' },
    4: { size: 'lg', weight: 'semibold' },
    5: { size: 'base', weight: 'semibold' },
    6: { size: 'sm', weight: 'semibold' },
};
export function Heading({ level, size, weight, color = 'primary', align, style, className, children, }) {
    const defaults = levelDefaults[level];
    const tag = `h${level}`;
    return (_jsx(Text, { as: tag, size: size || defaults.size, weight: weight || defaults.weight, color: color, align: align, style: style, className: className, children: children }));
}
//# sourceMappingURL=Text.js.map