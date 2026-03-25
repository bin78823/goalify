import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../api/auth";
import type { SupabaseUser } from "../api/types";

interface AuthState {
  user: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const isAuth = await authApi.isAuthenticated();
          if (isAuth) {
            const user = await authApi.getCurrentUser();
            set({ user, isAuthenticated: !!user, isLoading: false });
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
          if (result.success && result.user) {
            set({ user: result.user, isAuthenticated: true, isLoading: false });
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
              isLoading: false,
            });
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
