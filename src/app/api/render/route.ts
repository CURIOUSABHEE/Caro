import { NextResponse } from "next/server";
import satori from "satori";
import { loadAllFonts, type SatoriFont } from "@/lib/fonts";
import { renderThemeSlide, type RenderSlideInput } from "@/components/carousel/render-slide";
import { RenderProjectSchema } from "@/lib/validators";
import { tokenizeCode } from "@/lib/tokenize-code";
import { renderWithResvg } from "@/lib/renderSvg";
import { prefetchImage } from "@/lib/prefetch-image";
import type { Slide, VisualType } from "@/lib/types";
import { createHash } from "crypto";
import { codeThemeType } from "@/lib/constants";

// Module-level font cache — loaded once, reused across all requests
let fontCache: SatoriFont[] | null = null;
let fontLoadPromise: Promise<SatoriFont[]> | null = null;

async function getFonts(): Promise<SatoriFont[]> {
  if (fontCache) return fontCache;
  if (!fontLoadPromise) {
    fontLoadPromise = loadAllFonts().then((fonts) => {
      fontCache = fonts;
      return fonts;
    }).catch((err) => {
      fontLoadPromise = null;
      throw err;
    });
  }
  return fontLoadPromise;
}

// --- Render cache: skip re-rendering slides whose inputs haven't changed ---
const RENDER_CACHE_MAX = 200;
const renderCache = new Map<string, string>();

function makeCacheKey(args: {
  themeName: string;
  title: string;
  body: string;
  visualType: string;
  visualData: unknown;
  order: number;
  totalSlides: number;
  username: string;
  accentColor?: string;
  scale: number;
  fontPairing?: string;
  layoutDensity?: string;
  scribble: boolean;
  imageUrl?: string | null;
  imageLayout?: string;
  logoUrl?: string;
}): string {
  return createHash("sha1")
    .update(JSON.stringify(args))
    .digest("hex");
}

function buildSlideArgs(
  slide: Slide,
  i: number,
  totalSlides: number,
  themeName: string,
  username: string,
  websiteUrl: string,
  scribble: boolean,
  backgroundOnly: boolean = false,
  fontPairing?: string,
  layoutDensity?: "compact" | "comfortable" | "minimal",
  logoUrl?: string,
  noImages?: boolean,
  accentColor?: string
) {
  const finalImageUrl = noImages ? null : slide.imageUrl;
  
  const finalPalette = {
    background: slide.paletteOverride?.background,
    text: slide.paletteOverride?.text,
    primary: accentColor || slide.paletteOverride?.primary,
    secondary: slide.paletteOverride?.secondary,
    tertiary: slide.paletteOverride?.tertiary,
  };

  return {
    type: slide.type,
    title: slide.title,
    body: slide.body,
    themeName,
    username,
    order: i,
    totalSlides,
    imageUrl: finalImageUrl,
    imageLayout: slide.imageLayout || "inline",
    shapes: slide.shapes,
    visualType: slide.visualType,
    visualData: slide.visualData,
    websiteUrl,
    scribble,
    backgroundOnly,
    paletteOverride: finalPalette,
    fontPairing,
    layoutDensity,
    logoUrl,
  };
}

async function tokenizeSlideCode(slide: Slide, themeName: string): Promise<Slide["visualData"]> {
  if (slide.visualType === "code-block" && slide.visualData?.code) {
    try {
      const tokens = await tokenizeCode(
        slide.visualData.code,
        slide.visualData.language || "plaintext",
        codeThemeType(themeName)
      );
      return { ...slide.visualData, tokens };
    } catch (e) {
      console.error(`[API Render] Tokenization failed:`, e);
    }
  }
  return slide.visualData;
}

interface PreparedSlide {
  index: number;
  fullSlide: Slide;
  prefetchedImageUrl: string | null;
  prefetchedLogoUrl: string | null;
  tokenizedVisualData: Slide["visualData"];
}

async function prepareSlide(
  slide: Slide,
  i: number,
  themeName: string,
  logoUrl: string | undefined,
  noImages: boolean,
): Promise<PreparedSlide> {
  const fullSlide = { ...slide, order: slide.order ?? i } as unknown as Slide;

  const [prefetchedImageUrl, prefetchedLogoUrl, tokenizedVisualData] = await Promise.all([
    prefetchImage(noImages ? null : slide.imageUrl),
    prefetchImage(logoUrl),
    tokenizeSlideCode(slide, themeName),
  ]);

  return { index: i, fullSlide, prefetchedImageUrl, prefetchedLogoUrl, tokenizedVisualData };
}

