"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEY, Theme, ThemeContext } from "@/lib/themeContext";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");

  const applyTheme = useCallback((target: Theme) => {
    if (typeof window === "undefined") return;

    if (window.updateDOM) {
      window.updateDOM();
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = target === "dark" || (target === "system" && prefersDark);

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-mode", target);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme;
      const initial = stored || "system";
      // Intentional: restore saved theme early to prevent FOUC.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(initial);
      applyTheme(initial);
    } catch {
      applyTheme("system");
    }
    setMounted(true);
  }, [applyTheme]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    applyTheme(theme);
  }, [theme, mounted, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
