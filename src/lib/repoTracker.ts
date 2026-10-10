import { readCacheFile, writeCacheFile } from "./cache";
import {
  RepoInsightData,
  RepoOverview,
  ContributorStat,
  RepoPR,
  RepoIssue,
  DayDataPoint,
  AgeBucket,
  LifetimeBucket,
} from "@/types/repoTracker";

const GITHUB_API_BASE = "https://api.github.com";

interface FetchOptions {
  token?: string;
  forceRefresh?: boolean;
}

function getAuthHeaders(token?: string): Record<string, string> {
  const authToken = token || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoPulse-RepoTracker",
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

/**
 * Builds array of 30 past consecutive days ending today
 */
function buildPast30Days(): DayDataPoint[] {
  const days: DayDataPoint[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayOfMonth = String(d.getDate());
    days.push({
      date: dateStr,
      dayLabel: dayOfMonth,
      count: 0,
    });
  }

  return days;
}

/**
 * Fetches comprehensive repository intelligence, pull requests, issues,
 * and contributors metrics like githubtracker.com
 */
export async function fetchRepoInsights(
  owner: string,
  repo: string,
  options: FetchOptions = {}
): Promise<RepoInsightData> {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const cacheKey = `repo_insights_${cleanOwner.toLowerCase()}_${cleanRepo.toLowerCase()}.json`;

  if (!options.forceRefresh) {
    const cached = await readCacheFile<RepoInsightData>(cacheKey);
    if (cached) {
      // 15-minute freshness check
      const ageMs = Date.now() - new Date(cached.updatedAt).getTime();
      if (ageMs < 15 * 60 * 1000) {
        return cached;
      }
    }
  }

  const headers = getAuthHeaders(options.token);

  // 1. Fetch Repository Overview
  const repoRes = await fetch(`${GITHUB_API_BASE}/repos/${cleanOwner}/${cleanRepo}`, {
    headers,
    next: { revalidate: 600 },
  });

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`Repository "${cleanOwner}/${cleanRepo}" was not found on GitHub.`);
    }
    throw new Error(`GitHub API error (${repoRes.status}): ${repoRes.statusText}`);
  }

  const rawRepo: any = await repoRes.json();

  const overview: RepoOverview = {
    name: rawRepo.name,
    fullName: rawRepo.full_name,
    owner: {
      login: rawRepo.owner?.login || cleanOwner,
      avatarUrl: rawRepo.owner?.avatar_url || "",
      htmlUrl: rawRepo.owner?.html_url || `https://github.com/${cleanOwner}`,
    },
    description: rawRepo.description || null,
    htmlUrl: rawRepo.html_url,
    stars: rawRepo.stargazers_count || 0,
    forks: rawRepo.forks_count || 0,
    openIssuesCount: rawRepo.open_issues_count || 0,
    watchers: rawRepo.subscribers_count ?? rawRepo.watchers_count ?? 0,
    language: rawRepo.language || null,
    topics: Array.isArray(rawRepo.topics) ? rawRepo.topics : [],
    license: rawRepo.license?.spdx_id || rawRepo.license?.name || null,
    defaultBranch: rawRepo.default_branch || "main",
    createdAt: rawRepo.created_at,
    updatedAt: rawRepo.updated_at,
    pushedAt: rawRepo.pushed_at,
    homepage: rawRepo.homepage || null,
  };

  // 2. Fetch Contributors
  let rawContributors: any[] = [];
  try {
    const contribRes = await fetch(
      `${GITHUB_API_BASE}/repos/${cleanOwner}/${cleanRepo}/contributors?per_page=100`,
      { headers, next: { revalidate: 600 } }
    );
    if (contribRes.ok) {
      rawContributors = await contribRes.json();
    }
  } catch {
    rawContributors = [];
  }

  const contributors: ContributorStat[] = (Array.isArray(rawContributors) ? rawContributors : []).map(
    (c: any) => {
      const isBot =
        c.type === "Bot" ||
        (c.login && (c.login.endsWith("[bot]") || c.login.includes("bot")));
      return {
        login: c.login,
        avatarUrl: c.avatar_url || "",
        contributions: c.contributions || 0,
        htmlUrl: c.html_url || `https://github.com/${c.login}`,
        isBot,
      };
    }
  );

  // 3. Fetch Pull Requests (last 100)
  let rawPRs: any[] = [];
  try {
    const prRes = await fetch(
      `${GITHUB_API_BASE}/repos/${cleanOwner}/${cleanRepo}/pulls?state=all&per_page=100&sort=created&direction=desc`,
      { headers, next: { revalidate: 300 } }
    );
    if (prRes.ok) {
      rawPRs = await prRes.json();
    }
  } catch {
    rawPRs = [];
  }

  const pulls: RepoPR[] = (Array.isArray(rawPRs) ? rawPRs : []).map((p: any) => {
    const isBot =
      p.user?.type === "Bot" ||
      (p.user?.login && (p.user.login.endsWith("[bot]") || p.user.login.includes("bot")));

    let state: "open" | "closed" | "merged" = "open";
    if (p.merged_at) {
      state = "merged";
    } else if (p.state === "closed") {
      state = "closed";
    }

    return {
      id: p.id,
      number: p.number,
      title: p.title,
      state,
      user: {
        login: p.user?.login || "anonymous",
        avatarUrl: p.user?.avatar_url || "",
      },
      createdAt: p.created_at,
      closedAt: p.closed_at || null,
      mergedAt: p.merged_at || null,
      htmlUrl: p.html_url,
      isBot,
    };
  });

  // Calculate Daily Opened Pull Requests (30d excl. bots)
  const dailyOpenedPRs = buildPast30Days();
  const dayIndexMap = new Map<string, number>();
  dailyOpenedPRs.forEach((d, idx) => dayIndexMap.set(d.date, idx));

  const nowMs = Date.now();
  const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  let prs30dCount = 0;
  let merged30dCount = 0;
  let closed30dCount = 0;
  let open30dCount = 0;

  for (const pr of pulls) {
    const createdMs = new Date(pr.createdAt).getTime();
    if (createdMs >= thirtyDaysAgoMs) {
      prs30dCount++;
      if (pr.state === "merged") merged30dCount++;
      else if (pr.state === "closed") closed30dCount++;
      else open30dCount++;

      if (!pr.isBot) {
        const dateKey = pr.createdAt.split("T")[0];
        const idx = dayIndexMap.get(dateKey);
        if (idx !== undefined) {
          dailyOpenedPRs[idx].count += 1;
        }
      }
    }
  }

  const latestPRs = pulls.filter((p) => !p.isBot).slice(0, 15);

  // 4. Fetch Issues (last 100)
  let rawIssues: any[] = [];
  try {
    const issuesRes = await fetch(
      `${GITHUB_API_BASE}/repos/${cleanOwner}/${cleanRepo}/issues?state=all&per_page=100&sort=created&direction=desc`,
      { headers, next: { revalidate: 300 } }
    );
    if (issuesRes.ok) {
      rawIssues = await issuesRes.json();
    }
  } catch {
    rawIssues = [];
  }

  // Filter out Pull Requests from issues endpoint
  const issuesList: RepoIssue[] = (Array.isArray(rawIssues) ? rawIssues : [])
    .filter((item: any) => !item.pull_request)
    .map((item: any) => {
      const isBot =
        item.user?.type === "Bot" ||
        (item.user?.login && (item.user.login.endsWith("[bot]") || item.user.login.includes("bot")));
      return {
        id: item.id,
        number: item.number,
        title: item.title,
        state: item.state === "closed" ? "closed" : "open",
        user: {
          login: item.user?.login || "anonymous",
          avatarUrl: item.user?.avatar_url || "",
        },
        createdAt: item.created_at,
        closedAt: item.closed_at || null,
        htmlUrl: item.html_url,
        isBot,
      };
    });

  // Calculate 30d Open Issues Timeline
  const openIssuesTimeline = buildPast30Days();
  const issueDayIndexMap = new Map<string, number>();
  openIssuesTimeline.forEach((d, idx) => issueDayIndexMap.set(d.date, idx));

  let issues30dCount = 0;
  let closedIssues30d = 0;
  let openIssues30d = 0;

  for (const issue of issuesList) {
    const createdMs = new Date(issue.createdAt).getTime();
    if (createdMs >= thirtyDaysAgoMs) {
      issues30dCount++;
      if (issue.state === "closed") closedIssues30d++;
      else openIssues30d++;

      const dateKey = issue.createdAt.split("T")[0];
      const idx = issueDayIndexMap.get(dateKey);
      if (idx !== undefined) {
        openIssuesTimeline[idx].count += 1;
      }
    }
  }

  // 5. Calculate Open Issue Age
  const openIssues = issuesList.filter((i) => i.state === "open");
  const ageBuckets = [
    { key: "<24h", label: "< 24h", maxDays: 1, count: 0, color: "#22c55e" },
    { key: "7d", label: "7d", maxDays: 7, count: 0, color: "#eab308" },
    { key: "30d", label: "30d", maxDays: 30, count: 0, color: "#f97316" },
    { key: "90d", label: "90d", maxDays: 90, count: 0, color: "#ef4444" },
    { key: "180d", label: "180d", maxDays: 180, count: 0, color: "#a855f7" },
    { key: "older", label: "older...", maxDays: Infinity, count: 0, color: "#64748b" },
  ];

  for (const issue of openIssues) {
    const ageDays = (nowMs - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 1) ageBuckets[0].count++;
    else if (ageDays <= 7) ageBuckets[1].count++;
    else if (ageDays <= 30) ageBuckets[2].count++;
    else if (ageDays <= 90) ageBuckets[3].count++;
    else if (ageDays <= 180) ageBuckets[4].count++;
    else ageBuckets[5].count++;
  }

  const totalOpenAged = openIssues.length || 1;
  const openIssueAge: AgeBucket[] = ageBuckets.map((b) => ({
    key: b.key,
    label: b.label,
    count: b.count,
    percent: Math.round((b.count / totalOpenAged) * 100),
    color: b.color,
  }));

  // 6. Calculate Issue Lifetime (open to close)
  const closedIssues = issuesList.filter((i) => i.state === "closed" && i.closedAt);
  const lifetimeBuckets = [
    { key: "1d", label: "1d", maxDays: 1, count: 0, color: "#38bdf8" },
    { key: "3d", label: "3d", maxDays: 3, count: 0, color: "#38bdf8" },
    { key: "7d", label: "7d", maxDays: 7, count: 0, color: "#38bdf8" },
    { key: "15d", label: "15d", maxDays: 15, count: 0, color: "#38bdf8" },
    { key: "20d", label: "20d", maxDays: 20, count: 0, color: "#38bdf8" },
    { key: "90d", label: "90d", maxDays: 90, count: 0, color: "#38bdf8" },
    { key: "180d", label: "180d", maxDays: 180, count: 0, color: "#38bdf8" },
    { key: "more", label: "more", maxDays: Infinity, count: 0, color: "#38bdf8" },
  ];

  let totalLifetimeDays = 0;
  for (const issue of closedIssues) {
    const lifeDays =
      (new Date(issue.closedAt!).getTime() - new Date(issue.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    totalLifetimeDays += Math.max(0, lifeDays);

    if (lifeDays <= 1) lifetimeBuckets[0].count++;
    else if (lifeDays <= 3) lifetimeBuckets[1].count++;
    else if (lifeDays <= 7) lifetimeBuckets[2].count++;
    else if (lifeDays <= 15) lifetimeBuckets[3].count++;
    else if (lifeDays <= 20) lifetimeBuckets[4].count++;
    else if (lifeDays <= 90) lifetimeBuckets[5].count++;
    else if (lifeDays <= 180) lifetimeBuckets[6].count++;
    else lifetimeBuckets[7].count++;
  }

  const avgLifetimeDays =
    closedIssues.length > 0
      ? Number((totalLifetimeDays / closedIssues.length).toFixed(1))
      : null;

  const issueLifetime: LifetimeBucket[] = lifetimeBuckets.map((b) => ({
    key: b.key,
    label: b.label,
    count: b.count,
    color: b.color,
  }));

  const latestIssues = issuesList.slice(0, 15);

  const totalContributions = contributors.reduce((acc, c) => acc + c.contributions, 0);

  const insightData: RepoInsightData = {
    overview,
    contributors,
    dailyOpenedPRs,
    latestPRs,
    openIssuesTimeline,
    openIssueAge,
    issueLifetime,
    latestIssues,
    metrics: {
      totalContributions,
      totalPRs30d: prs30dCount,
      mergedPRs30d: merged30dCount,
      closedPRs30d: closed30dCount,
      openPRs30d: open30dCount,
      totalIssues30d: issues30dCount,
      closedIssues30d,
      openIssues30d,
      avgLifetimeDays,
    },
    updatedAt: new Date().toISOString(),
  };

  // Cache asynchronously
  try {
    await writeCacheFile(cacheKey, insightData);
  } catch (err) {
    console.warn("Failed to write repo insight cache:", err);
  }

  return insightData;
}

/**
 * Searches repositories on GitHub
 */
export async function searchRepositories(query: string, token?: string): Promise<RepoOverview[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const headers = getAuthHeaders(token);
  const res = await fetch(
    `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(cleanQ)}&per_page=8`,
    { headers, next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return [];
  }

  const data: any = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items.map((r: any) => ({
    name: r.name,
    fullName: r.full_name,
    owner: {
      login: r.owner?.login || "",
      avatarUrl: r.owner?.avatar_url || "",
      htmlUrl: r.owner?.html_url || "",
    },
    description: r.description || null,
    htmlUrl: r.html_url,
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    openIssuesCount: r.open_issues_count || 0,
    watchers: r.watchers_count || 0,
    language: r.language || null,
    topics: Array.isArray(r.topics) ? r.topics : [],
    license: r.license?.spdx_id || r.license?.name || null,
    defaultBranch: r.default_branch || "main",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    pushedAt: r.pushed_at,
    homepage: r.homepage || null,
  }));
}
