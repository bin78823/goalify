import React from 'react';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import TabItem from './TabItem';

const TabBar: React.FC = () => {
  const { tabs, activeTabId, handleTabClick, handleTabClose } = useTabNavigation();

  return (
    <div className="border-b border-[var(--border)] bg-[var(--background)]">
      <div
        className="flex items-end px-4 overflow-x-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="flex gap-0.5">
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => handleTabClick(tab)}
              onClose={() => handleTabClose(tab.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabBar;
