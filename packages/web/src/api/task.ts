import { invoke } from "@tauri-apps/api/core";
import type { Task, CreateTaskRequest, UpdateTaskRequest } from "./types";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// 延迟同步，避免频繁操作导致多次同步
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const triggerSync = () => {
  // 使用动态导入避免循环依赖
  import("../stores/SyncStore").then(({ useSyncStore }) => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
      useSyncStore.getState().sync();
    }, 500); // 500ms 防抖
  });
};

export const taskApi = {
  create: async (request: CreateTaskRequest): Promise<Task> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<Task>("create_task", { request });
    triggerSync();
    return result;
  },

  getByProject: (projectId: string): Promise<Task[]> => {
    if (!isTauri) return Promise.resolve([]);
    return invoke<Task[]>("get_tasks_by_project", { projectId });
  },

  get: (id: string): Promise<Task | null> => {
    if (!isTauri) return Promise.resolve(null);
    return invoke<Task | null>("get_task", { id });
  },

  update: async (request: UpdateTaskRequest): Promise<Task | null> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<Task | null>("update_task", { request });
    triggerSync();
    return result;
  },

  delete: async (id: string): Promise<boolean> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<boolean>("delete_task", { id });
    triggerSync();
    return result;
  },
};
