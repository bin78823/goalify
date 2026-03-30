import React, { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, Globe, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import GoalifyLogo from "./GoalifyLogo";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "zh-CN", name: "Simplified Chinese", nativeName: "简体中文" },
  { code: "zh-TW", name: "Traditional Chinese", nativeName: "繁體中文" },
];

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const changeLanguage = (code: string) => {
    localStorage.setItem("i18nextLng", code);
    window.location.reload();
  };

  const currentLang =
    languages.find((l) =>
      localStorage.getItem("i18nextLng")?.includes(l.code),
    ) || languages[0];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 dark:bg-black/90 backdrop-blur-xl shadow-sm border-b border-slate-200 dark:border-zinc-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-xl blur-md opacity-30 dark:opacity-40" />
              <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-500">
                <GoalifyLogo size={28} />
              </div>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Goalify
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["#features", "#download", "#about"].map((href) => (
              <button
                key={href}
                onClick={() => scrollToSection(href)}
                className="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t(`nav.${href.slice(1)}`)}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <Globe className="w-4 h-4" />
                <span>{currentLang.nativeName}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {isLangMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 min-w-[140px]">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors ${
                        localStorage.getItem("i18nextLng")?.includes(lang.code)
                          ? "text-blue-600 dark:text-blue-400 font-medium"
                          : "text-slate-600 dark:text-zinc-300"
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            )}

            <Button
              onClick={() => {
                document
                  .getElementById("download")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-slate-900 dark:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-zinc-800">
            <nav className="flex flex-col gap-2">
              {["#features", "#download", "#about"].map((href) => (
                <button
                  key={href}
                  onClick={() => scrollToSection(href)}
                  className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-left py-2"
                >
                  {t(`nav.${href.slice(1)}`)}
                </button>
              ))}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-zinc-800">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      localStorage.getItem("i18nextLng")?.includes(lang.code)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2">
                {mounted && (
                  <button
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    {theme === "dark" ? "Light" : "Dark"}
                  </button>
                )}
              </div>
              <div className="pt-4">
                <Button className="w-full bg-blue-600">Get Started</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
