import { Metadata } from "next";
import { connection } from "next/server";
import { RepoTrackerView } from "@/components/repo-tracker/RepoTrackerView";
import { fetchRepoInsights } from "@/lib/repoTracker";
import Link from "next/link";
import { ArrowLeft, BarChart3, Globe } from "lucide-react";

// Opt out of static prerendering — this page fetches live GitHub data
export const instant = false;

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `${owner}/${repo} Insights & Stats | RepoPulse Tracker`,
    description: `Track Pull Requests, Issues, Contributors, and velocity metrics for ${owner}/${repo}`,
  };
}

export default async function RepoDetailPage({ params }: PageProps) {
  await connection();
  const { owner, repo } = await params;

  let initialData = null;
  try {
    initialData = await fetchRepoInsights(owner, repo);
  } catch (err) {
    console.error(`Initial fetch failed for ${owner}/${repo}:`, err);
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

          <div className="flex items-center gap-2">
            <Link
              href={`/users/${owner}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-neutral-300 hover:text-white border border-white/10 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>@{owner} Map</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <RepoTrackerView
          initialOwner={owner}
          initialRepo={repo}
          initialData={initialData}
        />
      </div>
    </main>
  );
}
