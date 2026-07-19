import axios from "axios";

const IMAGE_CACHE_MAX = 50;
const imageCache = new Map<string, string>();

function cacheSet(key: string, value: string): void {
  if (imageCache.size >= IMAGE_CACHE_MAX) {
    const firstKey = imageCache.keys().next().value;
    if (firstKey) imageCache.delete(firstKey);
  }
  imageCache.set(key, value);
}

const PLACEHOLDER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8z8BQz0BFwMgwasCoAgBVNwMR506IOAAAAABJRU5ErkJggg==";

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

function getMimeFromContentType(ct: string | null): string | null {
  if (!ct) return null;
  const base = ct.split(";")[0].trim().toLowerCase();
  if (base.startsWith("image/")) return base;
  return null;
}

function getMimeFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    for (const [ext, mime] of Object.entries(MIME_MAP)) {
      if (pathname.endsWith(ext)) return mime;
    }
  } catch {
    // ignore
  }
  return null;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

export async function prefetchImage(url: string | null | undefined): Promise<string | null> {
  if (!url || url.startsWith("data:")) return url ?? null;

  const cached = imageCache.get(url);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await axios.get(url, {
      signal: controller.signal,
      responseType: "arraybuffer",
      headers: { Accept: "image/*" },
      maxRedirects: 5,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers["content-type"] as string | null;
    let mime = getMimeFromContentType(contentType) || getMimeFromUrl(url);
    if (!mime) mime = "image/png";

    const base64 = arrayBufferToBase64(response.data);
    const dataUri = `data:${mime};base64,${base64}`;

    cacheSet(url, dataUri);
    return dataUri;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Prefetch] Failed to fetch image ${url}: ${msg}`);
    return PLACEHOLDER;
  }
}

export async function prefetchImages(urls: (string | null | undefined)[]): Promise<(string | null)[]> {
  return Promise.all(urls.map(prefetchImage));
}
