import { invoke } from "@tauri-apps/api/core";
import type { AuthResult } from "./types";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export const authApi = {
  signUp: (request: SignUpRequest): Promise<AuthResult> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<AuthResult>("sign_up", { request });
  },

  signIn: (request: SignInRequest): Promise<AuthResult> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<AuthResult>("sign_in", { request });
  },

  signOut: (): Promise<AuthResult> => {
    if (!isTauri)
      return Promise.resolve({
        success: true,
        user: null,
        message: "Not in Tauri",
      });
    return invoke<AuthResult>("sign_out");
  },

  getCurrentUser: (): Promise<import("./types").SupabaseUser | null> => {
    if (!isTauri) return Promise.resolve(null);
    return invoke<import("./types").SupabaseUser | null>("get_current_user");
  },

  isAuthenticated: (): Promise<boolean> => {
    if (!isTauri) return Promise.resolve(false);
    return invoke<boolean>("is_authenticated");
  },
};
