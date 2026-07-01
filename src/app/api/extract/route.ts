import { NextResponse } from "next/server";
import { ExtractSchema } from "@/lib/validators";
import { extractArticle } from "@/services/scraper";
import NodeCache from "node-cache";

// Prevent multiple instances of NodeCache in Next.js dev mode (HMR)
const globalForCache = global as unknown as { extractionCache: NodeCache };

const extractionCache =
  globalForCache.extractionCache ||
  new NodeCache({
    stdTTL: 86400, // 24 hours in seconds
    checkperiod: 600, // check expired keys every 10 minutes
  });

if (process.env.NODE_ENV !== "production") {
  globalForCache.extractionCache = extractionCache;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = ExtractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { url } = validation.data;

    // Check cache
    const cachedArticle = extractionCache.get(url);
    if (cachedArticle) {
      console.log(`[API Extract] Cache HIT for URL: ${url}`);
      return NextResponse.json({
        success: true,
        data: cachedArticle,
      });
    }

    console.log(`[API Extract] Cache MISS for URL: ${url}. Scraping...`);
    const article = await extractArticle(url);

    // Save to cache
    extractionCache.set(url, article);

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error: any) {
    console.error("[API Extract] Scraper execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to scrape or extract readable content from URL.",
      },
      { status: 500 }
    );
  }
}
