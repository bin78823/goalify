import { useTranslation } from "react-i18next";
import { format, getISOWeek } from "date-fns";
import { enUS, zhCN, zhTW } from "date-fns/locale";

const localeMap: Record<string, any> = {
  en: enUS,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
};

export function useDateFormatter() {
  const { i18n } = useTranslation();
  const currentLocale = localeMap[i18n.language] || enUS;

  return {
    /**
     * 格式化月份 (如: "2024年3月" 或 "March 2024")
     */
    formatMonth: (date: Date) => {
      // 中文习惯: 2024年3月; 英文习惯: March 2024
      const pattern = i18n.language.startsWith("zh") ? "yyyy年M月" : "MMMM yyyy";
      return format(date, pattern, { locale: currentLocale });
    },

    /**
     * 格式化星期 (如: "周一" 或 "Mon")
     */
    formatWeekday: (date: Date) => {
      return format(date, "EEE", { locale: currentLocale });
    },

    /**
     * 格式化日期天数 (如: "19")
     */
    formatDay: (date: Date) => {
      return format(date, "d", { locale: currentLocale });
    },

    /**
     * 格式化完整日期 (如: "2024/03/19" 或 "Mar 19, 2024")
     */
    formatFullDate: (date: Date | string | number) => {
      const d = new Date(date);
      return format(d, "PP", { locale: currentLocale });
    },

    /**
     * 获取周数 (ISO 周)
     */
    getWeekNumber: (date: Date) => {
      return getISOWeek(date);
    },

    /**
     * 格式化日期范围
     */
    formatDateRange: (start: Date | string | number, end: Date | string | number) => {
      const s = new Date(start);
      const e = new Date(end);
      return `${format(s, "P", { locale: currentLocale })} → ${format(e, "P", { locale: currentLocale })}`;
    },
  };
}
