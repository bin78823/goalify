import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Play, Check } from "lucide-react";
import Button from "./Button";
import GoalifyLogo from "./GoalifyLogo";

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const features = [
    { key: "free", icon: <Check className="w-3.5 h-3.5" /> },
    { key: "crossPlatform", icon: <Check className="w-3.5 h-3.5" /> },
    { key: "cloudSync", icon: <Check className="w-3.5 h-3.5" /> },
  ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-white dark:bg-black">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("hero.title")}
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-slate-500 dark:text-zinc-400 font-medium">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              size="lg"
              onClick={() => {
                document
                  .getElementById("download")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base font-semibold rounded-lg"
            >
              {t("hero.cta.download")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                window.open("https://github.com/goalify", "_blank");
              }}
              className="h-12 px-8 text-base font-medium border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              {t("hero.cta.demo")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-900 rounded-full border border-slate-200 dark:border-zinc-800"
              >
                <span className="text-blue-600 dark:text-blue-400">
                  {feature.icon}
                </span>
                <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                  {t(`hero.features.${feature.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 text-center text-sm font-medium text-slate-400 dark:text-zinc-600">
                app.goalify.io
              </div>
            </div>
            <div className="p-6 bg-gradient-to-b from-slate-100 to-white dark:from-zinc-900 dark:to-black">
              <div className="aspect-[16/9] bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                <img
                  src="/images/screenshot.jpg"
                  alt="Goalify Gantt Chart"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
