'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';
export function Tabs({ tabs, activeTab, onChange, defaultTab, onTabChange, value, onValueChange }) {
    const { colors, textStyles: ts, spacing } = useThemeTokens();
    // Support both id and value properties on tab items
    const getTabId = (tab) => tab.id ?? tab.value ?? '';
    // Support both prop naming conventions
    const controlledValue = value ?? activeTab;
    const onChangeHandler = onValueChange ?? onChange ?? onTabChange;
    const [localActive, setLocalActive] = useState(controlledValue || defaultTab || getTabId(tabs[0]));
    const currentTab = controlledValue ?? localActive;
    const handleChange = (tabId) => {
        setLocalActive(tabId);
        onChangeHandler?.(tabId);
    };
    // Check if any tab has content (determines if we render content section)
    const hasContent = tabs.some(tab => tab.content !== undefined);
    return (_jsxs("div", { children: [_jsx("div", { style: styles({ borderBottom: `1px solid ${colors.border.subtle}` }), children: _jsx("nav", { style: styles({ display: 'flex', gap: spacing.lg }), children: tabs.map((tab) => {
                        const tabId = getTabId(tab);
                        return (_jsx("button", { onClick: () => handleChange(tabId), style: styles({
                                padding: `${spacing.md} ${spacing.xs}`,
                                fontSize: ts.body.fontSize,
                                fontWeight: ts.label.fontWeight,
                                color: currentTab === tabId ? colors.primary.default : colors.text.muted,
                                borderBottom: currentTab === tabId
                                    ? `2px solid ${colors.primary.default}`
                                    : '2px solid transparent',
                                background: 'none',
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                            }), children: tab.label }, tabId));
                    }) }) }), hasContent && (_jsx("div", { style: styles({ marginTop: spacing.lg }), children: tabs.find((t) => getTabId(t) === currentTab)?.content }))] }));
}
//# sourceMappingURL=Tabs.js.map