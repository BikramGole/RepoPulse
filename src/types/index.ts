export interface ContributionTimeline {
  last7Days: number;
  last30Days: number;
  last365Days: number;
}

export interface RepositorySummary {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: string | null;
  isFork: boolean;
  updatedAt: string;
}

export interface GitHubUserStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterUsername: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  starsReceived: number;
  forksReceived: number;
  totalContributions: number;
  timeline: ContributionTimeline;
  topRepositories: RepositorySummary[];
  historicalRank?: number;
}

export interface RankingWeights {
  contributions: number;
  stars: number;
  forks: number;
  followers: number;
  recentActivity: number;
  repos: number;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  contributions: 1.0,
  stars: 2.5,
  forks: 1.5,
  followers: 0.5,
  recentActivity: 1.2,
  repos: 0.2,
};

export type SortField =
  | 'score'
  | 'totalContributions'
  | 'recent7Days'
  | 'recent30Days'
  | 'followers'
  | 'following'
  | 'starsReceived'
  | 'forksReceived'
  | 'publicRepos';

export type SortDirection = 'asc' | 'desc';

export interface RankedUser extends GitHubUserStats {
  rank: number;
  score: number;
  rankDelta?: number; // positive = climbed up, negative = dropped, 0 = unchanged
  scoreBreakdown: {
    contributions: number;
    stars: number;
    forks: number;
    followers: number;
    recentActivity: number;
    repos: number;
  };
}
