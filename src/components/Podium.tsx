import React from "react";
import Link from "next/link";
import { RankedUser } from "@/types";
import { Trophy, Star, GitCommit, ArrowUpRight } from "lucide-react";
import { CrownIcon } from "./Icons";

interface PodiumProps {
  topUsers: RankedUser[];
}

export function Podium({ topUsers }: PodiumProps) {
  if (topUsers.length < 3) return null;

  // Reorder for podium display: [2nd, 1st, 3rd]
  const first = topUsers[0];
  const second = topUsers[1];
  const third = topUsers[2];

  const podiumOrder = [
    { user: second, place: 2, height: "h-64", badge: "2nd", color: "from-slate-400/20 to-slate-500/5", border: "border-slate-500/30", textCol: "text-slate-300" },
    { user: first, place: 1, height: "h-76", badge: "1st", color: "from-amber-400/25 to-yellow-500/5", border: "border-amber-400/40", textCol: "text-amber-300", isWinner: true },
    { user: third, place: 3, height: "h-56", badge: "3rd", color: "from-orange-500/20 to-amber-700/5", border: "border-amber-700/30", textCol: "text-amber-500" },
  ];

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Hall of Fame Podium
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Top performing developers determined by multi-metric algorithm
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
        {podiumOrder.map(({ user, place, height, badge, color, border, textCol, isWinner }) => (
          <div
            key={user.login}
            className={`relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b ${color} border ${border} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${height}`}
          >
            {isWinner && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20">
                <CrownIcon className="w-3.5 h-3.5" />
                Champion
              </div>
            )}

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className={`w-16 h-16 rounded-full border-2 ${border} shadow-md object-cover`}
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${
                    isWinner ? "bg-amber-400 text-black" : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                  }`}
                >
                  {badge}
                </span>
              </div>

              <Link
                href={`/users/${user.login}`}
                className="font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-1 group text-base"
              >
                {user.name || user.login}
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <span className="text-xs text-neutral-400">@{user.login}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Rank Score</span>
                <span className={`font-mono font-bold ${textCol}`}>{user.score.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="flex items-center gap-1 text-neutral-400">
                  <GitCommit className="w-3 h-3 text-emerald-400" /> Commits
                </span>
                <span className="font-mono">{user.totalContributions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="flex items-center gap-1 text-neutral-400">
                  <Star className="w-3 h-3 text-yellow-400" /> Stars
                </span>
                <span className="font-mono">{user.starsReceived.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
