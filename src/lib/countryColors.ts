import { scaleLog } from "d3";

export const MAP_BASE_STYLING = {
  spaceBackground: "#030712",
  oceanBackground: "#070c18",
  oceanGlow: "#0f172a",
  defaultFill: "#1e293b",
  defaultStroke: "#334155",
  highlightFill: "#3b82f6",
  nepalHighlightFill: "#06b6d4",
};

export const COUNTRY_ACCENTS: Record<string, string> = {
  NP: "#06b6d4", // Cyan / Electric turquoise for Nepal
  IN: "#f97316", // Amber / Orange
  US: "#3b82f6", // Blue
  GB: "#a855f7", // Purple
  DE: "#eab308", // Yellow
  CA: "#ec4899", // Pink
  AU: "#10b981", // Emerald
  JP: "#ef4444", // Red
  FR: "#6366f1", // Indigo
  SG: "#14b8a6", // Teal
  BD: "#22c55e", // Green
  PK: "#84cc16", // Lime
  BR: "#f59e0b", // Amber
  NL: "#f43f5e", // Rose
};

export function createHeatScale(countryCounts: Map<string, number>): (count: number) => number {
  const maxCount = Math.max(0, ...Array.from(countryCounts.values()));
  const domainMax = Math.max(1, maxCount);
  const scale = scaleLog()
    .domain([1, domainMax + 1])
    .range([0.35, 1.0])
    .clamp(true);

  return (count: number) => scale(count);
}
