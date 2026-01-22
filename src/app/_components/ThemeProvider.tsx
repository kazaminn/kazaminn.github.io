"use client";
import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEY, Theme, ThemeContext } from "@/lib/themeContext";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");

  const applyTheme = useCallback((targetTheme: Theme) => {
    if (typeof window === "undefined") return;

    if (window.updateDOM) {
      window.updateDOM();
    } else {
      const isDark =
        targetTheme === "dark" ||
        (targetTheme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.setAttribute("data-mode", targetTheme);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme;
      if (stored && stored !== theme) {
        setTheme(stored);
        applyTheme(stored);
      } else {
        applyTheme("system");
      }
    } catch (e) {
      applyTheme("system");
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTheme]);

  useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}

    applyTheme(theme);
  }, [theme, mounted, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
