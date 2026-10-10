import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRepoInsights, searchRepositories } from "./repoTracker";

describe("RepoTracker Intelligence Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches, computes and formats repository insights properly", async () => {
    // Mock global fetch
    const mockRepoData = {
      name: "KinaHub",
      full_name: "BikramGole/KinaHub",
      owner: {
        login: "BikramGole",
        avatar_url: "https://avatars.githubusercontent.com/u/173899168",
        html_url: "https://github.com/BikramGole",
      },
      description: "Classmate ecosystem",
      html_url: "https://github.com/BikramGole/KinaHub",
      stargazers_count: 16,
      forks_count: 2,
      open_issues_count: 3,
      watchers_count: 16,
      language: "TypeScript",
      topics: ["nextjs", "react"],
      license: { spdx_id: "MIT" },
      default_branch: "main",
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-10-10T00:00:00Z",
      pushed_at: "2026-10-10T12:00:00Z",
      homepage: null,
    };

    const mockContributors = [
      {
        login: "BikramGole",
        avatar_url: "https://avatars.githubusercontent.com/u/173899168",
        contributions: 236,
        html_url: "https://github.com/BikramGole",
        type: "User",
      },
      {
        login: "github-actions[bot]",
        avatar_url: "https://avatars.githubusercontent.com/in/15368",
        contributions: 1,
        html_url: "https://github.com/apps/github-actions",
        type: "Bot",
      },
    ];

    const mockPRs = [
      {
        id: 101,
        number: 1,
        title: "Swap demo walkthrough",
        state: "closed",
        merged_at: "2026-07-02T13:07:22Z",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          login: "BikramGole",
          avatar_url: "https://avatars.githubusercontent.com/u/173899168",
          type: "User",
        },
        html_url: "https://github.com/BikramGole/KinaHub/pull/1",
      },
    ];

    const mockIssues = [
      {
        id: 201,
        number: 5,
        title: "Sentry bug fix",
        state: "closed",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        closed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          login: "BikramGole",
          avatar_url: "https://avatars.githubusercontent.com/u/173899168",
          type: "User",
        },
        html_url: "https://github.com/BikramGole/KinaHub/issues/5",
        pull_request: null,
      },
      {
        id: 202,
        number: 6,
        title: "PR masquerading as issue",
        state: "open",
        created_at: new Date().toISOString(),
        closed_at: null,
        user: { login: "test", avatar_url: "" },
        html_url: "https://github.com/test",
        pull_request: { url: "https://api.github.com/pulls/6" }, // should be filtered out
      },
    ];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/contributors")) {
        return { ok: true, json: async () => mockContributors };
      }
      if (url.includes("/pulls")) {
        return { ok: true, json: async () => mockPRs };
      }
      if (url.includes("/issues")) {
        return { ok: true, json: async () => mockIssues };
      }
      if (url.includes("/repos/BikramGole/KinaHub")) {
        return { ok: true, json: async () => mockRepoData };
      }
      return { ok: false, status: 404, statusText: "Not Found" };
    }) as any;

    const data = await fetchRepoInsights("BikramGole", "KinaHub", { forceRefresh: true });

    expect(data.overview.name).toBe("KinaHub");
    expect(data.overview.stars).toBe(16);
    expect(data.overview.language).toBe("TypeScript");

    // Contributors
    expect(data.contributors.length).toBe(2);
    expect(data.contributors[0].isBot).toBe(false);
    expect(data.contributors[1].isBot).toBe(true);

    // Pull Requests
    expect(data.dailyOpenedPRs.length).toBe(30);
    expect(data.latestPRs.length).toBe(1);
    expect(data.latestPRs[0].state).toBe("merged");

    // Issues: pull request 202 must be filtered out
    expect(data.latestIssues.length).toBe(1);
    expect(data.latestIssues[0].id).toBe(201);

    // Buckets
    expect(data.openIssueAge.length).toBe(6);
    expect(data.issueLifetime.length).toBe(8);
    // Closed issue was closed in 2 days -> bucket "3d" should have 1 count
    const threeDayBucket = data.issueLifetime.find((b) => b.key === "3d");
    expect(threeDayBucket?.count).toBe(1);
  });

  it("handles repo search results correctly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            name: "RepoPulse",
            full_name: "BikramGole/RepoPulse",
            owner: { login: "BikramGole", avatar_url: "https://avatar", html_url: "https://gh" },
            stargazers_count: 10,
            forks_count: 1,
            open_issues_count: 0,
            language: "TypeScript",
            topics: [],
            license: null,
            default_branch: "main",
            created_at: "2026-01-01",
            updated_at: "2026-01-02",
            pushed_at: "2026-01-03",
          },
        ],
      }),
    }) as any;

    const results = await searchRepositories("RepoPulse");
    expect(results.length).toBe(1);
    expect(results[0].fullName).toBe("BikramGole/RepoPulse");
    expect(results[0].stars).toBe(10);
  });
});
