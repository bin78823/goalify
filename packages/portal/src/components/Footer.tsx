import React from "react";
import { useTranslation } from "react-i18next";
import { Github, Mail, Twitter } from "lucide-react";
import GoalifyLogo from "./GoalifyLogo";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="about"
      className="bg-slate-900 dark:bg-black text-white py-24 px-6 overflow-hidden relative"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-8 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform duration-500">
                <GoalifyLogo size={28} />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase">
                Goalify
              </span>
            </div>
            <p className="text-xl text-slate-400 max-w-md leading-relaxed font-medium mb-10">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-6">
              {[
                {
                  icon: <Github className="w-6 h-6" />,
                  href: "https://github.com/goalify",
                },
                {
                  icon: <Twitter className="w-6 h-6" />,
                  href: "https://twitter.com/goalify",
                },
                {
                  icon: <Mail className="w-6 h-6" />,
                  href: "mailto:support@goalify.io",
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[var(--primary)] transition-all duration-300 shadow-lg"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8">
              {t("footer.product")}
            </h4>
            <ul className="space-y-4">
              {["features", "download", "changelog", "pricing"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link}`}
                    className="text-lg font-bold text-slate-300 hover:text-white hover:translate-x-2 transition-all inline-block"
                  >
                    {t(`footer.links.${link}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8">
              {t("footer.support")}
            </h4>
            <ul className="space-y-4">
              {["help", "docs", "contact", "privacy"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-lg font-bold text-slate-300 hover:text-white hover:translate-x-2 transition-all inline-block"
                  >
                    {t(`footer.links.${link}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            © {currentYear} Goalify. {t("footer.copyright")}
          </p>

          <div className="flex items-center gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
