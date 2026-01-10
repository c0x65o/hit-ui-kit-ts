'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
};
const justifyMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
};
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
export function Stack({ gap = 'md', align, justify, inline = false, style: customStyle, className, children, }) {
    const { spacing } = useThemeTokens();
    const gapValue = typeof gap === 'number'
        ? `${gap}px`
        : spacing[gap] || gap;
    return (_jsx("div", { className: className, style: styles({
            display: inline ? 'inline-flex' : 'flex',
            flexDirection: 'column',
            gap: gapValue,
            alignItems: align ? alignMap[align] : undefined,
            justifyContent: justify ? justifyMap[justify] : undefined,
            ...customStyle,
        }), children: children }));
}
//# sourceMappingURL=Stack.js.map