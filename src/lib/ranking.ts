import { GitHubUserStats } from './github';

export interface RankedUser extends GitHubUserStats {
  rank: number;
  score: number;
}

export type SortField = 'score' | 'followers' | 'totalContributions' | 'publicRepos' | 'starsReceived';
export type SortDirection = 'asc' | 'desc';

export function calculateScore(user: GitHubUserStats): number {
  // Configurable weights
  const WEIGHTS = {
    totalContributions: 1,
    followers: 0.5,
    starsReceived: 2,
    forksReceived: 1.5,
    publicRepos: 0.2,
  };

  return (
    user.totalContributions * WEIGHTS.totalContributions +
    user.followers * WEIGHTS.followers +
    user.starsReceived * WEIGHTS.starsReceived +
    user.forksReceived * WEIGHTS.forksReceived +
    user.publicRepos * WEIGHTS.publicRepos
  );
}

export function sortAndRankUsers(
  users: GitHubUserStats[],
  sortBy: SortField = 'score',
  direction: SortDirection = 'desc'
): RankedUser[] {
  const scoredUsers = users.map((user) => ({
    ...user,
    score: calculateScore(user),
  }));

  const sorted = scoredUsers.sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    
    if (valA < valB) return direction === 'desc' ? 1 : -1;
    if (valA > valB) return direction === 'desc' ? -1 : 1;
    return 0;
  });

  return sorted.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));
}
