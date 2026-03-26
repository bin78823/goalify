import { invoke } from "@tauri-apps/api/core";
import type {
  Subtask,
  CreateSubtaskRequest,
  UpdateSubtaskRequest,
} from "./types";

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

export const subtaskApi = {
  create: async (request: CreateSubtaskRequest): Promise<Subtask> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<Subtask>("create_subtask", { request });
    triggerSync();
    return result;
  },

  getByParent: (parentId: string): Promise<Subtask[]> => {
    if (!isTauri) return Promise.resolve([]);
    return invoke<Subtask[]>("get_subtasks_by_parent", { parentId });
  },

  update: async (request: UpdateSubtaskRequest): Promise<Subtask | null> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<Subtask | null>("update_subtask", { request });
    triggerSync();
    return result;
  },

  delete: async (id: string): Promise<boolean> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<boolean>("delete_subtask", { id });
    triggerSync();
    return result;
  },
};
