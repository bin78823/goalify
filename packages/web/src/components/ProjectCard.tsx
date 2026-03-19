import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FolderKanban,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@goalify/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@goalify/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@goalify/ui";
import type { Project } from "../contexts/GanttContext";
import { useTabNavigation } from "../hooks/useTabNavigation";
import { useGanttStore } from "../contexts/GanttContext";
import EditProjectDialog from "./EditProjectDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { t, i18n } = useTranslation();
  const { openProjectTab } = useTabNavigation();
  const { updateProject, deleteProject } = useGanttStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
    });
  };

  const completedTasks = project.tasks.filter(
    (task) => task.progress >= 100,
  ).length;
  const progress =
    project.tasks.length > 0
      ? (completedTasks / project.tasks.length) * 100
      : 0;

  const handleEditSave = (updates: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }) => {
    updateProject(project.id, updates);
  };

  const handleDeleteConfirm = () => {
    deleteProject(project.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-dropdown-menu-trigger]")) {
      return;
    }
    openProjectTab(project.id, project.name);
  };

  return (
    <>
      <Card
        className="group relative cursor-pointer bg-[var(--card)] border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/15 hover:-translate-y-1 active:translate-y-0 border border-transparent hover:border-[var(--vibrant-blue)]/30"
        onClick={handleCardClick}
      >
        {/* Gradient accent on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--vibrant-blue)]/5 to-[var(--vibrant-violet)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
          <CardTitle className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--vibrant-blue)] transition-colors duration-200 tracking-tight line-clamp-1 pr-2">
            {project.name}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  data-dropdown-menu-trigger
                  className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end" sideOffset={6}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setIsEditOpen(true);
                  }}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  {t("project.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("project.actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-9 h-9 bg-gradient-to-br from-[var(--vibrant-blue)]/10 to-[var(--vibrant-violet)]/10 rounded-xl flex items-center justify-center text-[var(--vibrant-blue)] group-hover:from-[var(--vibrant-blue)] group-hover:to-[var(--vibrant-violet)] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative px-5 pb-5">
          <CardDescription className="mb-4 text-[var(--muted-foreground)] text-sm line-clamp-2 leading-relaxed">
            {project.description || t("project.noDescription")}
          </CardDescription>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                {t("project.progress")}
              </span>
              <span className="text-xs font-bold text-[var(--vibrant-blue)]">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)] bg-[var(--secondary)]/70 px-3 py-2 rounded-xl mb-4">
            <Calendar className="h-3.5 w-3.5 text-[var(--vibrant-blue)]" />
            <span className="truncate">
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/50">
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-[var(--card)] bg-gradient-to-br from-[var(--secondary)] to-[var(--muted-foreground)]/20 flex items-center justify-center text-[9px] font-bold text-[var(--muted-foreground)]"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                {project.tasks.length > 3 && (
                  <div className="w-7 h-7 rounded-full border-2 border-[var(--card)] bg-[var(--vibrant-blue)]/10 flex items-center justify-center text-[9px] font-bold text-[var(--vibrant-blue)]">
                    +{project.tasks.length - 3}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {completedTasks > 0 && (
                <div className="flex items-center gap-1 text-[var(--vibrant-blue)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">
                    {completedTasks}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  {t("project.tasks", { count: project.tasks.length })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditProjectDialog
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        project={project}
        onSave={handleEditSave}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        projectName={project.name}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default ProjectCard;
