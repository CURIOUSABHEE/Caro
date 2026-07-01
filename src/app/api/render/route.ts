import { NextResponse } from "next/server";
import satori from "satori";
import { loadAllFonts } from "@/lib/fonts";
import { renderThemeSlide } from "@/lib/themes";
import { RenderProjectSchema } from "@/lib/validators";
import { tokenizeCode } from "@/lib/tokenize-code";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";

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

function renderWithResvg(svg: string, _slideIdx: number): string {
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

    const { slides, themeName, username, websiteUrl, scribble, slideIndex } = validation.data;
    
    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "No slides provided to render." },
        { status: 400 }
      );
    }

    // Load fonts once and reuse for all slides in this request
    console.log("[API Render] Pre-loading fonts...");
    const fonts = await loadAllFonts();
    console.log("[API Render] Fonts loaded successfully.");

    if (slideIndex !== undefined) {
      if (slideIndex < 0 || slideIndex >= slides.length) {
        return NextResponse.json(
          { success: false, error: `Invalid slideIndex: ${slideIndex}` },
          { status: 400 }
        );
      }

      const slide = slides[slideIndex];
      console.log(`[API Render] Rendering single slide ${slideIndex + 1}/${slides.length} (${slide.type})...`);

      // Tokenize code server-side before Satori rendering
      let enrichedVisualData = slide.visualData;
      if (slide.visualType === "code-block" && slide.visualData?.code) {
        try {
          const themeType = ["monochrome", "cyber-horizon"].includes(themeName) ? "dark" : "light";
          const tokens = await tokenizeCode(
            slide.visualData.code,
            slide.visualData.language || "plaintext",
            themeType
          );
          enrichedVisualData = { ...slide.visualData, tokens };
        } catch (e) {
          console.error(`[API Render] Tokenization failed for slide ${slideIndex}:`, e);
        }
      }

      // 1. Generate SVG using Satori
      let svg: string;
      try {
        svg = await satori(
          removeZIndexFromTree(
            renderThemeSlide({
              type: slide.type,
              title: slide.title,
              body: slide.body,
              themeName,
              username,
              order: slideIndex,
              totalSlides: slides.length,
              imageUrl: slide.imageUrl,
              imageLayout: slide.imageLayout || "inline",
              shapes: slide.shapes,
              visualType: slide.visualType,
              visualData: enrichedVisualData,
              websiteUrl,
              scribble,
            })
          ),
          {
            width: 1080,
            height: 1350,
            fonts: fonts,
          }
        );
      } catch (satoriErr: any) {
        console.error(`[API Render] Satori rendering failed for slideIndex ${slideIndex}:`, satoriErr);
        try {
          fs.writeFileSync("/tmp/failed-render-payload.json", JSON.stringify({
            error: satoriErr.message,
            stack: satoriErr.stack,
            slideIndex,
            slide,
            themeName,
            username,
            websiteUrl,
            scribble,
            fullBody: body,
          }, null, 2));
          console.log("[API Render] Dumped failed payload to /tmp/failed-render-payload.json");
        } catch (dumpErr) {
          console.error("[API Render] Failed to dump payload:", dumpErr);
        }
        throw satoriErr;
      }

      // 2. Render SVG to PNG using resvg (isolated in child process)
      const base64Image = renderWithResvg(svg, slideIndex);
      return NextResponse.json({
        success: true,
        data: {
          image: base64Image,
          slideIndex,
        },
      });
    }

    const renderedImages: string[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`[API Render] Rendering slide ${i + 1}/${slides.length} (${slide.type})...`);

      // Tokenize code server-side before Satori rendering
      let enrichedVisualData = slide.visualData;
      if (slide.visualType === "code-block" && slide.visualData?.code) {
        try {
          const themeType = ["monochrome", "cyber-horizon"].includes(themeName) ? "dark" : "light";
          const tokens = await tokenizeCode(
            slide.visualData.code,
            slide.visualData.language || "plaintext",
            themeType
          );
          enrichedVisualData = { ...slide.visualData, tokens };
        } catch (e) {
          console.error(`[API Render] Tokenization failed for slide ${i}:`, e);
        }
      }

      // 1. Generate SVG using Satori
      const svg = await satori(
        removeZIndexFromTree(
          renderThemeSlide({
            type: slide.type,
            title: slide.title,
            body: slide.body,
            themeName,
            username,
            order: i,
            totalSlides: slides.length,
            imageUrl: slide.imageUrl,
            imageLayout: slide.imageLayout || "inline",
            shapes: slide.shapes,
            visualType: slide.visualType,
            visualData: enrichedVisualData,
            websiteUrl,
            scribble,
          })
        ),
        {
          width: 1080,
          height: 1350,
          fonts: fonts,
        }
      );

      // 2. Render SVG to PNG using resvg (isolated in child process)
      const base64Image = renderWithResvg(svg, i);
      renderedImages.push(base64Image);
    }

    console.log("[API Render] All slides rendered successfully.");
    return NextResponse.json({
      success: true,
      data: {
        images: renderedImages,
      },
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
