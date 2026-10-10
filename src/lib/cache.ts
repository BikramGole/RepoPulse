import fs from "fs";
import path from "path";

export interface CacheEntry<T> {
  data: T;
  timestamp: number; // Unix timestamp ms
  key: string;
}

export interface CacheOptions {
  ttlMs?: number; // Time to live in ms (default: 15 minutes)
  graceMs?: number; // SWR grace period (default: 24 hours)
  forceRefresh?: boolean;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_GRACE_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-Memory RAM Cache (Level 1)
const memoryStore = new Map<string, CacheEntry<unknown>>();

// Disk Cache Directory (Level 2)
const CACHE_DIR = process.env.VERCEL
  ? path.resolve("/tmp", ".cache")
  : path.resolve(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "commitrank-cache.json");
const SEED_CACHE_FILE = path.join(process.cwd(), ".cache", "commitrank-cache.json");

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch (err) {
    // Graceful fallback if filesystem is read-only
    console.warn("Could not create cache directory:", err);
  }
}

function readDiskCache(): Record<string, CacheEntry<unknown>> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, "utf8");
      return JSON.parse(content);
    }
    if (fs.existsSync(SEED_CACHE_FILE)) {
      const content = fs.readFileSync(SEED_CACHE_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Failed reading disk cache:", err);
  }
  return {};
}

function writeDiskCache(key: string, entry: CacheEntry<unknown>) {
  try {
    ensureCacheDir();
    const current = readDiskCache();
    current[key] = entry;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(current, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed writing disk cache:", err);
  }
}

/**
 * High-performance Multi-Tier Stale-While-Revalidate (SWR) cache.
 * Tier 1: Memory (RAM)
 * Tier 2: Persistent Disk
 * Strategy: Return fresh cache immediately. If stale but in grace period, return stale and revalidate in background.
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{ data: T; source: "memory" | "disk" | "network"; isStale: boolean }> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const graceMs = options.graceMs ?? DEFAULT_GRACE_MS;
  const force = options.forceRefresh ?? false;
  const now = Date.now();

  // 1. Check in-memory RAM store first
  if (!force && memoryStore.has(key)) {
    const entry = memoryStore.get(key) as CacheEntry<T>;
    const age = now - entry.timestamp;

    if (age <= ttlMs) {
      return { data: entry.data, source: "memory", isStale: false };
    }

    if (age <= graceMs) {
      // Stale while revalidate: trigger background fetch
      void (async () => {
        try {
          const fresh = await fetcher();
          const newEntry: CacheEntry<T> = { data: fresh, timestamp: Date.now(), key };
          memoryStore.set(key, newEntry);
          writeDiskCache(key, newEntry);
        } catch (e) {
          console.warn(`Background revalidation failed for ${key}:`, e);
        }
      })();

      return { data: entry.data, source: "memory", isStale: true };
    }
  }

  // 2. Check persistent disk store
  if (!force) {
    const diskStore = readDiskCache();
    const diskEntry = diskStore[key] as CacheEntry<T> | undefined;

    if (diskEntry) {
      const age = now - diskEntry.timestamp;
      // Populate memory store
      memoryStore.set(key, diskEntry);

      if (age <= ttlMs) {
        return { data: diskEntry.data, source: "disk", isStale: false };
      }

      if (age <= graceMs) {
        // Trigger background revalidate
        void (async () => {
          try {
            const fresh = await fetcher();
            const newEntry: CacheEntry<T> = { data: fresh, timestamp: Date.now(), key };
            memoryStore.set(key, newEntry);
            writeDiskCache(key, newEntry);
          } catch (e) {
            console.warn(`Background revalidation failed for ${key}:`, e);
          }
        })();

        return { data: diskEntry.data, source: "disk", isStale: true };
      }
    }
  }

  // 3. Cache Miss or Force Refresh -> Fetch from source
  try {
    const freshData = await fetcher();
    const newEntry: CacheEntry<T> = { data: freshData, timestamp: Date.now(), key };
    memoryStore.set(key, newEntry);
    writeDiskCache(key, newEntry);

    return { data: freshData, source: "network", isStale: false };
  } catch (error) {
    // If network fails (rate limit / offline), fallback to any stale cache available
    const staleMemory = memoryStore.get(key) as CacheEntry<T> | undefined;
    if (staleMemory) {
      console.warn(`Network fetch failed, falling back to stale memory cache for ${key}`);
      return { data: staleMemory.data, source: "memory", isStale: true };
    }

    const diskStore = readDiskCache();
    const staleDisk = diskStore[key] as CacheEntry<T> | undefined;
    if (staleDisk) {
      console.warn(`Network fetch failed, falling back to stale disk cache for ${key}`);
      return { data: staleDisk.data, source: "disk", isStale: true };
    }

    throw error;
  }
}
