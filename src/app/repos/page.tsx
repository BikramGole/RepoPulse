import { Metadata } from "next";
import { connection } from "next/server";
import { RepoTrackerView } from "@/components/repo-tracker/RepoTrackerView";
import { fetchRepoInsights } from "@/lib/repoTracker";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

export const instant = false;

export const metadata: Metadata = {
  title: "GitHub Repository Tracker & Insights | RepoPulse",
  description:
    "Track Pull Requests, Issues, Contributors, and velocity metrics for any GitHub repository.",
};

export default async function ReposLandingPage() {
  await connection();
  const defaultOwner = "BikramGole";
  const defaultRepo = "KinaHub";

  let initialData = null;
  try {
    initialData = await fetchRepoInsights(defaultOwner, defaultRepo);
  } catch (err) {
    console.error("Initial fetch failed for default repo:", err);
  }

  return (
    <main className="min-h-screen bg-[#030611] text-white selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#030611]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Leaderboard</span>
            </Link>

            <span className="text-neutral-600">/</span>

            <div className="flex items-center gap-2 font-mono text-xs">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">RepoTracker</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <RepoTrackerView
          initialOwner={defaultOwner}
          initialRepo={defaultRepo}
          initialData={initialData}
        />
      </div>
    </main>
  );
}
