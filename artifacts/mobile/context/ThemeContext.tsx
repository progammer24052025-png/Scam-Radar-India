import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
const THEME_KEY = "@scam_radar_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((val) => { if (val === "light" || val === "dark") setTheme(val); })
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
