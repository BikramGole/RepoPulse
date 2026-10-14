"use client";

import React, { useState, useMemo, useDeferredValue, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  GitHubUserStats,
  RankingWeights,
  DEFAULT_WEIGHTS,
  SortField,
  SortDirection,
} from "@/types";
import { sortAndRankUsers, filterUsers } from "@/lib/ranking";
import { Podium } from "./Podium";
import { WeightSettingsModal } from "./WeightSettingsModal";
import { AboutModal } from "./AboutModal";
// bundle-conditional: 3D globe (d3) only loads when the map tab is opened
const NetworkWorldMap = dynamic(
  () => import("./NetworkWorldMap").then((m) => m.NetworkWorldMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-80 rounded-3xl border border-white/[0.08] bg-[#0e131f]/50 flex items-center justify-center gap-3"
        role="status"
      >
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" aria-hidden="true" />
        <span className="text-xs text-neutral-400 font-mono">Loading 3D globe…</span>
      </div>
    ),
  }
);
import {
  Search,
  Sliders,
  Info,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  Flame,
  Star,
  Users,
  GitCommit,
  GitFork,
  BookOpen,
  Globe,
  LayoutGrid,
} from "lucide-react";

interface LeaderboardTableProps {
  initialUsers: GitHubUserStats[];
}

