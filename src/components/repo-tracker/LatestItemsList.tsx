"use client";

import React from "react";
import Image from "next/image";
import { RepoPR, RepoIssue } from "@/types/repoTracker";
import { GitPullRequest, CircleDot, ExternalLink } from "lucide-react";

interface LatestPRsListProps {
  type: "pr";
  title?: string;
  items: RepoPR[];
}

interface LatestIssuesListProps {
  type: "issue";
  title?: string;
  items: RepoIssue[];
}

type LatestItemsListProps = LatestPRsListProps | LatestIssuesListProps;

function formatRelativeDate(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1d ago";
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoStr;
  }
}

export function LatestItemsList(props: LatestItemsListProps) {
  const { type, title = type === "pr" ? "Latest (excl. bots)" : "Latest", items } = props;

  return (
    <div className="w-full bg-[#0b0f19] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-medium text-neutral-300 tracking-tight flex items-center gap-1.5">
          {type === "pr" ? (
            <GitPullRequest className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <CircleDot className="w-3.5 h-3.5 text-rose-400" />
          )}
          {title}
        </span>
        <span className="text-[11px] font-mono text-neutral-400">
          Recent: <strong className="text-white font-semibold">{items.length}</strong>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[190px] divide-y divide-white/[0.04] pr-1">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-neutral-400">
            No recent {type === "pr" ? "pull requests" : "issues"} found.
          </div>
        ) : (
          items.slice(0, 8).map((item) => {
            const isPR = "state" in item && type === "pr";
            const state = item.state;

            let badgeBg = "bg-neutral-800 text-neutral-300 border-neutral-700";
            let stateLabel = state.toUpperCase();

            if (state === "open") {
              badgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            } else if (state === "merged") {
              badgeBg = "bg-purple-500/10 text-purple-400 border-purple-500/20";
            } else if (state === "closed") {
              badgeBg = "bg-neutral-800 text-neutral-400 border-white/10";
            }

            return (
              <a
                key={item.id}
                href={item.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2.5 py-2.5 px-2 rounded-xl hover:bg-white/[0.04] transition-colors group/item block"
              >
                {/* Author Avatar */}
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10 flex-shrink-0 mt-0.5">
                  <Image
                    src={item.user.avatarUrl}
                    alt={item.user.login}
                    fill
                    unoptimized
                    sizes="24px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md border ${badgeBg}`}
                    >
                      {stateLabel}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-300 font-medium truncate">
                      {item.user.login}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {formatRelativeDate(item.createdAt)}
                    </span>
                  </div>

                  <p
                    className="text-xs text-neutral-300 group-hover/item:text-cyan-300 transition-colors line-clamp-1 mt-1 font-sans"
                    title={item.title}
                  >
                    {item.title}
                  </p>
                </div>

                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover/item:text-white transition-colors flex-shrink-0 mt-1 opacity-0 group-hover/item:opacity-100" />
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
