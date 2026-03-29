import { create } from "zustand";
import { persist } from "zustand/middleware";
import { membershipApi } from "../api/membership";

interface MembershipState {
  isMember: boolean;
  membershipStartedAt: string | null;
  membershipExpiresAt: string | null;
  isLoading: boolean;
  error: string | null;

  checkMembership: () => Promise<void>;
  createCheckout: (successUrl: string) => Promise<string | null>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useMembershipStore = create<MembershipState>()(
  persist(
    (set) => ({
      isMember: false,
      membershipStartedAt: null,
      membershipExpiresAt: null,
      isLoading: false,
      error: null,

      checkMembership: async () => {
        set({ isLoading: true, error: null });
        try {
          const status = await membershipApi.getStatus();
          set({
            isMember: status.is_member,
            membershipStartedAt: status.membership_started_at || null,
            membershipExpiresAt: status.membership_expires_at || null,
            isLoading: false,
          });
        } catch (e) {
          set({ error: String(e), isLoading: false });
        }
      },

      createCheckout: async (successUrl: string) => {
        set({ isLoading: true, error: null });
        try {
          const checkoutUrl = await membershipApi.createCheckout(successUrl);
          // Don't set isLoading: false here — caller will handle navigation
          return checkoutUrl;
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          console.error("Checkout error:", errorMsg);
          set({ error: errorMsg, isLoading: false });
          return null;
        }
      },

      refresh: async () => {
        set({ isLoading: true, error: null });
        try {
          const status = await membershipApi.refresh();
          set({
            isMember: status.is_member,
            membershipStartedAt: status.membership_started_at || null,
            membershipExpiresAt: status.membership_expires_at || null,
            isLoading: false,
          });
        } catch (e) {
          set({ error: String(e), isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "goalify-membership",
      partialize: (state) => ({
        isMember: state.isMember,
        membershipStartedAt: state.membershipStartedAt,
        membershipExpiresAt: state.membershipExpiresAt,
      }),
    }
  )
);
