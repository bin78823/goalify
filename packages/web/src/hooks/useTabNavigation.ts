import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTabStore } from '../stores/TabStore';
import { useGanttStore } from '../contexts/GanttContext';
import type { Tab } from '../types/tab';

export function useTabNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tabs, activeTabId, openTab, closeTab, setActiveTab } = useTabStore();
  const { projects } = useGanttStore();

  // 从 URL 同步标签状态
  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/projects' || pathname === '/') {
      setActiveTab('home');
    } else {
      // 检查是否是项目页面
      const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
      if (projectMatch) {
        const projectId = projectMatch[1];
        const project = projects.find(p => p.id === projectId);

        if (project) {
          // 检查标签是否已存在
          const existingTab = tabs.find(t => t.projectId === projectId);
          if (existingTab) {
            setActiveTab(existingTab.id);
          } else {
            // 创建新标签
            openTab({
              type: 'project',
              title: project.name,
              path: pathname,
              projectId: projectId,
              closable: true,
            });
          }
        }
      }
    }
  }, [location.pathname, projects]);

  // 点击标签时导航
  const handleTabClick = useCallback((tab: Tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  }, [navigate, setActiveTab]);

  // 关闭标签并切换到上一个
  const handleTabClose = useCallback((tabId: string) => {
    const navigateToTabId = closeTab(tabId);
    if (navigateToTabId) {
      const targetTab = useTabStore.getState().tabs.find(t => t.id === navigateToTabId);
      if (targetTab) {
        navigate(targetTab.path);
      }
    }
  }, [closeTab, navigate]);

  // 打开项目标签
  const openProjectTab = useCallback((projectId: string, projectName: string) => {
    const tabId = openTab({
      type: 'project',
      title: projectName,
      path: `/projects/${projectId}`,
      projectId: projectId,
      closable: true,
    });
    navigate(`/projects/${projectId}`);
    return tabId;
  }, [openTab, navigate]);

  return {
    tabs,
    activeTabId,
    handleTabClick,
    handleTabClose,
    openProjectTab,
  };
}
