import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, ArrowLeft, Plus } from "lucide-react";
import { Button, toast } from "@goalify/ui";
import { toPng } from "html-to-image";
import { useGanttStore, Task } from "../contexts/GanttContext";
import GanttHeader from "../components/GanttHeader";
import TaskListPanel from "../components/TaskListPanel";
import GanttChart from "../components/GanttChart";
import GanttExportImage from "../components/GanttExportImage";
import { exportGanttToExcel } from "../utils/excelExport";
import CreateTaskDialog from "../components/CreateTaskDialog";
import { useDateFormatter } from "../hooks/useDateFormatter";
import { useSubtaskStore } from "../stores/SubtaskStore";

type ViewMode = "day" | "week" | "month";

const GanttPage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    formatMonth,
    formatWeekday,
    formatDay,
    getWeekNumber,
    formatDateRange,
  } = useDateFormatter();
  const { projects, addTask, updateTask, deleteTask, reorderTasks } =
    useGanttStore();
  const { countsByParent, loadCountsByParent } = useSubtaskStore();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRangeVersion, setDateRangeVersion] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const taskListScrollRef = useRef<HTMLDivElement>(null);
  const ganttContentRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const exportReadyResolver = useRef<(() => void) | null>(null);
  const isScrollSyncing = useRef(false);

  const handleExportReady = useCallback(() => {
    exportReadyResolver.current?.();
  }, []);

  const project = projects.find((p) => p.id === projectId);

  // 加载所有任务的子任务统计
  useEffect(() => {
    if (project?.tasks && project.tasks.length > 0) {
      const taskIds = project.tasks.map((t) => t.id);
      loadCountsByParent(taskIds);
    }
  }, [project?.tasks, loadCountsByParent]);

  const selectedTask = useMemo(
    () => project?.tasks.find((t) => t.id === selectedTaskId) || null,
    [project?.tasks, selectedTaskId],
  );

  const dayWidth = useMemo(() => {
    const baseWidth = {
      day: 60,
      week: 25,
      month: 10,
    };
    return baseWidth[viewMode] * zoomLevel;
  }, [viewMode, zoomLevel]);

  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);

    const tasks = project?.tasks || [];

    if (tasks.length > 0) {
      const taskDates = tasks.flatMap((task) => [
        new Date(task.startDate),
        new Date(task.endDate),
      ]);
      const earliestTask = new Date(
        Math.min(...taskDates.map((d) => d.getTime())),
      );
      const latestTask = new Date(
        Math.max(...taskDates.map((d) => d.getTime())),
      );
      earliestTask.setHours(0, 0, 0, 0);
      latestTask.setHours(0, 0, 0, 0);

      earliestTask.setDate(earliestTask.getDate() - 7);
      latestTask.setDate(latestTask.getDate() + 7);

      start = new Date(Math.min(start.getTime(), earliestTask.getTime()));
      end = new Date(Math.max(end.getTime(), latestTask.getTime()));
    }

    switch (viewMode) {
      case "day":
        start.setDate(start.getDate() - 3);
        end.setDate(end.getDate() + 11);
        break;
      case "week":
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        const daysNeeded = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
        const totalDays = Math.max(8 * 7, daysNeeded + 1);
        end = new Date(start);
        end.setDate(start.getDate() + totalDays - 1);
        // 确保 end 是周日
        if (end.getDay() !== 0) {
          end.setDate(end.getDate() + (7 - end.getDay()));
        }
        break;
      case "month":
        start.setDate(1);
        const monthDiff = Math.max(
          6,
          Math.ceil(
            (end.getFullYear() - start.getFullYear()) * 12 +
              (end.getMonth() - start.getMonth()) +
              1,
          ),
        );
        end.setMonth(start.getMonth() + monthDiff);
        end.setDate(0);
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return { start, end };
  }, [viewMode, dateRangeVersion, project?.tasks]);

  const days = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [dateRange]);

  const weeks = useMemo(() => {
    const result: { start: Date; end: Date; daysCount: number }[] = [];
    const current = new Date(dateRange.start);
    current.setHours(0, 0, 0, 0);
    while (current <= dateRange.end) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      // 找到本周日（周六结束）
      const daysUntilSunday = (7 - current.getDay()) % 7;
      weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
      weekEnd.setHours(0, 0, 0, 0);
      // 如果本周结束超过日期范围，则使用日期范围的结束
      if (weekEnd > dateRange.end) {
        weekEnd.setTime(dateRange.end.getTime());
      }
      // 计算天数：使用日期差而不是时间戳差，避免精度问题
      const daysCount = Math.floor(
        (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
      result.push({
        start: weekStart,
        end: weekEnd,
        daysCount,
      });
      current.setDate(current.getDate() + daysCount);
    }
    return result;
  }, [dateRange]);

  const months = useMemo(() => {
    const result: { date: Date; daysCount: number }[] = [];
    const current = new Date(dateRange.start);
    current.setDate(1);
    current.setHours(0, 0, 0, 0);
    while (current <= dateRange.end) {
      const monthStart = new Date(current);
      if (monthStart < dateRange.start) {
        monthStart.setTime(dateRange.start.getTime());
      }

      const monthEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
      );
      if (monthEnd > dateRange.end) {
        monthEnd.setTime(dateRange.end.getTime());
      }
      monthEnd.setHours(23, 59, 59, 999);

      const daysCount = Math.round(
        (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      result.push({
        date: new Date(current),
        daysCount,
      });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [dateRange]);

  function toDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

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

  const renderDayHeader = () => (
    <div className="flex h-full" style={{ minWidth: totalWidth }}>
      {days.map((day, index) => (
        <div
          key={index}
          className={`flex flex-col items-center justify-center text-xs border-r border-slate-300/50 ${
            isToday(day)
              ? "bg-[var(--vibrant-blue)]/10 text-[var(--vibrant-blue)] font-black"
              : isWeekend(day)
                ? "text-[var(--muted-foreground)] bg-[var(--accent)]"
                : "text-[var(--muted-foreground)]"
          }`}
          style={{ width: dayWidth, height: "100%" }}
        >
          <span className="text-[10px] uppercase font-black tracking-tighter opacity-50">
            {formatWeekday(day)}
          </span>
          <span className="text-sm">{formatDay(day)}</span>
        </div>
      ))}
    </div>
  );

  const renderWeekHeader = () => (
    <div className="flex h-full" style={{ minWidth: totalWidth }}>
      {weeks.map((week, index) => (
        <div
          key={index}
          className={`flex-shrink-0 flex flex-col items-start justify-center text-xs border-r border-slate-300/50 px-4 ${
            index % 2 === 0 ? "bg-[var(--secondary)]/20" : ""
          }`}
          style={{
            width: week.daysCount * dayWidth,
            height: "100%",
          }}
        >
          <span className="text-xs font-medium text-[var(--foreground)] whitespace-nowrap">
            {t("gantt.week")} {getWeekNumber(week.start)}
          </span>
          <span className="text-[10px] font-medium text-[var(--muted-foreground)] opacity-60 whitespace-nowrap">
            {formatDateRange(week.start, week.end)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderMonthHeader = () => (
    <div className="flex h-full" style={{ minWidth: totalWidth }}>
      {months.map((monthData, index) => (
        <div
          key={index}
          className="flex-shrink-0 flex flex-col items-start justify-center text-xs border-r border-slate-300/50 text-[var(--foreground)] px-4"
          style={{
            width: monthData.daysCount * dayWidth,
            height: "100%",
          }}
        >
          <span className="text-xs font-medium whitespace-nowrap">
            {formatMonth(monthData.date)}
          </span>
          <span className="text-[10px] font-medium text-[var(--muted-foreground)] opacity-60 whitespace-nowrap">
            {monthData.date.getFullYear()}
          </span>
        </div>
      ))}
    </div>
  );

  const getPositionAndWidth = useCallback(
    (task: Task) => {
      const taskStart = toDateOnly(new Date(task.startDate));
      const taskEnd = toDateOnly(new Date(task.endDate));
      const viewStart = toDateOnly(new Date(dateRange.start));

      const daysOffset = Math.floor(
        (taskStart.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const duration =
        Math.floor(
          (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

      const left = daysOffset * dayWidth;
      const width = Math.max(duration * dayWidth - 4, dayWidth);

      return { left, width };
    },
    [dateRange.start, dayWidth],
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isDraggingRef.current || isScrollSyncing.current) return;
    isScrollSyncing.current = true;

    const target = e.currentTarget;

    if (
      headerRef.current &&
      headerRef.current.scrollLeft !== target.scrollLeft
    ) {
      headerRef.current.scrollLeft = target.scrollLeft;
    }

    if (
      taskListScrollRef.current &&
      taskListScrollRef.current.scrollTop !== target.scrollTop
    ) {
      taskListScrollRef.current.scrollTop = target.scrollTop;
    }

    requestAnimationFrame(() => {
      isScrollSyncing.current = false;
    });
  };

  const handleTaskListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isDraggingRef.current || isScrollSyncing.current) return;
    isScrollSyncing.current = true;

    const target = e.currentTarget;

    if (
      ganttContentRef.current &&
      ganttContentRef.current.scrollTop !== target.scrollTop
    ) {
      ganttContentRef.current.scrollTop = target.scrollTop;
    }

    requestAnimationFrame(() => {
      isScrollSyncing.current = false;
    });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 200), 600);
      setLeftPanelWidth(newWidth);
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    if (
      ganttContentRef.current &&
      ganttContentRef.current.scrollLeft !== e.currentTarget.scrollLeft
    ) {
      ganttContentRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const smoothScrollTo = (container: HTMLElement, targetScrollLeft: number) => {
    const startScrollLeft = container.scrollLeft;
    const duration = 300;
    const startTime = performance.now();

    const easeInOutQuad = (t: number) => {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentScrollLeft =
        startScrollLeft +
        (targetScrollLeft - startScrollLeft) * easeInOutQuad(progress);
      container.scrollLeft = currentScrollLeft;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const scrollToTask = (task: Task) => {
    if (!ganttContentRef.current) return;
    const { left } = getPositionAndWidth(task);
    const container = ganttContentRef.current;
    const targetScrollLeft = Math.max(
      0,
      left - container.clientWidth / 2 + dayWidth * 3,
    );
    smoothScrollTo(container, targetScrollLeft);
  };

  const scrollToToday = () => {
    if (!ganttContentRef.current) return;
    const today = new Date();
    const viewStart = new Date(dateRange.start);
    const daysOffset = Math.floor(
      (today.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const left = daysOffset * dayWidth;
    const container = ganttContentRef.current;
    const targetScrollLeft = Math.max(
      0,
      left - container.clientWidth / 2 + dayWidth * 3,
    );
    smoothScrollTo(container, targetScrollLeft);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    navigate(`/subtask/${task.id}`);
  };

  const handleTaskListClick = (task: Task) => {
    setSelectedTaskId(task.id);
    scrollToTask(task);
  };

  const handleReorderTasks = (activeId: string, overId: string) => {
    if (!projectId) return;
    reorderTasks(projectId, activeId, overId);
  };

  const handleDragUpdate = (taskId: string, deltaDays: number) => {
    if (!projectId || deltaDays === 0 || !project) return;
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const duration = Math.ceil(
      (new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const taskStart = new Date(task.startDate);
    taskStart.setDate(taskStart.getDate() + deltaDays);
    const taskEnd = new Date(taskStart);
    taskEnd.setDate(taskEnd.getDate() + duration);

    setHasDragged(true);
    updateTask(projectId, taskId, {
      startDate: taskStart,
      endDate: taskEnd,
    });
    setTimeout(() => setHasDragged(false), 0);
  };

  const handleResizeUpdate = (
    taskId: string,
    edge: "left" | "right",
    deltaDays: number,
  ) => {
    if (!projectId || deltaDays === 0 || !project) return;
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setHasDragged(true);

    if (edge === "right") {
      const newEnd = new Date(task.endDate);
      newEnd.setDate(newEnd.getDate() + deltaDays);
      if (newEnd > task.startDate) {
        updateTask(projectId, taskId, { endDate: newEnd });
      }
    } else {
      const newStart = new Date(task.startDate);
      newStart.setDate(newStart.getDate() + deltaDays);
      if (newStart < task.endDate) {
        updateTask(projectId, taskId, { startDate: newStart });
      }
    }
    setTimeout(() => setHasDragged(false), 0);
  };

  const handleCreateTask = (task: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    isMilestone: boolean;
    color: string;
  }) => {
    if (!projectId || !task.name.trim()) return;
    addTask(projectId, {
      name: task.name,
      description: task.description,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
      dependencies: [],
      isMilestone: task.isMilestone,
      color: task.color,
    });
    setIsCreateOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!projectId) return;
    deleteTask(projectId, taskId);
    setSelectedTaskId(null);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    if (!projectId) return;
    updateTask(projectId, taskId, updates);
  };

  const [draggingTask, setDraggingTask] = useState<{
    taskId: string;
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);

  const [resizingTask, setResizingTask] = useState<{
    taskId: string;
    startX: number;
    edge: "left" | "right";
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!projectId) return;

      if (draggingTask) {
        e.preventDefault();
        const deltaX = e.clientX - draggingTask.startX;
        const deltaDays = Math.round(deltaX / dayWidth);

        if (Math.abs(deltaDays) > 0 || Math.abs(deltaX) > 5) {
          setHasDragged(true);
        }

        if (deltaDays !== 0) {
          const duration = Math.ceil(
            (draggingTask.originalEnd.getTime() -
              draggingTask.originalStart.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          const taskStart = new Date(draggingTask.originalStart);
          taskStart.setDate(taskStart.getDate() + deltaDays);
          const taskEnd = new Date(taskStart);
          taskEnd.setDate(taskEnd.getDate() + duration);

          updateTask(projectId, draggingTask.taskId, {
            startDate: taskStart,
            endDate: taskEnd,
          });
        }
      }

      if (resizingTask) {
        e.preventDefault();
        const deltaX = e.clientX - resizingTask.startX;
        const deltaDays = Math.round(deltaX / dayWidth);

        if (Math.abs(deltaDays) > 0 || Math.abs(deltaX) > 5) {
          setHasDragged(true);
        }

        if (deltaDays !== 0) {
          if (resizingTask.edge === "right") {
            const newEnd = new Date(resizingTask.originalEnd);
            newEnd.setDate(newEnd.getDate() + deltaDays);
            if (newEnd > resizingTask.originalStart) {
              updateTask(projectId, resizingTask.taskId, { endDate: newEnd });
            }
          } else {
            const newStart = new Date(resizingTask.originalStart);
            newStart.setDate(newStart.getDate() + deltaDays);
            if (newStart < resizingTask.originalEnd) {
              updateTask(projectId, resizingTask.taskId, {
                startDate: newStart,
              });
            }
          }
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingTask(null);
      setResizingTask(null);
      isDraggingRef.current = false;
      if (ganttContentRef.current) {
        ganttContentRef.current.style.overflow = "auto";
      }
      setTimeout(() => setHasDragged(false), 0);
    };

    if (draggingTask || resizingTask) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.overflow = "hidden";
      document.body.style.userSelect = "none";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.overflow = "";
      document.body.style.userSelect = "";
      document.documentElement.style.overflow = "";
    };
  }, [draggingTask, resizingTask, projectId, dayWidth, updateTask]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setDateRangeVersion((v) => v + 1);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const exportDateRange = useMemo(() => {
    const tasks = project?.tasks || [];
    if (tasks.length === 0) return dateRange;

    const taskDates = tasks.flatMap((task) => [
      new Date(task.startDate),
      new Date(task.endDate),
    ]);
    const start = new Date(Math.min(...taskDates.map((d) => d.getTime())));
    const end = new Date(Math.max(...taskDates.map((d) => d.getTime())));

    // Add small buffer for export
    start.setDate(start.getDate() - 2);
    end.setDate(end.getDate() + 2);

    // Align to view mode boundaries for cleaner look
    if (viewMode === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      const endDay = end.getDay();
      end.setDate(end.getDate() + (6 - endDay));
    } else if (viewMode === "month") {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }, [project?.tasks, viewMode, dateRange]);

  const exportDays = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(exportDateRange.start);
    while (current <= exportDateRange.end) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [exportDateRange]);

  const exportWeeks = useMemo(() => {
    const result: { start: Date; end: Date; daysCount: number }[] = [];
    const current = new Date(exportDateRange.start);
    current.setHours(0, 0, 0, 0);
    current.setDate(current.getDate() - ((current.getDay() + 6) % 7));
    while (current <= exportDateRange.end) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > exportDateRange.end) {
        weekEnd.setTime(exportDateRange.end.getTime());
      }
      const daysCount =
        Math.round(
          (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;
      result.push({ start: weekStart, end: weekEnd, daysCount });
      current.setDate(current.getDate() + 7);
    }
    return result;
  }, [exportDateRange]);

  const exportMonths = useMemo(() => {
    const result: { date: Date; daysCount: number }[] = [];
    const current = new Date(exportDateRange.start);
    current.setDate(1);
    while (current <= exportDateRange.end) {
      const monthStart = new Date(current);
      if (monthStart < exportDateRange.start)
        monthStart.setTime(exportDateRange.start.getTime());
      const monthEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
      );
      if (monthEnd > exportDateRange.end)
        monthEnd.setTime(exportDateRange.end.getTime());
      const daysCount =
        Math.round(
          (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;
      result.push({ date: new Date(current), daysCount });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [exportDateRange]);

  const getExportPositionAndWidth = useCallback(
    (task: Task) => {
      const taskStart = toDateOnly(new Date(task.startDate));
      const taskEnd = toDateOnly(new Date(task.endDate));
      const viewStart = toDateOnly(new Date(exportDateRange.start));
      const daysOffset = Math.floor(
        (taskStart.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const duration =
        Math.floor(
          (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;
      const left = daysOffset * dayWidth;
      const width = Math.max(duration * dayWidth - 4, dayWidth);
      return { left, width };
    },
    [exportDateRange.start, dayWidth],
  );

  const handleExportExcel = async () => {
    if (!project) return;
    setIsExporting(true);
    try {
      await exportGanttToExcel({
        projectName: project.name,
        tasks: visibleTasks,
        viewMode,
        dateRange: exportDateRange,
        t,
        language: i18n.language,
        countsByParent,
      });
      toast.success(
        t("gantt.exportExcelSuccess") || "Excel exported successfully",
      );
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast.error(t("gantt.exportExcelError") || "Failed to export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!exportContainerRef.current || !project) return;

    // Create a new promise and store its resolver
    const readyPromise = new Promise<void>((resolve) => {
      exportReadyResolver.current = resolve;
    });

    setIsExporting(true);

    try {
      // Wait for the GanttExportImage component to signal it's ready
      // This is dynamic and handles small/large task lists reliably
      await readyPromise;

      const element = exportContainerRef.current;
      const targetElement =
        (element.firstElementChild as HTMLElement) || element;

      const dataUrl = await toPng(targetElement, {
        quality: 1,
        pixelRatio: 3, // High quality 3x resolution
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `${project.name}_gantt_${viewMode}_${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(
        t("gantt.exportImageSuccess") || "Image exported successfully",
      );
    } catch (error) {
      console.error("Failed to export image:", error);
      toast.error(t("gantt.exportImageError") || "Failed to export image");
    } finally {
      setIsExporting(false);
      exportReadyResolver.current = null;
    }
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6">
          <Calendar className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">
          Project not found
        </h2>
        <Button variant="ghost" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const visibleTasks = project.tasks;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] text-[var(--foreground)]">
      <GanttHeader
        projectName={project.name}
        projectDescription={project.description}
        projectStartDate={project.startDate}
        projectEndDate={project.endDate}
        taskCount={project.tasks.length}
        viewMode={viewMode}
        zoomLevel={zoomLevel}
        isRefreshing={isRefreshing}
        isExporting={isExporting}
        onBack={() => navigate("/projects")}
        onViewModeChange={setViewMode}
        onZoomIn={() => setZoomLevel((prev) => Math.min(prev * 1.5, 4))}
        onZoomOut={() => setZoomLevel((prev) => Math.max(prev / 1.5, 0.25))}
        onScrollToToday={scrollToToday}
        onRefresh={handleRefresh}
        onCreateTask={() => setIsCreateOpen(true)}
        onExport={(type) => {
          if (type === "image") {
            handleExportImage();
          } else {
            handleExportExcel();
          }
        }}
      />

      <CreateTaskDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateTask}
      />

      <div className="flex flex-col flex-1 overflow-hidden rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl shadow-black/5">
        <div className="flex shrink-0">
          <div
            className="border-r border-[var(--border)] bg-[var(--card)] flex-shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.04)]"
            style={{ width: leftPanelWidth }}
          >
            <div className="h-14 px-3 flex items-center justify-between bg-gradient-to-r from-[var(--secondary)]/80 to-[var(--card)]">
              <span className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em]">
                {t("task.title")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="h-8 w-8 p-0 hover:bg-[var(--vibrant-blue)]/10 hover:text-[var(--vibrant-blue)] text-[var(--muted-foreground)] transition-all duration-200"
                title={t("task.create")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className={`w-1 cursor-col-resize hover:bg-[var(--vibrant-blue)]/50 active:bg-[var(--vibrant-blue)] transition-colors flex-shrink-0 ${
              isResizing ? "bg-[var(--vibrant-blue)]" : "bg-[var(--border)]"
            }`}
            onMouseDown={handleMouseDown}
          />

          <div
            className="flex-1 min-w-0 h-14 border-b border-[var(--border)] bg-[var(--card)] overflow-x-hidden overflow-y-scroll scrollbar-visible shadow-sm shrink-0 dark:shadow-none"
            ref={headerRef}
          >
            <div
              className="flex h-full"
              style={{ minWidth: days.length * dayWidth }}
            >
              {viewMode === "day" && renderDayHeader()}
              {viewMode === "week" && renderWeekHeader()}
              {viewMode === "month" && renderMonthHeader()}
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div
            ref={taskListScrollRef}
            className="border-r border-[var(--border)] bg-[var(--card)] flex-shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.04)] overflow-hidden"
            style={{ width: leftPanelWidth }}
            onScroll={handleTaskListScroll}
          >
            <TaskListPanel
              tasks={visibleTasks}
              selectedTaskId={selectedTaskId}
              onTaskSelect={handleTaskListClick}
              onReorderTasks={handleReorderTasks}
              hasDragged={hasDragged}
            />
          </div>

          <div
            className={`w-1 cursor-col-resize hover:bg-[var(--vibrant-blue)]/50 active:bg-[var(--vibrant-blue)] transition-colors flex-shrink-0 ${
              isResizing ? "bg-[var(--vibrant-blue)]" : "bg-[var(--border)]"
            }`}
            onMouseDown={handleMouseDown}
          />

          <GanttChart
            tasks={visibleTasks}
            dayWidth={dayWidth}
            days={days}
            selectedTaskId={selectedTaskId}
            getPositionAndWidth={getPositionAndWidth}
            onTaskClick={handleTaskClick}
            hasDragged={hasDragged}
            onDragUpdate={handleDragUpdate}
            onResizeUpdate={handleResizeUpdate}
            onScroll={handleScroll}
            ganttRef={ganttContentRef}
          />
        </div>
      </div>

      <div
        ref={exportContainerRef}
        style={{
          position: "fixed",
          left: "-10000px",
          top: "0",
          width: "fit-content",
          height: "fit-content",
          pointerEvents: "none",
          zIndex: -100,
          display: isExporting ? "block" : "none",
        }}
      >
        {isExporting && (
          <GanttExportImage
            projectName={project.name}
            tasks={visibleTasks}
            dayWidth={dayWidth}
            viewMode={viewMode}
            days={exportDays}
            weeks={exportWeeks}
            months={exportMonths}
            dateRange={exportDateRange}
            getPositionAndWidth={getExportPositionAndWidth}
            countsByParent={countsByParent}
            onReady={handleExportReady}
          />
        )}
      </div>
    </div>
  );
};

export default GanttPage;
