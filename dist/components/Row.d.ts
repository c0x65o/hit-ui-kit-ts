import React from 'react';
import type { SpacingTokens } from '../tokens/spacing';
export type RowGap = keyof SpacingTokens | number;
export interface RowProps {
    /** Gap between children. Can be a spacing token key or a number (px). */
    gap?: RowGap;
    /** Vertical alignment of children */
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    /** Horizontal distribution of children */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    /** Whether children should wrap to new lines */
    wrap?: boolean;
    /** Whether to render as inline-flex */
    inline?: boolean;
    /** Additional inline styles */
    style?: React.CSSProperties;
    /** Optional className for escape hatch */
    className?: string;
    children: React.ReactNode;
}
/**
 * Row - Horizontal layout with consistent spacing
 *
 * Replaces Tailwind's `flex gap-*` and `flex items-center` patterns.
 *
 * @example
 * <Row gap="sm" align="center">
 *   <Icon />
 *   <Text>Label</Text>
 * </Row>
 *
 * @example
 * <Row gap="lg" justify="between">
 *   <Text>Left</Text>
 *   <Button>Right</Button>
 * </Row>
 */
export declare function Row({ gap, align, justify, wrap, inline, style: customStyle, className, children, }: RowProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Row.d.ts.map