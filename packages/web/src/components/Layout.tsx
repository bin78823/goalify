import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutGrid,
  Globe,
  Sun,
  Moon,
  X,
  Minus,
  Square,
  FolderKanban,
  LogOut,
  User,
  Cloud,
  CloudOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@goalify/ui";
import { useAuthStore } from "../stores/AuthStore";
import { useSyncStore } from "../stores/SyncStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@goalify/ui";
import i18n from "../i18n";
import { useTabNavigation } from "../hooks/useTabNavigation";
import type { Tab } from "../types/tab";
import { getCurrentWindow } from "@tauri-apps/api/window";

// 检测是否在 Tauri 环境中
const isTauri = () => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};

// 检测平台
type Platform = "macos" | "windows" | "linux" | "unknown";

const usePlatform = () => {
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    if (isTauri()) {
      import("@tauri-apps/plugin-os")
        .then((module) => module.platform())
        .then((p) => setPlatform(p as Platform))
        .catch(() => {
          const ua = navigator.userAgent.toLowerCase();
          if (ua.includes("mac")) setPlatform("macos");
          else if (ua.includes("win")) setPlatform("windows");
          else if (ua.includes("linux")) setPlatform("linux");
        });
    } else {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) setPlatform("macos");
      else if (ua.includes("win")) setPlatform("windows");
      else if (ua.includes("linux")) setPlatform("linux");
    }
  }, []);

  return {
    platform,
    isMacOS: platform === "macos",
    isWindows: platform === "windows",
    isLinux: platform === "linux",
  };
};

