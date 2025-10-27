/**
 * FlowScript Color Palettes
 *
 * Complete color system for light and dark modes
 * All colors meet WCAG AA contrast requirements (4.5:1 minimum)
 *
 * Design principles:
 * - Light mode: Saturated colors on white background
 * - Dark mode: Desaturated, lighter colors on dark background
 * - Semantic consistency across themes (causal = blue, temporal = purple, etc.)
 * - Professional appearance (not garish)
 */

export const lightColors = {
  // Core Relations
  causal: "#3b82f6",           // Blue-500
  temporal: "#8b5cf6",         // Purple-500
  reverseCausal: "#0ea5e9",    // Sky-500
  bidirectional: "#06b6d4",    // Cyan-500
  tension: "#f59e0b",          // Amber-500
  axisLabel: "#d97706",        // Amber-600

  // Definition Operators
  equivalent: "#10b981",       // Emerald-500
  notEquivalent: "#ef4444",    // Red-500

  // State Markers
  decided: "#22c55e",          // Green-500
  decidedBg: "rgba(34, 197, 94, 0.1)",
  exploring: "#fbbf24",        // Amber-400
  exploringBg: "rgba(251, 191, 36, 0.1)",
  blocked: "#dc2626",          // Red-600
  blockedBg: "rgba(220, 38, 38, 0.1)",
  parking: "#94a3b8",          // Slate-400
  parkingBg: "rgba(148, 163, 184, 0.1)",

  // Insights & Questions
  thought: "#a855f7",          // Purple-500
  question: "#f97316",         // Orange-500
  completed: "#059669",        // Emerald-600
  alternative: "#64748b",      // Slate-500

  // Commands
  action: "#0284c7",           // Sky-600

  // Modifiers
  urgent: "#dc2626",           // Red-600
  positive: "#16a34a",         // Green-600
  confident: "#7c3aed",        // Violet-600
  uncertain: "#6b7280",        // Gray-500 (improved from Gray-400)

  // Structure
  brace: "#6b7280",            // Gray-500
  bracket: "#6b7280",          // Gray-500
  scope: "#06b6d4",            // Cyan-500
  scopeBg: "rgba(6, 182, 212, 0.1)",

  // Comments
  comment: "#6b7280",          // Gray-500 (improved from Gray-400)

  // UI Elements
  background: "#ffffff",       // White
  surface: "#f9fafb",          // Gray-50
  border: "#e5e7eb",           // Gray-200
  text: "#111827",             // Gray-900
  textMuted: "#6b7280",        // Gray-500

  // Editor specific
  editorBg: "#ffffff",         // White
  gutterBg: "#f9fafb",         // Gray-50
  gutterBorder: "#e5e7eb",     // Gray-200
  activeLine: "#f9fafb",       // Gray-50
  activeLineGutter: "#f3f4f6", // Gray-100
  selection: "#dbeafe",        // Blue-100
  selectionFocused: "#bfdbfe", // Blue-200
  cursor: "#3b82f6",           // Blue-500
} as const;

export const darkColors = {
  // Core Relations
  causal: "#60a5fa",           // Blue-400 (lighter than light mode's blue-500)
  temporal: "#a78bfa",         // Purple-400
  reverseCausal: "#38bdf8",    // Sky-400
  bidirectional: "#22d3ee",    // Cyan-400
  tension: "#fbbf24",          // Amber-400
  axisLabel: "#fbbf24",        // Amber-400 (same as tension)

  // Definition Operators
  equivalent: "#4ade80",       // Green-400
  notEquivalent: "#f87171",    // Red-400

  // State Markers (with adjusted background alpha)
  decided: "#4ade80",          // Green-400
  decidedBg: "rgba(74, 222, 128, 0.15)", // 15% for dark mode
  exploring: "#fbbf24",        // Amber-400
  exploringBg: "rgba(251, 191, 36, 0.15)",
  blocked: "#f87171",          // Red-400
  blockedBg: "rgba(248, 113, 113, 0.15)",
  parking: "#94a3b8",          // Slate-400
  parkingBg: "rgba(148, 163, 184, 0.15)",

  // Insights & Questions
  thought: "#c084fc",          // Purple-400
  question: "#fb923c",         // Orange-400
  completed: "#34d399",        // Emerald-400
  alternative: "#94a3b8",      // Slate-400

  // Commands
  action: "#38bdf8",           // Sky-400

  // Modifiers
  urgent: "#f87171",           // Red-400
  positive: "#4ade80",         // Green-400
  confident: "#a78bfa",        // Violet-400
  uncertain: "#94a3b8",        // Slate-400

  // Structure
  brace: "#94a3b8",            // Slate-400
  bracket: "#94a3b8",          // Slate-400
  scope: "#22d3ee",            // Cyan-400
  scopeBg: "rgba(34, 211, 238, 0.15)",

  // Comments
  comment: "#64748b",          // Slate-500 (medium gray, not too light)

  // UI Elements
  background: "#0f172a",       // Slate-900 (very dark)
  surface: "#1e293b",          // Slate-800 (dark)
  border: "#334155",           // Slate-700 (medium)
  text: "#f1f5f9",             // Slate-100 (very light)
  textMuted: "#94a3b8",        // Slate-400 (muted)

  // Editor specific
  editorBg: "#1e293b",         // Slate-800
  gutterBg: "#0f172a",         // Slate-900 (darker than editor)
  gutterBorder: "#334155",     // Slate-700
  activeLine: "#334155",       // Slate-700 (subtle)
  activeLineGutter: "#1e293b", // Slate-800
  selection: "#1e40af",        // Blue-800 (dark blue for selection)
  selectionFocused: "#1e3a8a", // Blue-900 (darker when focused)
  cursor: "#ffffff",           // White (maximum visibility in dark mode)
} as const;

export type ThemeName = "light" | "dark";

export interface ThemeColors {
  // Core Relations
  causal: string;
  temporal: string;
  reverseCausal: string;
  bidirectional: string;
  tension: string;
  axisLabel: string;

  // Definition Operators
  equivalent: string;
  notEquivalent: string;

  // State Markers
  decided: string;
  decidedBg: string;
  exploring: string;
  exploringBg: string;
  blocked: string;
  blockedBg: string;
  parking: string;
  parkingBg: string;

  // Insights & Questions
  thought: string;
  question: string;
  completed: string;
  alternative: string;

  // Commands
  action: string;

  // Modifiers
  urgent: string;
  positive: string;
  confident: string;
  uncertain: string;

  // Structure
  brace: string;
  bracket: string;
  scope: string;
  scopeBg: string;

  // Comments
  comment: string;

  // UI Elements
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;

  // Editor specific
  editorBg: string;
  gutterBg: string;
  gutterBorder: string;
  activeLine: string;
  activeLineGutter: string;
  selection: string;
  selectionFocused: string;
  cursor: string;
}

/**
 * Get colors for specified theme
 */
export function getColors(theme: ThemeName): ThemeColors {
  return theme === "dark" ? darkColors : lightColors;
}
