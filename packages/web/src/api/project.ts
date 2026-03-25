import { invoke } from "@tauri-apps/api/core";
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "./types";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export const projectApi = {
  create: (request: CreateProjectRequest): Promise<Project> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<Project>("create_project", { request });
  },

  getAll: (): Promise<Project[]> => {
    if (!isTauri) return Promise.resolve([]);
    return invoke<Project[]>("get_all_projects");
  },

  get: (id: string): Promise<Project | null> => {
    if (!isTauri) return Promise.resolve(null);
    return invoke<Project | null>("get_project", { id });
  },

  update: (request: UpdateProjectRequest): Promise<Project | null> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<Project | null>("update_project", { request });
  },

  delete: (id: string): Promise<boolean> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<boolean>("delete_project", { id });
  },
};
