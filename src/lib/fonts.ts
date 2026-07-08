import { Buffer } from "buffer";
import axios from "axios";

// In-memory cache for font buffers to speed up rendering
const fontCache: Record<string, ArrayBuffer> = {};

// Use official, highly-available Fontsource woff files mirrored on jsDelivr
const FONT_URLS = {
  outfitRegular: "https://cdn.jsdelivr.net/npm/@fontsource/outfit/files/outfit-latin-400-normal.woff",
  outfitBold: "https://cdn.jsdelivr.net/npm/@fontsource/outfit/files/outfit-latin-700-normal.woff",
  playfairRegular: "https://cdn.jsdelivr.net/npm/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff",
  playfairItalic: "https://cdn.jsdelivr.net/npm/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff",
  caveatRegular: "https://cdn.jsdelivr.net/npm/@fontsource/caveat/files/caveat-latin-400-normal.woff",
  jetbrainsMonoRegular: "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff",
  jetbrainsMonoBold: "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff",
};

export async function loadFont(name: keyof typeof FONT_URLS): Promise<ArrayBuffer> {
  if (fontCache[name]) {
    return fontCache[name];
  }

  const primaryUrl = FONT_URLS[name];
  // Setup backup url mirror on unpkg
  const backupUrl = primaryUrl.replace("https://cdn.jsdelivr.net/npm/", "https://unpkg.com/");

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const url = attempt === maxRetries ? backupUrl : primaryUrl;
    console.log(`[FontLoader] Fetching font ${name} (attempt ${attempt}/${maxRetries}) from ${url}...`);

    const controller = new AbortController();
    // Increase timeout to 30s to accommodate slower or fluctuating connections
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await axios.get(url, { signal: controller.signal, responseType: "arraybuffer" });
      clearTimeout(timeoutId);

      const arrayBuffer = response.data;
      fontCache[name] = arrayBuffer;
      console.log(`[FontLoader] Successfully loaded font ${name}`);
      return arrayBuffer;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      console.error(`[FontLoader] Attempt ${attempt} failed for font ${name}:`, error.message || error);
      
      // Exponential backoff delay before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new Error(`Font loading failed for ${name} after ${maxRetries} attempts: ${lastError?.message || lastError}`);
}

export interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal" | "italic";
}

export async function loadAllFonts(): Promise<SatoriFont[]> {
  try {
    const [outfitReg, outfitBld, playfairReg, playfairItal, caveatReg, jbMonoReg, jbMonoBld] = await Promise.all([
      loadFont("outfitRegular"),
      loadFont("outfitBold"),
      loadFont("playfairRegular"),
      loadFont("playfairItalic"),
      loadFont("caveatRegular"),
      loadFont("jetbrainsMonoRegular"),
      loadFont("jetbrainsMonoBold"),
    ]);

    return [
      {
        name: "Outfit",
        data: outfitReg,
        weight: 400,
        style: "normal",
      },
      {
        name: "Outfit",
        data: outfitBld,
        weight: 700,
        style: "normal",
      },
      {
        name: "Playfair Display",
        data: playfairReg,
        weight: 400,
        style: "normal",
      },
      {
        name: "Playfair Display",
        data: playfairItal,
        weight: 400,
        style: "italic",
      },
      {
        name: "Caveat",
        data: caveatReg,
        weight: 400,
        style: "normal",
      },
      {
        name: "JetBrains Mono",
        data: jbMonoReg,
        weight: 400,
        style: "normal",
      },
      {
        name: "JetBrains Mono",
        data: jbMonoBld,
        weight: 700,
        style: "normal",
      },
    ];
  } catch (err: any) {
    console.error("[FontLoader] Failed to load all fonts:", err);
    throw err;
  }
}
