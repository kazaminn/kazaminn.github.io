"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STORAGE_KEY,
  type Theme,
  THEME_ATTR,
  ThemeContext,
} from "@/lib/themeContext";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");

  const applyTheme = useCallback((target: Theme) => {
    if (typeof window === "undefined") return;

    if (typeof window.updateDOM === "function") {
      window.updateDOM();
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme =
      target === "system" ? (prefersDark ? "dark" : "light") : target;

    document.documentElement.setAttribute(THEME_ATTR, theme);
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
};

export default ThemeProvider;
