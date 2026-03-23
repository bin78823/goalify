import { useTranslation } from "react-i18next";
import { format, getISOWeek } from "date-fns";
import { enUS, zhCN, zhTW, de, fr } from "date-fns/locale";
import type { Locale } from "date-fns";

const localeMap: Record<string, Locale> = {
  en: enUS,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  de,
  fr,
};

export function useDateFormatter() {
  const { i18n } = useTranslation();
  const currentLocale = localeMap[i18n.language] || enUS;

  const formatDateWithLocale = (date: Date, pattern: string) => {
    if (i18n.language === "ja") {
      const options: Intl.DateTimeFormatOptions =
        pattern === "P"
          ? { year: "numeric", month: "2-digit", day: "2-digit" }
          : pattern === "PP"
            ? { year: "numeric", month: "short", day: "numeric" }
            : {};
      return date.toLocaleDateString("ja", options);
    }
    return format(date, pattern, { locale: currentLocale });
  };

  return {
    formatMonth: (date: Date) => {
      if (i18n.language === "ja") {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
      }
      const pattern = i18n.language.startsWith("zh")
        ? "yyyy年M月"
        : "MMMM yyyy";
      return format(date, pattern, { locale: currentLocale });
    },

    formatWeekday: (date: Date) => {
      if (i18n.language === "ja") {
        const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
        return weekdays[date.getDay()];
      }
      return format(date, "EEE", { locale: currentLocale });
    },

    formatDay: (date: Date) => {
      return format(date, "d", { locale: currentLocale });
    },

    formatFullDate: (date: Date | string | number) => {
      const d = new Date(date);
      if (i18n.language === "ja") {
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
      }
      return format(d, "PP", { locale: currentLocale });
    },

    getWeekNumber: (date: Date) => {
      return getISOWeek(date);
    },

    formatDateRange: (
      start: Date | string | number,
      end: Date | string | number,
    ) => {
      const s = new Date(start);
      const e = new Date(end);
      return `${formatDateWithLocale(s, "P")} → ${formatDateWithLocale(e, "P")}`;
    },
  };
}
