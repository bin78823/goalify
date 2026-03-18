import React from 'react';
import { X, Home, FolderKanban } from 'lucide-react';
import type { Tab } from '../../types/tab';

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onClick, onClose }) => {
  const Icon = tab.type === 'home' ? Home : FolderKanban;

  return (
    <div
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`
        group relative flex items-center gap-2 px-4 h-9
        min-w-[100px] max-w-[200px]
        rounded-t-lg cursor-pointer transition-all duration-200
        ${isActive
          ? 'bg-[var(--card)] text-[var(--foreground)] border-t border-l border-r border-[var(--border)] shadow-sm'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/50 hover:text-[var(--foreground)]'
        }
      `}
      style={{
        marginBottom: '-1px',
      }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate text-sm font-medium">{tab.title}</span>
      {tab.closable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`
            ml-auto p-0.5 rounded transition-all duration-200
            ${isActive
              ? 'opacity-60 hover:opacity-100 hover:bg-[var(--destructive)]/20 hover:text-[var(--destructive)]'
              : 'opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100 group-hover:hover:bg-[var(--destructive)]/20 group-hover:hover:text-[var(--destructive)]'
            }
          `}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default TabItem;
