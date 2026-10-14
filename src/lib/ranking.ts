import {
  GitHubUserStats,
  RankedUser,
  RankingWeights,
  DEFAULT_WEIGHTS,
  SortField,
  SortDirection,
} from "@/types";
import { sanitizeWeight } from "@/lib/validation";

function sanitizeWeights(weights: RankingWeights): RankingWeights {
  return {
    contributions: sanitizeWeight(weights.contributions, DEFAULT_WEIGHTS.contributions),
    stars: sanitizeWeight(weights.stars, DEFAULT_WEIGHTS.stars),
    forks: sanitizeWeight(weights.forks, DEFAULT_WEIGHTS.forks),
    followers: sanitizeWeight(weights.followers, DEFAULT_WEIGHTS.followers),
    recentActivity: sanitizeWeight(weights.recentActivity, DEFAULT_WEIGHTS.recentActivity),
    repos: sanitizeWeight(weights.repos, DEFAULT_WEIGHTS.repos),
  };
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function calculateUserScore(
  user: GitHubUserStats,
  weights: RankingWeights = DEFAULT_WEIGHTS
): { score: number; breakdown: RankedUser["scoreBreakdown"] } {
  const w = sanitizeWeights(weights);
  const contributions = num(user.totalContributions) * w.contributions;
  const stars = num(user.starsReceived) * w.stars;
  const forks = num(user.forksReceived) * w.forks;
  const followers = num(user.followers) * w.followers;
  const recentActivity = (num(user.timeline?.last30Days) * 1.5 + num(user.timeline?.last7Days) * 2.0) * w.recentActivity;
  const repos = num(user.publicRepos) * w.repos;

  const total = contributions + stars + forks + followers + recentActivity + repos;

  return {
    score: Math.round(total * 10) / 10,
    breakdown: {
      contributions: Math.round(contributions * 10) / 10,
      stars: Math.round(stars * 10) / 10,
      forks: Math.round(forks * 10) / 10,
      followers: Math.round(followers * 10) / 10,
      recentActivity: Math.round(recentActivity * 10) / 10,
      repos: Math.round(repos * 10) / 10,
    },
  };
}

export function sortAndRankUsers(
  users: GitHubUserStats[],
  sortBy: SortField = "score",
  direction: SortDirection = "desc",
  weights: RankingWeights = DEFAULT_WEIGHTS
): RankedUser[] {
  // First calculate scores for all users
  const scoredUsers = users.map((user) => {
    const { score, breakdown } = calculateUserScore(user, weights);
    return {
      ...user,
      score,
      scoreBreakdown: breakdown,
    };
  });

  // Sort by the chosen metric
  const sorted = [...scoredUsers].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    switch (sortBy) {
      case "score":
        valA = a.score;
        valB = b.score;
        break;
      case "totalContributions":
        valA = a.totalContributions ?? 0;
        valB = b.totalContributions ?? 0;
        break;
      case "recent7Days":
        valA = a.timeline?.last7Days ?? 0;
        valB = b.timeline?.last7Days ?? 0;
        break;
      case "recent30Days":
        valA = a.timeline?.last30Days ?? 0;
        valB = b.timeline?.last30Days ?? 0;
        break;
      case "followers":
        valA = a.followers ?? 0;
        valB = b.followers ?? 0;
        break;
      case "following":
        valA = a.following ?? 0;
        valB = b.following ?? 0;
        break;
      case "starsReceived":
        valA = a.starsReceived ?? 0;
        valB = b.starsReceived ?? 0;
        break;
      case "forksReceived":
        valA = a.forksReceived ?? 0;
        valB = b.forksReceived ?? 0;
        break;
      case "publicRepos":
        valA = a.publicRepos ?? 0;
        valB = b.publicRepos ?? 0;
        break;
      default:
        valA = a.score;
        valB = b.score;
    }

    if (valA !== valB) {
      return direction === "desc" ? valB - valA : valA - valB;
    }

    // Tie-breaker: total contributions, then followers, then alphabetical login
    if (a.totalContributions !== b.totalContributions) {
      return b.totalContributions - a.totalContributions;
    }
    if (a.followers !== b.followers) {
      return b.followers - a.followers;
    }
    return a.login.localeCompare(b.login);
  });

  // Assign ranks and calculate rankDelta if historical rank is present
  return sorted.map((user, index) => {
    const rank = index + 1;
    let rankDelta: number | undefined = undefined;

    if (user.historicalRank) {
      // If historical was 5 and current is 3, climbed +2
      rankDelta = user.historicalRank - rank;
    }

    return {
      ...user,
      rank,
      rankDelta,
    };
  });
}

export function filterUsers(
  users: RankedUser[],
  searchQuery: string,
  minContributions = 0,
  hasRecentActivityOnly = false
): RankedUser[] {
  const query = searchQuery.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      !query ||
      user.login.toLowerCase().includes(query) ||
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.bio && user.bio.toLowerCase().includes(query));

    const matchesContributions = user.totalContributions >= minContributions;

    const matchesActivity =
      !hasRecentActivityOnly ||
      (user.timeline?.last7Days || 0) > 0 ||
      (user.timeline?.last30Days || 0) > 0;

    return matchesSearch && matchesContributions && matchesActivity;
  });
}
