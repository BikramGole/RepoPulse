import { describe, it, expect } from "vitest";
import {
  calculateUserScore,
  sortAndRankUsers,
  filterUsers,
} from "./ranking";
import { GitHubUserStats, DEFAULT_WEIGHTS } from "@/types";

const mockUsers: GitHubUserStats[] = [
  {
    login: "alice",
    name: "Alice Developer",
    avatarUrl: "https://example.com/alice.png",
    bio: "Full stack engineer",
    company: "Acme",
    location: "Global",
    websiteUrl: null,
    twitterUsername: null,
    followers: 100,
    following: 20,
    publicRepos: 10,
    starsReceived: 50,
    forksReceived: 10,
    totalContributions: 500,
    timeline: {
      last7Days: 20,
      last30Days: 80,
      last365Days: 500,
    },
    topRepositories: [],
    historicalRank: 2,
  },
  {
    login: "bob",
    name: "Bob Builder",
    avatarUrl: "https://example.com/bob.png",
    bio: "Open source enthusiast",
    company: null,
    location: null,
    websiteUrl: null,
    twitterUsername: null,
    followers: 250,
    following: 10,
    publicRepos: 30,
    starsReceived: 500,
    forksReceived: 100,
    totalContributions: 1200,
    timeline: {
      last7Days: 5,
      last30Days: 30,
      last365Days: 1200,
    },
    topRepositories: [],
    historicalRank: 1,
  },
  {
    login: "charlie",
    name: null,
    avatarUrl: "https://example.com/charlie.png",
    bio: null,
    company: null,
    location: null,
    websiteUrl: null,
    twitterUsername: null,
    followers: 5,
    following: 5,
    publicRepos: 2,
    starsReceived: 0,
    forksReceived: 0,
    totalContributions: 30,
    timeline: {
      last7Days: 0,
      last30Days: 0,
      last365Days: 30,
    },
    topRepositories: [],
  },
];

describe("Ranking Algorithm", () => {
  it("calculates weighted score correctly", () => {
    const { score, breakdown } = calculateUserScore(mockUsers[0], DEFAULT_WEIGHTS);
    expect(score).toBeGreaterThan(0);
    expect(breakdown.contributions).toBe(500 * DEFAULT_WEIGHTS.contributions);
    expect(breakdown.stars).toBe(50 * DEFAULT_WEIGHTS.stars);
  });

  it("sorts users by score in descending order and assigns correct ranks", () => {
    const ranked = sortAndRankUsers(mockUsers, "score", "desc");
    expect(ranked).toHaveLength(3);
    expect(ranked[0].login).toBe("bob");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].login).toBe("alice");
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].login).toBe("charlie");
    expect(ranked[2].rank).toBe(3);
  });

  it("calculates rankDelta when historicalRank is present", () => {
    const ranked = sortAndRankUsers(mockUsers, "score", "desc");
    // Bob: historicalRank 1, current rank 1 => delta 0
    expect(ranked[0].rankDelta).toBe(0);
    // Alice: historicalRank 2, current rank 2 => delta 0
    expect(ranked[1].rankDelta).toBe(0);
    // Charlie: historicalRank undefined => delta undefined
    expect(ranked[2].rankDelta).toBeUndefined();
  });

  it("sorts users by custom metrics such as recent7Days", () => {
    const ranked = sortAndRankUsers(mockUsers, "recent7Days", "desc");
    expect(ranked[0].login).toBe("alice"); // 20 vs 5 vs 0
  });

  it("filters users by username or search query", () => {
    const ranked = sortAndRankUsers(mockUsers, "score", "desc");
    const filtered = filterUsers(ranked, "alice");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].login).toBe("alice");
  });

  it("filters users with recent activity only", () => {
    const ranked = sortAndRankUsers(mockUsers, "score", "desc");
    const active = filterUsers(ranked, "", 0, true);
    expect(active).toHaveLength(2);
    expect(active.some((u) => u.login === "charlie")).toBe(false);
  });
});
