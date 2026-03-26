import { invoke } from "@tauri-apps/api/core";
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
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

export const projectApi = {
  create: async (request: CreateProjectRequest): Promise<Project> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<Project>("create_project", { request });
    triggerSync();
    return result;
  },

  getAll: (): Promise<Project[]> => {
    if (!isTauri) return Promise.resolve([]);
    return invoke<Project[]>("get_all_projects");
  },

  get: (id: string): Promise<Project | null> => {
    if (!isTauri) return Promise.resolve(null);
    return invoke<Project | null>("get_project", { id });
  },

  update: async (request: UpdateProjectRequest): Promise<Project | null> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<Project | null>("update_project", { request });
    triggerSync();
    return result;
  },

  delete: async (id: string): Promise<boolean> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    const result = await invoke<boolean>("delete_project", { id });
    triggerSync();
    return result;
  },
};
