import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Locate,
  RefreshCw,
  Plus,
  Download,
  Loader2,
  FileSpreadsheet,
  Image,
  Calendar,
  FileText,
} from "lucide-react";
import { Button } from "@goalify/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@goalify/ui";

type ViewMode = "day" | "week" | "month";

interface GanttHeaderProps {
  projectName: string;
  projectDescription?: string;
  projectStartDate?: Date;
  projectEndDate?: Date;
  taskCount: number;
  viewMode: ViewMode;
  zoomLevel: number;
  isRefreshing: boolean;
  isExporting?: boolean;
  onBack: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onScrollToToday: () => void;
  onRefresh: () => void;
  onCreateTask: () => void;
  onExport: (type: "image" | "excel") => void;
}

const GanttHeader: React.FC<GanttHeaderProps> = ({
  projectName,
  projectDescription,
  projectStartDate,
  projectEndDate,
  taskCount,
  viewMode,
  zoomLevel,
  isRefreshing,
  isExporting = false,
  onBack,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onScrollToToday,
  onRefresh,
  onCreateTask,
  onExport,
}) => {
  const { t, i18n } = useTranslation();

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-[var(--secondary)] text-[var(--foreground)]"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] bg-clip-text text-transparent">
              {projectName}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1 font-medium">
              {taskCount} {t("task.title").toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-xl p-1 shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomOut}
              disabled={zoomLevel <= 0.25}
              className="h-8 w-8 text-[var(--foreground)]"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-[var(--muted-foreground)] w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomIn}
              disabled={zoomLevel >= 4}
              className="h-8 w-8 text-[var(--foreground)]"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onScrollToToday}
            className="gap-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)] shadow-sm font-medium rounded-lg h-9 px-3"
          >
            <Locate className="h-4 w-4 text-[var(--vibrant-blue)]" />
            {t("gantt.today")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting}
                className="gap-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)] shadow-sm font-medium rounded-lg h-9 px-3"
                title={t("gantt.export") || "Export"}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--vibrant-blue)]" />
                ) : (
                  <Download className="h-4 w-4 text-[var(--vibrant-blue)]" />
                )}
                {t("gantt.export") || "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onExport("image")}>
                <Image className="mr-2 h-4 w-4" />
                {t("gantt.exportImage") || "Export as Image"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("excel")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t("gantt.exportExcel") || "Export as Excel"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)] shadow-sm font-medium rounded-lg h-9 px-3"
            title={t("gantt.refreshRange") || "Refresh date range"}
          >
            <RefreshCw
              className={`h-4 w-4 text-[var(--vibrant-blue)] ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <div className="flex items-center bg-[var(--secondary)] rounded-lg p-1">
            <button
              onClick={() => onViewModeChange("day")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === "day"
                  ? "bg-[var(--card)] text-[var(--vibrant-blue)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {t("gantt.viewDay")}
            </button>
            <button
              onClick={() => onViewModeChange("week")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === "week"
                  ? "bg-[var(--card)] text-[var(--vibrant-blue)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {t("gantt.viewWeek")}
            </button>
            <button
              onClick={() => onViewModeChange("month")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === "month"
                  ? "bg-[var(--card)] text-[var(--vibrant-blue)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {t("gantt.viewMonth")}
            </button>
          </div>

          <Button
            className="bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] hover:opacity-90 text-white shadow-lg shadow-blue-500/30 rounded-lg font-medium border-none h-9 px-4"
            onClick={onCreateTask}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("task.create")}
          </Button>
        </div>
      </div>

      {/* Project Info */}
      {(projectDescription || projectStartDate || projectEndDate) && (
        <div className="flex flex-wrap items-center gap-4 pl-[60px]">
          {projectDescription && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <FileText className="h-4 w-4 text-[var(--vibrant-blue)]" />
              <span className="line-clamp-1 max-w-md">
                {projectDescription}
              </span>
            </div>
          )}
          {(projectStartDate || projectEndDate) && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] bg-[var(--secondary)]/50 px-3 py-1.5 rounded-lg">
              <Calendar className="h-4 w-4 text-[var(--vibrant-blue)]" />
              <span>
                {formatDate(projectStartDate)} — {formatDate(projectEndDate)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GanttHeader;
