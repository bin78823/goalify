import React from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import type { Task } from "../contexts/GanttContext";
import { TASK_COLORS } from "./CreateTaskDialog";

type ViewMode = "day" | "week" | "month";

interface DateInfo {
  start: Date;
  end: Date;
  daysCount: number;
}

interface MonthInfo {
  date: Date;
  daysCount: number;
}

const COLORS = {
  background: "#ffffff",
  foreground: "#0f172a",
  card: "#ffffff",
  secondary: "#f1f5f9",
  mutedForeground: "#64748b",
  border: "#e2e8f0",
  vibrantBlue: "#2563eb",
  vibrantViolet: "#8b5cf6",
};

interface GanttExportImageProps {
  projectName: string;
  tasks: Task[];
  dayWidth: number;
  viewMode: ViewMode;
  days: Date[];
  weeks: DateInfo[];
  months: MonthInfo[];
  dateRange: { start: Date; end: Date };
  getPositionAndWidth: (task: Task) => { left: number; width: number };
  onReady?: () => void;
}

const GanttExportImage: React.FC<GanttExportImageProps> = ({
  projectName,
  tasks,
  dayWidth,
  viewMode,
  days,
  weeks,
  months,
  dateRange,
  getPositionAndWidth,
  onReady,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (onReady) {
      // Use double rAF to ensure React commit AND browser paint are done
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onReady();
        });
      });
    }
  }, [onReady]);

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

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const totalWidth = days.length * dayWidth;
  const rowHeight = 56;
  const headerHeight = 56;
  const titleHeight = 60;
  const totalHeight =
    titleHeight + headerHeight + tasks.length * rowHeight + 80; // Added padding to prevent clipping

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
  };

  const renderDayHeader = () => (
    <div style={{ display: "flex", height: "100%", minWidth: totalWidth }}>
      {days.map((day, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            borderRight: "1px solid rgba(148, 163, 184, 0.5)",
            width: dayWidth,
            height: "100%",
            backgroundColor: isToday(day)
              ? "rgba(37, 99, 235, 0.1)"
              : isWeekend(day)
                ? "#f1f5f9"
                : "transparent",
            color: isToday(day) ? COLORS.vibrantBlue : COLORS.mutedForeground,
            fontWeight: isToday(day) ? 800 : 400,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              fontWeight: 800,
              letterSpacing: "-0.05em",
              opacity: 0.5,
            }}
          >
            {t(`date.weekdays.${day.getDay()}`)}
          </span>
          <span style={{ fontSize: "14px" }}>{day.getDate()}</span>
        </div>
      ))}
    </div>
  );

  const renderWeekHeader = () => (
    <div style={{ display: "flex", height: "100%", minWidth: totalWidth }}>
      {weeks.map((week, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            fontSize: "12px",
            borderRight: "1px solid rgba(148, 163, 184, 0.5)",
            padding: "0 16px",
            width: week.daysCount * dayWidth,
            height: "100%",
            minWidth: 120,
            backgroundColor:
              index % 2 === 0 ? "rgba(241, 245, 249, 0.2)" : "transparent",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: COLORS.foreground,
              whiteSpace: "nowrap",
            }}
          >
            {t("gantt.week")} {getWeekNumber(week.start)}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: COLORS.mutedForeground,
              opacity: 0.6,
              whiteSpace: "nowrap",
            }}
          >
            {week.start.getDate()}/{week.start.getMonth() + 1} -{" "}
            {week.end.getDate()}/{week.end.getMonth() + 1}
          </span>
        </div>
      ))}
    </div>
  );

  const renderMonthHeader = () => (
    <div style={{ display: "flex", height: "100%", minWidth: totalWidth }}>
      {months.map((monthData, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            fontSize: "12px",
            borderRight: "1px solid rgba(148, 163, 184, 0.5)",
            color: COLORS.foreground,
            padding: "0 16px",
            width: monthData.daysCount * dayWidth,
            height: "100%",
            minWidth: 100,
          }}
        >
          <span
            style={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}
          >
            {t(`date.months.${monthData.date.getMonth()}`)}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: COLORS.mutedForeground,
              opacity: 0.6,
              whiteSpace: "nowrap",
            }}
          >
            {monthData.date.getFullYear()}
          </span>
        </div>
      ))}
    </div>
  );

  const renderGridLines = () => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
      }}
    >
      {days.map((day, index) => (
        <div
          key={index}
          style={{
            borderRight: "1px solid rgba(148, 163, 184, 0.5)",
            width: dayWidth,
            backgroundColor: isToday(day)
              ? "rgba(37, 99, 235, 0.05)"
              : isWeekend(day)
                ? "#f8fafc"
                : "transparent",
          }}
        />
      ))}
    </div>
  );

  const renderTodayLine = () => {
    const todayIndex = days.findIndex((d) => isToday(d));
    if (todayIndex === -1) return null;
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: "#ef4444",
          zIndex: 5,
          left: todayIndex * dayWidth + dayWidth / 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            border: "2px solid white",
          }}
        />
      </div>
    );
  };

  const renderTaskBars = () => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      {tasks.map((task, index) => {
        const { left, width } = getPositionAndWidth(task);

        return (
          <div
            key={task.id}
            style={{
              position: "absolute",
              height: 48,
              display: "flex",
              alignItems: "center",
              left: left + 2,
              width: width,
              top: index * rowHeight + 8,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 36,
                borderRadius: 12,
                clipPath: "inset(0 round 12px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                background:
                  TASK_COLORS.find((c) => c.primary === task.color)?.gradient ||
                  task.color,
              }}
            >
              {task.progress < 100 && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: `${100 - task.progress}%`,
                    background: "rgba(0, 0, 0, 0.4)",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "white",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    letterSpacing: "-0.025em",
                    textTransform: "uppercase",
                  }}
                >
                  {task.name}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "rgba(255, 255, 255, 0.9)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {task.progress}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: COLORS.background,
        color: COLORS.foreground,
        width: Math.max(totalWidth + 320, 800),
        height: totalHeight,
        padding: 20,
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 24,
          border: `1px solid ${COLORS.border}`,
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          width: "100%",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            borderBottom: `1px solid ${COLORS.border}`,
            height: titleHeight,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `linear-gradient(to bottom right, ${COLORS.vibrantBlue}, ${COLORS.vibrantViolet})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar style={{ width: 20, height: 20, color: "white" }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  background: `linear-gradient(to right, ${COLORS.vibrantBlue}, ${COLORS.vibrantViolet})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  margin: 0,
                }}
              >
                {projectName}
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: COLORS.mutedForeground,
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {formatDate(dateRange.start)} - {formatDate(dateRange.end)} ·{" "}
                {tasks.length} {t("task.title").toLowerCase()}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: COLORS.mutedForeground,
                backgroundColor: COLORS.secondary,
                padding: "4px 12px",
                borderRadius: 9999,
              }}
            >
              {viewMode === "day"
                ? t("gantt.viewDay")
                : viewMode === "week"
                  ? t("gantt.viewWeek")
                  : t("gantt.viewMonth")}
            </span>
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <div
            style={{
              borderRight: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              flexShrink: 0,
              width: 280,
            }}
          >
            <div
              style={{
                height: 56,
                borderBottom: `1px solid ${COLORS.border}`,
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                background: `linear-gradient(to right, rgba(241, 245, 249, 0.8), ${COLORS.card})`,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: COLORS.mutedForeground,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                }}
              >
                {t("task.title")}
              </span>
            </div>
            {tasks.map((task, index) => (
              <div
                key={task.id}
                style={{
                  height: 56,
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderBottom: `1px solid rgba(226, 232, 240, 0.6)`,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    flexShrink: 0,
                    boxShadow: "0 0 0 2px white",
                    backgroundColor: task.color || "#64748b",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: COLORS.foreground,
                      margin: 0,
                    }}
                  >
                    {task.name}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(100, 116, 139, 0.8)",
                      margin: "2px 0 0 0",
                    }}
                  >
                    {Math.ceil(
                      (new Date(task.endDate).getTime() -
                        new Date(task.startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) + 1}{" "}
                    {t("task.duration")}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                    flexShrink: 0,
                    minWidth: 52,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 6,
                      backgroundColor: COLORS.secondary,
                      borderRadius: 9999,
                      overflow: "hidden",
                      boxShadow: "inset 0 0 0 1px rgba(226, 232, 240, 0.5)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 9999,
                        width: `${task.progress}%`,
                        backgroundColor: task.color || "#64748b",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: COLORS.mutedForeground,
                    }}
                  >
                    {task.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                height: 56,
                borderBottom: `1px solid ${COLORS.border}`,
                background: `linear-gradient(to right, rgba(241, 245, 249, 0.8), ${COLORS.card}, ${COLORS.card})`,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: "100%",
                  minWidth: totalWidth,
                }}
              >
                {viewMode === "day" && renderDayHeader()}
                {viewMode === "week" && renderWeekHeader()}
                {viewMode === "month" && renderMonthHeader()}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                position: "relative",
                height: tasks.length * rowHeight,
              }}
            >
              {renderGridLines()}
              {renderTaskBars()}
              {renderTodayLine()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttExportImage;
