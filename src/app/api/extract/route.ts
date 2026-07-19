import { withValidation } from "@/lib/api-route";
import { ExtractSchema } from "@/lib/validators";
import { extractArticle } from "@/services/scraper";
import NodeCache from "node-cache";

const globalForCache = global as unknown as { extractionCache: NodeCache };
const extractionCache =
  globalForCache.extractionCache ||
  new NodeCache({ stdTTL: 86400, checkperiod: 600 });

if (process.env.NODE_ENV !== "production") {
  globalForCache.extractionCache = extractionCache;
}

export const POST = withValidation(ExtractSchema, async ({ url }) => {
  const cachedArticle = extractionCache.get(url);
  if (cachedArticle) {
    console.log(`[API Extract] Cache HIT for URL: ${url}`);
    return cachedArticle;
  }

  console.log(`[API Extract] Cache MISS for URL: ${url}. Scraping...`);
  const article = await extractArticle(url);
  extractionCache.set(url, article);
  return article;
});
