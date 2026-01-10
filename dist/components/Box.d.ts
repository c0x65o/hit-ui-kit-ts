import React from 'react';
import type { SpacingTokens } from '../tokens/spacing';
export type BoxSpacing = keyof SpacingTokens | number;
export interface BoxProps {
    /** Padding on all sides */
    p?: BoxSpacing;
    /** Horizontal padding */
    px?: BoxSpacing;
    /** Vertical padding */
    py?: BoxSpacing;
    /** Top padding */
    pt?: BoxSpacing;
    /** Right padding */
    pr?: BoxSpacing;
    /** Bottom padding */
    pb?: BoxSpacing;
    /** Left padding */
    pl?: BoxSpacing;
    /** Margin on all sides */
    m?: BoxSpacing;
    /** Horizontal margin */
    mx?: BoxSpacing;
    /** Vertical margin */
    my?: BoxSpacing;
    /** Top margin */
    mt?: BoxSpacing;
    /** Right margin */
    mr?: BoxSpacing;
    /** Bottom margin */
    mb?: BoxSpacing;
    /** Left margin */
    ml?: BoxSpacing;
    /** Background color token */
    bg?: 'page' | 'surface' | 'elevated' | 'muted';
    /** Border style */
    border?: boolean | 'subtle' | 'default' | 'strong';
    /** Border radius token */
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Whether the box takes full width */
    fullWidth?: boolean;
    /** Additional inline styles */
    style?: React.CSSProperties;
    /** Optional className for escape hatch */
    className?: string;
    /** HTML element to render as */
    as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav';
    children?: React.ReactNode;
}
/**
 * Box - Container with spacing, background, and border
 *
 * Replaces Tailwind's `p-* m-* bg-* rounded-* border` patterns.
 *
 * @example
 * <Box p="lg" bg="surface" rounded="lg" border>
 *   <Text>Card-like content</Text>
 * </Box>
 *
 * @example
 * <Box px="xl" py="md" mt="lg">
 *   <Stack gap="sm">...</Stack>
 * </Box>
 */
export declare function Box({ p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml, bg, border, rounded, fullWidth, style: customStyle, className, as: Component, children, }: BoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Box.d.ts.map