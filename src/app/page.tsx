import React, { Suspense } from "react";
import { fetchGitHubFollowingStats } from "@/lib/github";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { GithubIcon } from "@/components/Icons";
import {
  Users,
  Flame,
  Star,
  GitCommit,
  Sparkles,
} from "lucide-react";

async function LeaderboardContainer() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return (
      <div className="p-8 rounded-2xl border border-amber-900/40 bg-amber-950/20 text-amber-200 text-center space-y-3">
        <h2 className="text-xl font-bold">GitHub Token Required</h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          Please define <code className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded">GITHUB_TOKEN</code> in your environment variables to query GitHub GraphQL API.
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
        {/* Network Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-blue-400" /> Tracked Classmates
            </span>
            <p className="text-2xl md:text-3xl font-black font-mono text-white mt-2">
              {users.length}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">From @NeoXBikram network</p>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
              <GitCommit className="w-4 h-4 text-emerald-400" /> Total 365d Commits
            </span>
            <p className="text-2xl md:text-3xl font-black font-mono text-emerald-400 mt-2">
              {totalNetworkContribs.toLocaleString()}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">Verified public events</p>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
              <Star className="w-4 h-4 text-yellow-400" /> Total Stars
            </span>
            <p className="text-2xl md:text-3xl font-black font-mono text-yellow-400 mt-2">
              {totalNetworkStars.toLocaleString()}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">Across all public repos</p>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
              <Flame className="w-4 h-4 text-orange-400" /> Active This Week
            </span>
            <p className="text-2xl md:text-3xl font-black font-mono text-orange-400 mt-2">
              {totalActive7d}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">Committed in past 7 days</p>
          </div>
        </div>

        {/* Dynamic Interactive Leaderboard */}
        <LeaderboardTable initialUsers={users} />
      </div>
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return (
      <div className="p-8 rounded-2xl border border-rose-900/40 bg-rose-950/20 text-rose-200 text-center space-y-3">
        <h2 className="text-lg font-bold">API Synchronization Error</h2>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto">{errorMsg}</p>
      </div>
    );
  }
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-6 md:p-14 selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <GithubIcon className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                CommitRank
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                v1.0 Live
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Classmate GitHub Leaderboard
            </h1>
            <p className="text-neutral-400 text-sm max-w-xl">
              Live ranking of developers followed by{" "}
              <a
                href="https://github.com/NeoXBikram?tab=following"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline font-mono"
              >
                @NeoXBikram
              </a>
              . Scored on commits, velocity, stargazers, and community impact.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/BikramGole/RepoPulse"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <GithubIcon className="w-4 h-4" />
              Repository
            </a>
          </div>
        </header>

        {/* Content Section */}
        <section>
          <Suspense
            fallback={
              <div className="w-full h-80 rounded-2xl border border-neutral-800 bg-neutral-900/30 flex flex-col items-center justify-center gap-3">
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
        <footer className="pt-8 border-t border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© 2026 CommitRank. Built with Next.js, Turbopack, and GitHub GraphQL API.</p>
          <div className="flex items-center gap-4">
            <span>Dark Theme Analytics</span>
            <span>•</span>
            <span>Real Data</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
