"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
} from "lucide-react";

interface LeaderboardTableProps {
  initialUsers: GitHubUserStats[];
}

export function LeaderboardTable({ initialUsers }: LeaderboardTableProps) {
  const [weights, setWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [sortBy, setSortBy] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active7d" | "topStars" | "highContribs">("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Re-rank whenever weights, sortBy, or direction changes
  const rankedUsers = useMemo(() => {
    return sortAndRankUsers(initialUsers, sortBy, sortDirection, weights);
  }, [initialUsers, sortBy, sortDirection, weights]);

  // Filter based on tab and search
  const filteredUsers = useMemo(() => {
    let result = filterUsers(
      rankedUsers,
      searchQuery,
      filterTab === "highContribs" ? 50 : 0,
      filterTab === "active7d"
    );

    if (filterTab === "topStars") {
      result = result.filter((u) => u.starsReceived > 0);
    }

    return result;
  }, [rankedUsers, searchQuery, filterTab]);

  // Paginated slice
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortBy !== field) {
      return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 ml-1 inline" />;
    }
    return sortDirection === "desc" ? (
      <ChevronDown className="w-3.5 h-3.5 text-blue-400 ml-1 inline" />
    ) : (
      <ChevronUp className="w-3.5 h-3.5 text-blue-400 ml-1 inline" />
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Top 3 Podium */}
      {filterTab === "all" && !searchQuery && (
        <Podium topUsers={rankedUsers.slice(0, 3)} />
      )}

      {/* Control bar: Search, Filters, Configuration buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search classmates by username, name, or bio..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-neutral-950/80 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => { setFilterTab("all"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterTab === "all" ? "bg-neutral-800 text-white shadow" : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({rankedUsers.length})
            </button>
            <button
              onClick={() => { setFilterTab("active7d"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
                filterTab === "active7d" ? "bg-neutral-800 text-emerald-400 shadow" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400" /> Active 7d
            </button>
            <button
              onClick={() => { setFilterTab("topStars"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
                filterTab === "topStars" ? "bg-neutral-800 text-yellow-400 shadow" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-yellow-400" /> Stars
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-neutral-700/60 shadow-sm transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            Formula Weights
          </button>
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-medium border border-neutral-800 transition-all"
          >
            <Info className="w-3.5 h-3.5" />
            API & Notes
          </button>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-xs font-semibold uppercase tracking-wider text-neutral-400 select-none">
                <th className="py-4 pl-6 pr-3 w-16">Rank</th>
                <th className="py-4 px-4 min-w-[200px]">Developer</th>
                <th
                  onClick={() => handleSort("score")}
                  className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  Score {renderSortIndicator("score")}
                </th>
                <th
                  onClick={() => handleSort("totalContributions")}
                  className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center justify-end gap-1">
                    <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                    Commits (365d) {renderSortIndicator("totalContributions")}
                  </span>
                </th>
                <th
                  onClick={() => handleSort("recent7Days")}
                  className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center justify-end gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    Active (7d) {renderSortIndicator("recent7Days")}
                  </span>
                </th>
                <th
                  onClick={() => handleSort("starsReceived")}
                  className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center justify-end gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    Stars {renderSortIndicator("starsReceived")}
                  </span>
                </th>
                <th
                  onClick={() => handleSort("forksReceived")}
                  className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center justify-end gap-1">
                    <GitFork className="w-3.5 h-3.5 text-purple-400" />
                    Forks {renderSortIndicator("forksReceived")}
                  </span>
                </th>
                <th
                  onClick={() => handleSort("followers")}
                  className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center justify-end gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    Followers {renderSortIndicator("followers")}
                  </span>
                </th>
                <th
                  onClick={() => handleSort("publicRepos")}
                  className="py-4 pr-6 pl-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <span className="flex items-center justify-end gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                    Repos {renderSortIndicator("publicRepos")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {paginatedUsers.map((user) => {
                const isTop1 = user.rank === 1;
                const isTop2 = user.rank === 2;
                const isTop3 = user.rank === 3;

                return (
                  <tr
                    key={user.login}
                    className="hover:bg-neutral-800/40 transition-colors group"
                  >
                    {/* Rank & Delta Indicator */}
                    <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            isTop1
                              ? "bg-amber-400/20 text-amber-400 border border-amber-400/40"
                              : isTop2
                              ? "bg-slate-400/20 text-slate-300 border border-slate-400/40"
                              : isTop3
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                              : "text-neutral-400 font-normal"
                          }`}
                        >
                          {user.rank}
                        </span>

                        {/* Rank change indicator */}
                        {user.rankDelta !== undefined && (
                          <span
                            title={
                              user.rankDelta > 0
                                ? `Rose ${user.rankDelta} places`
                                : user.rankDelta < 0
                                ? `Dropped ${Math.abs(user.rankDelta)} places`
                                : "No change in rank"
                            }
                            className={`text-[10px] font-mono flex items-center ${
                              user.rankDelta > 0
                                ? "text-emerald-400"
                                : user.rankDelta < 0
                                ? "text-rose-400"
                                : "text-neutral-600"
                            }`}
                          >
                            {user.rankDelta > 0 && "▲"}
                            {user.rankDelta < 0 && "▼"}
                            {user.rankDelta === 0 && "•"}
                            {user.rankDelta !== 0 && Math.abs(user.rankDelta)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Developer info */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.login}
                          className="w-9 h-9 rounded-full border border-neutral-700/80 object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/users/${user.login}`}
                              className="font-medium text-white hover:text-blue-400 transition-colors truncate max-w-[150px] md:max-w-[180px]"
                            >
                              {user.name || user.login}
                            </Link>
                            <a
                              href={`https://github.com/${user.login}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Open on GitHub"
                              className="text-neutral-500 hover:text-neutral-300 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <p className="text-xs text-neutral-500 font-mono">@{user.login}</p>
                        </div>
                      </div>
                    </td>

                    {/* Overall Score */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 text-xs">
                        {user.score.toFixed(1)}
                      </span>
                    </td>

                    {/* 365d Public Contributions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap font-mono text-neutral-200">
                      {user.totalContributions.toLocaleString()}
                    </td>

                    {/* Recent 7d Active Velocity */}
                    <td className="py-4 px-4 text-right whitespace-nowrap font-mono">
                      {user.timeline?.last7Days > 0 ? (
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                          +{user.timeline.last7Days}
                        </span>
                      ) : (
                        <span className="text-neutral-600 text-xs">0</span>
                      )}
                    </td>

                    {/* Stars Received */}
                    <td className="py-4 px-4 text-right whitespace-nowrap font-mono text-neutral-300">
                      {user.starsReceived > 0 ? (
                        <span className="text-yellow-400 font-medium">
                          ★ {user.starsReceived.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-neutral-600">0</span>
                      )}
                    </td>

                    {/* Forks Received */}
                    <td className="py-4 px-4 text-right whitespace-nowrap font-mono text-neutral-400">
                      {user.forksReceived > 0 ? user.forksReceived.toLocaleString() : "0"}
                    </td>

                    {/* Followers */}
                    <td className="py-4 px-4 text-right whitespace-nowrap font-mono text-neutral-300">
                      {user.followers.toLocaleString()}
                    </td>

                    {/* Public Repos */}
                    <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap font-mono text-neutral-400">
                      {user.publicRepos}
                    </td>
                  </tr>
                );
              })}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    <p className="text-base font-medium">No developers matched your filter</p>
                    <p className="text-xs text-neutral-600 mt-1">Try clearing your search query or resetting filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 text-xs text-neutral-400">
            <div>
              Showing <span className="font-semibold text-neutral-200">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-neutral-200">
                {Math.min(page * pageSize, filteredUsers.length)}
              </span>{" "}
              of <span className="font-semibold text-neutral-200">{filteredUsers.length}</span> classmates
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 text-neutral-300 transition-colors"
              >
                Previous
              </button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 text-neutral-300 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
