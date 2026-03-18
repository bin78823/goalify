import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tab } from '../types/tab';

// 首页标签常量
const HOME_TAB: Tab = {
  id: 'home',
  type: 'home',
  title: 'Projects',
  path: '/projects',
  closable: false,
  createdAt: 0,
};

interface TabState {
  tabs: Tab[];
  activeTabId: string;
  openTab: (tab: Omit<Tab, 'id' | 'createdAt'>) => string;
  closeTab: (tabId: string) => string | null; // 返回需要切换到的标签ID
  setActiveTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  getTabByProjectId: (projectId: string) => Tab | undefined;
  syncWithProjects: (projectIds: string[]) => void;
  getActiveTab: () => Tab | undefined;
}

const generateId = () => `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [HOME_TAB],
      activeTabId: 'home',

      openTab: (tabData) => {
        const { tabs } = get();

        // 如果是首页，直接返回
        if (tabData.type === 'home') {
          set({ activeTabId: 'home' });
          return 'home';
        }

        // 检查是否已存在
        if (tabData.projectId) {
          const existingTab = tabs.find(t => t.projectId === tabData.projectId);
          if (existingTab) {
            set({ activeTabId: existingTab.id });
            return existingTab.id;
          }
        }

        // 创建新标签
        const newTab: Tab = {
          ...tabData,
          id: generateId(),
          createdAt: Date.now(),
        };

        set({
          tabs: [...tabs, newTab],
          activeTabId: newTab.id,
        });

        return newTab.id;
      },

      closeTab: (tabId) => {
        const { tabs, activeTabId } = get();
        const tabToClose = tabs.find(t => t.id === tabId);

        if (!tabToClose || !tabToClose.closable) return null;

        const newTabs = tabs.filter(t => t.id !== tabId);
        const closedIndex = tabs.findIndex(t => t.id === tabId);

        let newActiveId = activeTabId;
        let navigateToTabId: string | null = null;

        if (activeTabId === tabId) {
          // 切换到上一个标签，如果没有则切换到下一个
          const newActiveTab = newTabs[closedIndex - 1] || newTabs[closedIndex];
          newActiveId = newActiveTab?.id || 'home';
          navigateToTabId = newActiveId;
        }

        set({ tabs: newTabs, activeTabId: newActiveId });
        return navigateToTabId;
      },

      setActiveTab: (tabId) => {
        const { tabs } = get();
        if (tabs.find(t => t.id === tabId)) {
          set({ activeTabId: tabId });
        }
      },

      updateTabTitle: (tabId, title) => {
        set((state) => ({
          tabs: state.tabs.map(t =>
            t.id === tabId ? { ...t, title } : t
          ),
        }));
      },

      getTabByProjectId: (projectId) => {
        return get().tabs.find(t => t.projectId === projectId);
      },

      syncWithProjects: (projectIds) => {
        // 关闭已删除项目的标签
        const { tabs, activeTabId } = get();
        const newTabs = tabs.filter(t =>
          t.type === 'home' || (t.projectId && projectIds.includes(t.projectId))
        );

        // 如果当前激活的标签对应的项目被删除，切换到首页
        let newActiveId = activeTabId;
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab && activeTab.type === 'project' && activeTab.projectId && !projectIds.includes(activeTab.projectId)) {
          newActiveId = 'home';
        }

        set({ tabs: newTabs, activeTabId: newActiveId });
      },

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return tabs.find(t => t.id === activeTabId);
      },
    }),
    {
      name: 'goalify-tabs',
      partialize: (state) => ({
        // 不持久化标签，确保每次启动只有首页
      }),
    }
  )
);
