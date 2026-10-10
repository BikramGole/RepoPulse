"use client";

import React from "react";
import { StreakStats } from "@/lib/streak";
import { Flame, Trophy, CalendarCheck } from "lucide-react";

interface StreakStatsCardProps {
  streak?: StreakStats;
  totalContributions: number;
}

export function StreakStatsCard({ streak, totalContributions }: StreakStatsCardProps) {
  if (!streak) return null;

  return (
    <div className="w-full p-6 rounded-3xl bg-gradient-to-r from-[#0e131f]/95 via-[#131b2e]/90 to-[#0e131f]/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-72 h-36 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-72 h-36 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
            GitHub Commit Streak & Endurance
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Continuous coding consistency tracked across public repositories
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
          Streak Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Contributions */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Total Contributions</span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
              {totalContributions.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            {streak.activeDaysCount} active days in past year
          </p>
        </div>

        {/* Current Streak */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/20 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold text-orange-300">Current Streak</span>
            <Flame className="w-4 h-4 text-orange-400 animate-bounce fill-orange-400/40" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {streak.currentStreak}
            </span>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              {streak.currentStreak === 1 ? "Day" : "Days"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            {streak.currentStreak > 0
              ? `Active since ${streak.currentStreakStart}`
              : "No streak today"}
          </p>
        </div>

        {/* Longest Streak */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Longest Streak</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-amber-400 tracking-tight">
              {streak.longestStreak}
            </span>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {streak.longestStreak === 1 ? "Day" : "Days"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            {streak.longestStreakStart && streak.longestStreakEnd
              ? `${streak.longestStreakStart} → ${streak.longestStreakEnd}`
              : "All-time personal record"}
          </p>
        </div>
      </div>
    </div>
  );
}
