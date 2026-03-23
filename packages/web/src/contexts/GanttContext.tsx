import React from "react";
import { create } from "zustand";
import { useTabStore } from "../stores/TabStore";
import { projectApi, taskApi } from "../api";
import type { Project as ApiProject, Task as ApiTask } from "../api/types";

export interface Task {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  dependencies: string[];
  isMilestone: boolean;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  icon?: string;
  tasks: Task[];
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function parseDependencies(depStr: string): string[] {
  try {
    return JSON.parse(depStr);
  } catch {
    return [];
  }
}

function formatDependencies(deps: string[]): string {
  return JSON.stringify(deps);
}

function apiProjectToProject(
  apiProject: ApiProject,
  tasks: Task[] = [],
): Project {
  return {
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description,
    startDate: parseDate(apiProject.start_date),
    endDate: parseDate(apiProject.end_date),
    icon: apiProject.icon ?? undefined,
    tasks,
  };
}

function apiTaskToTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    name: apiTask.name,
    description: apiTask.description,
    startDate: parseDate(apiTask.start_date),
    endDate: parseDate(apiTask.end_date),
    dependencies: parseDependencies(apiTask.dependencies),
    isMilestone: apiTask.is_milestone,
    color: apiTask.color ?? undefined,
  };
}

interface GanttState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  addProject: (project: Omit<Project, "id" | "tasks">) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => void;
  addTask: (projectId: string, task: Omit<Task, "id">) => Promise<string>;
  updateTask: (
    projectId: string,
    taskId: string,
    updates: Partial<Task>,
  ) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  reorderTasks: (projectId: string, activeId: string, overId: string) => void;
}

export const useGanttStore = create<GanttState>()((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const apiProjects = await projectApi.getAll();
      const projectsWithTasks = await Promise.all(
        apiProjects.map(async (apiProject) => {
          const apiTasks = await taskApi.getByProject(apiProject.id);
          const tasks = apiTasks.map(apiTaskToTask);
          return apiProjectToProject(apiProject, tasks);
        }),
      );
      set({ projects: projectsWithTasks, isLoading: false });
    } catch (error) {
      console.error("Failed to load projects:", error);
      set({ isLoading: false });
    }
  },

  addProject: async (project) => {
    const apiProject = await projectApi.create({
      name: project.name,
      description: project.description,
      start_date: formatDate(project.startDate),
      end_date: formatDate(project.endDate),
      icon: project.icon,
    });
    const newProject = apiProjectToProject(apiProject, []);
    set((state) => ({
      projects: [newProject, ...state.projects],
    }));
    return apiProject.id;
  },

  updateProject: async (id, updates) => {
    const apiUpdates: {
      name?: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      icon?: string | null;
    } = {};
    if (updates.name !== undefined) apiUpdates.name = updates.name;
    if (updates.description !== undefined)
      apiUpdates.description = updates.description;
    if (updates.startDate !== undefined)
      apiUpdates.start_date = formatDate(updates.startDate);
    if (updates.endDate !== undefined)
      apiUpdates.end_date = formatDate(updates.endDate);
    if (updates.icon !== undefined) apiUpdates.icon = updates.icon;

    await projectApi.update({ id, ...apiUpdates });

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    }));
  },

  deleteProject: async (id) => {
    await projectApi.delete(id);
    useTabStore.getState().syncWithProjects(
      get()
        .projects.filter((p) => p.id !== id)
        .map((p) => p.id),
    );
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId:
        state.currentProjectId === id ? null : state.currentProjectId,
    }));
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  addTask: async (projectId, task) => {
    const apiTask = await taskApi.create({
      project_id: projectId,
      name: task.name,
      description: task.description ?? "",
      start_date: formatDate(task.startDate),
      end_date: formatDate(task.endDate),
      dependencies: formatDependencies(task.dependencies),
      is_milestone: task.isMilestone,
      color: task.color,
    });
    const newTask = apiTaskToTask(apiTask);
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p,
      ),
    }));
    return apiTask.id;
  },

  updateTask: async (projectId, taskId, updates) => {
    const apiUpdates: {
      name?: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      dependencies?: string;
      is_milestone?: boolean;
      color?: string;
    } = {};
    if (updates.name !== undefined) apiUpdates.name = updates.name;
    if (updates.description !== undefined)
      apiUpdates.description = updates.description;
    if (updates.startDate !== undefined)
      apiUpdates.start_date = formatDate(updates.startDate);
    if (updates.endDate !== undefined)
      apiUpdates.end_date = formatDate(updates.endDate);
    if (updates.dependencies !== undefined)
      apiUpdates.dependencies = formatDependencies(updates.dependencies);
    if (updates.isMilestone !== undefined)
      apiUpdates.is_milestone = updates.isMilestone;
    if (updates.color !== undefined) apiUpdates.color = updates.color;

    await taskApi.update({ id: taskId, ...apiUpdates });

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, ...updates } : t,
              ),
            }
          : p,
      ),
    }));
  },

  deleteTask: async (projectId, taskId) => {
    await taskApi.delete(taskId);
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p,
      ),
    }));
  },

  reorderTasks: (projectId, activeId, overId) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const oldIndex = p.tasks.findIndex((t) => t.id === activeId);
        const newIndex = p.tasks.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1) return p;
        const newTasks = [...p.tasks];
        const [removed] = newTasks.splice(oldIndex, 1);
        newTasks.splice(newIndex, 0, removed);
        return { ...p, tasks: newTasks };
      }),
    })),
}));

export const GanttProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};
