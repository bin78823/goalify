import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@goalify/ui";
import { Input } from "@goalify/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@goalify/ui";
import { useAuthStore } from "../stores/AuthStore";
import {
  ArrowLeft,
  Mail,
  Lock,
  UserPlus,
  Loader2,
  CheckCircle,
  Sparkles,
  CircleAlert,
} from "lucide-react";
import { DraggableArea } from "../components/DraggableArea";

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem("theme") as "light" | "dark" | null;
      const root = window.document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.removeAttribute("data-theme");
      }
    };

    applyTheme();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme") {
        applyTheme();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          applyTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      observer.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage("");

    if (password !== confirmPassword) {
      return;
    }

    const success = await signUp(email, password);
    if (success) {
      setSuccessMessage(
        t(
          "auth.signUpSuccessWithEmail",
          "账户创建成功！请查收邮件获取验证码"
        )
      );
      setTimeout(() => {
        navigate("/verify-email", { state: { email } });
      }, 1500);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <DraggableArea
        showTrafficLights
        className="absolute top-0 left-0 right-0 z-50"
      />

      {/* Background effects — same as LoginPage */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--vibrant-blue)]/[0.03]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--vibrant-blue)]/[0.03] rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--vibrant-violet)]/[0.03] rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Floating particles — same as LoginPage */}
      <div className="absolute top-32 left-10 w-2 h-2 bg-[var(--vibrant-blue)]/20 rounded-full animate-float" />
      <div
        className="absolute top-48 right-16 w-3 h-3 bg-[var(--vibrant-violet)]/20 rounded-full animate-float"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute top-72 left-1/3 w-1.5 h-1.5 bg-[var(--vibrant-blue)]/30 rounded-full animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-40 right-1/4 w-2.5 h-2.5 bg-[var(--vibrant-violet)]/15 rounded-full animate-float"
        style={{ animationDelay: "2s" }}
      />

      <button
        onClick={handleBack}
        className="absolute top-16 left-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--accent)] backdrop-blur-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.cancel")}
      </button>

      <Card className="w-full max-w-md relative z-10 border-[var(--border)] shadow-xl shadow-black/5 bg-[var(--card)] backdrop-blur-xl">
        <CardHeader className="space-y-4 pb-6">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-[var(--foreground)]">
              {t("auth.signUp")}
            </CardTitle>
            <CardDescription className="text-[var(--muted-foreground)]">
              {t("auth.signUpDescription")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 text-sm text-[var(--destructive)] bg-[var(--destructive)]/10 rounded-xl border border-[var(--destructive)]/20 flex items-center gap-2">
                <CircleAlert className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-4 text-sm text-[var(--vibrant-emerald)] bg-[var(--vibrant-emerald)]/10 rounded-xl border border-[var(--vibrant-emerald)]/20 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)] ml-1">
                {t("auth.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-[var(--accent)] border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--vibrant-blue)]/20 focus:border-[var(--vibrant-blue)] transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)] ml-1">
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-12 bg-[var(--accent)] border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--vibrant-blue)]/20 focus:border-[var(--vibrant-blue)] transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] ml-1">
                {t("auth.passwordHint", "密码长度至少为 6 个字符")}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)] ml-1">
                {t("auth.confirmPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-12 bg-[var(--accent)] border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--vibrant-blue)]/20 focus:border-[var(--vibrant-blue)] transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                />
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-[var(--destructive)] flex items-center gap-1">
                <CircleAlert className="w-4 h-4 flex-shrink-0" />
                {t("auth.passwordMismatch", "密码不匹配")}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] hover:brightness-110 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-70"
              disabled={
                isLoading ||
                (password !== confirmPassword && confirmPassword !== "")
              }
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("auth.creatingAccount")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {t("auth.signUp")}
                </span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--card)] text-[var(--muted-foreground)]">
                {t("auth.hasAccount")}
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center w-full h-12 px-4 border-2 border-[var(--border)] text-[var(--foreground)] font-semibold rounded-xl hover:bg-[var(--accent)] hover:border-[var(--vibrant-blue)]/50 transition-all duration-200 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 mr-2 text-[var(--vibrant-violet)]" />
            {t("auth.signIn")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
