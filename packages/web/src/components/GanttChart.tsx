import { useState, useCallback, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@goalify/ui";
import type { Task } from "../contexts/GanttContext";
import { TASK_COLORS } from "./CreateTaskDialog";
import { useDateFormatter } from "../hooks/useDateFormatter";
import { useSubtaskStore } from "../stores/SubtaskStore";

interface DragState {
  taskId: string;
  startX: number;
  originalStart: Date;
  originalEnd: Date;
  currentDelta: number;
}

interface ResizeState {
  taskId: string;
  startX: number;
  edge: "left" | "right";
  originalStart: Date;
  originalEnd: Date;
  currentDelta: number;
}

interface GanttChartProps {
  tasks: Task[];
  dayWidth: number;
  days: Date[];
  selectedTaskId: string | null;
  getPositionAndWidth: (task: Task) => { left: number; width: number };
  onTaskClick: (task: Task) => void;
  hasDragged: boolean;
  ganttRef?: React.RefObject<HTMLDivElement | null>;
  onDragUpdate?: (taskId: string, deltaDays: number) => void;
  onResizeUpdate?: (
    taskId: string,
    edge: "left" | "right",
    deltaDays: number,
  ) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dayWidth,
  days,
  selectedTaskId,
  getPositionAndWidth,
  onTaskClick,
  hasDragged,
  ganttRef,
  onDragUpdate,
  onResizeUpdate,
  onScroll,
}) => {
  const { formatDateRange } = useDateFormatter();
  const { countsByParent } = useSubtaskStore();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef<{
    taskId: string;
    edge: "left" | "right";
  } | null>(null);
  const taskBarRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // 根据子任务完成度计算进度（只计算done状态）
  const getTaskProgress = useCallback(
    (taskId: string): number => {
      const counts = countsByParent[taskId];
      if (!counts) return 0;

      const total = counts.todo + counts.in_progress + counts.done;
      if (total === 0) return 0;

      // 只计算done状态的子任务
      return Math.round((counts.done / total) * 100);
    },
    [countsByParent],
  );

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    };

    measure();

    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, task: Task) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    isDraggingRef.current = true;

    setDragState({
      taskId: task.id,
      startX: e.clientX,
      originalStart: new Date(task.startDate),
      originalEnd: new Date(task.endDate),
      currentDelta: 0,
    });

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      e.preventDefault();

      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / dayWidth);

      setDragState((prev) =>
        prev ? { ...prev, currentDelta: deltaDays } : null,
      );
    },
    [dragState, dayWidth],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      e.preventDefault();

      const target = e.currentTarget as HTMLElement;
      target.releasePointerCapture(e.pointerId);

      if (dragState.currentDelta !== 0 && onDragUpdate) {
        onDragUpdate(dragState.taskId, dragState.currentDelta);
      }

      isDraggingRef.current = false;
      setDragState(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    [dragState, onDragUpdate],
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, task: Task, edge: "left" | "right") => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      isResizingRef.current = { taskId: task.id, edge };

      setResizeState({
        taskId: task.id,
        startX: e.clientX,
        edge,
        originalStart: new Date(task.startDate),
        originalEnd: new Date(task.endDate),
        currentDelta: 0,
      });

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },
    [],
  );

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizeState) return;
      e.preventDefault();

      const deltaX = e.clientX - resizeState.startX;
      const deltaDays = Math.round(deltaX / dayWidth);

      setResizeState((prev) =>
        prev ? { ...prev, currentDelta: deltaDays } : null,
      );
    },
    [resizeState, dayWidth],
  );

  const handleResizePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!resizeState) return;
      e.preventDefault();

      const target = e.currentTarget as HTMLElement;
      target.releasePointerCapture(e.pointerId);

      if (resizeState.currentDelta !== 0 && onResizeUpdate) {
        onResizeUpdate(
          resizeState.taskId,
          resizeState.edge,
          resizeState.currentDelta,
        );
      }

      isResizingRef.current = null;
      setResizeState(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    [resizeState, onResizeUpdate],
  );

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const totalWidth = days.length * dayWidth;

  const getDragTransform = (taskId: string): number => {
    if (dragState?.taskId === taskId) {
      return dragState.currentDelta * dayWidth;
    }
    return 0;
  };

  const getResizeStyle = (
    task: Task,
  ): { left?: number; width?: number } | null => {
    if (resizeState?.taskId !== task.id) return null;

    if (resizeState.edge === "right") {
      const newEnd = new Date(task.endDate);
      newEnd.setDate(newEnd.getDate() + resizeState.currentDelta);
      if (newEnd > task.startDate) {
        const newDuration =
          Math.floor(
            (newEnd.getTime() - task.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;
        return { width: newDuration * dayWidth };
      }
    } else {
      const newStart = new Date(task.startDate);
      newStart.setDate(newStart.getDate() + resizeState.currentDelta);
      if (newStart < task.endDate) {
        const { left } = getPositionAndWidth(task);
        const newLeft = left + resizeState.currentDelta * dayWidth;
        const newDuration =
          Math.floor(
            (task.endDate.getTime() - newStart.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;
        return { left: newLeft + 2, width: newDuration * dayWidth };
      }
    }
    return null;
  };

  const renderGridLines = () => (
    <div className="absolute inset-0 flex">
      {days.map((day, index) => (
        <div
          key={index}
          className={`border-r border-slate-300/50 ${
            isToday(day)
              ? "bg-[var(--vibrant-blue)]/5"
              : isWeekend(day)
                ? "bg-[var(--muted)]"
                : ""
          }`}
          style={{ width: dayWidth }}
        />
      ))}
    </div>
  );

  const renderTodayLine = () => {
    const todayIndex = days.findIndex((d) => isToday(d));
    if (todayIndex === -1) return null;
    return (
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-red-500 z-20"
        style={{ left: todayIndex * dayWidth + dayWidth / 2 }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-white" />
      </div>
    );
  };

  const renderTaskBars = () => (
    <div className="absolute inset-0">
      {tasks.map((task, index) => {
        const { left, width } = getPositionAndWidth(task);
        const isDragging = dragState?.taskId === task.id;
        const isResizing = resizeState?.taskId === task.id;
        const isSelected = selectedTaskId === task.id;
        const progress = getTaskProgress(task.id);

        const dragTransform = getDragTransform(task.id);
        const resizeStyle = getResizeStyle(task);

        return (
          <div
            key={task.id}
            ref={(el) => {
              if (el) taskBarRefs.current.set(task.id, el);
            }}
            className={`absolute h-12 flex items-center group ${isDragging || isResizing ? "z-30" : "z-10"} ${isSelected ? "z-20" : "hover:z-25"}`}
            style={{
              left: resizeStyle?.left ?? left + 2 + dragTransform,
              width: resizeStyle?.width ?? width,
              top: index * 56 + 8,
              opacity: isDragging || isResizing ? 0.8 : 1,
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
              touchAction: "none",
            }}
            onPointerDown={(e) => handlePointerDown(e, task)}
            onPointerMove={isDragging ? handlePointerMove : undefined}
            onPointerUp={isDragging ? handlePointerUp : undefined}
            onPointerCancel={isDragging ? handlePointerUp : undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (
                !hasDragged &&
                !isDraggingRef.current &&
                !isResizingRef.current
              ) {
                onTaskClick(task);
              }
            }}
          >
            <div
              className={`relative w-full h-9 rounded-xl overflow-hidden border border-white/10 shadow-lg ${isSelected ? "ring-4 ring-offset-2 ring-offset-[var(--background)] ring-[var(--ring)] scale-[1.02]" : "hover:scale-[1.01] hover:shadow-xl"}`}
              style={{
                background:
                  TASK_COLORS.find((c) => c.primary === task.color)?.gradient ||
                  task.color,
              }}
            >
              <div
                className="absolute inset-0 bg-black/40"
                style={{
                  width: `${100 - progress}%`,
                  right: 0,
                  left: "auto",
                }}
              />
              <div className="absolute inset-0 flex items-center pl-3 pr-16 justify-between">
                <span className="text-xs font-black text-white truncate drop-shadow-md tracking-tight uppercase">
                  {task.name}
                </span>
                <span className="text-[10px] font-bold text-white/90 drop-shadow-md">
                  {progress}%
                </span>
              </div>
              <div
                className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 hover:bg-white/50 rounded-l-xl"
                style={{ touchAction: "none" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleResizePointerDown(e, task, "left");
                }}
                onPointerMove={
                  isResizingRef.current?.taskId === task.id &&
                  isResizingRef.current?.edge === "left"
                    ? handleResizePointerMove
                    : undefined
                }
                onPointerUp={
                  isResizingRef.current?.taskId === task.id &&
                  isResizingRef.current?.edge === "left"
                    ? handleResizePointerUp
                    : undefined
                }
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 hover:bg-white/50 rounded-r-xl"
                    style={{ touchAction: "none" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handleResizePointerDown(e, task, "right");
                    }}
                    onPointerMove={
                      isResizingRef.current?.taskId === task.id &&
                      isResizingRef.current?.edge === "right"
                        ? handleResizePointerMove
                        : undefined
                    }
                    onPointerUp={
                      isResizingRef.current?.taskId === task.id &&
                      isResizingRef.current?.edge === "right"
                        ? handleResizePointerUp
                        : undefined
                    }
                  />
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={12}>
                  <div className="flex flex-col gap-1.5 p-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: task.color || "#64748b" }}
                      />
                      <span className="text-sm text-[var(--popover-foreground)] font-medium">
                        {task.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <Calendar className="w-3.5 h-3.5 text-[var(--vibrant-blue)]" />
                      <span>
                        {formatDateRange(task.startDate, task.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: task.color || "#64748b",
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--muted-foreground)] min-w-[36px] text-right">
                        {progress}%
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full min-w-0">
      <div
        className="flex-1 min-w-0 bg-[var(--background)]/50 overflow-auto scrollbar-visible"
        ref={(el) => {
          containerRef.current = el;
          if (ganttRef) {
            ganttRef.current = el;
          }
        }}
        onScroll={(e) => {
          onScroll?.(e);
        }}
      >
        <div
          className="relative"
          style={{
            minWidth: totalWidth,
            height: `${Math.max(tasks.length * 56, containerHeight)}px`,
          }}
        >
          {renderGridLines()}
          {renderTaskBars()}
          {renderTodayLine()}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
