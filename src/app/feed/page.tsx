import React, { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { fetchGitHubFeed } from "@/lib/githubFeed";
import { GitHubFeed } from "@/components/GitHubFeed";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GithubIcon } from "@/components/Icons";
import {
  Rss,
  ArrowLeft,
  Activity,
} from "lucide-react";

async function FeedContainer() {
  await connection();
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return (
      <div className="p-8 rounded-3xl border border-amber-900/40 bg-amber-950/20 text-amber-200 text-center space-y-3 backdrop-blur-xl">
        <h2 className="text-xl font-bold">GitHub Token Required</h2>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Please define{" "}
          <code className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded font-mono">
            GITHUB_TOKEN
          </code>{" "}
          in your environment variables to load the feed.
        </p>
      </div>
    );
  }

  try {
    const feedData = await fetchGitHubFeed("NeoXBikram", token);

    return (
      <ErrorBoundary>
        <GitHubFeed data={feedData} />
      </ErrorBoundary>
    );
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return (
      <div className="p-8 rounded-3xl border border-rose-900/40 bg-rose-950/20 text-rose-200 text-center space-y-3 backdrop-blur-xl">
        <h2 className="text-lg font-bold">Feed Sync Error</h2>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto">{errorMsg}</p>
      </div>
    );
  }
}

export default function FeedPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#080c14] text-neutral-200 p-6 md:p-14 selection:bg-blue-500/30"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-6 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-mono">Leaderboard</span>
            </Link>

            <a
              href="https://github.com/NeoXBikram"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-xs text-neutral-300 hover:text-white transition-all"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              @NeoXBikram
            </a>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-orange-600 to-rose-600 text-white shadow-lg shadow-orange-500/25">
                <Rss className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                Activity Feed
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              Real-time activity stream from{" "}
              <a
                href="https://github.com/NeoXBikram"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-mono font-medium"
              >
                @NeoXBikram
              </a>
              &apos;s network — pushes, stars, forks, and more from people you follow.
            </p>
          </div>
        </header>

        {/* Feed Content */}
        <section>
          <Suspense
            fallback={
              <div className="w-full h-60 rounded-3xl border border-white/[0.08] bg-[#0e131f]/50 flex flex-col items-center justify-center gap-3 backdrop-blur-xl">
                <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                <span className="text-xs text-neutral-400 font-mono">
                  Syncing activity feed...
                </span>
              </div>
            }
          >
            <FeedContainer />
          </Suspense>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-500">
          <p>Powered by GitHub Events API</p>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Activity className="w-3 h-3" />
            <span>Live Stream</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
