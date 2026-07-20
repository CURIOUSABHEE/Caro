import axios from "axios";
import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import type { Browser, Page } from "playwright";


export interface ExtractedArticle {
  title: string;
  content: string;
  excerpt: string;
  siteName: string;
}

/**
 * Pre-process HTML to convert custom elements containing code in HTML comments
 * (e.g. <my-code><!-- code here --></my-code>) into standard <pre><code> blocks
 * so Readability preserves them and the regex code detector can find them.
 */
function normalizeCodeElements(html: string): string {
  return html.replace(
    /<my-code\b([^>]*)>([\s\S]*?)<\/my-code>/gi,
    (_match, attrs: string, inner: string) => {
      const commentMatches = [...inner.matchAll(/<!--\s*([\s\S]*?)-->/g)];
      if (commentMatches.length === 0) return "";

      const code = commentMatches.map((m: RegExpMatchArray) => m[1].trim()).join("\n");

      const langMatch = attrs.match(/\blang=["']([^"']+)["']/i);
      const lang = langMatch ? langMatch[1] : "javascript";

      const escapedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `<pre><code class="language-${lang}">${escapedCode}</code></pre>`;
    }
  );
}

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

async function fetchHtml(url: string, timeoutMs: number = 15000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await axios.get(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      responseType: "text",
    });

    clearTimeout(timeoutId);

    const contentType = String(res.headers["content-type"] || "");
    if (!contentType.includes("text/html")) {
      throw new Error(`Non-HTML content type: ${contentType}`);
    }

    return res.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function htmlToArticle(html: string): ExtractedArticle | null {
  const processed = normalizeCodeElements(html);
  const { document } = parseHTML(processed);
  if (!document) return null;

  const reader = new Readability(document);
  const article = reader.parse();
  if (!article) return null;

  return {
    title: article.title || "Untitled Article",
    content: article.textContent ? article.textContent.trim() : "",
    excerpt: article.excerpt ? article.excerpt.trim() : "",
    siteName: article.siteName || "",
  };
}

// Persistent browser instance for Cloudflare-protected sites
let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = (async () => {
    let chromium;
    try {
      ({ chromium } = await import("playwright"));
    } catch {
      throw new Error("Browser scraping is not available in this environment. Try pasting the article content directly.");
    }
    const browser = await chromium.launch({
      headless: true,
    });
    browserInstance = browser;
    browser.on("disconnected", () => {
      browserInstance = null;
    });
    console.log("[ScraperService] Browser launched for Cloudflare bypass");
    return browser;
  })();

  try {
    return await browserLaunchPromise;
  } finally {
    browserLaunchPromise = null;
  }
}

async function fetchHtmlViaBrowser(url: string, timeoutMs: number = 45000): Promise<string> {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent: BROWSER_HEADERS["User-Agent"],
    viewport: { width: 1280, height: 720 },
  });
  const page: Page = await ctx.newPage();

  try {
    await page.goto(url, {
      waitUntil: "load",
      timeout: timeoutMs,
    });

    // Wait for Cloudflare challenge to resolve
    const title = await page.title();
    if (title.includes("moment") || title.includes("challenge")) {
      await page.waitForFunction(
        () => !document.title.includes("moment") && !document.title.includes("challenge"),
        { timeout: 20000 }
      );
    }

    const html = await page.content();
    return html;
  } finally {
    await page.close();
    await ctx.close();
  }
}

function extractSlugFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) return null;
    return pathParts[pathParts.length - 1];
  } catch {
    return null;
  }
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  // 1. Try direct HTTP fetch
  try {
    const html = await fetchHtml(url);
    if (html && html.trim().length > 0) {
      const article = htmlToArticle(html);
      if (article && article.content.length > 50) {
        console.log(`[ScraperService] Direct fetch succeeded for ${url}`);
        return article;
      }
    }
  } catch (error: any) {
    const status = error.response?.status;
    console.log(`[ScraperService] Direct fetch failed (${status || error.message}) for ${url}`);
  }

  // 2. Try headless browser (bypasses Cloudflare JS challenges)
  try {
    console.log(`[ScraperService] Trying browser fallback for ${url}`);
    const html = await fetchHtmlViaBrowser(url);
    if (html && html.trim().length > 0) {
      const article = htmlToArticle(html);
      if (article && article.content.length > 50) {
        console.log(`[ScraperService] Browser fallback succeeded for ${url}`);
        return article;
      }
    }
  } catch (error: any) {
    console.log(`[ScraperService] Browser fallback failed for ${url}: ${error.message}`);
  }

  throw new Error(
    "Failed to extract article content. The site may require JavaScript to render. " +
    "Try pasting the article content directly instead."
  );
}

/**
 * Cleanup: call on server shutdown to close the persistent browser.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
