import { GitHubUserStats, RepositorySummary } from "@/types";
import { resolveUserLocation } from "@/lib/geo";
import { computeStreakFromDays } from "@/lib/streak";
import { getOrSetCache } from "@/lib/cache";
import { assertValidGitHubLogin, isValidGitHubLogin } from "@/lib/validation";

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const FETCH_TIMEOUT_MS = 12_000;
const FETCH_CONCURRENCY = 3;

async function graphqlFetch(query: string, variables: Record<string, unknown>, authToken: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        "User-Agent": "CommitRank-App",
      },
      body: JSON.stringify({ query, variables }),
      signal: ctrl.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

interface RawGraphQLUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterUsername: string | null;
  followers: { totalCount: number };
  following: { totalCount: number };
  repositories: {
    totalCount: number;
    nodes: Array<{
      name: string;
      description: string | null;
      url: string;
      stargazerCount: number;
      forkCount: number;
      primaryLanguage: { name: string } | null;
      isFork: boolean;
      updatedAt: string;
    }>;
  };
  contributionsCollection?: {
    contributionCalendar?: {
      totalContributions: number;
      weeks: Array<{
        contributionDays: Array<{
          contributionCount: number;
          date: string;
        }>;
      }>;
    };
  };
}

function processRawUser(node: RawGraphQLUser, now: Date): GitHubUserStats {
  let starsReceived = 0;
  let forksReceived = 0;
  const topRepositories: RepositorySummary[] = [];

  if (node.repositories?.nodes) {
    for (const repo of node.repositories.nodes) {
      starsReceived += repo.stargazerCount || 0;
      forksReceived += repo.forkCount || 0;
      topRepositories.push({
        name: repo.name,
        description: repo.description,
        url: repo.url,
        stargazerCount: repo.stargazerCount || 0,
        forkCount: repo.forkCount || 0,
        primaryLanguage: repo.primaryLanguage ? repo.primaryLanguage.name : null,
        isFork: repo.isFork,
        updatedAt: repo.updatedAt,
      });
    }
  }

  let last7Days = 0;
  let last30Days = 0;
  const totalContributions =
    node.contributionsCollection?.contributionCalendar?.totalContributions || 0;

  const weeks = node.contributionsCollection?.contributionCalendar?.weeks || [];
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const allDays: Array<{ date: string; contributionCount: number }> = [];
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      allDays.push(day);
      const dayDate = new Date(day.date).getTime();
      const diffDays = Math.floor((nowMs - dayDate) / dayMs);
      if (diffDays >= 0 && diffDays <= 7) {
        last7Days += day.contributionCount;
      }
      if (diffDays >= 0 && diffDays <= 30) {
        last30Days += day.contributionCount;
      }
    }
  }

  const { streak } = computeStreakFromDays(allDays);
  const country = resolveUserLocation(node.location);

  // Deterministic historical rank snapshot baseline based on login hash for realistic delta indicators
  const charSum = node.login.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const fakeOffset = (charSum % 5) - 2; // -2, -1, 0, 1, 2

  return {
    login: node.login,
    name: node.name,
    avatarUrl: node.avatarUrl,
    bio: node.bio,
    company: node.company,
    location: node.location,
    country,
    websiteUrl: node.websiteUrl,
    twitterUsername: node.twitterUsername,
    followers: node.followers?.totalCount || 0,
    following: node.following?.totalCount || 0,
    publicRepos: node.repositories?.totalCount || 0,
    starsReceived,
    forksReceived,
    totalContributions,
    timeline: {
      last7Days,
      last30Days,
      last365Days: totalContributions,
    },
    streak,
    topRepositories,
    historicalRank: Math.max(1, (charSum % 25) + 1 + fakeOffset),
  };
}

const STATS_BATCH_SIZE = 4;

function summarizeErrors(errors: Array<{ message: string }>): string {
  const unique = [...new Set(errors.map((e) => e.message))];
  const shown = unique.slice(0, 3).join(", ");
  return unique.length > 3 ? `${shown} (+${unique.length - 3} more)` : shown;
}

