import { invoke } from "@tauri-apps/api/core";
import type { Task, CreateTaskRequest, UpdateTaskRequest } from "./types";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export const taskApi = {
  create: (request: CreateTaskRequest): Promise<Task> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<Task>("create_task", { request });
  },

  getByProject: (projectId: string): Promise<Task[]> => {
    if (!isTauri) return Promise.resolve([]);
    return invoke<Task[]>("get_tasks_by_project", { projectId });
  },

  get: (id: string): Promise<Task | null> => {
    if (!isTauri) return Promise.resolve(null);
    return invoke<Task | null>("get_task", { id });
  },

  update: (request: UpdateTaskRequest): Promise<Task | null> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<Task | null>("update_task", { request });
  },

  delete: (id: string): Promise<boolean> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<boolean>("delete_task", { id });
  },
};
