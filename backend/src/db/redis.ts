import { Redis } from "ioredis";
import { ENV_VARS } from "../const/env.js";

export const redis = new Redis({
  host: ENV_VARS.redis.host,
  port: ENV_VARS.redis.port,
  password: ENV_VARS.redis.password,
  lazyConnect: true,
});

redis.on("error", (err: Error) => {
  console.error("[redis] connection error:", err.message);
});

export const FILTER_CACHE_TTL = 60 * 60; // 1 hour
const FILTER_CACHE_PREFIX = "influencer:filter:";
const VERSION_KEY = "influencer:filter:version";

function sortedStringify(obj: unknown): string {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(sortedStringify).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + sortedStringify((obj as Record<string, unknown>)[k]))
      .join(",") +
    "}"
  );
}

export function buildFilterCacheKey(version: string, filters: object): string {
  return `${FILTER_CACHE_PREFIX}v${version}:${sortedStringify(filters)}`;
}

/** Get the current cache version. Returns null if Redis is unreachable. */
export async function getCacheVersion(): Promise<string | null> {
  return redis.get(VERSION_KEY).catch(() => null);
}

/** Bump the version so all existing cache keys become unreachable orphans (TTL expires them). */
export async function invalidateFilterCache(): Promise<void> {
  await redis.incr(VERSION_KEY);
}
