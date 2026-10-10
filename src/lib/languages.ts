import { RepositorySummary } from "@/types";

export interface LanguageStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export const GITHUB_LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

export function computeLanguageStats(repos: RepositorySummary[]): LanguageStat[] {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const repo of repos) {
    if (repo.primaryLanguage) {
      counts[repo.primaryLanguage] = (counts[repo.primaryLanguage] || 0) + 1;
      total++;
    }
  }

  if (total === 0) return [];

  const stats: LanguageStat[] = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / total) * 100),
    color: GITHUB_LANG_COLORS[name] || "#6366f1",
  }));

  return stats.sort((a, b) => b.count - a.count);
}
