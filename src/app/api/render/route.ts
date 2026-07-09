import { NextResponse } from "next/server";
import satori from "satori";
import type { ReactNode } from "react";
import { loadAllFonts, type SatoriFont } from "@/lib/fonts";
import { renderThemeSlide, type RenderSlideInput } from "@/lib/themes";
import { RenderProjectSchema } from "@/lib/validators";
import { tokenizeCode } from "@/lib/tokenize-code";
import { renderWithResvg } from "@/lib/renderSvg";

// Module-level font cache — loaded once, reused across all requests
let fontCache: SatoriFont[] | null = null;
let fontLoadPromise: Promise<SatoriFont[]> | null = null;

async function getFonts(): Promise<SatoriFont[]> {
  if (fontCache) return fontCache;
  if (!fontLoadPromise) {
    fontLoadPromise = loadAllFonts().then((fonts) => {
      fontCache = fonts;
      return fonts;
    });
  }
  return fontLoadPromise;
}

// Recursive helper to clean zIndex styles from Satori rendering tree to prevent console warnings
function removeZIndexFromTree(node: ReactNode): ReactNode {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(removeZIndexFromTree) as ReactNode;
  }

  const obj = node as unknown as { props?: Record<string, unknown> } & Record<string, unknown>;
  if (obj.props) {
    const nextProps = { ...obj.props };
    
    if (nextProps.style && typeof nextProps.style === "object") {
      const nextStyle = { ...nextProps.style as Record<string, unknown> };
      delete nextStyle.zIndex;
      delete nextStyle["z-index"];
      nextProps.style = nextStyle;
    }
    
    if (nextProps.children) {
      nextProps.children = removeZIndexFromTree(nextProps.children as ReactNode);
    }
    
    return {
      ...obj,
      props: nextProps
    } as ReactNode;
  }

  return node;
}



import type { Slide, VisualData, VisualType } from "@/lib/types";

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
      const themeType = ["monochrome", "cyber-horizon", "neo-brutalism", "frosted-grid", "glassmorphism", "sketch"].includes(themeName) ? "dark" : "light";
      const tokens = await tokenizeCode(
        slide.visualData.code,
        slide.visualData.language || "plaintext",
        themeType
      );
      return { ...slide.visualData, tokens };
    } catch (e) {
      console.error(`[API Render] Tokenization failed:`, e);
    }
  }
  return slide.visualData;
}

async function renderSingleSlide(
  slide: Slide,
  i: number,
  totalSlides: number,
  themeName: string,
  username: string,
  websiteUrl: string,
  scribble: boolean,
  fonts: SatoriFont[],
  backgroundOnly: boolean = false,
  fontPairing?: string,
  layoutDensity?: "compact" | "comfortable" | "minimal",
  logoUrl?: string,
  noImages?: boolean,
  accentColor?: string,
  scale: number = 1,
): Promise<string> {
  // Retry once, then fallback to text-only on persistent failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const visualData = (attempt === 1 ? {} : await tokenizeSlideCode(slide, themeName));
      const renderArgs: RenderSlideInput = {
        ...buildSlideArgs(slide, i, totalSlides, themeName, username, websiteUrl, scribble, backgroundOnly, fontPairing, layoutDensity, logoUrl, noImages, accentColor),
        visualType: (attempt === 1 ? "text-only" : slide.visualType) as VisualType,
        visualData: visualData as Record<string, unknown>,
      };
      const jsx = removeZIndexFromTree(renderThemeSlide(renderArgs));
      const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
      return renderWithResvg(svg, scale);
    } catch (err: unknown) {
      console.error(`[API Render] Slide ${i} (theme: ${themeName}, visualType: ${slide.visualType}) attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 200));
      } else {
        console.error(`[API Render] Slide ${i} — both attempts failed, returning placeholder`);
        throw err;
      }
    }
  }
  throw new Error("Render failed after retry and fallback");
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

    // Fonts loaded once (cached at module scope across requests)
    const fonts = await getFonts();
    const total = slides.length;

    // Render slides sequentially — resvg native code can abort the process when
    // multiple renders run concurrently (rayon worker panic). Individual failures
    // still don't kill the batch.
    const results: PromiseSettledResult<string>[] = [];
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const fullSlide = {
        ...slide,
        order: slide.order ?? i,
      } as unknown as Slide;
      try {
        const value = await renderSingleSlide(
          fullSlide,
          i,
          total,
          themeName,
          username,
          websiteUrl,
          scribble,
          fonts,
          backgroundOnly,
          fontPairing,
          layoutDensity,
          logoUrl,
          noImages,
          accentColor,
          scale
        );
        results.push({ status: "fulfilled", value });
      } catch (reason) {
        results.push({ status: "rejected", reason });
      }
    }

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
