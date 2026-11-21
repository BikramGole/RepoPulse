"use client";

import React, { useState } from "react";
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
} from "lucide-react";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} minute${m !== 1 ? "s" : ""} ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} hour${h !== 1 ? "s" : ""} ago`;
  }
  const d = Math.floor(diffSec / 86400);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function EventIcon({ type }: { type: FeedEvent["type"] }) {
  const baseClass = "w-4 h-4 shrink-0";
  switch (type) {
    case "push":
      return <GitCommit className={`${baseClass} text-emerald-400`} />;
    case "star":
      return <Star className={`${baseClass} text-yellow-400`} />;
    case "fork":
      return <GitFork className={`${baseClass} text-purple-400`} />;
    case "follow":
      return <UserPlus className={`${baseClass} text-blue-400`} />;
    case "create":
      return <GitBranch className={`${baseClass} text-cyan-400`} />;
    case "issue":
      return <AlertCircle className={`${baseClass} text-orange-400`} />;
    case "pr":
      return <GitPullRequest className={`${baseClass} text-blue-400`} />;
    case "release":
      return <Package className={`${baseClass} text-pink-400`} />;
    default:
      return <Activity className={`${baseClass} text-neutral-400`} />;
  }
}

function eventBorderColor(type: FeedEvent["type"]): string {
  switch (type) {
    case "push":
      return "border-l-emerald-500/40";
    case "star":
      return "border-l-yellow-500/40";
    case "fork":
      return "border-l-purple-500/40";
    case "follow":
      return "border-l-blue-500/40";
    case "create":
      return "border-l-cyan-500/40";
    case "issue":
      return "border-l-orange-500/40";
    case "pr":
      return "border-l-blue-500/40";
    case "release":
      return "border-l-pink-500/40";
    default:
      return "border-l-neutral-500/40";
  }
}

function FeedEventCard({ event }: { event: FeedEvent }) {
  return (
    <div
      className={`group relative flex gap-3 p-4 rounded-2xl border border-white/[0.06] bg-[#0e131f]/70 backdrop-blur-sm hover:bg-[#111827]/80 hover:border-white/[0.12] transition-all border-l-2 ${eventBorderColor(event.type)}`}
    >
      {/* Avatar */}
      <a
        href={`https://github.com/${event.actor.login}`}
        target="_blank"
        rel="noreferrer"
        className="shrink-0"
      >
        <img
          src={event.actor.avatarUrl || `https://avatars.githubusercontent.com/${event.actor.login}`}
          alt={event.actor.login}
          className="w-10 h-10 rounded-full border border-white/[0.08] group-hover:border-white/[0.2] transition-all"
          loading="lazy"
        />
      </a>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <EventIcon type={event.type} />
            <a
              href={`https://github.com/${event.actor.login}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sm text-white hover:text-blue-400 transition-colors font-mono"
            >
              {event.actor.login}
            </a>
            <span className="text-neutral-400 text-sm truncate">
              {event.summary}
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono whitespace-nowrap shrink-0">
            {timeAgo(event.createdAt)}
          </span>
        </div>

        {/* Repo link */}
        {event.repo && (
          <a
            href={event.repo.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400/80 hover:text-blue-300 font-mono transition-colors"
          >
            <span className="truncate max-w-[300px]">{event.repo.name}</span>
          </a>
        )}

        {/* Commit messages for push events */}
        {event.type === "push" &&
          event.meta?.commitMessages &&
          event.meta.commitMessages.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {event.meta.commitMessages.slice(0, 3).map((msg, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-neutral-400"
                >
                  <span className="text-emerald-500/60 font-mono shrink-0 mt-0.5">
                    ●
                  </span>
                  <span className="truncate">{msg || "No commit message"}</span>
                </div>
              ))}
              {(event.meta.commitCount ?? 0) > 3 && (
                <span className="text-[11px] text-neutral-500 font-mono pl-4">
                  +{(event.meta.commitCount ?? 0) - 3} more commits
                </span>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

type FeedTab = "network" | "you";

export function GitHubFeed({ data }: { data: GitHubFeedData }) {
  const [activeTab, setActiveTab] = useState<FeedTab>("network");

  const events =
    activeTab === "network" ? data.networkEvents : data.userEvents;

  // Group events by date for a nicer timeline feel
  const grouped = new Map<string, FeedEvent[]>();
  for (const event of events) {
    const dateKey = new Date(event.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(event);
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0e131f]/80 rounded-2xl border border-white/[0.06] w-fit">
        <button
          onClick={() => setActiveTab("network")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "network"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              : "text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          <Rss className="w-3.5 h-3.5" />
          Network
        </button>
        <button
          onClick={() => setActiveTab("you")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "you"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              : "text-neutral-400 hover:text-white border border-transparent"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          You
        </button>
      </div>

      {/* Feed Stream */}
      {events.length === 0 ? (
        <div className="p-12 rounded-3xl border border-white/[0.06] bg-[#0e131f]/50 text-center">
          <Activity className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">No recent activity found.</p>
          <p className="text-neutral-500 text-xs mt-1">
            Events will appear here as your network is active.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([dateLabel, dayEvents]) => (
            <div key={dateLabel} className="space-y-2">
              {/* Date separator */}
              <div className="flex items-center gap-3 py-1">
                <span className="text-xs font-semibold text-neutral-500 font-mono uppercase tracking-wider whitespace-nowrap">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Events for this date */}
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <FeedEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      <p className="text-[11px] text-neutral-500 font-mono text-center pt-2">
        Feed synced {timeAgo(data.fetchedAt)} · Showing{" "}
        {events.length} event{events.length !== 1 ? "s" : ""} ·{" "}
        <span className="text-neutral-400">@{data.username}</span>
      </p>
    </div>
  );
}
