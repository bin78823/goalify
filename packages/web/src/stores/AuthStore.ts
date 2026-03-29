import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../api/auth";
import { syncApi } from "../api/sync";
import type { SupabaseUser } from "../api/types";

export type SyncStatus = "idle" | "syncing" | "completed" | "error";

interface AuthState {
  user: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  syncVersion: number;

  checkAuth: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  triggerSyncRefresh: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      syncStatus: "idle",
      syncVersion: 0,

      triggerSyncRefresh: () => {
        set((state) => ({ syncVersion: state.syncVersion + 1 }));
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const isAuth = await authApi.isAuthenticated();
          if (isAuth) {
            const user = await authApi.getCurrentUser();
            set({ user, isAuthenticated: !!user, isLoading: false, syncStatus: "syncing" });
            try {
              await syncApi.all();
              set({ syncStatus: "completed" });
              get().triggerSyncRefresh();
            } catch {
              set({ syncStatus: "error" });
            }
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      signUp: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.signUp({ email, password });
          if (result.success) {
            if (result.user) {
              set({ user: result.user, isAuthenticated: true, isLoading: false });
            } else {
              set({ isLoading: false });
            }
            return true;
          } else {
            set({ error: result.message, isLoading: false });
            return false;
          }
        } catch (e) {
          set({ error: String(e), isLoading: false });
          return false;
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.signIn({ email, password });
          if (result.success && result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              syncStatus: "syncing",
            });
            try {
              await syncApi.all();
              set({ syncStatus: "completed", isLoading: false });
              get().triggerSyncRefresh();
            } catch {
              set({ syncStatus: "error", isLoading: false });
            }
            return true;
          } else {
            set({ error: result.message, isLoading: false });
            return false;
          }
        } catch (e) {
          set({ error: String(e), isLoading: false });
          return false;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await authApi.signOut();
        } catch {
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            syncStatus: "idle",
            syncVersion: 0,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "goalify-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
