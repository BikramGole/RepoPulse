import React, { Suspense } from "react";
import { connection } from "next/server";
import { fetchGitHubFollowingStats } from "@/lib/github";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { GithubIcon } from "@/components/Icons";
import {
  Users,
  Flame,
  Star,
  GitCommit,
  Sparkles,
  Zap,
} from "lucide-react";

async function LeaderboardContainer() {
  await connection();
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return (
      <div className="p-8 rounded-3xl border border-amber-900/40 bg-amber-950/20 text-amber-200 text-center space-y-3 backdrop-blur-xl">
        <h2 className="text-xl font-bold">GitHub Token Required</h2>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Please define <code className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded font-mono">GITHUB_TOKEN</code> in your environment variables to query GitHub GraphQL API.
        </p>
      </div>
    );
  }

  try {
    const users = await fetchGitHubFollowingStats("NeoXBikram", token);

    // Compute network summary aggregates
    const totalNetworkContribs = users.reduce((acc, u) => acc + (u.totalContributions || 0), 0);
    const totalNetworkStars = users.reduce((acc, u) => acc + (u.starsReceived || 0), 0);
    const totalActive7d = users.filter((u) => (u.timeline?.last7Days || 0) > 0).length;

    return (
      <div className="space-y-8">
        {/* Network Highlight KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative p-6 rounded-3xl border border-white/[0.08] bg-[#0e131f]/90 backdrop-blur-xl shadow-xl overflow-hidden group hover:border-white/[0.15] transition-all">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" /> Classmates
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-400/80" />
            </div>
            <p className="text-3xl font-black font-mono text-white mt-3 tracking-tight">
              {users.length}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1 font-mono">From @NeoXBikram network</p>
          </div>

          <div className="relative p-6 rounded-3xl border border-white/[0.08] bg-[#0e131f]/90 backdrop-blur-xl shadow-xl overflow-hidden group hover:border-white/[0.15] transition-all">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-emerald-400" /> 365d Commits
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
            </div>
            <p className="text-3xl font-black font-mono text-emerald-400 mt-3 tracking-tight">
              {totalNetworkContribs.toLocaleString()}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1 font-mono">Verified public events</p>
          </div>

          <div className="relative p-6 rounded-3xl border border-white/[0.08] bg-[#0e131f]/90 backdrop-blur-xl shadow-xl overflow-hidden group hover:border-white/[0.15] transition-all">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Star className="w-3 h-3 text-yellow-400" /> Total Stars
              </span>
              <span className="w-2 h-2 rounded-full bg-yellow-400/80" />
            </div>
            <p className="text-3xl font-black font-mono text-yellow-400 mt-3 tracking-tight">
              {totalNetworkStars.toLocaleString()}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1 font-mono">Across public repositories</p>
          </div>

          <div className="relative p-6 rounded-3xl border border-white/[0.08] bg-[#0e131f]/90 backdrop-blur-xl shadow-xl overflow-hidden group hover:border-white/[0.15] transition-all">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> Active This Week
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-400/80 animate-pulse" />
            </div>
            <p className="text-3xl font-black font-mono text-orange-400 mt-3 tracking-tight">
              {totalActive7d}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1 font-mono">Committed in past 7 days</p>
          </div>
        </div>

        {/* Dynamic Interactive Leaderboard */}
        <LeaderboardTable initialUsers={users} />
      </div>
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return (
      <div className="p-8 rounded-3xl border border-rose-900/40 bg-rose-950/20 text-rose-200 text-center space-y-3 backdrop-blur-xl">
        <h2 className="text-lg font-bold">API Synchronization Error</h2>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto">{errorMsg}</p>
      </div>
    );
  }
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#080c14] text-neutral-200 p-6 md:p-14 selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <GithubIcon className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                CommitRank ⚡
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Data Feed
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              GitHub Developer Leaderboard
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time engineering leaderboard of classmates followed by{" "}
              <a
                href="https://github.com/NeoXBikram?tab=following"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-mono font-medium"
              >
                @NeoXBikram
              </a>
              . Powered by authentic GitHub GraphQL contribution calendars, activity velocity, and GitCharta geographic tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/BikramGole/RepoPulse"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 hover:text-white rounded-2xl text-xs font-semibold transition-all shadow-sm"
            >
              <GithubIcon className="w-4 h-4" />
              Source Repo
            </a>
          </div>
        </header>

        {/* Content Section */}
        <section>
          <Suspense
            fallback={
              <div className="w-full h-80 rounded-3xl border border-white/[0.08] bg-[#0e131f]/50 flex flex-col items-center justify-center gap-3 backdrop-blur-xl">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-xs text-neutral-400 font-mono">
                  Loading classmates and syncing GitHub metrics...
                </span>
              </div>
            }
          >
            <LeaderboardContainer />
          </Suspense>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© 2026 CommitRank. Built with Next.js, GitCharta, Turbopack, and GitHub GraphQL API.</p>
          <div className="flex items-center gap-4">
            <span className="text-neutral-400">Dark Analytics Engine</span>
            <span>•</span>
            <span className="text-emerald-400">100% Authentic Live Data</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
