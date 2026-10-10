"use client";

import React, { useState } from "react";
import { ContributionCalendarWeek } from "@/types";

interface ContributionHeatmapProps {
  weeks?: ContributionCalendarWeek[];
  totalContributions: number;
}

const LEVEL_COLORS: Record<number, string> = {
  0: "bg-[#161b26] border-white/[0.04]",
  1: "bg-[#0e4429] border-[#006d32]/30",
  2: "bg-[#006d32] border-[#26a641]/40",
  3: "bg-[#26a641] border-[#39d353]/50 shadow-[0_0_8px_rgba(38,166,65,0.4)]",
  4: "bg-[#39d353] border-white/40 shadow-[0_0_12px_rgba(57,211,83,0.6)]",
};

export function ContributionHeatmap({
  weeks = [],
  totalContributions,
}: ContributionHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  if (!weeks || weeks.length === 0) return null;

  // Month labels helper
  const months: Array<{ label: string; weekIndex: number }> = [];
  let currentMonth = -1;

  weeks.forEach((week, index) => {
    const firstDay = week.contributionDays[0];
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== currentMonth) {
        currentMonth = month;
        months.push({
          label: new Date(firstDay.date).toLocaleString("default", { month: "short" }),
          weekIndex: index,
        });
      }
    }
  });

  const getLevel = (count: number): number => {
    if (count <= 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
  };

  return (
    <div className="w-full p-6 rounded-3xl bg-[#0e131f]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Contribution Activity Graph (Last 365 Days)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Verified public timeline matrix with daily contribution density
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {totalContributions.toLocaleString()} Total Commits
          </span>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[760px] select-none">
          {/* Month labels */}
          <div className="flex text-[10px] text-neutral-400 font-mono mb-2 pl-7 h-4 relative">
            {months.map(({ label, weekIndex }) => (
              <span
                key={`${label}-${weekIndex}`}
                style={{ position: "absolute", left: `${weekIndex * 14.5 + 28}px` }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-neutral-400 pr-1 h-[98px]">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Matrix of weeks */}
            <div className="flex gap-[3.5px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3.5px]">
                  {week.contributionDays.map((day) => {
                    const level = getLevel(day.contributionCount);
                    return (
                      <div
                        key={day.date}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            date: day.date,
                            count: day.contributionCount,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-[11px] h-[11px] rounded-[2.5px] border transition-transform hover:scale-125 hover:z-20 cursor-pointer ${LEVEL_COLORS[level]}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredDay && (
        <div
          style={{
            position: "fixed",
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y}px`,
            transform: "translate(-50%, -100%)",
          }}
          className="pointer-events-none z-50 px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/20 text-white text-[11px] font-medium shadow-2xl backdrop-blur-md whitespace-nowrap"
        >
          <span className="font-bold font-mono text-emerald-400">
            {hoveredDay.count} {hoveredDay.count === 1 ? "contribution" : "contributions"}
          </span>{" "}
          on {new Date(hoveredDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-4 mt-2 border-t border-white/[0.06]">
        <span>Learn how GitHub calculates public contributions</span>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#161b26] border border-white/[0.04]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#0e4429]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#006d32]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#26a641]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#39d353]" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
