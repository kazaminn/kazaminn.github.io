"use client";

declare global {
  interface Window {
    updateDOM: () => void;
  }
}

export function NoFOUCScript(storageKey: string) {
  const [SYSTEM, DARK, LIGHT] = ["system", "dark", "light"];

  const modifyTransition = () => {
    const css = document.createElement("style");
    css.textContent = "*,*:after,*:before{transition:none !important;}";
    document.head.appendChild(css);
    return () => {
      window.getComputedStyle(document.body);
      setTimeout(() => {
        if (document.head.contains(css)) document.head.removeChild(css);
      }, 1);
    };
  };

  const media = window.matchMedia(`(prefers-color-scheme: ${DARK})`);

  window.updateDOM = () => {
    const restoreTransitions = modifyTransition();
    let mode = SYSTEM;
    try {
      mode = localStorage.getItem(storageKey) || SYSTEM;
    } catch (e) {}

    const systemMode = media.matches ? DARK : LIGHT;
    const resolvedMode = mode === SYSTEM ? systemMode : mode;

    const root = document.documentElement;
    if (resolvedMode === DARK) root.classList.add(DARK);
    else root.classList.remove(DARK);

    root.setAttribute("data-mode", mode);
    restoreTransitions();
  };

  window.updateDOM();
  media.addEventListener("change", window.updateDOM);
}
