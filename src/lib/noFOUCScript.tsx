"use client";

declare global {
  // Global augmentation requires `interface` for declaration merging; `type` can't merge here.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    updateDOM: () => void;
  }
}

const THEME_COLORS: Record<string, string> = {
  light: "#f8fafc",
  dark: "#0f172b",
};

export function NoFOUCScript(storageKey: string, attr = "data-mode") {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const disableTransitions = () => {
    const style = document.createElement("style");
    style.textContent = "*,*:before,*:after{transition:none!important}";
    document.head.appendChild(style);
    return () => {
      window.getComputedStyle(document.body);
      setTimeout(() => style.remove(), 1);
    };
  };

  const setThemeColor = (theme: string) => {
    const color = THEME_COLORS[theme];
    if (!color) return;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
  };

  window.updateDOM = () => {
    const restore = disableTransitions();

    let mode = "system";
    try {
      mode = localStorage.getItem(storageKey) ?? "system";
    } catch {
      // localStorage unavailable (SSR / privacy mode); keep default
    }

    const theme = mode === "system" ? (media.matches ? "dark" : "light") : mode;
    document.documentElement.setAttribute(attr, theme);
    setThemeColor(theme);

    restore();
  };

  window.updateDOM();
  media.addEventListener("change", window.updateDOM);
}
