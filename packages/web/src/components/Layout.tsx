import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@goalify/ui";
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

const Layout: React.FC = () => {
  const { t } = useTranslation();
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
              <SelectTrigger className="w-[88px] h-8 bg-transparent border-none text-[10px] font-bold hover:bg-[var(--secondary)] transition-colors uppercase">
                <Globe className="mr-1 h-3 w-3 text-[var(--vibrant-blue)]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="zh-CN">CN</SelectItem>
                <SelectItem value="zh-TW">TW</SelectItem>
                <SelectItem value="ja">JA</SelectItem>
                <SelectItem value="de">DE</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
              </SelectContent>
            </Select>
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
        <main className="flex-1 overflow-auto p-6 bg-[var(--background)]">
          <Outlet />
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
              <SelectTrigger className="w-28 h-8 bg-transparent border-none text-xs font-medium hover:bg-[var(--secondary)]">
                <Globe className="mr-1.5 h-3.5 w-3.5 text-[var(--vibrant-blue)]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="zh-TW">繁體中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <main className="p-6">
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