async function renderSingleSlide(
  prepared: PreparedSlide,
  totalSlides: number,
  themeName: string,
  username: string,
  websiteUrl: string,
  scribble: boolean,
  fonts: SatoriFont[],
  backgroundOnly: boolean = false,
  fontPairing?: string,
  layoutDensity?: "compact" | "comfortable" | "minimal",
  noImages?: boolean,
  accentColor?: string,
  scale: number = 1,
): Promise<string> {
  const { fullSlide, prefetchedImageUrl, prefetchedLogoUrl, tokenizedVisualData, index: i } = prepared;

  // Check render cache
  const cacheKey = makeCacheKey({
    themeName,
    title: fullSlide.title ?? "",
    body: fullSlide.body ?? "",
    visualType: fullSlide.visualType ?? "text-only",
    visualData: fullSlide.visualData,
    order: i,
    totalSlides,
    username,
    accentColor,
    scale,
    fontPairing,
    layoutDensity,
    scribble,
    imageUrl: prefetchedImageUrl,
    imageLayout: fullSlide.imageLayout,
    logoUrl: prefetchedLogoUrl ?? undefined,
  });
  const cached = renderCache.get(cacheKey);
  if (cached) return cached;

  const slideArgs = buildSlideArgs(fullSlide, i, totalSlides, themeName, username, websiteUrl, scribble, backgroundOnly, fontPairing, layoutDensity, undefined, noImages, accentColor);

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      let visualType: string = fullSlide.visualType || "text-only";
      let visualData: Record<string, unknown> | undefined = fullSlide.visualData as Record<string, unknown> | undefined;

      if (attempt === 0) {
        visualData = tokenizedVisualData as Record<string, unknown> | undefined;
      } else if (attempt === 1 && fullSlide.visualType === "code-block") {
        visualType = "code-block";
        visualData = fullSlide.visualData as Record<string, unknown> | undefined;
      } else {
        visualType = "text-only";
        visualData = undefined;
      }

      const renderArgs: RenderSlideInput = {
        ...slideArgs,
        imageUrl: prefetchedImageUrl,
        logoUrl: prefetchedLogoUrl ?? undefined,
        visualType: visualType as VisualType,
        visualData: visualData,
      };
      const jsx = renderThemeSlide(renderArgs);
      const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
      const result = await renderWithResvg(svg, scale);

      // Store in render cache (evict oldest if at capacity)
      if (renderCache.size >= RENDER_CACHE_MAX) {
        const firstKey = renderCache.keys().next().value;
        if (firstKey) renderCache.delete(firstKey);
      }
      renderCache.set(cacheKey, result);

      return result;
    } catch (err: unknown) {
      console.error(`[API Render] Slide ${i} (theme: ${themeName}, visualType: ${fullSlide.visualType}) attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 150));
      } else {
        console.error(`[API Render] Slide ${i} — all ${maxAttempts} attempts failed, returning placeholder`);
        throw err;
      }
    }
  }
  throw new Error("Render failed after all fallback attempts");
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
    const validation = RenderProjectSchema.safeParse(body);

    if (!validation.success) {
      console.error("[API Render] Validation failed for payload:", JSON.stringify(body, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      slides,
      themeName,
      username,
      websiteUrl,
      scribble,
      backgroundOnly,
      fontPairing,
      layoutDensity,
      logoUrl,
      noImages,
      accentColor,
      scale = 1,
    } = validation.data;
    
    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "No slides provided to render." },
        { status: 400 }
      );
    }

    const fonts = await getFonts();
    const total = slides.length;

    // Phase 1: Parallel image prefetch + code tokenization for all slides
    const prepared = await Promise.all(
      slides.map((slide, i) => prepareSlide(slide as unknown as Slide, i, themeName, logoUrl, noImages ?? false))
    );

    // Phase 2: Render slides
    const results: PromiseSettledResult<string>[] = await Promise.allSettled(
      prepared.map((p) =>
        renderSingleSlide(
          p,
          total,
          themeName,
          username,
          websiteUrl,
          scribble,
          fonts,
          backgroundOnly,
          fontPairing,
          layoutDensity,
          noImages,
          accentColor,
          scale,
        )
      )
    );

    const renderedImages: string[] = [];
    const errors: { index: number; error: string }[] = [];
    const placeholderPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        renderedImages.push(r.value);
      } else {
        console.error(`[API Render] Slide ${i} failed:`, r.reason);
        renderedImages.push(placeholderPixel);
        errors.push({ index: i, error: r.reason?.message || "Render failed" });
      }
    }

    return NextResponse.json({
      success: true,
      data: { images: renderedImages, errors: errors.length > 0 ? errors : undefined },
    });
  } catch (error: unknown) {
    console.error("[API Render] Uncaught handler error:", error);
    if (body) {
      console.error("[API Render] Failed payload context:", JSON.stringify(body, null, 2));
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to render slide images using Satori.",
      },
      { status: 500 }
    );
  }
}
