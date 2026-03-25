import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderKanban, Sparkles } from "lucide-react";
import { useGanttStore } from "../contexts/GanttContext";
import ProjectCard from "../components/ProjectCard";
import ProjectFormDialog from "../components/ProjectFormDialog";
import EmptyProjects from "../components/EmptyProjects";
import GoalifyLogo from "../components/GoalifyLogo";

const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const { projects, addProject } = useGanttStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateProject = (project: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    icon?: string;
  }) => {
    addProject({
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      icon: project.icon,
    });
    setIsCreateOpen(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--vibrant-blue)]/[0.03]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--vibrant-blue)]/[0.03] rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--vibrant-violet)]/[0.03] rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Floating decorative elements */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] rounded-2xl blur-md opacity-30" />
              <div className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] shadow-lg shadow-blue-500/25">
                <GoalifyLogo size={36} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] bg-clip-text text-transparent tracking-tight">
                Goalify
              </span>
              <span className="text-xs text-[var(--muted-foreground)] font-medium tracking-widest uppercase">
                {t("app.tagline")}
              </span>
            </div>
          </div>

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-black text-[var(--foreground)] tracking-tight leading-none">
                  {t("project.title")}
                </h1>
                {projects.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--vibrant-blue)]/10 text-[var(--vibrant-blue)] rounded-full text-sm font-bold animate-in fade-in zoom-in-95 duration-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {projects.length} {t("project.active")}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-base text-[var(--muted-foreground)] max-w-xl">
                {projects.length === 0
                  ? t("project.emptyHint")
                  : t("project.manageHint", { count: projects.length })}
              </p>
            </div>
            <ProjectFormDialog
              isOpen={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              mode="create"
              onSubmit={handleCreateProject}
            />
          </div>

          {/* Decorative divider */}
          <div className="relative h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        </div>

        {/* Content Section */}
        {projects.length === 0 ? (
          <EmptyProjects onCreateClick={() => setIsCreateOpen(true)} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-400"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
