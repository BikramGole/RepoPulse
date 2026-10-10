import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrSetCache } from "./cache";

describe("Multi-Tier Cache Engine", () => {
  it("fetches from network on cache miss", async () => {
    const fetcher = vi.fn().mockResolvedValue({ hello: "world" });
    const key = "test-key-" + Date.now();

    const res = await getOrSetCache(key, fetcher, { ttlMs: 1000 });
    expect(res.data).toEqual({ hello: "world" });
    expect(res.source).toBe("network");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("serves from memory on immediate subsequent request", async () => {
    const fetcher = vi.fn().mockResolvedValue({ count: 42 });
    const key = "test-mem-" + Date.now();

    // First request (network)
    await getOrSetCache(key, fetcher, { ttlMs: 5000 });
    // Second request (memory cache)
    const res2 = await getOrSetCache(key, fetcher, { ttlMs: 5000 });

    expect(res2.data).toEqual({ count: 42 });
    expect(res2.source).toBe("memory");
    expect(res2.isStale).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1); // Not called again!
  });

  it("respects forceRefresh option", async () => {
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      callCount++;
      return { val: callCount };
    });
    const key = "test-force-" + Date.now();

    await getOrSetCache(key, fetcher, { ttlMs: 5000 });
    const refreshed = await getOrSetCache(key, fetcher, { forceRefresh: true });

    expect(refreshed.data).toEqual({ val: 2 });
    expect(refreshed.source).toBe("network");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
