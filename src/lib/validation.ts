/**
 * Central input validation (security-review + api-design-principles).
 * All GitHub identifiers that reach GraphQL interpolation or REST URLs
 * must pass through here. Seams are tested in validation.test.ts (tdd).
 */

const GITHUB_LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
// GitHub repo names: alphanumerics, ., _, -, max 100 chars, cannot end with .git ambiguities handled by caller
const GITHUB_REPO_RE = /^[a-zA-Z0-9._-]{1,100}$/;

export function isValidGitHubLogin(login: unknown): login is string {
  return typeof login === "string" && GITHUB_LOGIN_RE.test(login) && login.length <= 39;
}

export function assertValidGitHubLogin(login: unknown, field = "login"): asserts login is string {
  if (!isValidGitHubLogin(login)) {
    throw new Error(`Invalid GitHub ${field}: must be 1-39 chars, alphanumerics or hyphens`);
  }
}

export function isValidRepoName(name: unknown): name is string {
  if (typeof name !== "string") return false;
  if (name.length === 0 || name.length > 100) return false;
  if (name === "." || name === "..") return false;
  if (name.endsWith(".git")) return false;
  return GITHUB_REPO_RE.test(name);
}

export function assertValidRepoSlug(owner: unknown, repo: unknown): void {
  if (!isValidGitHubLogin(owner)) {
    throw new Error("Invalid repository owner");
  }
  if (!isValidRepoName(repo)) {
    throw new Error("Invalid repository name");
  }
}

/** Search query guard: trim, bound length, strip control chars. Returns "" when unusable. */
export function sanitizeSearchQuery(q: unknown, maxLen = 100): string {
  if (typeof q !== "string") return "";
  // Remove control characters (potential log injection / header concerns)
  const cleaned = q.replace(new RegExp("[\u0000-\u001F\u007F]", "g"), "").trim();
  if (cleaned.length === 0) return "";
  return cleaned.slice(0, maxLen);
}

/** Clamp a weight to a finite, non-negative number (ranking hardening). */
export function sanitizeWeight(value: unknown, fallback = 0, max = 10): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
}