export function LeaderboardTable({ initialUsers }: LeaderboardTableProps) {
  const [weights, setWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [sortBy, setSortBy] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  // rerender-use-deferred-value: keep typing responsive on large networks
  const deferredQuery = useDeferredValue(searchQuery);
  const [filterTab, setFilterTab] = useState<"all" | "active7d" | "topStars" | "highContribs">("all");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Re-rank whenever weights, sortBy, or direction changes
  const rankedUsers = useMemo(() => {
    return sortAndRankUsers(initialUsers, sortBy, sortDirection, weights);
  }, [initialUsers, sortBy, sortDirection, weights]);

  // Unique countries list
  const availableCountries = useMemo(() => {
    const set = new Map<string, { code: string; name: string; flag: string; count: number }>();
    for (const u of rankedUsers) {
      const code = u.country?.code || "NP";
      const name = u.country?.name || "Nepal";
      const flag = u.country?.flag || "🇳🇵";
      const current = set.get(code);
      if (current) {
        current.count++;
      } else {
        set.set(code, { code, name, flag, count: 1 });
      }
    }
    return Array.from(set.values()).sort((a, b) => b.count - a.count);
  }, [rankedUsers]);

  // Filter based on tab, country, and search
  const filteredUsers = useMemo(() => {
    let result = filterUsers(
      rankedUsers,
      deferredQuery,
      filterTab === "highContribs" ? 50 : 0,
      filterTab === "active7d"
    );

    if (filterTab === "topStars") {
      result = result.filter((u) => u.starsReceived > 0);
    }

    if (selectedCountryFilter !== "ALL") {
      result = result.filter((u) => (u.country?.code || "NP") === selectedCountryFilter);
    }

    return result;
  }, [rankedUsers, deferredQuery, filterTab, selectedCountryFilter]);

  // Paginated slice
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const handleSort = (field: SortField) => {
    // rerender-transitions: sorting is non-urgent, keep UI responsive
    startTransition(() => {
      if (sortBy === field) {
        setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
      } else {
        setSortBy(field);
        setSortDirection("desc");
      }
      setPage(1);
    });
  };

  const sortAria = (field: SortField): "ascending" | "descending" | "none" =>
    sortBy !== field ? "none" : sortDirection === "desc" ? "descending" : "ascending";

  const renderSortIndicator = (field: SortField) => {
    if (sortBy !== field) {
      return <ChevronsUpDown className="w-3.5 h-3.5 opacity-30 ml-1 inline" />;
    }
    return sortDirection === "desc" ? (
      <ChevronDown className="w-3.5 h-3.5 text-blue-400 ml-1 inline" />
    ) : (
      <ChevronUp className="w-3.5 h-3.5 text-blue-400 ml-1 inline" />
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation Mode: Leaderboard Table vs GitCharta World Map */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-[#0e131f]/90 border border-white/[0.08] backdrop-blur-xl">
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/80 border border-white/[0.05] w-full sm:w-auto"
          role="tablist"
          aria-label="Leaderboard view"
        >
          <button
            role="tab"
            aria-selected={viewMode === "table"}
            onClick={() => setViewMode("table")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition-all ${
              viewMode === "table"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            Rankings & Leaderboard
          </button>
          <button
            role="tab"
            aria-selected={viewMode === "map"}
            onClick={() => setViewMode("map")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition-all ${
              viewMode === "map"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
            GitCharta 3D Globe
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pr-2">
          <button
            onClick={() => setIsWeightModalOpen(true)}
            aria-haspopup="dialog"
            className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-white/[0.04] hover:bg-white/[0.08] text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-white/[0.08] transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
            Formula Weights
          </button>
          <button
            onClick={() => setIsAboutModalOpen(true)}
            aria-haspopup="dialog"
            className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs font-medium border border-white/[0.08] transition-all"
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            API Caveats
          </button>
        </div>
      </div>

      {/* RENDER MAP VIEW */}
      {viewMode === "map" && <NetworkWorldMap users={rankedUsers} />}

      {/* RENDER TABLE VIEW */}
      {viewMode === "table" && (
        <>
          {/* Top 3 Podium */}
          {filterTab === "all" && selectedCountryFilter === "ALL" && !deferredQuery && (
            <Podium topUsers={rankedUsers.slice(0, 3)} />
          )}

          {/* Control Bar: Search & Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-3xl bg-[#0e131f]/90 border border-white/[0.08] backdrop-blur-xl shadow-xl">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <label htmlFor="leaderboard-search" className="visually-hidden">
                  Search classmates by username, name, or bio
                </label>
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="leaderboard-search"
                  type="search"
                  autoComplete="off"
                  placeholder="Search classmates by username, name, or bio..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  aria-describedby="leaderboard-result-count"
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-neutral-950/80 border border-white/[0.08] rounded-2xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                />
              </div>

              {/* Country selector filter */}
              <div>
                <label htmlFor="region-filter" className="visually-hidden">
                  Filter by region
                </label>
                <select
                  id="region-filter"
                  value={selectedCountryFilter}
                  onChange={(e) => {
                    setSelectedCountryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3.5 py-2.5 min-h-[44px] bg-neutral-950/80 border border-white/[0.08] rounded-2xl text-xs text-neutral-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Regions ({rankedUsers.length})</option>
                  {availableCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Filter tabs */}
            <div
              className="flex items-center gap-1 bg-neutral-950/80 p-1.5 rounded-2xl border border-white/[0.06] text-xs overflow-x-auto"
              role="group"
              aria-label="Quick filters"
            >
              <button
                aria-pressed={filterTab === "all"}
                onClick={() => { setFilterTab("all"); setPage(1); }}
                className={`px-3 py-2 min-h-[44px] rounded-xl font-medium transition-all ${
                  filterTab === "all" ? "bg-white/[0.1] text-white shadow-sm" : "text-neutral-300 hover:text-white"
                }`}
              >
                All ({rankedUsers.length})
              </button>
              <button
                aria-pressed={filterTab === "active7d"}
                onClick={() => { setFilterTab("active7d"); setPage(1); }}
                className={`px-3 py-2 min-h-[44px] rounded-xl font-medium flex items-center gap-1 transition-all ${
                  filterTab === "active7d" ? "bg-white/[0.1] text-emerald-400 shadow-sm" : "text-neutral-300 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> Active 7d
              </button>
              <button
                aria-pressed={filterTab === "topStars"}
                onClick={() => { setFilterTab("topStars"); setPage(1); }}
                className={`px-3 py-2 min-h-[44px] rounded-xl font-medium flex items-center gap-1 transition-all ${
                  filterTab === "topStars" ? "bg-white/[0.1] text-yellow-400 shadow-sm" : "text-neutral-300 hover:text-white"
                }`}
              >
                <Star className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" /> Top Stars
              </button>
            </div>
          </div>
          <p id="leaderboard-result-count" className="text-xs text-neutral-400 font-mono" role="status" aria-live="polite">
            Showing {filteredUsers.length} of {rankedUsers.length} developers
            {deferredQuery !== searchQuery ? " — updating…" : ""}
          </p>

          {/* Leaderboard Table Container */}
          <div className="w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0e131f]/80 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <caption className="visually-hidden">
                  GitHub developer leaderboard, sortable by score, commits, velocity, stars, forks, followers, and repositories
                </caption>
                <thead>
                  <tr className="border-b border-white/[0.08] bg-neutral-950/80 text-[11px] font-semibold uppercase tracking-wider text-neutral-300 select-none">
                    <th scope="col" className="py-4 pl-6 pr-2 w-16">Rank</th>
                    <th scope="col" className="py-4 px-4 min-w-[220px]">Developer</th>
                    <th scope="col" aria-sort={sortAria("score")} className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleSort("score")}
                        aria-label={`Sort by score, currently ${sortAria("score")}`}
                        className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors min-h-[44px]"
                      >
                        Score {renderSortIndicator("score")}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortAria("totalContributions")} className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleSort("totalContributions")}
                        aria-label={`Sort by 365-day commits, currently ${sortAria("totalContributions")}`}
                        className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors min-h-[44px]"
                      >
                        <GitCommit className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        Commits (365d) {renderSortIndicator("totalContributions")}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortAria("recent7Days")} className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleSort("recent7Days")}
                        aria-label={`Sort by 7-day velocity, currently ${sortAria("recent7Days")}`}
                        className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors min-h-[44px]"
                      >
                        <Flame className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
                        7d Vel {renderSortIndicator("recent7Days")}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortAria("starsReceived")} className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleSort("starsReceived")}
                        aria-label={`Sort by stars, currently ${sortAria("starsReceived")}`}
                        className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors min-h-[44px]"
                      >
                        <Star className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" />
                        Stars {renderSortIndicator("starsReceived")}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortAria("forksReceived")} className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleSort("forksReceived")}
                        aria-label={`Sort by forks, currently ${sortAria("forksReceived")}`}
                        className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors min-h-[44px]"
                      >
                        <GitFork className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                        Forks {renderSortIndicator("forksReceived")}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortAria("followers")} className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleSort("followers")}
                        aria-label={`Sort by followers, currently ${sortAria("followers")}`}
                        className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors min-h-[44px]"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                        Followers {renderSortIndicator("followers")}
                      </button>
                    </th>
                    <th scope="col" aria-sort={sortAria("publicRepos")} className="py-4 pr-6 pl-4 text-right">
                      <button
                        onClick={() => handleSort("publicRepos")}
                        aria-label={`Sort by repositories, currently ${sortAria("publicRepos")}`}
                        className="inline-flex items-center justify-end gap-1 hover:text-white transition-colors min-h-[44px]"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                        Repos {renderSortIndicator("publicRepos")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {paginatedUsers.map((user) => {
                    const isTop1 = user.rank === 1;
                    const isTop2 = user.rank === 2;
                    const isTop3 = user.rank === 3;

                      return (
                      <tr
                        key={user.login}
                        className="leaderboard-row hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Rank & Delta Indicator */}
                        <td className="py-4 pl-6 pr-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              aria-label={`Rank ${user.rank}`}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                                isTop1
                                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                  : isTop2
                                  ? "bg-slate-300/15 text-slate-200 border border-slate-300/30"
                                  : isTop3
                                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                  : "text-neutral-300 font-normal"
                              }`}
                            >
                              {user.rank}
                            </span>

                            {user.rankDelta !== undefined && (
                              <span
                                aria-label={
                                  user.rankDelta > 0
                                    ? `Climbed ${user.rankDelta} places`
                                    : user.rankDelta < 0
                                      ? `Dropped ${Math.abs(user.rankDelta)} places`
                                      : "Rank unchanged"
                                }
                                className={`text-[10px] font-mono flex items-center ${
                                  user.rankDelta > 0
                                    ? "text-emerald-400"
                                    : user.rankDelta < 0
                                    ? "text-rose-400"
                                    : "text-neutral-500"
                                }`}
                              >
                                <span aria-hidden="true">
                                  {user.rankDelta > 0 && "▲"}
                                  {user.rankDelta < 0 && "▼"}
                                  {user.rankDelta === 0 && "•"}
                                  {user.rankDelta !== 0 && Math.abs(user.rankDelta)}
                                </span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Developer Info + Flag */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Image
                                src={user.avatarUrl}
                                alt={`GitHub avatar of ${user.name || user.login}`}
                                width={36}
                                height={36}
                                loading="lazy"
                                sizes="36px"
                                className="w-9 h-9 rounded-xl object-cover border border-white/10 flex-shrink-0"
                              />
                              {user.country && (
                                <span
                                  aria-hidden="true"
                                  className="absolute -bottom-1 -right-1 text-[11px] leading-none drop-shadow-md"
                                >
                                  {user.country.flag}
                                </span>
                              )}
                              {user.country && (
                                <span className="visually-hidden">{user.country.name}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/users/${user.login}`}
                                  className="font-semibold text-white hover:text-blue-400 transition-colors truncate max-w-[150px] md:max-w-[180px]"
                                >
                                  {user.name || user.login}
                                </Link>
                                <a
                                  href={`https://github.com/${user.login}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Open ${user.login} on GitHub (new tab)`}
                                  className="text-neutral-400 hover:text-neutral-200 transition-colors focus-visible:opacity-100"
                                >
                                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                </a>
                              </div>
                              <p className="text-[11px] text-neutral-400 font-mono">@{user.login}</p>
                            </div>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 text-xs">
                            {user.score.toFixed(1)}
                          </span>
                        </td>

                        {/* 365d Commits */}
                        <td className="py-4 px-4 text-right whitespace-nowrap font-mono tabular-nums text-neutral-100 font-medium">
                          {user.totalContributions.toLocaleString()}
                        </td>

                        {/* 7d Velocity */}
                        <td className="py-4 px-4 text-right whitespace-nowrap font-mono tabular-nums">
                          {user.timeline?.last7Days > 0 ? (
                            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px] border border-emerald-500/20">
                              +{user.timeline.last7Days}
                            </span>
                          ) : (
                            <span className="text-neutral-600 text-xs">0</span>
                          )}
                        </td>

                        {/* Stars */}
                        <td className="py-4 px-4 text-right whitespace-nowrap font-mono tabular-nums text-yellow-300">
                          {user.starsReceived > 0 ? (
                            <span>★ {user.starsReceived.toLocaleString()}</span>
                          ) : (
                            <span className="text-neutral-600">0</span>
                          )}
                        </td>

                        {/* Forks */}
                        <td className="py-4 px-4 text-right whitespace-nowrap font-mono tabular-nums text-neutral-400">
                          {user.forksReceived > 0 ? user.forksReceived.toLocaleString() : "0"}
                        </td>

                        {/* Followers */}
                        <td className="py-4 px-4 text-right whitespace-nowrap font-mono tabular-nums text-neutral-300">
                          {user.followers.toLocaleString()}
                        </td>

                        {/* Repos */}
                        <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap font-mono tabular-nums text-neutral-400">
                          {user.publicRepos}
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-400">
                        <p className="text-sm font-medium">No developers matched your filters</p>
                        <p className="text-xs text-neutral-500 mt-1">Try clearing your search query or selecting All Regions.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <nav
                aria-label="Leaderboard pagination"
                className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-neutral-950/60 text-xs text-neutral-300"
              >
                <div aria-live="polite">
                  Showing <span className="font-semibold text-white">{(page - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-semibold text-white">
                    {Math.min(page * pageSize, filteredUsers.length)}
                  </span>{" "}
                  of <span className="font-semibold text-white">{filteredUsers.length}</span> classmates
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Go to previous page"
                    className="px-3 py-2.5 min-h-[44px] rounded-xl border border-white/[0.08] bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 text-neutral-200 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-mono" aria-current="page">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Go to next page"
                    className="px-3 py-2.5 min-h-[44px] rounded-xl border border-white/[0.08] bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 text-neutral-200 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <WeightSettingsModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        weights={weights}
        onUpdateWeights={setWeights}
      />
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
