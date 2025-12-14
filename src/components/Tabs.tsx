'use client';

import React, { useState } from 'react';
import { useThemeTokens } from '../theme/index.js';
import { styles } from './utils';

// Extended props to support both APIs:
// - Original: { tabs: [{id, label, content}], activeTab, onChange }
// - Alternative: { tabs: [{value, label}], value, onValueChange }
interface TabItem {
  id?: string;
  value?: string;
  label: string;
  content?: React.ReactNode;
}

interface ExtendedTabsProps {
  tabs: TabItem[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  // Alternative controlled API
  value?: string;
  onValueChange?: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange, value, onValueChange }: ExtendedTabsProps) {
  const { colors, textStyles: ts, spacing } = useThemeTokens();
  
  // Support both id and value properties on tab items
  const getTabId = (tab: TabItem) => tab.id ?? tab.value ?? '';
  
  // Support both prop naming conventions
  const controlledValue = value ?? activeTab;
  const onChangeHandler = onValueChange ?? onChange;
  
  const [localActive, setLocalActive] = useState(controlledValue || getTabId(tabs[0]));
  const currentTab = controlledValue ?? localActive;

  const handleChange = (tabId: string) => {
    setLocalActive(tabId);
    onChangeHandler?.(tabId);
  };

  // Check if any tab has content (determines if we render content section)
  const hasContent = tabs.some(tab => tab.content !== undefined);

  return (
    <div>
      <div style={styles({ borderBottom: `1px solid ${colors.border.subtle}` })}>
        <nav style={styles({ display: 'flex', gap: spacing.lg })}>
          {tabs.map((tab) => {
            const tabId = getTabId(tab);
            return (
              <button
                key={tabId}
                onClick={() => handleChange(tabId)}
                style={styles({
                  padding: `${spacing.md} ${spacing.xs}`,
                  fontSize: ts.body.fontSize,
                  fontWeight: ts.label.fontWeight,
                  color: currentTab === tabId ? colors.primary.default : colors.text.muted,
                  borderBottom: currentTab === tabId
                    ? `2px solid ${colors.primary.default}`
                    : '2px solid transparent',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                })}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      {hasContent && (
        <div style={styles({ marginTop: spacing.lg })}>
          {tabs.find((t) => getTabId(t) === currentTab)?.content}
        </div>
      )}
    </div>
  );
}

