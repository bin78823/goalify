import React from "react";
import { useTranslation } from "react-i18next";
import { Crown, Check, Loader2, LogIn, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@goalify/ui";
import { Button } from "@goalify/ui";
import { useMembershipStore } from "../stores/MembershipStore";
import { useAuthStore } from "../stores/AuthStore";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  "membership.features.unlimitedProjects",
  "membership.features.prioritySupport",
  "membership.features.earlyAccess",
] as const;

const featureIcons = [
  "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/infinity.svg",
  "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/headset.svg",
  "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/rocket.svg",
] as const;

export const UpgradeDialog: React.FC<UpgradeDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createCheckout, isLoading, error, clearError } = useMembershipStore();
  const { isAuthenticated } = useAuthStore();

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      onOpenChange(false);
      return;
    }

    clearError();
    const currentUrl = window.location.origin;
    const successUrl = `${currentUrl}/payment-success`;
    const checkoutUrl = await createCheckout(successUrl);

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-[var(--vibrant-blue)]/20">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-[var(--vibrant-blue)]/[0.08] via-[var(--vibrant-violet)]/[0.06] to-transparent px-6 pt-6 pb-2">
          {/* Decorative glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--vibrant-violet)]/15 rounded-full blur-[50px]" />

          <DialogHeader className="relative">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] rounded-3xl blur-2xl opacity-40" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] shadow-lg shadow-blue-500/25">
                <Crown className="h-7 w-7 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold text-[var(--foreground)]">
              {t("membership.title", "升级到 Goalify Pro")}
            </DialogTitle>
            <DialogDescription className="text-center text-[var(--muted-foreground)] mt-1.5">
              {t("membership.description", "解锁无限项目，创建更多可能")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Feature list */}
          <div className="space-y-3">
            {features.map((key, index) => (
              <div
                key={key}
                className="flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${100 + index * 80}ms`, animationFillMode: "both" }}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--vibrant-blue)]/10 text-[var(--vibrant-blue)]">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {t(key)}
                </span>
              </div>
            ))}
          </div>

          {/* Price card */}
          <div className="relative rounded-2xl border border-[var(--vibrant-blue)]/10 bg-gradient-to-br from-[var(--vibrant-blue)]/[0.04] to-[var(--vibrant-violet)]/[0.04] p-5 text-center overflow-hidden">
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-[var(--vibrant-blue)]/8 rounded-full blur-[30px]" />
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[var(--vibrant-violet)]/8 rounded-full blur-[30px]" />
            <div className="relative">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-[var(--foreground)] tracking-tight">$12</span>
                <span className="text-sm font-medium text-[var(--muted-foreground)]">
                  /{t("membership.perYear", "年")}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {t("membership.perProject", "约 $1/月")}
              </p>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 p-3.5 text-sm text-[var(--destructive)]">
              {error}
            </div>
          )}

          {/* Login required hint */}
          {!isAuthenticated && (
            <div className="rounded-xl border border-[var(--vibrant-blue)]/20 bg-[var(--vibrant-blue)]/10 p-3.5 text-sm text-[var(--vibrant-blue)]">
              {t("membership.loginRequired", "请先登录后再升级")}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.loading", "加载中...")}
              </span>
            ) : !isAuthenticated ? (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                {t("auth.signIn", "登录")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t("membership.checkoutButton", "立即升级")}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
