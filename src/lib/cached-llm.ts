import { createHash } from "crypto";
import { getCachedLLM, setCachedLLM } from "@/lib/llm-cache";

/**
 * Wraps an LLM call with automatic caching keyed by URL + params.
 * Returns cached result on hit; calls `llmCall()`, caches, and returns on miss.
 *
 * When `url` is undefined/empty, caching is skipped entirely.
 */
export async function cachedLLMCall<T>(
  url: string | undefined,
  params: Record<string, unknown>,
  llmCall: () => Promise<T>
): Promise<T> {
  if (url) {
    const textHash = createHash("sha256")
      .update(JSON.stringify(params))
      .digest("hex")
      .slice(0, 16);
    const cacheKey = { ...params, _h: textHash };
    const cached = getCachedLLM<T>(url, cacheKey);
    if (cached !== undefined) {
      console.log(`[LLM Cache] HIT for ${url}`);
      return cached;
    }
    console.log(`[LLM Cache] MISS for ${url}`);
  }

  const result = await llmCall();

  if (url) {
    const textHash = createHash("sha256")
      .update(JSON.stringify(params))
      .digest("hex")
      .slice(0, 16);
    const cacheKey = { ...params, _h: textHash };
    setCachedLLM(url, cacheKey, result);
  }

  return result;
}
