"use client";

import { Icon } from "@/app/_components/Icon";
import type { IconName } from "@/lib/icons";
import { useTheme } from "@/lib/themeContext";

export const THEME_ICON = [
  { value: "light", label: "ライトモード", icon: "sun" },
  { value: "dark", label: "ダークモード", icon: "moon" },
  { value: "system", label: "システム設定", icon: "monitor" },
] as const satisfies readonly {
  value: string;
  label: string;
  icon: IconName;
}[];

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  return (
    <div
      role="group"
      aria-label="テーマ選択"
      className="dark:bg-bg-dark dark:border-border-dark flex w-fit items-center gap-1 rounded-full border border-border bg-bg p-1"
    >
      {THEME_ICON.map(({ value, label, icon }) => {
        const isActive = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            aria-label={label}
            className={`group relative rounded-full p-1.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-link ${
              isActive
                ? "dark:bg-bg-dark text-fg dark:text-fg-dark bg-bg shadow-sm"
                : "text-mute hover:text-fg dark:hover:text-fg-dark"
            }`}
          >
            <Icon name={icon} size="sm" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
export default ThemeToggle;
