import { invoke } from '@tauri-apps/api/core';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from './types';

export const projectApi = {
  create: (request: CreateProjectRequest): Promise<Project> => {
    return invoke<Project>('create_project', { request });
  },

  getAll: (): Promise<Project[]> => {
    return invoke<Project[]>('get_all_projects');
  },

  get: (id: string): Promise<Project | null> => {
    return invoke<Project | null>('get_project', { id });
  },

  update: (request: UpdateProjectRequest): Promise<Project | null> => {
    return invoke<Project | null>('update_project', { request });
  },

  delete: (id: string): Promise<boolean> => {
    return invoke<boolean>('delete_project', { id });
  },
};
