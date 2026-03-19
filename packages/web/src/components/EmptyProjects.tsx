import { useTranslation } from "react-i18next";
import { FolderKanban, Plus, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@goalify/ui";

interface EmptyProjectsProps {
  onCreateClick: () => void;
}

const EmptyProjects: React.FC<EmptyProjectsProps> = ({ onCreateClick }) => {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col items-center justify-center py-20 px-8 mt-8">
      {/* Background glow effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--vibrant-blue)]/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-12 left-1/4 w-2 h-2 bg-[var(--vibrant-blue)]/20 rounded-full animate-float" />
      <div
        className="absolute top-20 right-1/4 w-1.5 h-1.5 bg-[var(--vibrant-violet)]/30 rounded-full animate-float"
        style={{ animationDelay: "0.7s" }}
      />
      <div
        className="absolute bottom-16 left-1/3 w-3 h-3 bg-[var(--vibrant-blue)]/15 rounded-full animate-float"
        style={{ animationDelay: "1.2s" }}
      />

      {/* Icon container */}
      <div className="relative mb-8">
        {/* Glow ring */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--vibrant-blue)]/20 to-[var(--vibrant-violet)]/20 rounded-full blur-xl animate-pulse" />

        {/* Icon background */}
        <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--vibrant-blue)]/10 to-[var(--vibrant-violet)]/10 rounded-3xl flex items-center justify-center border border-[var(--vibrant-blue)]/20">
          <FolderKanban className="w-12 h-12 text-[var(--vibrant-blue)]/60" />

          {/* Plus badge */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Plus className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-center space-y-4 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--vibrant-blue)]" />
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            {t("project.noProjects")}
          </h2>
          <Sparkles className="w-4 h-4 text-[var(--vibrant-violet)]" />
        </div>

        <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
          {t("project.createFirst")}
        </p>
      </div>

      {/* CTA Button */}
      <Button
        className="mt-8 group relative bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] hover:opacity-90 text-white shadow-xl shadow-blue-500/20 rounded-2xl px-8 py-6 h-auto font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30"
        onClick={onCreateClick}
      >
        <span className="flex items-center gap-2">
          {t("project.createFirst")}
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Button>

      {/* Feature hints */}
      <div className="flex items-center gap-8 mt-12 text-xs text-[var(--muted-foreground)]/60">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--vibrant-blue)]" />
          <span>Gantt Charts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--vibrant-violet)]" />
          <span>Task Tracking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--vibrant-blue)]/60" />
          <span>Visual Timeline</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyProjects;
