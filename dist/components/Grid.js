'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
const alignMap = {
    start: 'start',
    center: 'center',
    end: 'end',
    stretch: 'stretch',
};
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
export function Grid({ cols = 1, gap = 'md', rowGap, colGap, alignItems, justifyItems, style: customStyle, className, children, }) {
    const { spacing } = useThemeTokens();
    const resolveGap = (g) => {
        if (g === undefined)
            return undefined;
        if (typeof g === 'number')
            return `${g}px`;
        return spacing[g] || g;
    };
    const gapValue = resolveGap(gap);
    const rowGapValue = resolveGap(rowGap);
    const colGapValue = resolveGap(colGap);
    // For now, we only support simple number cols (responsive would need CSS media queries or JS)
    const colCount = typeof cols === 'number' ? cols : cols.md || cols.sm || 1;
    const gridTemplateColumns = `repeat(${colCount}, minmax(0, 1fr))`;
    return (_jsx("div", { className: className, style: styles({
            display: 'grid',
            gridTemplateColumns,
            gap: !rowGapValue && !colGapValue ? gapValue : undefined,
            rowGap: rowGapValue,
            columnGap: colGapValue,
            alignItems: alignItems ? alignMap[alignItems] : undefined,
            justifyItems: justifyItems ? alignMap[justifyItems] : undefined,
            ...customStyle,
        }), children: children }));
}
export function GridItem({ colSpan, rowSpan, style: customStyle, className, children, }) {
    return (_jsx("div", { className: className, style: styles({
            gridColumn: colSpan ? `span ${colSpan} / span ${colSpan}` : undefined,
            gridRow: rowSpan ? `span ${rowSpan} / span ${rowSpan}` : undefined,
            ...customStyle,
        }), children: children }));
}
//# sourceMappingURL=Grid.js.map