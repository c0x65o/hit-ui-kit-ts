import React from 'react';
import type { SpacingTokens } from '../tokens/spacing';
export type StackGap = keyof SpacingTokens | number;
export interface StackProps {
    /** Gap between children. Can be a spacing token key or a number (px). */
    gap?: StackGap;
    /** Horizontal alignment of children */
    align?: 'start' | 'center' | 'end' | 'stretch';
    /** Vertical distribution of children */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    /** Whether to render as inline-flex */
    inline?: boolean;
    /** Additional inline styles */
    style?: React.CSSProperties;
    /** Optional className for escape hatch */
    className?: string;
    children: React.ReactNode;
}
/**
 * Stack - Vertical layout with consistent spacing
 *
 * Replaces Tailwind's `flex flex-col gap-*` and `space-y-*` patterns.
 *
 * @example
 * <Stack gap="lg">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 * </Stack>
 *
 * @example
 * <Stack gap={4} align="center">
 *   <Text>Centered text</Text>
 *   <Button>Action</Button>
 * </Stack>
 */
export declare function Stack({ gap, align, justify, inline, style: customStyle, className, children, }: StackProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Stack.d.ts.map