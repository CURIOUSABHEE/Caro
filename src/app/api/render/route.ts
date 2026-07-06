import { NextResponse } from "next/server";
import satori from "satori";
import { loadAllFonts, type SatoriFont } from "@/lib/fonts";
import { renderThemeSlide } from "@/lib/themes";
import { RenderProjectSchema } from "@/lib/validators";
import { tokenizeCode } from "@/lib/tokenize-code";
import { Resvg } from "@resvg/resvg-js";

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
function removeZIndexFromTree(node: any): any {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(removeZIndexFromTree);
  }

  if (node.props) {
    const nextProps = { ...node.props };
    
    if (nextProps.style) {
      const nextStyle = { ...nextProps.style };
      delete nextStyle.zIndex;
      delete nextStyle["z-index"];
      nextProps.style = nextStyle;
    }
    
    if (nextProps.children) {
      nextProps.children = removeZIndexFromTree(nextProps.children);
    }
    
    return {
      ...node,
      props: nextProps
    };
  }

  return node;
}

function renderWithResvg(svg: string): string {
  try {
    const resvg = new Resvg(svg, {
      background: "rgba(0, 0, 0, 0)",
      fitTo: { mode: "width", value: 1080 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch (err: any) {
    throw new Error(err.message || "Resvg rendering failed");
  }
}

function buildSlideArgs(slide: any, i: number, totalSlides: number, themeName: string, username: string, websiteUrl: string, scribble: boolean, backgroundOnly: boolean = false) {
  return {
    type: slide.type,
    title: slide.title,
    body: slide.body,
    themeName,
    username,
    order: i,
    totalSlides,
    imageUrl: slide.imageUrl,
    imageLayout: slide.imageLayout || "inline",
    shapes: slide.shapes,
    visualType: slide.visualType,
    visualData: slide.visualData,
    websiteUrl,
    scribble,
    backgroundOnly,
    paletteOverride: slide.paletteOverride,
  };
}

async function tokenizeSlideCode(slide: any, themeName: string): Promise<any> {
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

async function renderSingleSlide(slide: any, i: number, totalSlides: number, themeName: string, username: string, websiteUrl: string, scribble: boolean, fonts: SatoriFont[], backgroundOnly: boolean = false): Promise<string> {
  // Retry once, then fallback to text-only on persistent failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const visualData = attempt === 1
        ? {}
        : await tokenizeSlideCode(slide, themeName);
      const renderArgs = {
        ...buildSlideArgs(slide, i, totalSlides, themeName, username, websiteUrl, scribble, backgroundOnly),
        visualType: attempt === 1 ? "text-only" : slide.visualType,
        visualData,
      };
      const jsx = removeZIndexFromTree(renderThemeSlide(renderArgs));
      const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
      return renderWithResvg(svg);
    } catch (err: any) {
      console.error(`[API Render] Slide ${i} (theme: ${themeName}, visualType: ${slide.visualType}) attempt ${attempt + 1} failed:`, err.message);
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
  let body: any = null;
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

    const { slides, themeName, username, websiteUrl, scribble, backgroundOnly } = validation.data;
    
    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "No slides provided to render." },
        { status: 400 }
      );
    }

    // Fonts loaded once (cached at module scope across requests)
    const fonts = await getFonts();
    const total = slides.length;

    // Render all slides in parallel — individual failures don't kill the batch
    const results = await Promise.allSettled(
      slides.map((slide, i) =>
        renderSingleSlide(slide, i, total, themeName, username, websiteUrl, scribble, fonts, backgroundOnly)
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
  } catch (error: any) {
    console.error("[API Render] Slide rendering failed:", error);
    if (body) {
      console.error("[API Render] Failed payload context:", JSON.stringify(body, null, 2));
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to render slide images using Satori.",
      },
      { status: 500 }
    );
  }
}