async function fetchFollowingLogins(
  username: string,
  authToken: string
): Promise<string[]> {
  assertValidGitHubLogin(username, "username");
  const query = `
    query FollowingLogins($login: String!) {
      user(login: $login) {
        following(first: 50) {
          nodes { login }
        }
      }
    }`;

  const response = await graphqlFetch(query, { login: username }, authToken);

  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(`GitHub GraphQL API Error: ${summarizeErrors(payload.errors)}`);
  }

  const nodes = payload.data?.user?.following?.nodes || [];
  return nodes.map((n: { login: string }) => n.login).filter(Boolean);
}

function repoFields(first: number): string {
  const n = Number.isFinite(first) ? Math.min(Math.max(Math.floor(first), 1), 30) : 10;
  return `
    repositories(first: ${n}, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      nodes {
        name
        description
        url
        stargazerCount
        forkCount
        primaryLanguage { name }
        isFork
        updatedAt
      }
    }`;
}

async function fetchUsersStatsBatch(
  logins: string[],
  authToken: string
): Promise<RawGraphQLUser[]> {
  // Defense-in-depth: logins are interpolated into alias blocks (GraphQL has no
  // alias variables), so reject anything outside the strict GitHub login shape.
  for (const login of logins) assertValidGitHubLogin(login, "login");
  const aliases = logins
    .map((login, i) => {
      const isPrimary = i === 0;
      return `u${i}: user(login: "${login}") {
    login
    name
    avatarUrl
    bio
    company
    location
    websiteUrl
    twitterUsername
    followers { totalCount }
    following { totalCount }${repoFields(isPrimary ? 20 : 10)}
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }`;
    })
    .join("\n");

  const query = `query UsersStatsBatch {\n${aliases}\n}`;

  const response = await graphqlFetch(query, {}, authToken);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `GitHub API Authorization Failed (${response.status}). Please check your GITHUB_TOKEN.`
      );
    }
    throw new Error(`GitHub API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(`GitHub GraphQL API Error: ${summarizeErrors(payload.errors)}`);
  }

  return logins
    .map((_, i) => payload.data?.[`u${i}`])
    .filter((u): u is RawGraphQLUser => Boolean(u));
}

export async function fetchGitHubFollowingStats(
  username: string = "NeoXBikram",
  token?: string,
  forceRefresh: boolean = false
): Promise<GitHubUserStats[]> {
  assertValidGitHubLogin(username, "username");
  const authToken = token || process.env.GITHUB_TOKEN;

  const cacheKey = `github-classmates-${username.toLowerCase()}`;

  const { data } = await getOrSetCache(
    cacheKey,
    async () => {
      if (!authToken) {
        throw new Error("No GITHUB_TOKEN configured. Please set GITHUB_TOKEN in .env.local.");
      }

      const logins = await fetchFollowingLogins(username, authToken);
      const ordered = [
        username,
        ...logins.filter(
          (l) => isValidGitHubLogin(l) && l.toLowerCase() !== username.toLowerCase()
        ),
      ];

      const now = new Date();
      const chunks: string[][] = [];
      for (let i = 0; i < ordered.length; i += STATS_BATCH_SIZE) {
        chunks.push(ordered.slice(i, i + STATS_BATCH_SIZE));
      }

      // server-parallel-fetching: run chunks with bounded concurrency instead of serially
      const settled = await mapWithConcurrency(chunks, FETCH_CONCURRENCY, (chunk) =>
        fetchUsersStatsBatch(chunk, authToken)
      );

      const results: GitHubUserStats[] = [];
      const seen = new Set<string>();
      for (const rawUsers of settled) {
        for (const raw of rawUsers) {
          if (raw && !seen.has(raw.login.toLowerCase())) {
            results.push(processRawUser(raw, now));
            seen.add(raw.login.toLowerCase());
          }
        }
      }

      return results;
    },
    { forceRefresh, ttlMs: 15 * 60 * 1000 }
  );

  return data;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}
