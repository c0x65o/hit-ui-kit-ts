'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
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
export function Row({ gap = 'sm', align, justify, wrap = false, inline = false, style: customStyle, className, children, }) {
    const { spacing } = useThemeTokens();
    const gapValue = typeof gap === 'number'
        ? `${gap}px`
        : spacing[gap] || gap;
    return (_jsx("div", { className: className, style: styles({
            display: inline ? 'inline-flex' : 'flex',
            flexDirection: 'row',
            gap: gapValue,
            alignItems: align ? alignMap[align] : undefined,
            justifyContent: justify ? justifyMap[justify] : undefined,
            flexWrap: wrap ? 'wrap' : undefined,
            ...customStyle,
        }), children: children }));
}
//# sourceMappingURL=Row.js.map