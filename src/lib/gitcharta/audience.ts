import fs from "fs";
import path from "path";
import { getOrSetCache } from "../cache";
import { localizeProfile } from "./geocode";
import { AudienceProfile, UserAudienceData } from "./types";
import { fetchGitHubFollowingStats } from "../github";
import { sortAndRankUsers } from "../ranking";

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

interface RawAudienceNode {
  login: string;
  databaseId?: number;
  name: string | null;
  avatarUrl: string;
  url?: string;
  company?: string | null;
  location: string | null;
  bio?: string | null;
  twitterUsername?: string | null;
}

interface RawAudienceQueryResponse {
  data?: {
    user?: {
      login: string;
      followers: {
        totalCount: number;
        nodes: RawAudienceNode[];
      };
      following: {
        totalCount: number;
        nodes: RawAudienceNode[];
      };
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Builds fallback audience data using the local classmate cohort
 * when offline or rate-limited.
 */
async function buildCohortFallbackAudience(
  username: string,
  token?: string
): Promise<UserAudienceData> {
  let cohort: ReturnType<typeof sortAndRankUsers> = [];
  try {
    const rawUsers = await fetchGitHubFollowingStats("NeoXBikram", token);
    cohort = sortAndRankUsers(rawUsers, "score", "desc");
  } catch (err) {
    console.warn("Could not load cohort for fallback audience:", err);
  }

  const normalizedUser = username.toLowerCase();
  const rankMap = new Map<string, number>();
  for (const c of cohort) {
    rankMap.set(c.login.toLowerCase(), c.rank);
  }

  const currentUser = cohort.find((c) => c.login.toLowerCase() === normalizedUser);
  const otherClassmates = cohort.filter((c) => c.login.toLowerCase() !== normalizedUser);

  let followingNodes: RawAudienceNode[] = [];
  let followerNodes: RawAudienceNode[] = [];

  if (normalizedUser === "neoxbikram") {
    // NeoXBikram follows all classmates in the cohort
    followingNodes = otherClassmates.map((c) => ({
      login: c.login,
      name: c.name,
      avatarUrl: c.avatarUrl,
      url: `https://github.com/${c.login}`,
      company: c.company,
      location: c.location || (c.country?.name ?? "Nepal"),
      bio: c.bio,
      twitterUsername: c.twitterUsername,
    }));

    // Classmates that follow NeoXBikram back
    followerNodes = otherClassmates.slice(0, currentUser?.followers || 7).map((c) => ({
      login: c.login,
      name: c.name,
      avatarUrl: c.avatarUrl,
      url: `https://github.com/${c.login}`,
      company: c.company,
      location: c.location || (c.country?.name ?? "Nepal"),
      bio: c.bio,
      twitterUsername: c.twitterUsername,
    }));
  } else {
    // For any classmate in the cohort
    const primary = cohort.find((c) => c.login.toLowerCase() === "neoxbikram");
    if (primary) {
      followerNodes.push({
        login: primary.login,
        name: primary.name,
        avatarUrl: primary.avatarUrl,
        url: `https://github.com/${primary.login}`,
        company: primary.company,
        location: primary.location || "Nepal",
        bio: primary.bio,
        twitterUsername: primary.twitterUsername,
      });
    }

    // Peers from cohort
    const targetCount = currentUser?.following || 3;
    followingNodes = otherClassmates.slice(0, Math.max(1, targetCount)).map((c) => ({
      login: c.login,
      name: c.name,
      avatarUrl: c.avatarUrl,
      url: `https://github.com/${c.login}`,
      company: c.company,
      location: c.location || (c.country?.name ?? "Nepal"),
      bio: c.bio,
      twitterUsername: c.twitterUsername,
    }));

    const followerCount = currentUser?.followers || 4;
    followerNodes.push(
      ...otherClassmates.slice(0, Math.max(0, followerCount - followerNodes.length)).map((c) => ({
        login: c.login,
        name: c.name,
        avatarUrl: c.avatarUrl,
        url: `https://github.com/${c.login}`,
        company: c.company,
        location: c.location || (c.country?.name ?? "Nepal"),
        bio: c.bio,
        twitterUsername: c.twitterUsername,
      }))
    );
  }

  const followers = followerNodes.map((node) =>
    localizeProfile(node, rankMap.get(node.login.toLowerCase()))
  );
  const following = followingNodes.map((node) =>
    localizeProfile(node, rankMap.get(node.login.toLowerCase()))
  );

  const followerLogins = new Set(followers.map((f) => f.login.toLowerCase()));
  const mutuals = following.filter((f) => followerLogins.has(f.login.toLowerCase()));

  return {
    username,
    followers,
    following,
    mutuals,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchAudienceField(
  login: string,
  field: "followers" | "following",
  authToken: string,
  maxItems: number = 600
): Promise<RawAudienceNode[]> {
  const nodes: RawAudienceNode[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext && nodes.length < maxItems) {
    const query = `
      query GetAudiencePage($login: String!, $after: String) {
        user(login: $login) {
          ${field}(first: 100, after: $after) {
            totalCount
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              login
              databaseId
              name
              avatarUrl
              url
              company
              location
              bio
              twitterUsername
            }
          }
        }
      }
    `;

    try {
      const res: Response = await fetch(GITHUB_GRAPHQL_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "User-Agent": "RepoPulse-GitCharta",
        },
        body: JSON.stringify({
          query,
          variables: { login, after: cursor },
        }),
      });

      if (!res.ok) break;

      const payload: any = await res.json();
      const conn = payload?.data?.user?.[field];
      if (!conn || !Array.isArray(conn.nodes)) break;

      nodes.push(...conn.nodes);

      hasNext = Boolean(conn.pageInfo?.hasNextPage);
      cursor = conn.pageInfo?.endCursor || null;
      if (!cursor) break;
    } catch {
      break;
    }
  }

  return nodes;
}

/**
 * Fetches audience (followers & following) for any GitHub username,
 * geocoding all profiles to country destinations using GitCharta intelligence.
 */
export async function fetchUserAudience(
  username: string,
  token?: string,
  forceRefresh: boolean = false
): Promise<UserAudienceData> {
  let authToken = token || process.env.GITHUB_TOKEN;
  if (!authToken) {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const match = fs.readFileSync(envPath, "utf8").match(/GITHUB_TOKEN=([^\r\n]+)/);
        if (match) authToken = match[1].trim();
      }
    } catch {
      // ignore
    }
  }

  const cacheKey = `gitcharta-audience-${username.toLowerCase()}`;

  const { data } = await getOrSetCache(
    cacheKey,
    async () => {
      // 1. If auth token available, fetch all pages of followers and following
      if (authToken) {
        try {
          const [followerNodes, followingNodes] = await Promise.all([
            fetchAudienceField(username, "followers", authToken, 800),
            fetchAudienceField(username, "following", authToken, 800),
          ]);

          if (followerNodes.length > 0 || followingNodes.length > 0) {
            // Check cohort for rank badges
            let cohort: ReturnType<typeof sortAndRankUsers> = [];
            try {
              const rawUsers = await fetchGitHubFollowingStats("NeoXBikram", authToken);
              cohort = sortAndRankUsers(rawUsers, "score", "desc");
            } catch {
              // ignore
            }
            const rankMap = new Map<string, number>();
            for (const c of cohort) {
              rankMap.set(c.login.toLowerCase(), c.rank);
            }

            const followers = followerNodes.map((node) =>
              localizeProfile(node, rankMap.get(node.login.toLowerCase()))
            );
            const following = followingNodes.map((node) =>
              localizeProfile(node, rankMap.get(node.login.toLowerCase()))
            );

            const followerLogins = new Set(followers.map((f) => f.login.toLowerCase()));
            const mutuals = following.filter((f) => followerLogins.has(f.login.toLowerCase()));

            return {
              username,
              followers,
              following,
              mutuals,
              updatedAt: new Date().toISOString(),
            };
          }
        } catch (err) {
          console.warn(`Live GraphQL audience fetch failed for ${username}, using cohort fallback:`, err);
        }
      }

      // 2. Fallback to cohort audience synthesis
      return await buildCohortFallbackAudience(username, authToken);
    },
    { forceRefresh, ttlMs: 15 * 60 * 1000 }
  );

  return data;
}
