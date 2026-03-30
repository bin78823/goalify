import React from "react";
import { useTranslation } from "react-i18next";
import { Apple, Monitor, Terminal, Download } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  macos: <Apple className="w-8 h-8" />,
  windows: <Monitor className="w-8 h-8" />,
  linux: <Terminal className="w-8 h-8" />,
};

const platforms = ["macos", "windows", "linux"];

const DownloadSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section
      id="download"
      className="py-24 px-4 bg-slate-50 dark:bg-zinc-900/50"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            {t("download.title")}
          </h2>
          <p className="text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">
            {t("download.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <div
              key={platform}
              className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group cursor-pointer"
              onClick={() => {
                window.open(
                  `/downloads/goalify-1.0.0-${platform}.dmg`,
                  "_blank",
                );
              }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {iconMap[platform]}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center text-slate-900 dark:text-white mb-1">
                {t(`download.platforms.${platform}.name`)}
              </h3>
              <p className="text-sm text-center text-slate-500 dark:text-zinc-400 mb-4">
                {t(`download.platforms.${platform}.description`)}
              </p>
              <p className="text-xs text-center text-slate-400 dark:text-zinc-600 mb-4">
                {t("download.version")} 1.0.0
              </p>
              <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                {t("hero.cta.download")}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mt-8">
          {t("download.security")}
        </p>
      </div>
    </section>
  );
};

export default DownloadSection;
