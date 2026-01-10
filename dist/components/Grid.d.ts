import React from 'react';
import type { SpacingTokens } from '../tokens/spacing';
export type GridGap = keyof SpacingTokens | number;
export interface GridProps {
    /** Number of columns. Can be a number or responsive object. */
    cols?: number | {
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    /** Gap between grid items. Can be a spacing token key or a number (px). */
    gap?: GridGap;
    /** Row gap (overrides gap for rows) */
    rowGap?: GridGap;
    /** Column gap (overrides gap for columns) */
    colGap?: GridGap;
    /** Horizontal alignment of items within cells */
    alignItems?: 'start' | 'center' | 'end' | 'stretch';
    /** Vertical alignment of items within cells */
    justifyItems?: 'start' | 'center' | 'end' | 'stretch';
    /** Additional inline styles */
    style?: React.CSSProperties;
    /** Optional className for escape hatch */
    className?: string;
    children: React.ReactNode;
}
/**
 * Grid - CSS Grid layout with consistent spacing
 *
 * Replaces Tailwind's `grid grid-cols-* gap-*` patterns.
 *
 * @example
 * <Grid cols={3} gap="lg">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * @example
 * <Grid cols={7} gap="md" alignItems="center">
 *   <Text>Col 1</Text>
 *   <Text>Col 2</Text>
 *   ...
 * </Grid>
 */
export declare function Grid({ cols, gap, rowGap, colGap, alignItems, justifyItems, style: customStyle, className, children, }: GridProps): import("react/jsx-runtime").JSX.Element;
/**
 * GridItem - Control individual grid item placement
 */
export interface GridItemProps {
    /** Number of columns to span */
    colSpan?: number;
    /** Number of rows to span */
    rowSpan?: number;
    /** Additional inline styles */
    style?: React.CSSProperties;
    /** Optional className for escape hatch */
    className?: string;
    children: React.ReactNode;
}
export declare function GridItem({ colSpan, rowSpan, style: customStyle, className, children, }: GridItemProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Grid.d.ts.map