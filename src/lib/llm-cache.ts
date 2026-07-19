import { createHash } from "crypto";
import NodeCache from "node-cache";

const globalForLLMCache = global as unknown as { llmResponseCache: NodeCache };

export const llmResponseCache =
  globalForLLMCache.llmResponseCache ||
  new NodeCache({
    stdTTL: 86400, // 24 hours
    checkperiod: 600,
  });

if (process.env.NODE_ENV !== "production") {
  globalForLLMCache.llmResponseCache = llmResponseCache;
}

function buildCacheKey(url: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${JSON.stringify(params[k])}`)
    .join("&");
  return createHash("sha256").update(`${url}|${sorted}`).digest("hex");
}

export function getCachedLLM<T>(url: string, params: Record<string, unknown>): T | undefined {
  return llmResponseCache.get<T>(buildCacheKey(url, params));
}

export function setCachedLLM<T>(url: string, params: Record<string, unknown>, data: T): void {
  llmResponseCache.set(buildCacheKey(url, params), data);
}
