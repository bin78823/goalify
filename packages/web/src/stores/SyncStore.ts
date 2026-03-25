import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncApi } from "../api/sync";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  lastError: string | null;
  pendingChanges: number;
  retryCount: number;

  // 动作
  sync: () => Promise<void>;
  startPeriodicSync: () => void;
  stopPeriodicSync: () => void;
  setStatus: (status: SyncStatus) => void;
  setPendingChanges: (count: number) => void;
  clearError: () => void;
}

// 定时器引用
let syncInterval: ReturnType<typeof setInterval> | null = null;

// 检测是否在 Tauri 环境
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// 检测网络状态
const isOnline = () => {
  return typeof navigator !== "undefined" && navigator.onLine;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      status: "idle",
      lastSyncedAt: null,
      lastError: null,
      pendingChanges: 0,
      retryCount: 0,

      sync: async () => {
        const currentStatus = get().status;
        if (currentStatus === "syncing") return;

        // 检查网络状态
        if (!isOnline()) {
          set({ status: "offline", lastError: "网络离线" });
          return;
        }

        // 检查是否在 Tauri 环境
        if (!isTauri) {
          set({ status: "offline" });
          return;
        }

        set({ status: "syncing", lastError: null });

        try {
          const result = await syncApi.all();

          if (result.success) {
            set({
              status: "idle",
              lastSyncedAt: Date.now(),
              lastError: null,
              retryCount: 0,
            });
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "同步失败";
          const newRetryCount = get().retryCount + 1;

          set({
            status: "error",
            lastError: errorMessage,
            retryCount: newRetryCount,
          });

          // 自动重试（最多 3 次，指数退避）
          if (newRetryCount < 3) {
            const delay = Math.pow(2, newRetryCount) * 1000; // 2s, 4s, 8s
            setTimeout(() => {
              get().sync();
            }, delay);
          }
        }
      },

      startPeriodicSync: () => {
        // 停止已有的定时器
        get().stopPeriodicSync();

        // 立即执行一次同步
        get().sync();

        // 每 5 分钟执行一次同步
        syncInterval = setInterval(() => {
          // 页面可见时才同步
          if (document.visibilityState === "visible") {
            get().sync();
          }
        }, 5 * 60 * 1000); // 5 分钟

        // 监听页面可见性变化
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // 监听网络状态变化
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
      },

      stopPeriodicSync: () => {
        if (syncInterval) {
          clearInterval(syncInterval);
          syncInterval = null;
        }

        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      },

      setStatus: (status: SyncStatus) => set({ status }),

      setPendingChanges: (count: number) => set({ pendingChanges: count }),

      clearError: () => set({ lastError: null, status: "idle" }),
    }),
    {
      name: "goalify-sync",
      partialize: (state) => ({
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    // 页面变为可见时，检查是否需要同步
    const { lastSyncedAt, sync } = useSyncStore.getState();
    const fiveMinutes = 5 * 60 * 1000;

    if (!lastSyncedAt || Date.now() - lastSyncedAt > fiveMinutes) {
      sync();
    }
  }
};

// 网络恢复处理
const handleOnline = () => {
  useSyncStore.getState().setStatus("idle");
  useSyncStore.getState().sync();
};

// 网络断开处理
const handleOffline = () => {
  useSyncStore.getState().setStatus("offline");
};
