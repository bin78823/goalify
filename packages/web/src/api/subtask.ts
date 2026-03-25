import { invoke } from "@tauri-apps/api/core";
import type {
  Subtask,
  CreateSubtaskRequest,
  UpdateSubtaskRequest,
} from "./types";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export const subtaskApi = {
  create: (request: CreateSubtaskRequest): Promise<Subtask> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<Subtask>("create_subtask", { request });
  },

  getByParent: (parentId: string): Promise<Subtask[]> => {
    if (!isTauri) return Promise.resolve([]);
    return invoke<Subtask[]>("get_subtasks_by_parent", { parentId });
  },

  update: (request: UpdateSubtaskRequest): Promise<Subtask | null> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<Subtask | null>("update_subtask", { request });
  },

  delete: (id: string): Promise<boolean> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<boolean>("delete_subtask", { id });
  },
};
