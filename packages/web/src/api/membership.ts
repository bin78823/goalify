import { invoke } from "@tauri-apps/api/core";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export interface MembershipStatus {
  is_member: boolean;
  membership_started_at: string | null;
  membership_expires_at: string | null;
}

export const membershipApi = {
  getStatus: (): Promise<MembershipStatus> => {
    if (!isTauri) return Promise.resolve({ is_member: false, membership_started_at: null, membership_expires_at: null });
    return invoke<MembershipStatus>("get_membership_status");
  },

  createCheckout: (successUrl: string): Promise<string> => {
    if (!isTauri) return Promise.reject("Not running in Tauri environment");
    return invoke<string>("create_membership_checkout", { successUrl });
  },

  refresh: (): Promise<MembershipStatus> => {
    if (!isTauri) return Promise.resolve({ is_member: false, membership_started_at: null, membership_expires_at: null });
    return invoke<MembershipStatus>("refresh_membership_status");
  },
}
