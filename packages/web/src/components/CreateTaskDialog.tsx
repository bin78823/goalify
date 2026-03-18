import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@goalify/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@goalify/ui";
import { Input } from "@goalify/ui";
import { Label } from "@goalify/ui";
import { DatePicker } from "@goalify/ui";
import ProgressSliderWithMilestones from "./ProgressSliderWithMilestones";

export const TASK_COLORS = [
  {
    name: "Aurora Blue",
    primary: "#2563eb",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  },
  {
    name: "Neon Pink",
    primary: "#db2777",
    gradient: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)",
  },
  {
    name: "Emerald Wave",
    primary: "#059669",
    gradient: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
  },
  {
    name: "Sunset Orange",
    primary: "#ea580c",
    gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
  },
  {
    name: "Deep Violet",
    primary: "#7c3aed",
    gradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
  },
  {
    name: "Electric Cyan",
    primary: "#0891b2",
    gradient: "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
  },
];

interface TaskFormData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  isMilestone: boolean;
}

interface CreateTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (task: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    progress: number;
    isMilestone: boolean;
    color: string;
  }) => void;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  isOpen,
  onOpenChange,
  onCreate,
}) => {
  const { t, i18n } = useTranslation();
  const [newTask, setNewTask] = useState<TaskFormData>({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    progress: 0,
    isMilestone: false,
  });
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0]);

  const handleCreate = () => {
    if (!newTask.name.trim()) return;
    onCreate({
      name: newTask.name,
      description: newTask.description,
      startDate: new Date(newTask.startDate),
      endDate: new Date(newTask.endDate),
      progress: newTask.progress,
      isMilestone: newTask.isMilestone,
      color: selectedColor.primary,
    });
    setNewTask({
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      progress: 0,
      isMilestone: false,
    });
    setSelectedColor(TASK_COLORS[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("task.create")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="taskName" className="font-medium text-sm">
              {t("task.name")}
            </Label>
            <Input
              id="taskName"
              value={newTask.name}
              onChange={(e) =>
                setNewTask({ ...newTask, name: e.target.value })
              }
              placeholder="Task name"
              className={`bg-[var(--secondary)] border-[var(--border)] rounded-lg h-10 px-3 transition-all duration-200 focus:ring-2 focus:ring-[var(--vibrant-blue)] ${
                newTask.name.trim()
                  ? "border-l-[3px] border-l-[var(--vibrant-blue)] bg-[var(--accent)]"
                  : ""
              }`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="taskStart" className="font-medium text-sm">
                {t("task.startDate")}
              </Label>
              <DatePicker
                value={newTask.startDate}
                locale={i18n.language}
                onChange={(date) =>
                  date && setNewTask({ ...newTask, startDate: date })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taskEnd" className="font-medium text-sm">
                {t("task.endDate")}
              </Label>
              <DatePicker
                value={newTask.endDate}
                locale={i18n.language}
                onChange={(date) =>
                  date && setNewTask({ ...newTask, endDate: date })
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="progress" className="font-medium text-sm">
              {t("task.progress")}
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ProgressSliderWithMilestones
                  value={newTask.progress}
                  onChange={(value) =>
                    setNewTask({ ...newTask, progress: value })
                  }
                />
              </div>
              <span className="text-sm font-medium text-[var(--vibrant-blue)] w-10 text-right">
                {newTask.progress}%
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="font-medium text-sm">
              {t("task.color")}
            </Label>
            <div className="flex gap-2">
              {TASK_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`w-9 h-9 rounded-full transition-all duration-300 ${
                    selectedColor.name === color.name
                      ? "ring-4 ring-offset-2 ring-[var(--ring)] scale-110 shadow-lg"
                      : "hover:scale-110"
                  }`}
                  style={{ background: color.gradient }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-12 font-bold border-[var(--border)]"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-[var(--vibrant-blue)] hover:bg-[var(--vibrant-blue)]/90 text-white font-bold rounded-xl h-12 px-8 shadow-md"
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
