import { invoke } from "@tauri-apps/api/core";
import type {
  Subtask,
  CreateSubtaskRequest,
  UpdateSubtaskRequest,
} from "./types";

export const subtaskApi = {
  create: (request: CreateSubtaskRequest): Promise<Subtask> => {
    return invoke<Subtask>("create_subtask", { request });
  },

  getByParent: (parentId: string): Promise<Subtask[]> => {
    return invoke<Subtask[]>("get_subtasks_by_parent", { parentId });
  },

  update: (request: UpdateSubtaskRequest): Promise<Subtask | null> => {
    return invoke<Subtask | null>("update_subtask", { request });
  },

  delete: (id: string): Promise<boolean> => {
    return invoke<boolean>("delete_subtask", { id });
  },
};
