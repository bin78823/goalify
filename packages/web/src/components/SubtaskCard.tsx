import React from "react";
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Pencil,
  Trash2,
  GripVertical,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@goalify/ui";
import { cn } from "@goalify/ui";
import type { Subtask, SubtaskStatus } from "../api/types";

interface SubtaskCardProps {
  subtask: Subtask;
  onStatusChange: (subtaskId: string, newStatus: SubtaskStatus) => void;
  onEdit: (subtaskId: string, updates: Partial<Subtask>) => void;
  onDelete: (subtaskId: string) => void;
  isDragOverlay?: boolean;
}

const SubtaskCard: React.FC<SubtaskCardProps> = ({
  subtask,
  onStatusChange,
  onEdit,
  onDelete,
  isDragOverlay = false,
}) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id, disabled: isDragOverlay });

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const isCompleted = subtask.status === "done";
  const isInProgress = subtask.status === "in_progress";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        "bg-[var(--background)] rounded-xl",
        "border border-[var(--border)]",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        "hover:border-[var(--primary)]/30",
        "transition-all duration-200 ease-out",
        isDragging && "opacity-40",
        isDragOverlay && [
          "shadow-[0_12px_24px_rgba(0,0,0,0.15)]",
          "scale-[1.02]",
          "ring-2 ring-[var(--primary)]/50",
        ],
        "active:scale-[0.98]",
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "p-1.5 rounded-lg",
            "text-[var(--muted-foreground)]",
            "opacity-0 group-hover:opacity-100",
            "hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            "cursor-grab active:cursor-grabbing",
            "transition-all duration-150 ease-out",
            "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
          )}
          aria-label={t("kanban.dragToReorder") || "Drag to reorder"}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <button
          onClick={() =>
            onStatusChange(subtask.id, isCompleted ? "todo" : "done")
          }
          className={cn(
            "w-6 h-6 rounded-lg flex-shrink-0",
            "flex items-center justify-center",
            "border-2 transition-all duration-200 ease-out",
            isCompleted && [
              "bg-[var(--primary)] border-[var(--primary)]",
              "text-white",
            ],
            isInProgress && [
              "border-[var(--primary)] bg-[var(--primary)]/10",
              "text-[var(--primary)]",
            ],
            !isCompleted &&
              !isInProgress && [
                "border-[var(--border)]",
                "hover:border-[var(--primary)] hover:scale-105",
              ],
          )}
          aria-label={
            isCompleted
              ? t("kanban.markAsIncomplete") || "Mark as incomplete"
              : t("kanban.markAsComplete") || "Mark as complete"
          }
        >
          {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
          {isInProgress && (
            <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium text-[var(--foreground)]",
              "leading-snug",
              isCompleted && ["line-through text-[var(--muted-foreground)]"],
            )}
          >
            {subtask.name}
          </p>
          {subtask.description && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1.5 line-clamp-2 leading-relaxed">
              {subtask.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-8 h-8 p-0 rounded-lg",
              "text-[var(--muted-foreground)]",
              "hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
              "transition-colors duration-150",
            )}
            onClick={() => {
              const newName = prompt(
                t("kanban.editTaskName") || "Edit task name:",
                subtask.name,
              );
              if (newName && newName.trim()) {
                onEdit(subtask.id, { name: newName.trim() });
              }
            }}
            aria-label={t("kanban.editTask") || "Edit task"}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-8 h-8 p-0 rounded-lg",
              "text-[var(--muted-foreground)]",
              "hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10",
              "transition-colors duration-150",
            )}
            onClick={() => {
              if (confirm(t("kanban.deleteConfirm") || "Delete this task?")) {
                onDelete(subtask.id);
              }
            }}
            aria-label={t("kanban.deleteTask") || "Delete task"}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubtaskCard;
