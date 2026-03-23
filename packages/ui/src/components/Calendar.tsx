"use client";

import * as React from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { zhCN, zhTW, enUS, ja, de, fr } from "date-fns/locale";

import { cn } from "../lib/utils";
import { Button, buttonVariants } from "./Button";

const localeMap: Record<string, Locale> = {
  en: enUS,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ja,
  de,
  fr,
};

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  localeCode?: string;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  localeCode = "en",
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();
  const dateFnsLocale = locale || localeMap[localeCode] || enUS;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 group/calendar bg-[var(--popover)] rounded-xl border border-[var(--border)] shadow-lg",
        className,
      )}
      captionLayout={captionLayout}
      locale={dateFnsLocale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(dateFnsLocale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 min-h-[300px]",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 z-10",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant, size: "sm" }),
          "h-8 w-12 bg-[var(--secondary)] hover:bg-[var(--accent)] dark:hover:bg-[var(--accent)] border-0 shadow-none transition-colors rounded-lg",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant, size: "sm" }),
          "h-8 w-12 bg-[var(--secondary)] hover:bg-[var(--accent)] dark:hover:bg-[var(--accent)] border-0 shadow-none transition-colors rounded-lg",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center font-semibold text-[var(--foreground)]",
          defaultClassNames.month_caption,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex justify-between", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-[var(--muted-foreground)] w-9 font-normal text-[0.75rem] text-center mb-2 uppercase tracking-tight",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-0 justify-between", defaultClassNames.week),
        day: cn("relative p-0 text-center text-sm", defaultClassNames.day),
        outside: cn(
          "text-[var(--muted-foreground)] opacity-50",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-[var(--muted-foreground)] opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeft
                className={cn(
                  "h-4 w-4 text-[var(--muted-foreground)]",
                  className,
                )}
                {...props}
              />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-[var(--muted-foreground)]",
                  className,
                )}
                {...props}
              />
            );
          }

          return (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[var(--muted-foreground)]",
                className,
              )}
              {...props}
            />
          );
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={dateFnsLocale} {...props} />
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        "h-9 w-9 p-0 font-normal transition-all rounded-lg text-[var(--foreground)]",
        modifiers.selected &&
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:text-[var(--primary-foreground)] focus:bg-[var(--primary)] focus:text-[var(--primary-foreground)]",
        modifiers.today &&
          !modifiers.selected &&
          "bg-[var(--secondary)] text-[var(--foreground)] font-bold",
        className,
      )}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar, CalendarDayButton };
