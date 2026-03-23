import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task } from "../contexts/GanttContext";
import { useSubtaskStore } from "../stores/SubtaskStore";

interface TaskListPanelProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onTaskSelect: (task: Task) => void;
  onReorderTasks: (activeId: string, overId: string) => void;
  hasDragged: boolean;
}

const TaskListPanel: React.FC<TaskListPanelProps> = ({
  tasks,
  selectedTaskId,
  onTaskSelect,
  onReorderTasks,
  hasDragged,
}) => {
  const { t } = useTranslation();
  const { countsByParent, loadCountsByParent } = useSubtaskStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  // 加载所有任务的子任务统计
  useEffect(() => {
    if (tasks.length > 0) {
      const taskIds = tasks.map((t) => t.id);
      loadCountsByParent(taskIds);
    }
  }, [tasks, loadCountsByParent]);

  // 根据子任务完成度计算进度
  const getTaskProgress = useCallback((taskId: string): number => {
    const counts = countsByParent[taskId];
    if (!counts) return 0;
    const total = counts.todo + counts.in_progress + counts.done;
    if (total === 0) return 0;
    return Math.round((counts.done / total) * 100);
  }, [countsByParent]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      onReorderTasks(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="flex-1">
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-[var(--muted-foreground)]">
          <div className="w-16 h-16 rounded-full bg-[var(--secondary)] flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-sm font-semibold">{t("task.noTasks")}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task, index) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                index={index}
                totalCount={tasks.length}
                isSelected={selectedTaskId === task.id}
                onClick={() => onTaskSelect(task)}
                hasDragged={hasDragged}
                getTaskProgress={getTaskProgress}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeTask ? (
              <TaskDragOverlay
                task={activeTask}
                getTaskProgress={getTaskProgress}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

interface SortableTaskItemProps {
  task: Task;
  index: number;
  totalCount: number;
  isSelected: boolean;
  onClick: () => void;
  hasDragged: boolean;
  getTaskProgress: (taskId: string) => number;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  index,
  totalCount,
  isSelected,
  onClick,
  hasDragged,
  getTaskProgress,
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: task.id,
  });
  const progress = getTaskProgress(task.id);

  return (
    <div
      ref={setNodeRef}
      className={`group h-[56px] px-2 flex items-center gap-2 cursor-pointer transition-all duration-200 ${
        isSelected ? "bg-[var(--accent)]" : "hover:bg-[var(--secondary)]/60"
      } border-l-[3px] ${
        index !== totalCount - 1 ? "border-b border-[var(--border)]/60" : ""
      } ${isDragging ? "opacity-40" : ""}`}
      style={{
        borderLeftColor: isSelected ? task.color || "#64748b" : "transparent",
      }}
      onClick={() => {
        if (!hasDragged) {
          onClick();
        }
      }}
    >
      <button
        className="p-1 cursor-grab active:cursor-grabbing text-[var(--muted-foreground)]/40 hover:text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-[var(--background)] shadow-sm"
        style={{ backgroundColor: task.color || "#64748b" }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate transition-colors"
          style={{
            color: isSelected
              ? task.color || "#64748b"
              : "var(--foreground)",
          }}
        >
          {task.name}
        </p>
        <p className="text-[10px] font-medium text-[var(--muted-foreground)]/80 mt-0.5">
          {Math.ceil(
            (new Date(task.endDate).getTime() -
              new Date(task.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1}{" "}
          {t("task.duration")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 min-w-[52px]">
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden ring-1 ring-[var(--border)]/50">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: task.color || "#64748b",
                boxShadow: "0 0 4px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        </div>
        <span className="text-[10px] font-bold text-[var(--muted-foreground)]">
          {progress}%
        </span>
      </div>
    </div>
  );
};

// 拖拽时的覆盖层组件
interface TaskDragOverlayProps {
  task: Task;
  getTaskProgress: (taskId: string) => number;
}

const TaskDragOverlay: React.FC<TaskDragOverlayProps> = ({
  task,
  getTaskProgress,
}) => {
  const { t } = useTranslation();
  const progress = getTaskProgress(task.id);

  return (
    <div
      className="h-[56px] px-2 flex items-center gap-2 bg-[var(--accent)] border-l-[3px] shadow-xl rounded-md"
      style={{
        borderLeftColor: task.color || "#64748b",
      }}
    >
      <button className="p-1 cursor-grabbing text-[var(--muted-foreground)]">
        <GripVertical className="w-4 h-4" />
      </button>
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-[var(--background)] shadow-sm"
        style={{
          backgroundColor: task.color || "#64748b",
        }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: task.color || "#64748b" }}
        >
          {task.name}
        </p>
        <p className="text-[10px] font-medium text-[var(--muted-foreground)]/80 mt-0.5">
          {Math.ceil(
            (new Date(task.endDate).getTime() -
              new Date(task.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1}{" "}
          {t("task.duration")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 min-w-[52px]">
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden ring-1 ring-[var(--border)]/50">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: task.color || "#64748b",
              }}
            />
          </div>
        </div>
        <span className="text-[10px] font-bold text-[var(--muted-foreground)]">
          {progress}%
        </span>
      </div>
    </div>
  );
};

export default TaskListPanel;
