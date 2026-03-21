import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@goalify/ui";
import ImageUpload from "./ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@goalify/ui";
import { Input } from "@goalify/ui";
import { Label } from "@goalify/ui";
import { DatePicker } from "@goalify/ui";
import type { Project } from "../contexts/GanttContext";
import { useFormValidation, ValidationRules } from "../hooks/useFormValidation";

interface ProjectFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: Project;
  onSubmit: (data: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    icon?: string;
  }) => void;
}

interface FormValues {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  icon?: string;
}

const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  isOpen,
  onOpenChange,
  mode,
  project,
  onSubmit,
}) => {
  const { t, i18n } = useTranslation();

  const defaultInitialValues = useMemo<FormValues>(
    () => ({
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }),
    [],
  );

  const initialValues = useMemo<FormValues>(() => {
    if (mode === "edit" && project) {
      return {
        name: project.name,
        description: project.description,
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
        icon: project.icon,
      };
    }
    return defaultInitialValues;
  }, [mode, project, defaultInitialValues]);

  const validationRules = useMemo<ValidationRules<FormValues>>(
    () => ({
      name: {
        required: t("project.validation.nameRequired"),
        maxLength: {
          value: 50,
          message: t("project.validation.nameTooLong"),
        },
      },
      startDate: {
        required: t("project.validation.startDateRequired"),
      },
      endDate: {
        required: t("project.validation.endDateRequired"),
      },
    }),
    [t],
  );

  const crossFieldValidate = useMemo(
    () => (vals: FormValues) => {
      const crossErrors: Record<string, string> = {};
      if (vals.startDate && vals.endDate && vals.endDate < vals.startDate) {
        crossErrors.endDate = t("project.validation.endDateBeforeStart");
      }
      return crossErrors;
    },
    [t],
  );

  const {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
  } = useFormValidation<FormValues>({
    rules: validationRules,
    initialValues,
    crossFieldValidate,
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [isOpen, initialValues, reset]);

  const handleSubmit = () => {
    if (validateAll()) {
      onSubmit(values);
      onOpenChange(false);
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setValue("startDate", date);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setValue("endDate", date);
    }
  };

  const isCreate = mode === "create";
  const title = isCreate ? t("project.create") : t("project.edit");
  const description = isCreate
    ? t("project.createFirst")
    : t("project.editDescription");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {isCreate && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-[var(--vibrant-blue)] to-[var(--vibrant-violet)] hover:opacity-90 text-white shadow-lg shadow-blue-500/20 rounded-xl font-bold px-4 h-10 border-none">
            + {t("project.create")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] rounded-[32px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
          <DialogDescription className="text-[var(--muted-foreground)]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="flex items-center gap-4">
            <ImageUpload
              value={values.icon}
              onChange={(icon) => setValue("icon", icon)}
            />
            <div className="flex flex-col gap-1">
              <Label className="font-bold ml-1">{t("project.icon")}</Label>
              <span className="text-xs text-[var(--muted-foreground)] ml-1">
                {t("imageUpload.hint")}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor={isCreate ? "name" : "edit-name"}
              className="font-bold ml-1"
            >
              {t("project.name")}
            </Label>
            <Input
              id={isCreate ? "name" : "edit-name"}
              value={values.name}
              onChange={(e) => setValue("name", e.target.value)}
              onBlur={() => setFieldTouched("name")}
              placeholder="My Project"
              className={`bg-[var(--secondary)] border-[var(--border)] rounded-xl h-12 px-4 focus:ring-2 focus:ring-[var(--vibrant-blue)] ${touched.name && errors.name ? "border-red-500" : ""}`}
            />
            {touched.name && errors.name && (
              <p className="text-red-500 text-sm ml-1">{errors.name}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor={isCreate ? "description" : "edit-description"}
              className="font-bold ml-1"
            >
              {t("project.description")}
            </Label>
            <Input
              id={isCreate ? "description" : "edit-description"}
              value={values.description}
              onChange={(e) => setValue("description", e.target.value)}
              placeholder="Project description"
              className="bg-[var(--secondary)] border-[var(--border)] rounded-xl h-12 px-4 focus:ring-2 focus:ring-[var(--vibrant-blue)]"
            />
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor={isCreate ? "startDate" : "edit-startDate"}
                  className="font-bold ml-1"
                >
                  {t("project.startDate")}
                </Label>
                <DatePicker
                  value={values.startDate}
                  locale={i18n.language}
                  onChange={handleStartDateChange}
                />
                {touched.startDate && errors.startDate && (
                  <p className="text-red-500 text-sm ml-1">
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor={isCreate ? "endDate" : "edit-endDate"}
                  className="font-bold ml-1"
                >
                  {t("project.endDate")}
                </Label>
                <DatePicker
                  value={values.endDate}
                  locale={i18n.language}
                  onChange={handleEndDateChange}
                />
              </div>
            </div>
            {errors.endDate && (
              <p className="text-red-500 text-sm ml-1">{errors.endDate}</p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-12 font-bold border-[var(--border)]"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[var(--vibrant-blue)] hover:bg-[var(--vibrant-blue)]/90 text-white font-bold rounded-xl h-12 px-8 shadow-md"
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormDialog;
