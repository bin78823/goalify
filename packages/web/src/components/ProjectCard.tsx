import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FolderKanban,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
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
  const { t } = useTranslation();
  const { openProjectTab } = useTabNavigation();
  const { updateProject, deleteProject } = useGanttStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
        className="group cursor-pointer bg-[var(--card)] border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.98] border-b-2 border-b-[var(--border)] hover:border-b-[var(--vibrant-blue)]"
        onClick={handleCardClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
          <CardTitle className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--vibrant-blue)] transition-colors tracking-tight line-clamp-1">
            {project.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  data-dropdown-menu-trigger
                  className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-all duration-200 opacity-0 group-hover:opacity-100"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-36" align="end" sideOffset={4}>
                <DropdownMenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    setIsEditOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("project.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("project.actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-8 h-8 bg-[var(--secondary)] rounded-lg flex items-center justify-center text-[var(--vibrant-blue)] group-hover:bg-[var(--vibrant-blue)] group-hover:text-white transition-all duration-300 shrink-0">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <CardDescription className="mb-3 text-[var(--muted-foreground)] text-xs line-clamp-2 h-8">
            {project.description || "No description provided."}
          </CardDescription>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--muted-foreground)] bg-[var(--secondary)]/50 w-fit px-2 py-1 rounded-md">
              <Calendar className="h-3 w-3 text-[var(--vibrant-blue)]" />
              <span>
                {formatDate(project.startDate)} - {formatDate(project.endDate)}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center -space-x-1.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-[var(--card)] bg-[var(--secondary)] flex items-center justify-center text-[8px] font-bold text-[var(--muted-foreground)]"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-[var(--card)] bg-[var(--vibrant-blue)]/10 flex items-center justify-center text-[8px] font-bold text-[var(--vibrant-blue)]">
                  +{project.tasks.length}
                </div>
              </div>
              <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider opacity-60">
                {project.tasks.length} task
              </span>
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
