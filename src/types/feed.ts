/**
 * Types for the GitHub activity feed.
 * Maps GitHub REST API event types to a simplified, renderable feed model.
 */

export interface FeedActor {
  login: string;
  avatarUrl: string;
}

export interface FeedRepo {
  name: string; // "owner/repo"
  url: string;
  description?: string | null;
  language?: string | null;
  stars?: number;
}

export interface FeedUser {
  login: string;
  avatarUrl: string;
  bio?: string | null;
  repos?: number;
  followers?: number;
}

export type FeedEventType =
  | "push"
  | "star"
  | "fork"
  | "follow"
  | "create"
  | "issue"
  | "pr"
  | "release"
  | "watch"
  | "unknown";

export interface FeedEvent {
  id: string;
  type: FeedEventType;
  actor: FeedActor;
  repo?: FeedRepo;
  createdAt: string; // ISO timestamp
  /** Human-readable summary line */
  summary: string;
  /** Extra context depending on type */
  meta?: {
    branch?: string;
    commitCount?: number;
    commitMessages?: string[];
    action?: string;
    targetUser?: FeedUser;
    forkRepo?: string;
    releaseTag?: string;
    releaseName?: string;
    issueTitle?: string;
    issueNumber?: number;
    prTitle?: string;
    prNumber?: number;
  };
}

export interface GitHubFeedData {
  /** Events from people the user follows (received_events) */
  networkEvents: FeedEvent[];
  /** The user's own activity */
  userEvents: FeedEvent[];
  /** Timestamp of fetch */
  fetchedAt: string;
  username: string;
}
