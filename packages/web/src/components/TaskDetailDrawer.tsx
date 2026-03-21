import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import { Button } from "@goalify/ui";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerDescription,
} from "@goalify/ui";
import { Input } from "@goalify/ui";
import { DatePicker } from "@goalify/ui";
import type { Task } from "../contexts/GanttContext";
import ProgressSliderWithMilestones from "./ProgressSliderWithMilestones";
import { TASK_COLORS } from "./CreateTaskDialog";

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");

  useEffect(() => {
    if (task) {
      setName(task.name);
    }
  }, [task?.id, task?.name]);

  const handleNameBlur = () => {
    if (task && name.trim() && name.trim() !== task.name) {
      onUpdate(task.id, { name: name.trim() });
    }
  };

  const handleDelete = () => {
    if (task) {
      onDelete(task.id);
      onClose();
    }
  };

  const getNameError = () => {
    if (!name.trim()) {
      return t("task.validation.nameRequired");
    }
    if (name.length > 50) {
      return t("task.validation.nameTooLong");
    }
    return null;
  };

  const nameError = getNameError();

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      direction="right"
    >
      <DrawerContent
        direction="right"
        className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] h-screen w-full max-w-md"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DrawerHeader className="border-b border-[var(--border)]/60 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full shadow-md ring-2 ring-[var(--background)] flex-shrink-0"
              style={{ backgroundColor: task?.color || "#64748b" }}
            />
            <div className="flex-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                className={`h-9 text-base font-semibold bg-[var(--background)] border-none px-2 focus:ring-2 focus:ring-[var(--vibrant-blue)] ${nameError ? "ring-2 ring-red-500" : ""}`}
                placeholder="Task name"
              />
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )}
            </div>
          </div>
          <DrawerDescription className="sr-only">
            Task details panel
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
          {task && (
            <>
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[var(--secondary)]/50 to-[var(--secondary)]/30 rounded-2xl">
                <Calendar className="w-5 h-5 text-[var(--vibrant-blue)]" />
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {Math.ceil(
                    (new Date(task.endDate).getTime() -
                      new Date(task.startDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                  ) + 1}{" "}
                  {t("task.duration")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">
                    {t("task.startDate")}
                  </p>
                  <DatePicker
                    value={new Date(task.startDate)}
                    locale={i18n.language}
                    onChange={(date) =>
                      date && onUpdate(task.id, { startDate: date })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">
                    {t("task.endDate")}
                  </p>
                  <DatePicker
                    value={new Date(task.endDate)}
                    locale={i18n.language}
                    onChange={(date) =>
                      date && onUpdate(task.id, { endDate: date })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">
                    {t("task.progress")}
                  </p>
                  <p className="text-lg font-bold text-[var(--vibrant-blue)]">
                    {task.progress}%
                  </p>
                </div>
                <div className="bg-[var(--secondary)]/50 rounded-2xl p-4">
                  <ProgressSliderWithMilestones
                    value={task.progress}
                    onChange={(value) => onUpdate(task.id, { progress: value })}
                    color={task.color || "var(--vibrant-blue)"}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">
                  {t("task.color")}
                </p>
                <div className="flex gap-2">
                  {TASK_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        onUpdate(task.id, { color: color.primary })
                      }
                      className={`w-9 h-9 rounded-full transition-all duration-300 ${
                        task.color === color.primary
                          ? "ring-4 ring-offset-2 ring-[var(--ring)] scale-110 shadow-lg"
                          : "hover:scale-110"
                      }`}
                      style={{ background: color.gradient }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DrawerFooter className="border-t border-[var(--border)]/60 pt-4 flex-row gap-3">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex-1 rounded-xl font-semibold h-11"
          >
            {t("common.delete")}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 rounded-xl font-semibold bg-[var(--secondary)] text-[var(--secondary-foreground)] h-11"
          >
            {t("common.close")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TaskDetailDrawer;
