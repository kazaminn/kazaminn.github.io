"use client";

declare global {
  interface Window {
    updateDOM: () => void;
  }
}

export function NoFOUCScript(storageKey: string) {
  const SYSTEM = "system";
  const DARK = "dark";
  const LIGHT = "light";

  const disableTransitions = () => {
    const style = document.createElement("style");
    style.textContent = "*,*:before,*:after{transition:none!important}";
    document.head.appendChild(style);
    return () => {
      window.getComputedStyle(document.body);
      setTimeout(() => style.remove(), 1);
    };
  };

  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const setThemeColor = (isDark: boolean) => {
    const color = isDark ? "#0f172b" : "#f8fafc";
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

    let mode = SYSTEM;
    try {
      mode = localStorage.getItem(storageKey) || SYSTEM;
    } catch {}

    const systemMode = media.matches ? DARK : LIGHT;
    const resolved = mode === SYSTEM ? systemMode : mode;
    const isDark = resolved === DARK;

    const root = document.documentElement;
    root.classList.toggle(DARK, isDark);
    root.setAttribute("data-mode", mode);

    setThemeColor(isDark);
    restore();
  };

  window.updateDOM();
  media.addEventListener("change", window.updateDOM);
}
