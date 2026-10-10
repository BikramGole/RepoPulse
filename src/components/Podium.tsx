"use client";

import React from "react";
import Link from "next/link";
import { RankedUser } from "@/types";
import { ArrowUpRight, Flame, Star, GitCommit } from "lucide-react";
import { CrownIcon } from "./Icons";

interface PodiumProps {
  topUsers: RankedUser[];
}

export function Podium({ topUsers }: PodiumProps) {
  if (topUsers.length < 3) return null;

  const first = topUsers[0];
  const second = topUsers[1];
  const third = topUsers[2];

  const cards = [
    {
      user: second,
      place: 2,
      order: "order-2 md:order-1",
      height: "md:h-[340px]",
      badgeText: "2ND",
      badgeBg: "bg-slate-300/10 text-slate-300 border-slate-400/30",
      ringColor: "ring-slate-400/30",
      accentGlow: "from-slate-400/10 via-transparent to-transparent",
      borderColor: "border-slate-700/50 hover:border-slate-500/60",
      trophyBg: "bg-slate-400/10 text-slate-300",
    },
    {
      user: first,
      place: 1,
      order: "order-1 md:order-2",
      height: "md:h-[370px]",
      badgeText: "1ST",
      badgeBg: "bg-amber-400/15 text-amber-300 border-amber-400/40",
      ringColor: "ring-amber-400/50",
      accentGlow: "from-amber-400/15 via-yellow-500/5 to-transparent",
      borderColor: "border-amber-500/40 hover:border-amber-400/70",
      trophyBg: "bg-amber-400/20 text-amber-300",
      isChampion: true,
    },
    {
      user: third,
      place: 3,
      order: "order-3 md:order-3",
      height: "md:h-[320px]",
      badgeText: "3RD",
      badgeBg: "bg-orange-500/10 text-orange-300 border-orange-500/30",
      ringColor: "ring-orange-500/30",
      accentGlow: "from-orange-500/10 via-transparent to-transparent",
      borderColor: "border-orange-800/40 hover:border-orange-600/50",
      trophyBg: "bg-orange-500/10 text-orange-300",
    },
  ];

  return (
    <div className="w-full mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Top Ranked Classmates
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Hall of Fame Podium
          </h2>
        </div>
        <p className="text-xs text-neutral-400 max-w-xs sm:text-right">
          Scored by verified public commits, developer velocity, and repository stargazers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end max-w-4xl mx-auto">
        {cards.map(
          ({
            user,
            place,
            order,
            height,
            badgeText,
            badgeBg,
            ringColor,
            accentGlow,
            borderColor,
            isChampion,
          }) => (
            <div
              key={user.login}
              className={`relative flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-b ${accentGlow} bg-[#0e131f]/90 border ${borderColor} backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${height} ${order}`}
            >
              {/* Champion crown crown tag */}
              {isChampion && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/30">
                  <CrownIcon className="w-3.5 h-3.5" />
                  Network #1
                </div>
              )}

              {/* Header profile area */}
              <div className="flex flex-col items-center text-center pt-2">
                <div className="relative mb-3.5">
                  <img
                    src={user.avatarUrl}
                    alt={user.login}
                    className={`w-18 h-18 rounded-2xl object-cover shadow-2xl ring-2 ${ringColor}`}
                  />
                  <span
                    className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] border shadow-md ${badgeBg}`}
                  >
                    {badgeText}
                  </span>
                </div>

                <Link
                  href={`/users/${user.login}`}
                  className="font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1 group text-base mt-1"
                >
                  <span className="truncate max-w-[190px]">
                    {user.name || user.login}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
                <span className="text-xs font-mono text-neutral-400">
                  @{user.login}
                </span>

                {user.bio && (
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-1 max-w-[220px]">
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Score and metrics breakdown card */}
              <div className="mt-4 pt-4 border-t border-white/[0.07] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">Rank Score</span>
                  <span className="font-mono font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/[0.08]">
                    {user.score.toFixed(1)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                      <GitCommit className="w-3 h-3 text-emerald-400" /> Commits
                    </span>
                    <p className="font-mono text-xs font-semibold text-neutral-200 mt-0.5">
                      {user.totalContributions.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" /> 7d Vel
                    </span>
                    <p className="font-mono text-xs font-semibold text-orange-400 mt-0.5">
                      +{user.timeline?.last7Days || 0}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" /> Stars
                    </span>
                    <p className="font-mono text-xs font-semibold text-yellow-400 mt-0.5">
                      {user.starsReceived.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
