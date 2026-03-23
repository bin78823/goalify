import { create } from "zustand";
import { subtaskApi } from "../api";
import type { Subtask, SubtaskStatus } from "../api/types";

export type SubtaskCounts = Record<SubtaskStatus, number>;

interface SubtaskState {
  subtasks: Subtask[];
  isLoading: boolean;
  countsByParent: Record<string, SubtaskCounts>;

  loadByParentId: (parentId: string) => Promise<void>;
  loadCountsByParent: (parentIds: string[]) => Promise<void>;
  getCountsForParent: (parentId: string) => SubtaskCounts;
  create: (
    parentId: string,
    name: string,
    status?: SubtaskStatus,
  ) => Promise<string>;
  update: (subtaskId: string, updates: Partial<Subtask>) => Promise<void>;
  remove: (subtaskId: string) => Promise<void>;
  move: (
    subtaskId: string,
    newStatus: SubtaskStatus,
    newIndex: number,
  ) => Promise<void>;
  reorder: (subtaskId: string, newIndex: number) => Promise<void>;
  clear: () => void;
}

const defaultCounts = (): SubtaskCounts => ({
  todo: 0,
  in_progress: 0,
  done: 0,
});

export const useSubtaskStore = create<SubtaskState>()((set, get) => ({
  subtasks: [],
  isLoading: false,
  countsByParent: {},

  loadByParentId: async (parentId) => {
    set({ isLoading: true });
    try {
      const subtasks = await subtaskApi.getByParent(parentId);
      const counts: SubtaskCounts = { ...defaultCounts() };
      subtasks.forEach((s) => {
        counts[s.status]++;
      });
      set((state) => ({
        subtasks,
        isLoading: false,
        countsByParent: {
          ...state.countsByParent,
          [parentId]: counts,
        },
      }));
    } catch (error) {
      console.error("Failed to load subtasks:", error);
      set({ isLoading: false });
    }
  },

  loadCountsByParent: async (parentIds) => {
    try {
      const countsMap: Record<string, SubtaskCounts> = {};
      await Promise.all(
        parentIds.map(async (parentId) => {
          const subtasks = await subtaskApi.getByParent(parentId);
          const counts: SubtaskCounts = { ...defaultCounts() };
          subtasks.forEach((s) => {
            counts[s.status]++;
          });
          countsMap[parentId] = counts;
        }),
      );
      set((state) => ({
        countsByParent: { ...state.countsByParent, ...countsMap },
      }));
    } catch (error) {
      console.error("Failed to load subtask counts:", error);
    }
  },

  getCountsForParent: (parentId) => {
    return get().countsByParent[parentId] || defaultCounts();
  },

  create: async (parentId, name, status = "todo") => {
    const newSubtask = await subtaskApi.create({
      parent_id: parentId,
      name,
      status,
    });
    set((state) => {
      const currentCounts = state.countsByParent[parentId] || defaultCounts();
      return {
        subtasks: [...state.subtasks, newSubtask],
        countsByParent: {
          ...state.countsByParent,
          [parentId]: {
            ...currentCounts,
            [status]: currentCounts[status] + 1,
          },
        },
      };
    });
    return newSubtask.id;
  },

  update: async (subtaskId, updates) => {
    const oldSubtask = get().subtasks.find((s) => s.id === subtaskId);
    await subtaskApi.update({ id: subtaskId, ...updates });
    set((state) => ({
      subtasks: state.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, ...updates } : s,
      ),
      countsByParent:
        updates.status && oldSubtask
          ? {
              ...state.countsByParent,
              [oldSubtask.parent_id]: {
                ...(state.countsByParent[oldSubtask.parent_id] ||
                  defaultCounts()),
                [oldSubtask.status]: Math.max(
                  (state.countsByParent[oldSubtask.parent_id]?.[
                    oldSubtask.status
                  ] || 1) - 1,
                  0,
                ),
                [updates.status]:
                  (state.countsByParent[oldSubtask.parent_id]?.[
                    updates.status
                  ] || 0) + 1,
              },
            }
          : state.countsByParent,
    }));
  },

  remove: async (subtaskId) => {
    const subtask = get().subtasks.find((s) => s.id === subtaskId);
    await subtaskApi.delete(subtaskId);
    set((state) => {
      if (!subtask)
        return { subtasks: state.subtasks.filter((s) => s.id !== subtaskId) };
      const currentCounts =
        state.countsByParent[subtask.parent_id] || defaultCounts();
      return {
        subtasks: state.subtasks.filter((s) => s.id !== subtaskId),
        countsByParent: {
          ...state.countsByParent,
          [subtask.parent_id]: {
            ...currentCounts,
            [subtask.status]: Math.max(currentCounts[subtask.status] - 1, 0),
          },
        },
      };
    });
  },

  move: async (subtaskId, newStatus, newIndex) => {
    const subtasks = get().subtasks;
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    const tasksInNewStatus = subtasks
      .filter((s) => s.status === newStatus && s.id !== subtaskId)
      .sort((a, b) => a.order_index - b.order_index);

    tasksInNewStatus.splice(newIndex, 0, {
      ...subtask,
      status: newStatus,
    } as Subtask);

    const orderMap = tasksInNewStatus.reduce(
      (acc, s, i) => {
        acc[s.id] = i;
        return acc;
      },
      {} as Record<string, number>,
    );

    // 更新数据库
    await subtaskApi.update({
      id: subtaskId,
      status: newStatus,
      order_index: newIndex,
    });

    // 批量更新其他任务的 order_index
    await Promise.all(
      Object.entries(orderMap)
        .filter(([id]) => id !== subtaskId)
        .map(([id, idx]) => subtaskApi.update({ id, order_index: idx })),
    );

    // 更新本地状态
    set((state) => {
      const oldStatus = subtask.status;
      const currentCounts =
        state.countsByParent[subtask.parent_id] || defaultCounts();
      return {
        subtasks: state.subtasks.map((s) => ({
          ...s,
          status: s.id === subtaskId ? newStatus : s.status,
          order_index: orderMap[s.id] ?? s.order_index,
        })),
        countsByParent:
          oldStatus !== newStatus
            ? {
                ...state.countsByParent,
                [subtask.parent_id]: {
                  ...currentCounts,
                  [oldStatus]: Math.max(currentCounts[oldStatus] - 1, 0),
                  [newStatus]: currentCounts[newStatus] + 1,
                },
              }
            : state.countsByParent,
      };
    });
  },

  reorder: async (subtaskId, newIndex) => {
    const subtasks = get().subtasks;
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    const tasksInStatus = subtasks
      .filter((s) => s.status === subtask.status)
      .sort((a, b) => a.order_index - b.order_index);

    const oldIndex = tasksInStatus.findIndex((s) => s.id === subtaskId);
    tasksInStatus.splice(oldIndex, 1);
    tasksInStatus.splice(newIndex, 0, subtask);

    const orderMap = tasksInStatus.reduce(
      (acc, s, i) => {
        acc[s.id] = i;
        return acc;
      },
      {} as Record<string, number>,
    );

    await Promise.all(
      Object.entries(orderMap).map(([id, idx]) =>
        subtaskApi.update({ id, order_index: idx }),
      ),
    );

    set((state) => ({
      subtasks: state.subtasks.map((s) => ({
        ...s,
        order_index: orderMap[s.id] ?? s.order_index,
      })),
    }));
  },

  clear: () => {
    set({ subtasks: [], isLoading: false });
  },
}));
