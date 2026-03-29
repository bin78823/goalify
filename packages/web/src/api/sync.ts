import { invoke } from "@tauri-apps/api/core";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export interface SyncResult {
  success: boolean;
  message: string;
  pushed_projects: number;
  pushed_tasks: number;
  pushed_subtasks: number;
  pulled_projects: number;
  pulled_tasks: number;
  pulled_subtasks: number;
  deleted_tasks: number;
  deleted_subtasks: number;
  deleted_projects: number;
}

export const syncApi = {
  push: (): Promise<SyncResult> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<SyncResult>("sync_push");
  },

  pull: (): Promise<SyncResult> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<SyncResult>("sync_pull");
  },

  all: (): Promise<SyncResult> => {
    if (!isTauri)
      return Promise.resolve({
        success: true,
        message: "Not in Tauri",
        pushed_projects: 0,
        pushed_tasks: 0,
        pushed_subtasks: 0,
        pulled_projects: 0,
        pulled_tasks: 0,
        pulled_subtasks: 0,
        deleted_tasks: 0,
        deleted_subtasks: 0,
        deleted_projects: 0,
      });
    return invoke<SyncResult>("sync_all");
  },
};
