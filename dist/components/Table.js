'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
import { formatDateTimeCellIfApplicable } from '../utils/datetime';
export function Table({ columns, data, onRowClick, emptyMessage, loading }) {
    const { colors, textStyles: ts, spacing } = useThemeTokens();
    if (loading) {
        return (_jsx("div", { style: styles({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing['5xl'],
            }), children: _jsx(Loader2, { size: 32, style: { color: colors.text.muted, animation: 'spin 1s linear infinite' } }) }));
    }
    if (data.length === 0) {
        return (_jsx("div", { style: styles({
                textAlign: 'center',
                padding: spacing['5xl'],
                color: colors.text.muted,
                fontSize: ts.body.fontSize,
            }), children: emptyMessage || 'No data available' }));
    }
    return (_jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsx("tr", { style: { borderBottom: `1px solid ${colors.border.subtle}` }, children: columns.map((col) => (_jsx("th", { style: styles({
                                padding: `${spacing.md} ${spacing.lg}`,
                                textAlign: col.align || 'left',
                                fontSize: ts.bodySmall.fontSize,
                                fontWeight: ts.label.fontWeight,
                                color: colors.text.muted,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                width: col.width,
                            }), children: col.label }, col.key))) }) }), _jsx("tbody", { children: data.map((row, rowIndex) => (_jsx("tr", { onClick: () => onRowClick?.(row, rowIndex), style: styles({
                            borderBottom: `1px solid ${colors.border.subtle}`,
                            cursor: onRowClick ? 'pointer' : 'default',
                            transition: 'background-color 150ms ease',
                        }), onMouseEnter: (e) => {
                            if (onRowClick) {
                                e.currentTarget.style.backgroundColor = colors.bg.elevated;
                            }
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }, children: columns.map((col) => (_jsx("td", { style: styles({
                                padding: `${spacing.md} ${spacing.lg}`,
                                textAlign: col.align || 'left',
                                fontSize: ts.body.fontSize,
                                color: colors.text.secondary,
                            }), children: col.render
                                ? col.render(row[col.key], row, rowIndex)
                                : (formatDateTimeCellIfApplicable(col.key, row[col.key]) ?? row[col.key]) }, col.key))) }, rowIndex))) })] }) }));
}
//# sourceMappingURL=Table.js.map