import { describe, it, expect } from "vitest";
import {
  isValidGitHubLogin,
  assertValidGitHubLogin,
  isValidRepoName,
  assertValidRepoSlug,
  sanitizeSearchQuery,
  sanitizeWeight,
} from "./validation";

describe("validation (security seam)", () => {
  it("accepts normal logins", () => {
    expect(isValidGitHubLogin("NeoXBikram")).toBe(true);
    expect(isValidGitHubLogin("octocat")).toBe(true);
    expect(isValidGitHubLogin("a-b-123")).toBe(true);
  });

  it("rejects GraphQL injection payloads", () => {
    // Classic breakout attempts must fail closed
    expect(isValidGitHubLogin('"test"){__schema{types{name}}}')).toBe(false);
    expect(isValidGitHubLogin('u0: user(login:"x")')).toBe(false);
    expect(isValidGitHubLogin("a\nb")).toBe(false);
    expect(isValidGitHubLogin('a"b')).toBe(false);
    expect(isValidGitHubLogin("")).toBe(false);
    expect(isValidGitHubLogin("-leading-hyphen")).toBe(false);
    expect(isValidGitHubLogin("x".repeat(40))).toBe(false);
    expect(() => assertValidGitHubLogin('evil" { viewer { login } }')).toThrow();
  });

  it("validates repo slugs against SSRF/path traversal", () => {
    expect(isValidRepoName("KinaHub")).toBe(true);
    expect(isValidRepoName("my.repo-1_2")).toBe(true);
    expect(isValidRepoName("..")).toBe(false);
    expect(isValidRepoName(".")).toBe(false);
    expect(isValidRepoName("x.git")).toBe(false);
    expect(isValidRepoName("../../etc")).toBe(false);
    expect(isValidRepoName("a/b")).toBe(false);
    expect(() => assertValidRepoSlug("octo cat", "repo")).toThrow();
    expect(() => assertValidRepoSlug("octocat", "../x")).toThrow();
  });

  it("sanitizes search queries (control chars, length)", () => {
    expect(sanitizeSearchQuery("  hello  ")).toBe("hello");
    expect(sanitizeSearchQuery("")).toBe("");
    expect(sanitizeSearchQuery("a\u0000b\u001Fc")).toBe("abc");
    expect(sanitizeSearchQuery("x".repeat(500), 100)).toHaveLength(100);
    expect(sanitizeSearchQuery(null)).toBe("");
  });

  it("sanitizes weights (NaN, Infinity, negatives)", () => {
    expect(sanitizeWeight(1.5)).toBe(1.5);
    expect(sanitizeWeight(NaN, 1)).toBe(1);
    expect(sanitizeWeight(Infinity, 1)).toBe(1);
    expect(sanitizeWeight(-2, 0)).toBe(0);
    expect(sanitizeWeight(99, 0, 10)).toBe(10);
  });
});
