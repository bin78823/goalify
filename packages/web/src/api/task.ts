import { invoke } from '@tauri-apps/api/core';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from './types';

export const taskApi = {
  create: (request: CreateTaskRequest): Promise<Task> => {
    return invoke<Task>('create_task', { request });
  },

  getByProject: (projectId: string): Promise<Task[]> => {
    return invoke<Task[]>('get_tasks_by_project', { projectId });
  },

  get: (id: string): Promise<Task | null> => {
    return invoke<Task | null>('get_task', { id });
  },

  update: (request: UpdateTaskRequest): Promise<Task | null> => {
    return invoke<Task | null>('update_task', { request });
  },

  delete: (id: string): Promise<boolean> => {
    return invoke<boolean>('delete_task', { id });
  },
};
