import { createContext, useContext } from "react";

export type Theme = "light" | "dark" | "system";
export const STORAGE_KEY = "theme";
// Align with global CSS settings
export const THEME_ATTR = "data-theme";

export type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {
    /* empty */
  },
  mounted: false,
});

export const useTheme = () => useContext(ThemeContext);
