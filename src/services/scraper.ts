import axios from "axios";
import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";


export interface ExtractedArticle {
  title: string;
  content: string;
  excerpt: string;
  siteName: string;
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await axios.get(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      responseType: "text"
    });

    clearTimeout(timeoutId);

    const contentType = String(res.headers["content-type"] || "");
    if (!contentType.includes("text/html")) {
      throw new Error("Invalid content type. Expected HTML content.");
    }

    const html = res.data;

    if (!html || html.trim().length === 0) {
      throw new Error("Received empty HTML content from the page.");
    }

    // Parse HTML with linkedom (lightweight DOM for serverless)
    const { document } = parseHTML(html);

    if (!document) {
      throw new Error("Failed to parse DOM representation of page.");
    }

    // Run Mozilla Readability
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      throw new Error("Unable to extract clean text. The article page layout is not readable or might be paywalled/JS-rendered.");
    }

    return {
      title: article.title || "Untitled Article",
      content: article.textContent ? article.textContent.trim() : "",
      excerpt: article.excerpt ? article.excerpt.trim() : "",
      siteName: article.siteName || "",
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`[ScraperService] Failed to extract from URL: ${url}`, error);
    
    if (error.name === "AbortError") {
      throw new Error("Scraping request timed out. The server took too long to respond.");
    }
    
    throw new Error(error.message || "Failed to fetch and parse the article.");
  }
}
