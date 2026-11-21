"use client";

import React, { useState, useMemo } from "react";
import type { FeedEvent, GitHubFeedData } from "@/types/feed";
import {
  GitCommit,
  Star,
  GitFork,
  UserPlus,
  GitBranch,
  AlertCircle,
  Package,
  GitPullRequest,
  Activity,
  Rss,
  User,
  Search,
  X,
  ExternalLink,
  Users,
  FolderGit2,
} from "lucide-react";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m}m ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h}h ago`;
  }
  const d = Math.floor(diffSec / 86400);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function EventBadge({ type }: { type: FeedEvent["type"] }) {
  const iconClass = "w-3 h-3 text-white";
  switch (type) {
    case "push":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50">
          <GitCommit className={iconClass} />
        </span>
      );
    case "star":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50">
          <Star className={`${iconClass} fill-white`} />
        </span>
      );
    case "fork":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50">
          <GitFork className={iconClass} />
        </span>
      );
    case "follow":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50">
          <UserPlus className={iconClass} />
        </span>
      );
    case "create":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50">
          <GitBranch className={iconClass} />
        </span>
      );
    case "issue":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50">
          <AlertCircle className={iconClass} />
        </span>
      );
    case "pr":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50">
          <GitPullRequest className={iconClass} />
        </span>
      );
    case "release":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50">
          <Package className={iconClass} />
        </span>
      );
    default:
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-600 shadow-sm">
          <Activity className={iconClass} />
        </span>
      );
  }
}

function eventAccentBorder(type: FeedEvent["type"]): string {
  switch (type) {
    case "push":
      return "border-emerald-500/20 hover:border-emerald-500/40";
    case "star":
      return "border-amber-500/20 hover:border-amber-500/40";
    case "fork":
      return "border-purple-500/20 hover:border-purple-500/40";
    case "follow":
      return "border-blue-500/20 hover:border-blue-500/40";
    case "create":
      return "border-cyan-500/20 hover:border-cyan-500/40";
    case "issue":
      return "border-orange-500/20 hover:border-orange-500/40";
    case "pr":
      return "border-indigo-500/20 hover:border-indigo-500/40";
    case "release":
      return "border-pink-500/20 hover:border-pink-500/40";
    default:
      return "border-white/[0.08] hover:border-white/[0.16]";
  }
}

function FeedEventCard({ event, isDeferred }: { event: FeedEvent; isDeferred: boolean }) {
  return (
    <article
      tabIndex={0}
      className={`group relative flex gap-4 p-4 sm:p-5 rounded-2xl border bg-[#0e131f]/85 backdrop-blur-md transition-all shadow-lg hover:shadow-xl focus-visible:outline-2 focus-visible:outline-blue-500 ${eventAccentBorder(
        event.type
      )} ${isDeferred ? "feed-card-deferred" : ""}`}
    >
      {/* Avatar with Floating Event Badge */}
      <div className="relative shrink-0 self-start">
        <a
          href={`https://github.com/${event.actor.login}`}
          target="_blank"
          rel="noreferrer"
          className="block rounded-full focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label={`GitHub profile of ${event.actor.login}`}
        >
          <img
            src={event.actor.avatarUrl || `https://avatars.githubusercontent.com/${event.actor.login}`}
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 rounded-full border border-white/10 group-hover:border-white/30 transition-colors object-cover bg-neutral-900"
            loading="lazy"
          />
        </a>
        <div className="absolute -bottom-1 -right-1" aria-hidden="true">
          <EventBadge type={event.type} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Top line: Author + action + time */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-sm">
            <a
              href={`https://github.com/${event.actor.login}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white hover:text-blue-400 transition-colors font-mono tracking-tight"
            >
              @{event.actor.login}
            </a>
            <span className="text-neutral-400 font-normal">
              {event.summary}
            </span>
          </div>

          <time
            dateTime={event.createdAt}
            title={new Date(event.createdAt).toLocaleString()}
            className="text-[11px] text-neutral-400 font-mono shrink-0 whitespace-nowrap pl-2 pt-0.5"
          >
            {timeAgo(event.createdAt)}
          </time>
        </div>

        {/* Repository context tag */}
        {event.repo && (
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={event.repo.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-blue-300 hover:text-white transition-all max-w-full"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{event.repo.name}</span>
              <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            {event.meta?.branch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono">
                <GitBranch className="w-2.5 h-2.5" />
                {event.meta.branch}
              </span>
            )}
          </div>
        )}

        {/* Commit Messages for Push Events */}
        {event.type === "push" && event.meta?.commitMessages && event.meta.commitMessages.length > 0 && (
          <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-black/40 border border-white/[0.04]">
            {event.meta.commitMessages.slice(0, 3).map((msg, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-neutral-300 font-mono">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">›</span>
                <span className="truncate">{msg || "Update repository"}</span>
              </div>
            ))}
            {(event.meta.commitCount ?? 0) > 3 && (
              <div className="text-[11px] text-neutral-400 font-mono pl-4 pt-0.5">
                +{(event.meta.commitCount ?? 0) - 3} more commits
              </div>
            )}
          </div>
        )}

        {/* Star Target Highlight */}
        {event.type === "star" && event.repo && (
          <div className="text-xs text-amber-200/90 font-mono flex items-center gap-1.5 mt-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Added to starred repositories</span>
          </div>
        )}
      </div>
    </article>
  );
}

type FeedTab = "network" | "you";
type FilterType = "all" | "push" | "star" | "fork" | "other";

export function GitHubFeed({ data }: { data: GitHubFeedData }) {
  const [activeTab, setActiveTab] = useState<FeedTab>("network");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const rawEvents = activeTab === "network" ? data.networkEvents : data.userEvents;

  // Filter and search
  const filteredEvents = useMemo(() => {
    return rawEvents.filter((event) => {
      // Type filter
      if (selectedFilter === "push" && event.type !== "push") return false;
      if (selectedFilter === "star" && event.type !== "star") return false;
      if (selectedFilter === "fork" && event.type !== "fork") return false;
      if (
        selectedFilter === "other" &&
        (event.type === "push" || event.type === "star" || event.type === "fork")
      )
        return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesActor = event.actor.login.toLowerCase().includes(query);
        const matchesRepo = event.repo?.name.toLowerCase().includes(query) ?? false;
        const matchesBranch = event.meta?.branch?.toLowerCase().includes(query) ?? false;
        const matchesSummary = event.summary.toLowerCase().includes(query);
        const matchesCommits =
          event.meta?.commitMessages?.some((m) => m.toLowerCase().includes(query)) ?? false;
        return matchesActor || matchesRepo || matchesBranch || matchesSummary || matchesCommits;
      }

      return true;
    });
  }, [rawEvents, selectedFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalPushes = rawEvents.filter((e) => e.type === "push").length;
    const totalStars = rawEvents.filter((e) => e.type === "star").length;
    const uniqueActors = new Set(rawEvents.map((e) => e.actor.login)).size;
    const uniqueRepos = new Set(rawEvents.filter((e) => e.repo).map((e) => e.repo!.name)).size;
    return { totalPushes, totalStars, uniqueActors, uniqueRepos };
  }, [rawEvents]);

  // Group events by date
  const grouped = useMemo(() => {
    const map = new Map<string, FeedEvent[]>();
    for (const event of filteredEvents) {
      const dateKey = new Date(event.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    }
    return map;
  }, [filteredEvents]);

  let cardGlobalIndex = 0;

  return (
    <div className="space-y-6">
      {/* Top Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Network vs You Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#0e131f]/90 rounded-2xl border border-white/[0.08] w-fit shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab("network")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "network"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Rss className="w-3.5 h-3.5" />
            Network Feed
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono">
              {data.networkEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("you")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "you"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Your Activity
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono">
              {data.userEvents.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search author, repo, commit..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#0e131f]/90 border border-white/[0.08] text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0e131f]/70 border border-white/[0.06] backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
            <Users className="w-3.5 h-3.5 text-blue-400" /> Developers
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {stats.uniqueActors}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e131f]/70 border border-white/[0.06] backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
            <GitCommit className="w-3.5 h-3.5 text-emerald-400" /> Push Events
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {stats.totalPushes}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e131f]/70 border border-white/[0.06] backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
            <Star className="w-3.5 h-3.5 text-amber-400" /> Stars
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {stats.totalStars}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e131f]/70 border border-white/[0.06] backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
            <FolderGit2 className="w-3.5 h-3.5 text-purple-400" /> Repositories
          </div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">
            {stats.uniqueRepos}
          </div>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedFilter === "all"
              ? "bg-white/15 text-white border border-white/20"
              : "bg-white/[0.04] text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          All Activity
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("push")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedFilter === "push"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-white/[0.04] text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
          Pushes
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("star")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedFilter === "star"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "bg-white/[0.04] text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-400" />
          Stars
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("fork")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedFilter === "fork"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "bg-white/[0.04] text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          <GitFork className="w-3.5 h-3.5 text-purple-400" />
          Forks
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("other")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedFilter === "other"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
              : "bg-white/[0.04] text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Other
        </button>
      </div>

      {/* Feed Stream */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 rounded-3xl border border-white/[0.06] bg-[#0e131f]/50 text-center space-y-3">
          <Activity className="w-8 h-8 text-neutral-500 mx-auto" />
          <p className="text-neutral-300 text-sm font-medium">No activity matches your filters.</p>
          {(searchQuery || selectedFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedFilter("all");
              }}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-mono cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8" role="feed" aria-label="GitHub Activity Feed">
          {[...grouped.entries()].map(([dateLabel, dayEvents]) => (
            <section key={dateLabel} className="space-y-3">
              {/* Date Header Badge */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono text-neutral-400 bg-white/[0.05] border border-white/[0.08] tracking-wider uppercase">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-neutral-400 font-mono">
                  {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Day Event Cards */}
              <div className="space-y-3">
                {dayEvents.map((event) => {
                  const isDeferred = cardGlobalIndex >= 4;
                  cardGlobalIndex++;
                  return (
                    <FeedEventCard
                      key={event.id}
                      event={event}
                      isDeferred={isDeferred}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pt-4 border-t border-white/[0.06]">
        <span>Feed synced {timeAgo(data.fetchedAt)}</span>
        <span>
          Showing {filteredEvents.length} of {rawEvents.length} events
        </span>
      </div>
    </div>
  );
}
