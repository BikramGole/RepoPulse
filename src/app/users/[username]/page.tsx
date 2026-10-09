import React, { Suspense } from "react";
import Link from "next/link";
import { fetchGitHubFollowingStats } from "@/lib/github";
import { sortAndRankUsers } from "@/lib/ranking";
import { GithubIcon } from "@/components/Icons";
import {
  ArrowLeft,
  ExternalLink,
  GitCommit,
  Star,
  GitFork,
  Users,
  BookOpen,
  Flame,
  Award,
} from "lucide-react";

export const instant = false;

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

async function UserProfileContent({ params }: UserProfilePageProps) {
  const { username } = await params;
  const token = process.env.GITHUB_TOKEN;

  let allUsers: ReturnType<typeof sortAndRankUsers> = [];
  try {
    const rawUsers = await fetchGitHubFollowingStats("NeoXBikram", token);
    allUsers = sortAndRankUsers(rawUsers, "score", "desc");
  } catch (err) {
    console.error("Failed to fetch user list:", err);
  }

  const user = allUsers.find(
    (u) => u.login.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Developer Not Found</h2>
          <p className="text-sm text-neutral-400">
            Could not find <span className="font-mono text-blue-400">@{username}</span> in the classmate network.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-6 md:p-16">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Classmate Leaderboard
        </Link>

        {/* Developer Header Banner */}
        <div className="relative p-8 rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <img
                src={user.avatarUrl}
                alt={user.login}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-neutral-700 object-cover shadow-xl"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {user.name || user.login}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    Rank #{user.rank}
                  </span>
                </div>
                <p className="text-sm font-mono text-neutral-400">@{user.login}</p>
                {user.bio && <p className="text-xs text-neutral-300 max-w-xl pt-1">{user.bio}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`https://github.com/${user.login}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-white shadow-md transition-all"
              >
                <GithubIcon className="w-4 h-4" />
                View GitHub
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </a>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-8 pt-6 border-t border-neutral-800/80">
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Award className="w-3 h-3 text-blue-400" /> Rank Score
              </span>
              <p className="text-xl font-bold font-mono text-blue-400 mt-1">{user.score.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <GitCommit className="w-3 h-3 text-emerald-400" /> 365d Commits
              </span>
              <p className="text-xl font-bold font-mono text-neutral-100 mt-1">
                {user.totalContributions.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> 7d Velocity
              </span>
              <p className="text-xl font-bold font-mono text-orange-400 mt-1">
                +{user.timeline?.last7Days || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" /> Stars Received
              </span>
              <p className="text-xl font-bold font-mono text-yellow-400 mt-1">
                {user.starsReceived.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <GitFork className="w-3 h-3 text-purple-400" /> Forks
              </span>
              <p className="text-xl font-bold font-mono text-purple-400 mt-1">
                {user.forksReceived.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Followers
              </span>
              <p className="text-xl font-bold font-mono text-neutral-100 mt-1">
                {user.followers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Contribution Activity Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
              Recent Velocity (7 Days)
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-orange-400">
                {user.timeline?.last7Days || 0}
              </span>
              <span className="text-xs text-neutral-500">public events</span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Recent momentum weight in ranking score calculation.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
              Monthly Active (30 Days)
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-emerald-400">
                {user.timeline?.last30Days || 0}
              </span>
              <span className="text-xs text-neutral-500">public events</span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Consistent monthly engagement across repositories.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
              Annual Contributions (365 Days)
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-white">
                {user.timeline?.last365Days.toLocaleString() || 0}
              </span>
              <span className="text-xs text-neutral-500">contributions</span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Total contribution graph activity verified by GitHub.
            </p>
          </div>
        </div>

        {/* Repositories showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Featured Public Repositories ({user.topRepositories?.length || 0})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.topRepositories?.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="group p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800/50 hover:border-neutral-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                      {repo.name}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </div>
                  {repo.description && (
                    <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-800/60 text-xs text-neutral-400">
                  {repo.primaryLanguage && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      {repo.primaryLanguage}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    {repo.stargazerCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5 text-purple-400" />
                    {repo.forkCount}
                  </span>
                </div>
              </a>
            ))}

            {(!user.topRepositories || user.topRepositories.length === 0) && (
              <div className="col-span-2 p-8 text-center text-neutral-500 border border-neutral-800 rounded-2xl">
                No public non-fork repositories found for this account.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage(props: UserProfilePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <UserProfileContent {...props} />
    </Suspense>
  );
}
