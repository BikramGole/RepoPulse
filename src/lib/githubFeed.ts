import { FeedEvent, FeedEventType, GitHubFeedData } from "@/types/feed";
import { getOrSetCache } from "@/lib/cache";
import { assertValidGitHubLogin } from "@/lib/validation";

const GITHUB_REST_API = "https://api.github.com";
const FETCH_TIMEOUT_MS = 12_000;

async function restFetch(path: string, authToken: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${GITHUB_REST_API}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${authToken}`,
        "User-Agent": "CommitRank-App",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: ctrl.signal,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `GitHub API Authorization Failed (${response.status}). Check your GITHUB_TOKEN.`
        );
      }
      throw new Error(`GitHub API request failed with status ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapEventType(raw: string): FeedEventType {
  switch (raw) {
    case "PushEvent":
      return "push";
    case "WatchEvent":
      return "star";
    case "ForkEvent":
      return "fork";
    case "FollowEvent":
      return "follow";
    case "CreateEvent":
      return "create";
    case "IssuesEvent":
      return "issue";
    case "PullRequestEvent":
      return "pr";
    case "ReleaseEvent":
      return "release";
    default:
      return "unknown";
  }
}

function buildSummary(type: FeedEventType, actor: string, repoName: string, payload: any): string {
  switch (type) {
    case "push": {
      const count = payload?.commits?.length ?? payload?.size ?? (payload?.head ? 1 : 0);
      const branch = (payload?.ref ?? "").replace("refs/heads/", "");
      const branchName = branch || "main";
      return count > 0
        ? `pushed ${count} commit${count !== 1 ? "s" : ""} to ${branchName} in ${repoName}`
        : `pushed to ${branchName} in ${repoName}`;
    }
    case "star":
      return `starred ${repoName}`;
    case "fork":
      return `forked ${repoName}`;
    case "follow":
      return `followed ${payload?.target?.login ?? "a user"}`;
    case "create": {
      const refType = payload?.ref_type ?? "repository";
      const ref = payload?.ref;
      return ref
        ? `created ${refType} ${ref} in ${repoName}`
        : `created ${refType} ${repoName}`;
    }
    case "issue": {
      const action = payload?.action ?? "opened";
      const title = payload?.issue?.title ?? "";
      return `${action} issue "${title}" in ${repoName}`;
    }
    case "pr": {
      const action = payload?.action ?? "opened";
      const title = payload?.pull_request?.title ?? "";
      return `${action} pull request "${title}" in ${repoName}`;
    }
    case "release": {
      const tag = payload?.release?.tag_name ?? "";
      return `published release ${tag} of ${repoName}`;
    }
    default:
      return `performed an action on ${repoName}`;
  }
}

function parseEvent(raw: any): FeedEvent {
  const type = mapEventType(raw.type ?? "");
  const actor = {
    login: raw.actor?.login ?? raw.actor?.display_login ?? "unknown",
    avatarUrl: raw.actor?.avatar_url ?? "",
  };
  const repoName = raw.repo?.name ?? "";
  const payload = raw.payload ?? {};

  const meta: FeedEvent["meta"] = {};

  if (type === "push") {
    meta.branch = (payload.ref ?? "").replace("refs/heads/", "");
    meta.commitCount = payload.commits?.length ?? payload.size ?? (payload.head ? 1 : 0);
    meta.commitMessages = (payload.commits ?? [])
      .slice(0, 3)
      .map((c: any) => c.message?.split("\n")[0] ?? "");
  } else if (type === "star") {
    meta.action = payload.action ?? "started";
  } else if (type === "fork") {
    meta.forkRepo = payload.forkee?.full_name ?? "";
  } else if (type === "create") {
    meta.branch = payload.ref ?? undefined;
    meta.action = payload.ref_type ?? "repository";
  } else if (type === "issue") {
    meta.action = payload.action;
    meta.issueTitle = payload.issue?.title;
    meta.issueNumber = payload.issue?.number;
  } else if (type === "pr") {
    meta.action = payload.action;
    meta.prTitle = payload.pull_request?.title;
    meta.prNumber = payload.pull_request?.number;
  } else if (type === "release") {
    meta.releaseTag = payload.release?.tag_name;
    meta.releaseName = payload.release?.name;
  }

  return {
    id: raw.id ?? `${Date.now()}-${Math.random()}`,
    type,
    actor,
    repo: repoName
      ? {
          name: repoName,
          url: `https://github.com/${repoName}`,
        }
      : undefined,
    createdAt: raw.created_at ?? new Date().toISOString(),
    summary: buildSummary(type, actor.login, repoName, payload),
    meta: Object.keys(meta).length > 0 ? meta : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Group consecutive same-type events from the same actor on the same repo
 * (e.g. multiple push events to the same repo) into a single entry.
 */
function deduplicateEvents(events: FeedEvent[]): FeedEvent[] {
  const result: FeedEvent[] = [];
  let prev: FeedEvent | null = null;

  for (const event of events) {
    if (
      prev &&
      prev.type === event.type &&
      prev.actor.login === event.actor.login &&
      prev.repo?.name === event.repo?.name &&
      prev.type === "push"
    ) {
      // Merge push events: accumulate commit count
      const prevCommitCount: number = prev.meta?.commitCount ?? 0;
      const curCommitCount: number = event.meta?.commitCount ?? 0;
      const totalCount = prevCommitCount + curCommitCount;
      const mergedMessages = [
        ...(prev.meta?.commitMessages ?? []),
        ...(event.meta?.commitMessages ?? []),
      ].slice(0, 5);
      const branch = prev.meta?.branch || "main";

      const pushSummary = totalCount > 0
        ? `pushed ${totalCount} commit${totalCount !== 1 ? "s" : ""} to ${branch} in ${prev.repo?.name ?? ""}`
        : `pushed to ${branch} in ${prev.repo?.name ?? ""}`;

      const merged: FeedEvent = {
        id: prev.id,
        type: prev.type,
        actor: prev.actor,
        repo: prev.repo,
        createdAt: prev.createdAt,
        summary: pushSummary,
        meta: {
          branch,
          commitCount: totalCount,
          commitMessages: mergedMessages,
        },
      };
      prev = merged;
    } else {
      if (prev) result.push(prev);
      prev = event;
    }
  }
  if (prev) result.push(prev);

  return result;
}

/**
 * Fetch the GitHub activity feed for a user.
 * Uses the REST Events API:
 * - /users/{username}/received_events — activity from people they follow
 * - /users/{username}/events — the user's own activity
 */
export async function fetchGitHubFeed(
  username: string = "NeoXBikram",
  token?: string,
  forceRefresh: boolean = false
): Promise<GitHubFeedData> {
  assertValidGitHubLogin(username, "username");
  const authToken = token || process.env.GITHUB_TOKEN;

  const cacheKey = `github-feed-${username.toLowerCase()}`;

  const { data } = await getOrSetCache(
    cacheKey,
    async () => {
      if (!authToken) {
        throw new Error("No GITHUB_TOKEN configured. Please set GITHUB_TOKEN in .env.local.");
      }

      // Fetch both endpoints in parallel
      const [receivedRaw, userRaw] = await Promise.all([
        restFetch(`/users/${username}/received_events?per_page=50`, authToken),
        restFetch(`/users/${username}/events?per_page=30`, authToken),
      ]);

      const receivedEvents = Array.isArray(receivedRaw)
        ? receivedRaw.map(parseEvent)
        : [];
      const userEvents = Array.isArray(userRaw)
        ? userRaw.map(parseEvent)
        : [];

      return {
        networkEvents: deduplicateEvents(receivedEvents),
        userEvents: deduplicateEvents(userEvents),
        fetchedAt: new Date().toISOString(),
        username,
      };
    },
    { forceRefresh, ttlMs: 5 * 60 * 1000 }
  );

  return data;
}
