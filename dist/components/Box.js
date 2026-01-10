'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
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
export function Box({ p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml, bg, border, rounded, fullWidth, style: customStyle, className, as: Component = 'div', children, }) {
    const { spacing, colors, radius } = useThemeTokens();
    const resolveSpacing = (s) => {
        if (s === undefined)
            return undefined;
        if (typeof s === 'number')
            return `${s}px`;
        return spacing[s] || s;
    };
    // Resolve padding
    const pAll = resolveSpacing(p);
    const pxVal = resolveSpacing(px);
    const pyVal = resolveSpacing(py);
    const ptVal = resolveSpacing(pt);
    const prVal = resolveSpacing(pr);
    const pbVal = resolveSpacing(pb);
    const plVal = resolveSpacing(pl);
    const paddingTop = ptVal || pyVal || pAll;
    const paddingRight = prVal || pxVal || pAll;
    const paddingBottom = pbVal || pyVal || pAll;
    const paddingLeft = plVal || pxVal || pAll;
    // Resolve margin
    const mAll = resolveSpacing(m);
    const mxVal = resolveSpacing(mx);
    const myVal = resolveSpacing(my);
    const mtVal = resolveSpacing(mt);
    const mrVal = resolveSpacing(mr);
    const mbVal = resolveSpacing(mb);
    const mlVal = resolveSpacing(ml);
    const marginTop = mtVal || myVal || mAll;
    const marginRight = mrVal || mxVal || mAll;
    const marginBottom = mbVal || myVal || mAll;
    const marginLeft = mlVal || mxVal || mAll;
    // Resolve background
    const bgColor = bg ? colors.bg[bg] : undefined;
    // Resolve border
    let borderStyle;
    if (border === true || border === 'default') {
        borderStyle = `1px solid ${colors.border.default}`;
    }
    else if (border === 'subtle') {
        borderStyle = `1px solid ${colors.border.subtle}`;
    }
    else if (border === 'strong') {
        borderStyle = `1px solid ${colors.border.strong}`;
    }
    // Resolve border radius
    const borderRadius = rounded ? radius[rounded] : undefined;
    return (_jsx(Component, { className: className, style: styles({
            paddingTop,
            paddingRight,
            paddingBottom,
            paddingLeft,
            marginTop,
            marginRight,
            marginBottom,
            marginLeft,
            backgroundColor: bgColor,
            border: borderStyle,
            borderRadius,
            width: fullWidth ? '100%' : undefined,
            ...customStyle,
        }), children: children }));
}
//# sourceMappingURL=Box.js.map