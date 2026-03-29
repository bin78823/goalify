import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { useMembershipStore } from "../stores/MembershipStore";
import { DraggableArea } from "../components/DraggableArea";

const PaymentSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refresh, isMember, isLoading, error } = useMembershipStore();
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [countdown, setCountdown] = useState(2);

  const doRefresh = useCallback(async () => {
    setRefreshAttempted(false);
    await refresh();
    setRefreshAttempted(true);
  }, [refresh]);

  useEffect(() => {
    doRefresh();
  }, [doRefresh]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (isMember && !isLoading && refreshAttempted) {
      setCountdown(2);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/projects");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isMember, isLoading, refreshAttempted, navigate]);

  const handleRetry = async () => {
    await doRefresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <DraggableArea
        showTrafficLights
        className="absolute top-0 left-0 right-0 z-50"
      />

      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--vibrant-emerald)]/[0.04]" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[var(--vibrant-emerald)]/[0.04] rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-[var(--vibrant-blue)]/[0.04] rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute top-24 left-12 w-2 h-2 bg-[var(--vibrant-emerald)]/20 rounded-full animate-float" />
      <div
        className="absolute top-40 right-20 w-2.5 h-2.5 bg-[var(--vibrant-blue)]/20 rounded-full animate-float"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute top-64 left-1/4 w-1.5 h-1.5 bg-[var(--vibrant-violet)]/20 rounded-full animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-32 right-1/3 w-2 h-2 bg-[var(--vibrant-emerald)]/15 rounded-full animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative text-center space-y-6 max-w-sm mx-auto px-4">
        {isLoading || !refreshAttempted ? (
          /* Loading state */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Pulsing ring + spinner */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--vibrant-blue)]/20 animate-ping" />
              <div className="absolute inset-1 rounded-full border-2 border-[var(--vibrant-blue)]/10 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--vibrant-blue)]" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {t("membership.processing", "正在处理您的会员...")}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("membership.processingHint", "正在验证支付信息，请稍候")}
              </p>
            </div>
          </div>
        ) : isMember ? (
          /* Success state */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Animated success icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-[var(--vibrant-emerald)]/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-[var(--vibrant-emerald)]/15" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-[var(--vibrant-emerald)]" strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {t("membership.success", "会员升级成功！")}
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("membership.redirecting", "正在跳转到项目页面...")}
              </p>
            </div>
            {/* Countdown progress bar */}
            <div className="space-y-2">
              <div className="h-1 rounded-full bg-[var(--muted)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--vibrant-emerald)] to-[var(--vibrant-blue)] transition-all duration-1000 ease-linear"
                  style={{ width: `${((2 - countdown) / 2) * 100}%` }}
                />
              </div>
              <button
                onClick={() => navigate("/projects")}
                className="inline-flex items-center gap-1.5 mx-auto text-sm font-medium text-[var(--vibrant-blue)] hover:underline cursor-pointer"
              >
                {t("membership.goNow", "立即前往")}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Error state */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-[var(--destructive)]/10 border border-[var(--destructive)]/20">
              <RefreshCw className="w-8 h-8 text-[var(--destructive)]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {t("membership.verifyFailed", "验证支付状态")}
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {error || t("membership.processingHint", "支付可能仍在处理中，请稍后再试")}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 mx-auto px-6 py-2.5 bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] text-white font-medium rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.97] transition-all duration-200 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {t("common.retry", "重试")}
              </button>
              <button
                onClick={() => navigate("/projects")}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline transition-colors cursor-pointer"
              >
                {t("common.skip", "跳过")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
