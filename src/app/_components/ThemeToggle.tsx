"use client";
import { Display, Moon, Sun } from "react-bootstrap-icons";
import { useTheme } from "@/lib/themeContext";

export const THEME_ICON = [
  { value: "light", label: "ライトモード", icon: Sun },
  { value: "dark", label: "ダークモード", icon: Moon },
  { value: "system", label: "システム設定", icon: Display },
] as const;

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  return (
    <div
      role="group"
      aria-label="テーマ選択"
      className="flex items-center gap-1 bg-bg dark:bg-bg-dark p-1 rounded-full border border-border dark:border-border-dark w-fit"
    >
      {THEME_ICON.map(({ value, label, icon: Icon }) => {
        const isActive = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            aria-label={label}
            className={`group relative p-1.5 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-link ${
              isActive
                ? "bg-bg dark:bg-bg-dark shadow-sm text-fg dark:text-fg-dark"
                : "text-mute hover:text-fg dark:hover:text-fg-dark"
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
export default ThemeToggle;
