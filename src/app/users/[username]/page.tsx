import React, { Suspense } from "react";
import Link from "next/link";
import { fetchGitHubFollowingStats } from "@/lib/github";
import { sortAndRankUsers } from "@/lib/ranking";
import { GithubIcon } from "@/components/Icons";
import { ContributionHeatmap } from "@/components/ContributionHeatmap";
import { StreakStatsCard } from "@/components/StreakStatsCard";
import { LanguageBreakdownCard } from "@/components/LanguageBreakdownCard";
import {
  ArrowLeft,
  ExternalLink,
  GitCommit,
  Star,
  GitFork,
  Users,
  BookOpen,
  MapPin,
  Flame,
  Award,
  Calendar,
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
      <div className="min-h-screen bg-[#080c14] text-neutral-200 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-3xl border border-white/[0.08] bg-[#0e131f]/90 text-center space-y-4 backdrop-blur-xl shadow-2xl">
          <h2 className="text-xl font-bold text-white">Developer Not Found</h2>
          <p className="text-xs text-neutral-400">
            Could not find <span className="font-mono text-blue-400">@{username}</span> in the classmate network.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/20"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const countryCode = user.country?.code || "NP";
  const countryName = user.country?.name || "Nepal";
  const countryFlag = user.country?.flag || "🇳🇵";

  return (
    <div className="min-h-screen bg-[#080c14] text-neutral-200 p-6 md:p-14">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classmate Leaderboard
          </Link>

          <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live GitHub Verified Profile
          </span>
        </div>

        {/* Developer Header Hero Banner */}
        <div className="relative p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#101726]/90 to-[#0c101c]/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-3xl border-2 border-white/20 object-cover shadow-2xl"
                />
                <span className="absolute -bottom-2 -right-2 text-2xl drop-shadow-md">
                  {countryFlag}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {user.name || user.login}
                  </h1>
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    Leaderboard Rank #{user.rank}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/[0.06] border border-white/[0.08] text-neutral-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    {user.location || countryName}
                  </span>
                </div>

                <p className="text-xs font-mono text-neutral-400">@{user.login}</p>
                {user.bio && (
                  <p className="text-xs text-neutral-300 max-w-xl leading-relaxed pt-1">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions & Official Badges */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Committers.top Nepal Badge */}
              <div className="flex items-center">
                <img
                  src={`https://user-badge.committers.top/${countryName.toLowerCase()}/${user.login}`}
                  alt={`${user.login} ranking in ${countryName}`}
                  className="h-7 rounded shadow-md object-contain"
                  onError={(e) => {
                    // Fallback if user is not indexed on committers.top yet
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <a
                href={`https://github.com/${user.login}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-white shadow-lg transition-all"
              >
                <GithubIcon className="w-4 h-4" />
                GitHub Profile
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </a>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-8 pt-6 border-t border-white/[0.06]">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Award className="w-3 h-3 text-blue-400" /> Score
              </span>
              <p className="text-xl font-bold font-mono text-blue-400 mt-1">{user.score.toFixed(1)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <GitCommit className="w-3 h-3 text-emerald-400" /> 365d Commits
              </span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {user.totalContributions.toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> 7d Velocity
              </span>
              <p className="text-xl font-bold font-mono text-orange-400 mt-1">
                +{user.timeline?.last7Days || 0}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" /> Stars
              </span>
              <p className="text-xl font-bold font-mono text-yellow-400 mt-1">
                {user.starsReceived.toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <GitFork className="w-3 h-3 text-purple-400" /> Forks
              </span>
              <p className="text-xl font-bold font-mono text-purple-400 mt-1">
                {user.forksReceived.toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Followers
              </span>
              <p className="text-xl font-bold font-mono text-neutral-100 mt-1">
                {user.followers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 1. Streak Stats Card (Mirroring github-readme-streak-stats) */}
        <StreakStatsCard
          streak={user.streak}
          totalContributions={user.totalContributions}
        />

        {/* 2. Interactive 52-Week Contribution Calendar Heatmap */}
        <ContributionHeatmap
          weeks={user.calendarWeeks}
          totalContributions={user.totalContributions}
        />

        {/* 3. Language & Technology Stack Breakdown */}
        <LanguageBreakdownCard repositories={user.topRepositories} />

        {/* 4. Featured Public Repositories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
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
                className="group p-5 rounded-3xl border border-white/[0.08] bg-[#0e131f]/90 hover:bg-[#131b2e] hover:border-white/[0.16] transition-all flex flex-col justify-between shadow-xl"
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

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.06] text-xs text-neutral-400">
                  {repo.primaryLanguage && (
                    <span className="flex items-center gap-1.5 font-medium text-neutral-300">
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
              <div className="col-span-2 p-8 text-center text-neutral-500 border border-white/[0.08] rounded-3xl">
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
        <div className="min-h-screen bg-[#080c14] text-neutral-200 p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <UserProfileContent {...props} />
    </Suspense>
  );
}
