/**
 * Theme Provider for FlowScript
 *
 * Manages theme state (light/dark/system) with:
 * - System preference detection
 * - localStorage persistence
 * - React context for global access
 * - Automatic data-theme attribute updates
 */

import React, { createContext, useEffect, useState } from "react";
import type { ThemeName } from "./colors";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  systemTheme: ThemeName;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

/**
 * Detect system theme preference
 */
function detectSystemTheme(): ThemeName {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [systemTheme, setSystemTheme] = useState<ThemeName>(detectSystemTheme);
  const [userTheme, setUserTheme] = useState<ThemeName | null>(() => {
    // Load from localStorage on mount
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("flowscript-theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return null;
  });

  // Active theme: user preference OR system theme
  const activeTheme = userTheme || systemTheme;

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Update data-theme attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);

    if (userTheme) {
      localStorage.setItem("flowscript-theme", userTheme);
    } else {
      localStorage.removeItem("flowscript-theme");
    }
  }, [activeTheme, userTheme]);

  const setTheme = (theme: ThemeName) => {
    setUserTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, setTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
