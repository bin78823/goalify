import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Plus,
  CircleDot,
  CheckCircle2,
  ListTodo,
  Loader2,
  Calendar,
  Trash2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  DatePicker,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@goalify/ui";
import { useSubtaskStore, SubtaskCounts } from "../stores/SubtaskStore";
import { useGanttStore } from "../contexts/GanttContext";
import { useAuthStore } from "../stores/AuthStore";
import SubtaskCard from "../components/SubtaskCard";
import ProgressSliderWithMilestones from "../components/ProgressSliderWithMilestones";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { Subtask, SubtaskStatus } from "../api/types";
import { TASK_COLORS } from "../components/CreateTaskDialog";

interface ColumnProps {
  status: SubtaskStatus;
  label: string;
  tasks: Subtask[];
  color: string;
  onAddTask: (status: SubtaskStatus) => void;
  onStatusChange: (subtaskId: string, newStatus: SubtaskStatus) => void;
  onEdit: (subtaskId: string, updates: Partial<Subtask>) => void;
  onDelete: (subtaskId: string) => void;
}

const COLUMN_CONFIG: Record<
  SubtaskStatus,
  { color: string; icon: React.ReactNode }
> = {
  todo: {
    color: "var(--muted-foreground)",
    icon: <ListTodo className="w-4 h-4" />,
  },
  in_progress: {
    color: "#3b82f6",
    icon: <CircleDot className="w-4 h-4" />,
  },
  done: {
    color: "#22c55e",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
};

const defaultCounts = (): SubtaskCounts => ({
  todo: 0,
  in_progress: 0,
  done: 0,
});

const Column: React.FC<ColumnProps> = ({
  status,
  label,
  tasks,
  color,
  onAddTask,
  onStatusChange,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = COLUMN_CONFIG[status];

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col
        h-full
        rounded-2xl
        transition-all duration-200 ease-out
        ${
          isOver
            ? "ring-2 ring-[var(--primary)]/30 bg-[var(--primary)]/5"
            : "bg-[var(--muted)]/30"
        }
      `}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${config.color}15` }}
          >
            <div style={{ color: config.color }}>{config.icon}</div>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              {label}
            </h2>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${config.color}15`,
                color: config.color,
              }}
            >
              {tasks.length}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 rounded-xl hover:bg-[var(--muted)] bg-[var(--muted)]/30"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${label}`}
        >
          <Plus className="w-5 h-5 text-[var(--muted-foreground)]" />
        </Button>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 min-h-[200px] overflow-y-auto px-3 pb-4 scrollbar-thin relative">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("kanban.noTasks")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <SubtaskCard
                    subtask={task}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => onAddTask(status)}
            className="w-full mt-2 py-2 rounded-lg text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {t("kanban.addATask")}
          </button>
        </div>
      </SortableContext>
    </div>
  );
};

const SubtaskBoardPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { projects, updateTask, deleteTask } = useGanttStore();
  const syncVersion = useAuthStore((s) => s.syncVersion);
  const {
    subtasks,
    isLoading,
    loadByParentId,
    create,
    update,
    remove,
    move,
    reorder,
  } = useSubtaskStore();

  const [newTaskName, setNewTaskName] = useState("");
  const [addingToColumn, setAddingToColumn] = useState<SubtaskStatus | null>(
    null,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const parentTask = useMemo(() => {
    if (!taskId) return null;
    for (const project of projects) {
      const task = project.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return null;
  }, [taskId, projects]);

  const activeSubtask = useMemo(() => {
    if (!activeId) return null;
    return subtasks.find((s) => s.id === activeId) || null;
  }, [activeId, subtasks]);

  const counts = useMemo((): SubtaskCounts => {
    const c = defaultCounts();
    subtasks.forEach((s) => {
      c[s.status]++;
    });
    return c;
  }, [subtasks]);

  const totalSubtasks = subtasks.length;
  const computedProgress =
    totalSubtasks > 0 ? Math.round((counts.done / totalSubtasks) * 100) : 0;

  useEffect(() => {
    if (taskId) {
      loadByParentId(taskId);
    }
  }, [taskId, loadByParentId]);

  useEffect(() => {
    if (syncVersion > 0 && taskId) {
      loadByParentId(taskId);
    }
  }, [syncVersion, taskId, loadByParentId]);

  useEffect(() => {
    if (parentTask) {
      setNameValue(parentTask.name);
    }
  }, [parentTask?.id, parentTask?.name]);

  useEffect(() => {
    if (addingToColumn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingToColumn]);

  const handleNameBlur = useCallback(() => {
    if (
      parentTask &&
      nameValue.trim() &&
      nameValue.trim() !== parentTask.name
    ) {
      const project = projects.find((p) =>
        p.tasks.some((t) => t.id === parentTask.id),
      );
      if (project) {
        updateTask(project.id, parentTask.id, { name: nameValue.trim() });
      }
    }
  }, [parentTask, nameValue, projects, updateTask]);

  const handleDelete = useCallback(() => {
    if (!parentTask) return;
    setIsDeleteOpen(false);
    const project = projects.find((p) =>
      p.tasks.some((t) => t.id === parentTask.id),
    );
    if (project) {
      deleteTask(project.id, parentTask.id);
      navigate(-1);
    }
  }, [parentTask, projects, deleteTask, navigate]);

  const handleDeleteClick = useCallback(() => {
    setIsDeleteOpen(true);
  }, []);

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !taskId || !addingToColumn) return;

    setIsAddingTask(true);
    try {
      await create(taskId, newTaskName.trim(), addingToColumn);
      setNewTaskName("");
      setAddingToColumn(null);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleStatusChange = useCallback(
    async (subtaskId: string, newStatus: SubtaskStatus) => {
      const tasksInNewStatus = subtasks.filter((s) => s.status === newStatus);
      await move(subtaskId, newStatus, tasksInNewStatus.length);
    },
    [subtasks, move],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeSubtask = subtasks.find((s) => s.id === activeId);
    if (!activeSubtask) return;

    const overIsColumn = ["todo", "in_progress", "done"].includes(overId);
    if (overIsColumn) {
      const newStatus = overId as SubtaskStatus;
      if (activeSubtask.status !== newStatus) {
        handleStatusChange(activeId, newStatus);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeSubtask = subtasks.find((s) => s.id === activeId);
    const overSubtask = subtasks.find((s) => s.id === overId);

    if (!activeSubtask) return;

    if (overSubtask) {
      const tasksInStatus = subtasks
        .filter((s) => s.status === activeSubtask.status)
        .sort((a, b) => a.order_index - b.order_index);

      const oldIndex = tasksInStatus.findIndex((s) => s.id === activeId);
      const newIndex = tasksInStatus.findIndex((s) => s.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        await reorder(activeId, newIndex);
      }
    }
  };

  const columns: { status: SubtaskStatus; label: string }[] = [
    { status: "todo", label: t("kanban.todo") || "To Do" },
    { status: "in_progress", label: t("kanban.inProgress") || "In Progress" },
    { status: "done", label: t("kanban.done") || "Done" },
  ];

  const getTasksByStatus = (status: SubtaskStatus) =>
    subtasks
      .filter((s) => s.status === status)
      .sort((a, b) => a.order_index - b.order_index);

  if (!parentTask) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted-foreground)]">Task not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      <header className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-5">
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0 rounded-lg hover:bg-[var(--muted)] shrink-0"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div
              className="w-3 h-3 rounded-full shadow-sm shrink-0 mt-0.5"
              style={{ backgroundColor: parentTask.color || "#64748b" }}
            />
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="flex-1 min-w-0 text-lg font-semibold text-[var(--foreground)] bg-transparent border-none outline-none placeholder:text-[var(--muted-foreground)] truncate"
              placeholder="Task name"
            />
            <Popover open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 shrink-0"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 bg-[var(--card)] border-[var(--border)] rounded-2xl p-4 shadow-xl"
                align="end"
                sideOffset={8}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                      {t("task.delete")}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      {t("task.deleteConfirm")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 rounded-lg border-[var(--border)] text-[var(--foreground)]"
                    onClick={() => setIsDeleteOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm"
                    onClick={handleDelete}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Calendar className="w-4 h-4" />
                <DatePicker
                  value={new Date(parentTask.startDate)}
                  locale={i18n.language}
                  onChange={(date) => {
                    const project = projects.find((p) =>
                      p.tasks.some((t) => t.id === parentTask.id),
                    );
                    if (project && date) {
                      updateTask(project.id, parentTask.id, {
                        startDate: date,
                      });
                    }
                  }}
                />
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <DatePicker
                  value={new Date(parentTask.endDate)}
                  locale={i18n.language}
                  onChange={(date) => {
                    const project = projects.find((p) =>
                      p.tasks.some((t) => t.id === parentTask.id),
                    );
                    if (project && date) {
                      updateTask(project.id, parentTask.id, { endDate: date });
                    }
                  }}
                />
              </div>
              <span className="text-xs text-[var(--muted-foreground)] px-2 py-0.5 bg-[var(--muted)] rounded-md ml-1">
                {Math.ceil(
                  (new Date(parentTask.endDate).getTime() -
                    new Date(parentTask.startDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                ) + 1}{" "}
                {t("task.duration")}
              </span>
            </div>

            <div className="flex items-end gap-24">
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    {t("task.progress")}
                  </span>
                  <span className="text-sm font-bold text-[var(--foreground)]">
                    {computedProgress}%
                  </span>
                </div>
                <ProgressSliderWithMilestones
                  value={computedProgress}
                  readOnly
                  color={parentTask.color || "var(--vibrant-blue)"}
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pb-1">
                {TASK_COLORS.slice(0, 8).map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      const project = projects.find((p) =>
                        p.tasks.some((t) => t.id === parentTask.id),
                      );
                      if (project) {
                        updateTask(project.id, parentTask.id, {
                          color: color.primary,
                        });
                      }
                    }}
                    className={`w-6 h-6 rounded-full transition-all duration-200 ${
                      parentTask.color === color.primary
                        ? "ring-2 ring-offset-1.5 ring-[var(--ring)] scale-110"
                        : "hover:scale-110 opacity-60 hover:opacity-100"
                    }`}
                    style={{ background: color.gradient }}
                    aria-label={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 px-6 py-3 bg-[var(--card)] border-b border-[var(--border)] text-sm">
        <span className="text-[var(--muted-foreground)]">
          {subtasks.length} {t("kanban.subtasks")}
        </span>
        <span className="text-[var(--muted-foreground)]">·</span>
        <span className="text-[var(--muted-foreground)]">
          {counts.todo} {t("kanban.todo")}
        </span>
        <span className="text-[#3b82f6]">
          {counts.in_progress} {t("kanban.inProgress")}
        </span>
        <span className="text-[#22c55e]">
          {counts.done} {t("kanban.done")}
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 min-h-0 overflow-auto p-6">
            <div className="grid grid-cols-3 gap-4 h-full min-h-0">
              {columns.map(({ status, label }, index) => (
                <div
                  key={status}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <Column
                    status={status}
                    label={label}
                    tasks={getTasksByStatus(status)}
                    color={COLUMN_CONFIG[status].color}
                    onAddTask={setAddingToColumn}
                    onStatusChange={handleStatusChange}
                    onEdit={update}
                    onDelete={remove}
                  />
                </div>
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeSubtask && (
              <SubtaskCard
                subtask={activeSubtask}
                onStatusChange={handleStatusChange}
                onEdit={update}
                onDelete={remove}
                isDragOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {addingToColumn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            setAddingToColumn(null);
            setNewTaskName("");
          }}
        >
          <div
            className="bg-[var(--background)] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[var(--border)] animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${COLUMN_CONFIG[addingToColumn].color}15`,
                }}
              >
                <div style={{ color: COLUMN_CONFIG[addingToColumn].color }}>
                  {COLUMN_CONFIG[addingToColumn].icon}
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  {t("kanban.newTask")}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t("kanban.addingTo")}{" "}
                  {columns.find((c) => c.status === addingToColumn)?.label}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full px-4 py-3 rounded-xl 
                           bg-[var(--muted)]/50 
                           border border-[var(--border)]
                           text-[var(--foreground)] text-sm
                           placeholder:text-[var(--muted-foreground)]
                           focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]
                           transition-all duration-150"
                  placeholder={t("kanban.placeholder")}
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTask();
                    if (e.key === "Escape") {
                      setAddingToColumn(null);
                      setNewTaskName("");
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl px-4"
                  onClick={() => {
                    setAddingToColumn(null);
                    setNewTaskName("");
                  }}
                >
                  {t("kanban.cancel")}
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] hover:opacity-90 text-white shadow-lg shadow-blue-500/30 rounded-xl px-4 gap-2"
                  onClick={handleAddTask}
                  disabled={!newTaskName.trim() || isAddingTask}
                >
                  {isAddingTask ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t("kanban.addTask")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtaskBoardPage;
