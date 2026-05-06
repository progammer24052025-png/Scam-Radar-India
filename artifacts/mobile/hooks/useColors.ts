import { useContext } from "react";
import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { ThemeContext } from "@/context/ThemeContext";

export function useColors() {
  // Try to use the ThemeContext if available, fall back to system
  let themeOverride: "dark" | "light" | null = null;
  try {
    const ctx = useContext(ThemeContext);
    if (ctx) themeOverride = ctx.theme;
  } catch {
    // ThemeContext not available yet during boot
  }

  const systemScheme = useColorScheme();
  const scheme = themeOverride ?? systemScheme ?? "dark";
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
