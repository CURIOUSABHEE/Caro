import { Buffer } from "buffer";
import axios from "axios";

// In-memory cache for font buffers to speed up rendering
const fontCache: Record<string, ArrayBuffer> = {};

// Use official, highly-available Fontsource woff files mirrored on jsDelivr
const FONT_URLS = {
  outfitRegular: "https://cdn.jsdelivr.net/npm/@fontsource/outfit/files/outfit-latin-400-normal.woff",
  outfitBold: "https://cdn.jsdelivr.net/npm/@fontsource/outfit/files/outfit-latin-700-normal.woff",
  playfairRegular: "https://cdn.jsdelivr.net/npm/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff",
  playfairBold: "https://cdn.jsdelivr.net/npm/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff",
  playfairItalic: "https://cdn.jsdelivr.net/npm/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff",
  caveatRegular: "https://cdn.jsdelivr.net/npm/@fontsource/caveat/files/caveat-latin-400-normal.woff",
  jetbrainsMonoRegular: "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff",
  jetbrainsMonoBold: "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff",
  loraRegular: "https://cdn.jsdelivr.net/npm/@fontsource/lora/files/lora-latin-400-normal.woff",
  loraBold: "https://cdn.jsdelivr.net/npm/@fontsource/lora/files/lora-latin-700-normal.woff",
  jakartaRegular: "https://cdn.jsdelivr.net/npm/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff",
  jakartaBold: "https://cdn.jsdelivr.net/npm/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff",
  cinzelRegular: "https://cdn.jsdelivr.net/npm/@fontsource/cinzel/files/cinzel-latin-400-normal.woff",
  cinzelBold: "https://cdn.jsdelivr.net/npm/@fontsource/cinzel/files/cinzel-latin-700-normal.woff",
  pacificoRegular: "https://cdn.jsdelivr.net/npm/@fontsource/pacifico/files/pacifico-latin-400-normal.woff",
};

export async function loadFont(name: keyof typeof FONT_URLS): Promise<ArrayBuffer | null> {
  if (fontCache[name]) {
    return fontCache[name];
  }

  const primaryUrl = FONT_URLS[name];
  const backupUrl = primaryUrl.replace("https://cdn.jsdelivr.net/npm/", "https://unpkg.com/");

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const url = attempt === maxRetries ? backupUrl : primaryUrl;
    console.log(`[FontLoader] Fetching font ${name} (attempt ${attempt}/${maxRetries}) from ${url}...`);

    const controller = new AbortController();
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
      
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.error(`[FontLoader] Font ${name} failed after ${maxRetries} attempts — skipping (last error: ${lastError?.message || lastError})`);
  return null;
}

export interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal" | "italic";
}

export async function loadAllFonts(): Promise<SatoriFont[]> {
  try {
    const [
      outfitReg, outfitBld,
      playfairReg, playfairBld, playfairItal,
      caveatReg,
      jbMonoReg, jbMonoBld,
      loraReg, loraBld,
      jakartaReg, jakartaBld,
      cinzelReg, cinzelBld,
      pacificoReg
    ] = await Promise.all([
      loadFont("outfitRegular"),
      loadFont("outfitBold"),
      loadFont("playfairRegular"),
      loadFont("playfairBold"),
      loadFont("playfairItalic"),
      loadFont("caveatRegular"),
      loadFont("jetbrainsMonoRegular"),
      loadFont("jetbrainsMonoBold"),
      loadFont("loraRegular"),
      loadFont("loraBold"),
      loadFont("jakartaRegular"),
      loadFont("jakartaBold"),
      loadFont("cinzelRegular"),
      loadFont("cinzelBold"),
      loadFont("pacificoRegular"),
    ]);

    const fonts: SatoriFont[] = [];

    function addFont(name: string, data: ArrayBuffer | null, weight: 400 | 700, style: "normal" | "italic") {
      if (data) fonts.push({ name, data, weight, style });
    }

    addFont("Outfit", outfitReg, 400, "normal");
    addFont("Outfit", outfitBld, 700, "normal");
    addFont("Playfair Display", playfairReg, 400, "normal");
    addFont("Playfair Display", playfairBld, 700, "normal");
    addFont("Playfair Display", playfairItal, 400, "italic");
    addFont("Caveat", caveatReg, 400, "normal");
    addFont("JetBrains Mono", jbMonoReg, 400, "normal");
    addFont("JetBrains Mono", jbMonoBld, 700, "normal");
    addFont("Lora", loraReg, 400, "normal");
    addFont("Lora", loraBld, 700, "normal");
    addFont("Plus Jakarta Sans", jakartaReg, 400, "normal");
    addFont("Plus Jakarta Sans", jakartaBld, 700, "normal");
    addFont("Cinzel", cinzelReg, 400, "normal");
    addFont("Cinzel", cinzelBld, 700, "normal");
    addFont("Pacifico", pacificoReg, 400, "normal");

    if (fonts.length === 0) {
      throw new Error("No fonts could be loaded — rendering will fail");
    }

    console.log(`[FontLoader] Loaded ${fonts.length} font variants`);
    return fonts;
  } catch (err: any) {
    console.error("[FontLoader] Failed to load fonts:", err);
    throw err;
  }
}
