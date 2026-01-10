import React from 'react';
export interface TextProps {
    /** Text size variant */
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    /** Font weight */
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';
    /** Text color variant */
    color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'error' | 'success' | 'warning' | 'info';
    /** Text alignment */
    align?: 'left' | 'center' | 'right';
    /** Whether text should truncate with ellipsis */
    truncate?: boolean;
    /** Whether text should not wrap */
    nowrap?: boolean;
    /** Whether to render as span (inline) instead of p (block) */
    inline?: boolean;
    /** Additional inline styles */
    style?: React.CSSProperties;
    /** Optional className for escape hatch */
    className?: string;
    /** HTML element to render as */
    as?: 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'strong' | 'em';
    children: React.ReactNode;
}
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
export declare function Text({ size, weight, color, align, truncate, nowrap, inline, style: customStyle, className, as, children, }: TextProps): import("react/jsx-runtime").JSX.Element;
/**
 * Heading - Semantic heading with consistent styling
 *
 * @example
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2}>Section Title</Heading>
 */
export interface HeadingProps {
    /** Heading level (1-6) */
    level: 1 | 2 | 3 | 4 | 5 | 6;
    /** Override visual size (defaults to match level) */
    size?: TextProps['size'];
    /** Font weight (defaults to bold for h1-h2, semibold for h3-h6) */
    weight?: TextProps['weight'];
    /** Text color */
    color?: TextProps['color'];
    /** Text alignment */
    align?: TextProps['align'];
    /** Additional inline styles */
    style?: React.CSSProperties;
    /** Optional className */
    className?: string;
    children: React.ReactNode;
}
export declare function Heading({ level, size, weight, color, align, style, className, children, }: HeadingProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Text.d.ts.map