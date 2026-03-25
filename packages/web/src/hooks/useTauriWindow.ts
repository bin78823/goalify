import { useState, useCallback } from "react";

const isTauri = () => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};

export type Platform = "macos" | "windows" | "linux" | "unknown";

export function useTauriWindow() {
  const [isTauriEnv, setIsTauriEnv] = useState(isTauri());
  const [isMaximized, setIsMaximized] = useState(false);

  const minimize = useCallback(async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    }
  }, [isTauriEnv]);

  const maximize = useCallback(async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      const isMax = await win.isMaximized();
      setIsMaximized(isMax);
      if (isMax) {
        await win.unmaximize();
      } else {
        await win.maximize();
      }
    }
  }, [isTauriEnv]);

  const close = useCallback(async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    }
  }, [isTauriEnv]);

  const startDragging = useCallback(async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    }
  }, [isTauriEnv]);

  const toggleMaximize = useCallback(async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      const isMax = await win.isMaximized();
      setIsMaximized(isMax);
      if (isMax) {
        await win.unmaximize();
      } else {
        await win.maximize();
      }
      return !isMax;
    }
    return false;
  }, [isTauriEnv]);

  const checkMaximized = useCallback(async () => {
    if (isTauriEnv) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      const isMax = await win.isMaximized();
      setIsMaximized(isMax);
      return isMax;
    }
    return false;
  }, [isTauriEnv]);

  return {
    isTauriEnv,
    isMaximized,
    minimize,
    maximize,
    close,
    startDragging,
    toggleMaximize,
    checkMaximized,
  };
}
