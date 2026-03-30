import React from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  Layers,
  Users,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  gantt: <BarChart3 className="w-6 h-6" />,
  projects: <Layers className="w-6 h-6" />,
  subtasks: <CheckSquare className="w-6 h-6" />,
  milestones: <Calendar className="w-6" />,
  timeline: <Clock className="w-6 h-6" />,
  collaboration: <Users className="w-6 h-6" />,
};

const features = [
  "gantt",
  "projects",
  "subtasks",
  "milestones",
  "timeline",
  "collaboration",
];

const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 px-4 bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            {t("features.title")}
          </h2>
          <p className="text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature}
              className="p-6 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                {iconMap[feature]}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t(`features.${feature}.title`)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {t(`features.${feature}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
