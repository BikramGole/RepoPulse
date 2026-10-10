"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RepoInsightData } from "@/types/repoTracker";
import { DailyBarChart } from "./DailyBarChart";
import { DonutChart } from "./DonutChart";
import { HistogramBarChart } from "./HistogramBarChart";
import { ContributorBarChart } from "./ContributorBarChart";
import { LatestItemsList } from "./LatestItemsList";
import {
  Search,
  Star,
  GitFork,
  CircleDot,
  Eye,
  RotateCw,
  ExternalLink,
  Code2,
  Users,
  GitPullRequest,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface RepoTrackerViewProps {
  initialOwner?: string;
  initialRepo?: string;
  initialData?: RepoInsightData | null;
}

const PRESET_REPOS = [
  { owner: "BikramGole", repo: "KinaHub", label: "BikramGole/KinaHub" },
  { owner: "BikramGole", repo: "RepoPulse", label: "BikramGole/RepoPulse" },
  { owner: "shadcn-ui", repo: "ui", label: "shadcn-ui/ui" },
  { owner: "facebook", repo: "react", label: "facebook/react" },
];

export function RepoTrackerView({
  initialOwner = "BikramGole",
  initialRepo = "KinaHub",
  initialData = null,
}: RepoTrackerViewProps) {
  const router = useRouter();

  const [currentOwner, setCurrentOwner] = useState(initialOwner);
  const [currentRepo, setCurrentRepo] = useState(initialRepo);
  const [data, setData] = useState<RepoInsightData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search input state
  const [searchInput, setSearchInput] = useState(`${initialOwner}/${initialRepo}`);

  // Fetch insights
  const fetchInsights = async (owner: string, repo: string, forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${
        forceRefresh ? "?refresh=true" : ""
      }`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Failed to fetch repository (${res.status})`);
      }

      setData(json);
      setCurrentOwner(owner);
      setCurrentRepo(repo);
    } catch (err: any) {
      setError(err.message || "Failed to load repository insights");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchInsights(initialOwner, initialRepo);
    }
  }, [initialOwner, initialRepo]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let query = searchInput.trim();
    if (!query) return;

    // Handle full GitHub URLs e.g. https://github.com/owner/repo
    if (query.includes("github.com/")) {
      const parts = query.split("github.com/")[1]?.split("/");
      if (parts && parts.length >= 2) {
        query = `${parts[0]}/${parts[1]}`;
      }
    }

    const segments = query.split("/").map((s) => s.trim()).filter(Boolean);
    if (segments.length >= 2) {
      const [nextOwner, nextRepo] = segments;
      fetchInsights(nextOwner, nextRepo);
      router.push(`/repos/${nextOwner}/${nextRepo}`);
    } else {
      setError("Please enter repository in 'owner/repo' format (e.g. BikramGole/KinaHub)");
    }
  };

  const handleSelectPreset = (owner: string, repo: string) => {
    setSearchInput(`${owner}/${repo}`);
    fetchInsights(owner, repo);
    router.push(`/repos/${owner}/${repo}`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Search & Actions Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0b0f19]/90 border border-white/[0.08] backdrop-blur-xl space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search or enter repository (e.g. BikramGole/KinaHub or github.com/...)"
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-400/80 transition-all"
            />
            <button
              type="submit"
              disabled={loading || isRefreshing}
              className="absolute right-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Track</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => fetchInsights(currentOwner, currentRepo, true)}
              disabled={loading || isRefreshing}
              title="Refresh repository stats"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-mono text-neutral-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 text-cyan-400 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {data?.overview.htmlUrl && (
              <a
                href={data.overview.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-mono text-neutral-300 hover:text-white transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            )}
          </div>
        </div>

        {/* Preset quick jump tags */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/[0.04] text-[11px] font-mono">
          <span className="text-neutral-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Presets:
          </span>
          {PRESET_REPOS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleSelectPreset(preset.owner, preset.repo)}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                currentOwner.toLowerCase() === preset.owner.toLowerCase() &&
                currentRepo.toLowerCase() === preset.repo.toLowerCase()
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-white/[0.03] text-neutral-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading && (
        <div className="p-12 rounded-3xl bg-[#0b0f19] border border-white/[0.08] flex flex-col items-center justify-center gap-3 text-center">
          <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-medium text-white">
            Analyzing {currentOwner}/{currentRepo}...
          </p>
          <p className="text-xs text-neutral-500 font-mono">
            Fetching PRs, issues, contributors, and activity metrics
          </p>
        </div>
      )}

      {/* Main Content Display */}
      {!loading && data && (
        <div className="space-y-6 animate-fade-in">
          {/* Repo Overview Hero Card */}
          <div className="p-6 rounded-3xl bg-[#0b0f19] border border-white/[0.08] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-lg flex-shrink-0">
                  <Image
                    src={data.overview.owner.avatarUrl}
                    alt={data.overview.owner.login}
                    fill
                    unoptimized
                    sizes="56px"
                    className="object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/users/${data.overview.owner.login}`}
                      className="text-xs font-mono text-cyan-400 hover:underline"
                    >
                      {data.overview.owner.login}
                    </Link>
                    <span className="text-neutral-500">/</span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {data.overview.name}
                    </h2>
                    {data.overview.language && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {data.overview.language}
                      </span>
                    )}
                  </div>

                  {data.overview.description && (
                    <p className="text-xs text-neutral-400 mt-1 max-w-2xl line-clamp-2">
                      {data.overview.description}
                    </p>
                  )}
                </div>
              </div>

              {/* KPI Badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-white">{data.overview.stars}</span>
                  <span className="text-neutral-500 text-[10px]">stars</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300">
                  <GitFork className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-bold text-white">{data.overview.forks}</span>
                  <span className="text-neutral-500 text-[10px]">forks</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300">
                  <CircleDot className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-bold text-white">{data.overview.openIssuesCount}</span>
                  <span className="text-neutral-500 text-[10px]">issues</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-bold text-white">{data.overview.watchers}</span>
                  <span className="text-neutral-500 text-[10px]">watchers</span>
                </div>
              </div>
            </div>

            {/* Topics / Tags */}
            {data.overview.topics.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-4 border-t border-white/[0.06]">
                {data.overview.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-white/[0.04] text-neutral-400 border border-white/[0.06]"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section: Pull Requests (30d) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider font-mono">
                Pull Requests (30d)
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <DailyBarChart
                  title="Daily Opened Pull Requests (excl. bots)"
                  data={data.dailyOpenedPRs}
                  barColor="#38bdf8"
                  hoverColor="#67e8f9"
                  height={190}
                />
              </div>
              <div className="lg:col-span-1">
                <LatestItemsList
                  type="pr"
                  title="Latest (excl. bots)"
                  items={data.latestPRs}
                />
              </div>
            </div>
          </div>

          {/* Section: Contributors (all) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider font-mono">
                Contributors (all)
              </h3>
            </div>

            <ContributorBarChart
              contributors={data.contributors}
              height={190}
            />
          </div>

          {/* Section: Issues (30d) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider font-mono">
                Issues (30d)
              </h3>
            </div>

            {/* Wide 30-day timeline chart */}
            <DailyBarChart
              title="Currently Open Issues"
              data={data.openIssuesTimeline}
              barColor="#f43f5e"
              hoverColor="#fb7185"
              height={190}
            />

            {/* 3 Bottom Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DonutChart
                title="Open Issue Age"
                buckets={data.openIssueAge}
                height={210}
              />

              <HistogramBarChart
                title="Issue Lifetime (open - close)"
                buckets={data.issueLifetime}
                height={210}
              />

              <LatestItemsList
                type="issue"
                title="Latest"
                items={data.latestIssues}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
