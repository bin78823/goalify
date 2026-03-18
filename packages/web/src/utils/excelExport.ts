import * as ExcelJS from "exceljs";
import type { Task } from "../contexts/GanttContext";

type ViewMode = "day" | "week" | "month";

interface ExcelExportOptions {
  projectName: string;
  tasks: Task[];
  viewMode: ViewMode;
  dateRange: { start: Date; end: Date };
  t: (key: string) => string;
}

const hexToARGB = (hex: string): string => {
  if (!hex || typeof hex !== "string") return "FF64748B";
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    const r = cleanHex[0] + cleanHex[0];
    const g = cleanHex[1] + cleanHex[1];
    const b = cleanHex[2] + cleanHex[2];
    return `FF${r}${g}${b}`.toUpperCase();
  }
  if (cleanHex.length === 6) {
    return `FF${cleanHex}`.toUpperCase();
  }
  return "FF64748B";
};

const hexToRgbObject = (hex: string): { r: number; g: number; b: number } => {
  const cleanHex = hex.replace("#", "");
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

interface MonthGroup {
  label: string;
  startIndex: number;
  endIndex: number;
}

interface WeekGroup {
  label: string;
  startIndex: number;
  endIndex: number;
}

const groupDaysByMonth = (days: Date[]): MonthGroup[] => {
  const groups: MonthGroup[] = [];
  let currentGroup: MonthGroup | null = null;

  days.forEach((day, index) => {
    const monthKey = `${day.getFullYear()}-${day.getMonth()}`;

    if (!currentGroup || currentGroup.label !== monthKey) {
      currentGroup = {
        label: monthKey,
        startIndex: index,
        endIndex: index,
      };
      groups.push(currentGroup);
    } else {
      currentGroup.endIndex = index;
    }
  });

  return groups;
};

const groupDaysByWeek = (days: Date[]): WeekGroup[] => {
  const groups: WeekGroup[] = [];
  let currentGroup: WeekGroup | null = null;

  days.forEach((day, index) => {
    // Get ISO week number
    const weekNum = getWeekNumber(day);
    const weekKey = `${day.getFullYear()}-W${weekNum}`;

    if (!currentGroup || currentGroup.label !== weekKey) {
      currentGroup = {
        label: weekKey,
        startIndex: index,
        endIndex: index,
      };
      groups.push(currentGroup);
    } else {
      currentGroup.endIndex = index;
    }
  });

  return groups;
};

export const exportGanttToExcel = async ({
  projectName,
  tasks,
  viewMode,
  dateRange,
  t,
}: ExcelExportOptions) => {
  try {
    const workbook = new ExcelJS.Workbook();

    let sheetName = t("gantt.title");
    if (sheetName === "gantt.title" || !sheetName) {
      sheetName = projectName || "Gantt";
    }
    const safeSheetName = sheetName
      .substring(0, 31)
      .replace(/[\\\?\/\*\[\]]/g, "");
    const worksheet = workbook.addWorksheet(safeSheetName);

    // Setup Days
    const days: Date[] = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (days.length > 2000) break;
    }

    // Columns
    const basicColsCount = 5;
    worksheet.getColumn(1).width = 28;
    worksheet.getColumn(2).width = 14;
    worksheet.getColumn(3).width = 14;
    worksheet.getColumn(4).width = 12;
    worksheet.getColumn(5).width = 12;

    const timeColWidth = viewMode === "day" ? 3 : viewMode === "week" ? 2.5 : 2;
    for (let i = 0; i < days.length; i++) {
      worksheet.getColumn(basicColsCount + i + 1).width = timeColWidth;
    }

    // Row 1: Project Title
    const titleRow = worksheet.getRow(1);
    titleRow.height = 36;
    titleRow.getCell(1).value = projectName || "Project";
    titleRow.getCell(1).font = {
      bold: true,
      size: 16,
      color: { argb: "FF2563EB" },
    };
    worksheet.mergeCells(1, 1, 1, basicColsCount + days.length);
    titleRow.getCell(1).alignment = {
      vertical: "middle",
      horizontal: "left",
      indent: 1,
    };

    // Row 2: Subtitle (task count + date range)
    const subtitleRow = worksheet.getRow(2);
    subtitleRow.height = 24;
    subtitleRow.getCell(1).value =
      `${tasks.length} ${t("task.title") || "Tasks"} · ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
    subtitleRow.getCell(1).font = {
      size: 10,
      color: { argb: "FF64748B" },
    };
    worksheet.mergeCells(2, 1, 2, basicColsCount + days.length);
    subtitleRow.getCell(1).alignment = {
      vertical: "middle",
      horizontal: "left",
      indent: 1,
    };

    // Row 3: Month/Year headers (merged)
    const monthRow = worksheet.getRow(3);
    monthRow.height = 24;

    const monthGroups = groupDaysByMonth(days);
    monthGroups.forEach((group) => {
      const firstDay = days[group.startIndex];
      const label =
        viewMode === "day" || viewMode === "week"
          ? `${firstDay.getFullYear()}/${firstDay.getMonth() + 1}`
          : `${firstDay.getFullYear()}`;

      const startCol = basicColsCount + group.startIndex + 1;
      const endCol = basicColsCount + group.endIndex + 1;
      const colSpan = endCol - startCol + 1;

      const cell = monthRow.getCell(startCol);
      cell.value = label;
      cell.font = { bold: true, size: 10, color: { argb: "FF64748B" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8EAEC" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      if (colSpan > 1) {
        worksheet.mergeCells(3, startCol, 3, endCol);
      }
    });

    // Row 4: Day headers
    const dayHeaderRow = worksheet.getRow(4);
    dayHeaderRow.height = 28;

    // Task info column headers
    dayHeaderRow.getCell(1).value =
      t("task.name") === "task.name" ? "Task Name" : t("task.name");
    dayHeaderRow.getCell(2).value =
      t("task.startDate") === "task.startDate" ? "Start" : t("task.startDate");
    dayHeaderRow.getCell(3).value =
      t("task.endDate") === "task.endDate" ? "End" : t("task.endDate");
    dayHeaderRow.getCell(4).value =
      t("task.progress") === "task.progress" ? "Progress" : t("task.progress");
    dayHeaderRow.getCell(5).value =
      t("task.duration") === "task.duration" ? "Days" : t("task.duration");

    for (let i = 1; i <= basicColsCount; i++) {
      const cell = dayHeaderRow.getCell(i);
      cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF475569" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF334155" } },
        bottom: { style: "medium", color: { argb: "FF334155" } },
        left: { style: "thin", color: { argb: "FF334155" } },
        right: { style: "thin", color: { argb: "FF334155" } },
      };
    }

    // Date column headers with merging based on viewMode
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (viewMode === "day") {
      // Day view: Show weekday abbreviation (no merging)
      days.forEach((day, index) => {
        const colIndex = basicColsCount + index + 1;
        const cell = dayHeaderRow.getCell(colIndex);
        const dayOfWeek = day.getDay();
        const isSat = dayOfWeek === 6;
        const isSun = dayOfWeek === 0;
        const isTodayDate = isToday(day);

        cell.value = weekdays[dayOfWeek];

        if (isTodayDate) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E7FF" },
          };
          cell.font = { size: 9, bold: true, color: { argb: "FF2563EB" } };
        } else if (isSat) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEEF2FF" },
          };
          cell.font = { size: 9, color: { argb: "FF6366F1" } };
        } else if (isSun) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
          };
          cell.font = { size: 9, color: { argb: "FF94A3B8" } };
        } else {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" },
          };
          cell.font = { size: 9, color: { argb: "FF64748B" } };
        }

        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    } else if (viewMode === "week") {
      // Week view: Merge each week (Mon-Sun)
      const weekGroups = groupDaysByWeek(days);

      weekGroups.forEach((group) => {
        const startCol = basicColsCount + group.startIndex + 1;
        const endCol = basicColsCount + group.endIndex + 1;
        const firstDay = days[group.startIndex];
        const weekNum = getWeekNumber(firstDay);
        const label = `W${weekNum}`;

        const cell = dayHeaderRow.getCell(startCol);
        cell.value = label;
        cell.font = { size: 10, bold: true, color: { argb: "FF475569" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEF2FF" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };

        // Merge cells for this week
        worksheet.mergeCells(4, startCol, 4, endCol);
      });
    } else if (viewMode === "month") {
      // Month view: Merge each month
      const monthGroups = groupDaysByMonth(days);

      monthGroups.forEach((group) => {
        const startCol = basicColsCount + group.startIndex + 1;
        const endCol = basicColsCount + group.endIndex + 1;
        const firstDay = days[group.startIndex];
        const label = `${firstDay.getFullYear()}/${firstDay.getMonth() + 1}`;

        const cell = dayHeaderRow.getCell(startCol);
        cell.value = label;
        cell.font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF475569" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FF334155" } },
          bottom: { style: "medium", color: { argb: "FF334155" } },
          left: { style: "thin", color: { argb: "FF334155" } },
          right: { style: "thin", color: { argb: "FF334155" } },
        };

        // Merge cells for this month
        worksheet.mergeCells(4, startCol, 4, endCol);
      });
    }

    // Row 5+: Tasks
    const dataStartRow = 5;

    tasks.forEach((task, taskIndex) => {
      const rowIndex = dataStartRow + taskIndex;
      const row = worksheet.getRow(rowIndex);
      row.height = 40;

      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      const duration =
        Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

      // Task info columns
      const nameCell = row.getCell(1);
      nameCell.value = task.name;
      nameCell.font = { size: 11, bold: true, color: { argb: "FF1E293B" } };
      nameCell.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1,
      };
      nameCell.border = {
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      const startCell = row.getCell(2);
      startCell.value = startDate.toLocaleDateString();
      startCell.font = { size: 10, color: { argb: "FF64748B" } };
      startCell.alignment = { vertical: "middle", horizontal: "center" };
      startCell.border = {
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      const endCell = row.getCell(3);
      endCell.value = endDate.toLocaleDateString();
      endCell.font = { size: 10, color: { argb: "FF64748B" } };
      endCell.alignment = { vertical: "middle", horizontal: "center" };
      endCell.border = {
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      const progressCell = row.getCell(4);
      progressCell.value = `${task.progress}%`;
      progressCell.font = { size: 10, bold: true, color: { argb: "FF2563EB" } };
      progressCell.alignment = { vertical: "middle", horizontal: "center" };
      progressCell.border = {
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      const durationCell = row.getCell(5);
      durationCell.value = duration;
      durationCell.font = { size: 10, color: { argb: "FF64748B" } };
      durationCell.alignment = { vertical: "middle", horizontal: "center" };
      durationCell.border = {
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Gantt chart cells
      const taskColor = task.color || "#64748b";
      const taskColorARGB = hexToARGB(taskColor);
      const rgb = hexToRgbObject(taskColor);

      // Calculate lighter color for remaining progress
      const lighterRgb = {
        r: Math.min(255, rgb.r + 100),
        g: Math.min(255, rgb.g + 100),
        b: Math.min(255, rgb.b + 100),
      };
      const lighterColor =
        `FF${lighterRgb.r.toString(16).padStart(2, "0")}${lighterRgb.g.toString(16).padStart(2, "0")}${lighterRgb.b.toString(16).padStart(2, "0")}`.toUpperCase();

      days.forEach((day, dayIndex) => {
        const colIndex = basicColsCount + dayIndex + 1;
        const cell = row.getCell(colIndex);

        const dTime = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
        ).getTime();
        const sTime = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        ).getTime();
        const eTime = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
        ).getTime();
        const isSat = day.getDay() === 6;
        const isSun = day.getDay() === 0;
        const isTodayDate = isToday(day);

        if (dTime >= sTime && dTime <= eTime) {
          const totalDays = Math.max(1, (eTime - sTime) / 86400000 + 1);
          const currentDay = (dTime - sTime) / 86400000;
          const isDone = currentDay < totalDays * (task.progress / 100);

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isDone ? taskColorARGB : lighterColor },
          };

          // Subtle progress line
          if (
            isDone &&
            dTime - sTime > 0 &&
            dTime - sTime < totalDays * (task.progress / 100)
          ) {
            cell.border = {
              left: { style: "thin", color: { argb: "FFFFFFFF" } },
            };
          }

          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (isTodayDate) {
          // Today highlight - red line
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEE2E2" },
          };
          cell.border = {
            ...cell.border,
            left: { style: "medium", color: { argb: "FFEF4444" } },
          };
        } else if (isSat) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEEF2FF" },
          };
        } else if (isSun) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
          };
        }

        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: cell.border?.left || {
            style: "thin",
            color: { argb: "FFE2E8F0" },
          },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // Freeze panes
    worksheet.views = [
      {
        state: "frozen",
        xSplit: basicColsCount,
        ySplit: 4,
        topLeftCell: "F5",
      },
    ];

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const timestamp = new Date().toISOString().split("T")[0];
    const safeFileName = (projectName || "Gantt").replace(
      /[^a-z0-9\u4e00-\u9fa5]/gi,
      "_",
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFileName}_${timestamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  } catch (err) {
    console.error("Excel Export Error:", err);
    throw err;
  }
};
