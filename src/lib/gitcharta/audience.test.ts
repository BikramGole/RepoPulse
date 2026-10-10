import { describe, it, expect } from "vitest";
import { fetchUserAudience } from "./audience";

describe("fetchUserAudience", () => {
  it("successfully returns followers and following for NeoXBikram", async () => {
    const data = await fetchUserAudience("NeoXBikram");
    expect(data).toBeDefined();
    expect(data.username).toBe("NeoXBikram");
    expect(Array.isArray(data.followers)).toBe(true);
    expect(Array.isArray(data.following)).toBe(true);
    expect(Array.isArray(data.mutuals)).toBe(true);
    expect(data.following.length).toBeGreaterThan(0);

    const firstFollowed = data.following[0];
    expect(firstFollowed.login).toBeDefined();
    expect(firstFollowed.country).toBeDefined();
    expect(firstFollowed.countryFlag).toBeDefined();
    expect(firstFollowed.countryName).toBeDefined();
  });

  it("handles classmate profiles with localized country data", async () => {
    const data = await fetchUserAudience("sandesh6636");
    expect(data).toBeDefined();
    expect(data.username).toBe("sandesh6636");
    expect(data.followers.length).toBeGreaterThan(0);
  });
});
