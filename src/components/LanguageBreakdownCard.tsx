"use client";

import React from "react";
import { computeLanguageStats } from "@/lib/languages";
import { RepositorySummary } from "@/types";
import { Code2, PieChart } from "lucide-react";

interface LanguageBreakdownCardProps {
  repositories: RepositorySummary[];
}

export function LanguageBreakdownCard({ repositories }: LanguageBreakdownCardProps) {
  const languages = computeLanguageStats(repositories);

  if (languages.length === 0) return null;

  const topLanguage = languages[0];

  return (
    <div className="w-full p-6 rounded-3xl bg-[#0e131f]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl relative">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            Languages & Technology Stack
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Distribution across {repositories.length} original public repositories
          </p>
        </div>
        {topLanguage && (
          <span
            style={{ backgroundColor: `${topLanguage.color}15`, color: topLanguage.color, borderColor: `${topLanguage.color}35` }}
            className="px-3 py-1 rounded-full text-xs font-mono font-bold border"
          >
            Top: {topLanguage.name} ({topLanguage.percentage}%)
          </span>
        )}
      </div>

      {/* Segmented multi-color progress bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-900 border border-white/[0.08] mb-5">
        {languages.map((lang) => (
          <div
            key={lang.name}
            style={{
              width: `${lang.percentage}%`,
              backgroundColor: lang.color,
            }}
            title={`${lang.name}: ${lang.percentage}% (${lang.count} repos)`}
            className="h-full transition-all hover:opacity-80"
          />
        ))}
      </div>

      {/* Language detail items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {languages.map((lang) => (
          <div
            key={lang.name}
            className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                style={{ backgroundColor: lang.color }}
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              />
              <span className="text-xs font-medium text-neutral-200 truncate">
                {lang.name}
              </span>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <span className="font-mono text-xs font-bold text-white">
                {lang.percentage}%
              </span>
              <p className="text-[10px] text-neutral-500 font-mono">
                {lang.count} {lang.count === 1 ? "repo" : "repos"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