// 同步状态指示器组件
const SyncStatusIndicator: React.FC = () => {
  const { status, lastSyncedAt, lastError, sync } = useSyncStore();
  const { isAuthenticated } = useAuthStore();

  // 未登录时不显示同步按钮
  if (!isAuthenticated) {
    return null;
  }

  const getStatusDisplay = () => {
    switch (status) {
      case "syncing":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--vibrant-blue)]" />,
          text: "同步中",
          className: "text-[var(--vibrant-blue)]",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
          text: "同步失败",
          className: "text-red-500",
        };
      case "offline":
        return {
          icon: <CloudOff className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />,
          text: "离线",
          className: "text-[var(--muted-foreground)]",
        };
      default:
        return {
          icon: <Cloud className="h-3.5 w-3.5 text-emerald-500" />,
          text: "已同步",
          className: "text-emerald-500",
        };
    }
  };

  const { icon, text, className } = getStatusDisplay();

  const formatLastSync = () => {
    if (!lastSyncedAt) return "从未同步";
    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => sync()}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[var(--secondary)] transition-colors ${className}`}
        >
          {icon}
          <span className="text-xs">{text}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p>最后同步: {formatLastSync()}</p>
          {lastError && <p className="text-red-500 mt-1">{lastError}</p>}
          <p className="text-[var(--muted-foreground)] mt-1">点击立即同步</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// 登录/登出按钮组件
const AuthButton: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuthStore();
  const { stopPeriodicSync } = useSyncStore();

  const handleSignOut = async () => {
    await signOut();
    stopPeriodicSync();
    navigate("/login");
  };

  if (isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        className="rounded-lg w-7 h-7 hover:bg-[var(--secondary)] transition-colors"
        title={t("auth.signOut")}
      >
        <LogOut className="h-3.5 w-3.5 text-slate-600" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/login")}
      className="rounded-lg h-7 px-2 hover:bg-[var(--secondary)] transition-colors text-xs"
    >
      <User className="h-3.5 w-3.5 mr-1" />
      {t("auth.signIn")}
    </Button>
  );
};

const Layout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { startPeriodicSync, stopPeriodicSync } = useSyncStore();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  const [isTauriEnv, setIsTauriEnv] = useState(false);
  const { isMacOS, isWindows } = usePlatform();
  const { tabs, activeTabId, handleTabClick, handleTabClose } =
    useTabNavigation();

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 登录后启动定时同步
  useEffect(() => {
    if (isAuthenticated) {
      startPeriodicSync();
    } else {
      stopPeriodicSync();
    }

    return () => {
      stopPeriodicSync();
    };
  }, [isAuthenticated, startPeriodicSync, stopPeriodicSync]);

  useEffect(() => {
    setIsTauriEnv(isTauri());
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // 窗口控制函数
  const handleMinimize = async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    }
  };

  const handleMaximize = async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      const isMax = await win.isMaximized();
      if (isMax) await win.unmaximize();
      else await win.maximize();
    }
  };

  const handleClose = async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    }
  };

  // Tauri 桌面端布局
  if (isTauriEnv) {
    return (
      <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        {/* 自定义标题栏 */}
        <header
          className="flex items-center h-11 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] shrink-0 z-50 select-none"
          onMouseDown={async (e) => {
            // 只响应左键
            if (e.button !== 0) return;

            // 如果点击的是按钮或输入框，不要触发拖动
            if (
              (e.target as HTMLElement).closest("button, input, [data-no-drag]")
            ) {
              return;
            }

            const appWindow = getCurrentWindow();
            await appWindow.startDragging();
          }}
          onDoubleClick={async () => {
            const appWindow = getCurrentWindow();
            const isMaximized = await appWindow.isMaximized();
            if (isMaximized) {
              await appWindow.unmaximize();
            } else {
              await appWindow.maximize();
            }
          }}
        >
          {/* macOS: 左侧留出 traffic lights 空间 */}
          {isMacOS && (
            <div
              className="flex items-center justify-center w-[80px] h-full"
              data-tauri-drag-region
            />
          )}

          {/* 标签页 */}
          <div className="flex items-center h-full overflow-x-auto scrollbar-none flex-1">
            <div className="flex items-center h-full px-2 gap-1">
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

          {/* 右侧拖拽区域 */}
          <div className="w-10 h-full" data-tauri-drag-region />

          {/* 工具栏按钮 */}
          <div className="flex items-center gap-1 px-3 h-full border-l border-[var(--border)]/30">
            <SyncStatusIndicator />

            {isAuthenticated && <div className="w-px h-4 bg-[var(--border)] mx-1" />}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg w-7 h-7 hover:bg-[var(--secondary)] transition-colors"
            >
              {theme === "light" ? (
                <Moon className="h-3.5 w-3.5 text-slate-600" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              )}
            </Button>

            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[100px] h-8 bg-transparent border-none text-[11px] font-medium hover:bg-[var(--secondary)] transition-colors">
                <Globe className="mr-1 h-3 w-3 text-[var(--vibrant-blue)]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="zh-TW">繁体中文</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>

            <AuthButton />
          </div>

          {/* Windows: 右侧窗口控制按钮 */}
          {isWindows && (
            <div className="flex items-center h-full">
              <button
                onClick={handleMinimize}
                className="h-full px-3 hover:bg-[var(--muted)] transition-colors flex items-center justify-center group"
                title="最小化"
              >
                <Minus className="w-3.5 h-3.5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
              </button>
              <button
                onClick={handleMaximize}
                className="h-full px-3 hover:bg-[var(--muted)] transition-colors flex items-center justify-center group"
                title="最大化"
              >
                <Square className="w-3 h-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
              </button>
              <button
                onClick={handleClose}
                className="h-full px-3 hover:bg-red-500 transition-colors flex items-center justify-center group"
                title="关闭"
              >
                <X className="w-3.5 h-3.5 text-[var(--muted-foreground)] group-hover:text-white" />
              </button>
            </div>
          )}
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto bg-[var(--background)]">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  // Web 端布局
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex h-12 items-center justify-between px-6">
          <div className="flex items-center h-full gap-2">
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
          <div className="flex items-center gap-3">
            <SyncStatusIndicator />

            {isAuthenticated && <div className="w-px h-4 bg-[var(--border)]" />}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg w-8 h-8 hover:bg-[var(--secondary)] transition-all duration-300"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4 text-slate-600" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
            </Button>

            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[100px] h-8 bg-transparent border-none text-xs font-medium hover:bg-[var(--secondary)]">
                <Globe className="mr-1.5 h-3.5 w-3.5 text-[var(--vibrant-blue)]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="zh-TW">繁体中文</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>

            <AuthButton />
          </div>
        </div>
      </header>
      <main className="p-6 bg-[var(--background)]">
        <Outlet />
      </main>
    </div>
  );
};

// 标签项组件
interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const TabItem: React.FC<TabItemProps> = ({
  tab,
  isActive,
  onClick,
  onClose,
}) => {
  const isHome = tab.id === "home";
  const Icon = isHome ? LayoutGrid : FolderKanban;

  return (
    <div
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`
        group relative flex items-center gap-2 px-3 h-7
        min-w-[36px] max-w-[180px]
        rounded-lg cursor-pointer transition-all duration-200
        ${
          isActive
            ? "bg-[var(--secondary)] text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/50 hover:text-[var(--foreground)]"
        }
      `}
    >
      <Icon
        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? "scale-110 text-[var(--vibrant-blue)]" : "opacity-60 group-hover:opacity-100"}`}
      />

      {!isHome && (
        <span className="truncate text-[11px] font-bold tracking-tight leading-none uppercase">
          {tab.title}
        </span>
      )}

      {tab.closable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`
            ml-1 p-0.5 rounded-sm transition-all duration-200
            ${
              isActive
                ? "opacity-40 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                : "opacity-0 group-hover:opacity-40 group-hover:hover:opacity-100 group-hover:hover:bg-red-500/10 group-hover:hover:text-red-500"
            }
          `}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

export default Layout;
