import React from "react";
import { useTranslation } from "react-i18next";
import { Crown, X, Zap } from "lucide-react";
import { useMembershipStore } from "../stores/MembershipStore";

interface MembershipBannerProps {
  onUpgradeClick: () => void;
}

export const MembershipBanner: React.FC<MembershipBannerProps> = ({ onUpgradeClick }) => {
  const { t } = useTranslation();
  const { isMember } = useMembershipStore();

  if (isMember) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--vibrant-blue)]/20 bg-gradient-to-r from-[var(--vibrant-blue)]/[0.06] via-[var(--vibrant-violet)]/[0.08] to-[var(--vibrant-blue)]/[0.06] p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--vibrant-blue)]/10 rounded-full blur-[60px]" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[var(--vibrant-violet)]/10 rounded-full blur-[50px]" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] rounded-xl blur-md opacity-40" />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] shadow-lg shadow-blue-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)] text-sm">
              {t("membership.limitReached", "免费项目额度已用完")}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {t("membership.limitMessage", "升级到 Pro 解锁无限项目")}
            </p>
          </div>
        </div>
        <button
          onClick={onUpgradeClick}
          className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.97] cursor-pointer"
        >
          <Crown className="h-4 w-4" />
          {t("membership.upgrade", "升级到 Pro")}
        </button>
      </div>
    </div>
  );
};
