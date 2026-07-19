import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { loadAllFonts } from "../src/lib/fonts";
import { renderThemeSlide } from "../src/components/carousel/render-slide";

async function main() {
  const fonts = await loadAllFonts();
  const fs = await import("fs");

  // Test just soft-gradient with step-chain, save SVG
  const jsx = renderThemeSlide({
    type: "CONTENT",
    title: "Test step-chain",
    body: "• First point\n• Second point",
    themeName: "soft-gradient",
    username: "@testuser",
    order: 2,
    totalSlides: 5,
    websiteUrl: "example.com",
    visualType: "step-chain",
    visualData: {
      steps: [
        { number: 1, label: "Step One", description: "First" },
        { number: 2, label: "Step Two", description: "Second" },
        { number: 3, label: "Step Three", description: "Third" },
      ],
    } as Record<string, unknown>,
  });

  const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
  const svgStr = svg.toString();
  
  // Find zero-width masks
  const zeroWidthMatches = [...svgStr.matchAll(/<rect[^>]*width="0"[^>]*>/g)];
  console.log(`Zero-width rects: ${zeroWidthMatches.length}`);
  zeroWidthMatches.forEach((m, i) => {
    // Get surrounding context (50 chars before and after)
    const start = Math.max(0, m.index! - 100);
    const end = Math.min(svgStr.length, m.index! + m[0].length + 100);
    console.log(`  Rect ${i}: ...${svgStr.substring(start, end)}...`);
  });

  // Find the diagram content area
  const contentAreaMatch = svgStr.match(/width="920" height="(\d+)"/);
  if (contentAreaMatch) {
    console.log(`\nContent area found: ${contentAreaMatch[0]}`);
  }

  // Save SVG
  fs.writeFileSync("/tmp/debug-softgradient.svg", svgStr);
  const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
  const pngData = resvg.render();
  fs.writeFileSync("/tmp/debug-softgradient.png", pngData.asPng());
  console.log("Saved to /tmp/debug-softgradient.svg and .png");

  // Now test mesh-glow with same diagram
  const jsx2 = renderThemeSlide({
    type: "CONTENT",
    title: "Test step-chain",
    body: "• First point\n• Second point",
    themeName: "mesh-glow",
    username: "@testuser",
    order: 2,
    totalSlides: 5,
    websiteUrl: "example.com",
    visualType: "step-chain",
    visualData: {
      steps: [
        { number: 1, label: "Step One", description: "First" },
        { number: 2, label: "Step Two", description: "Second" },
        { number: 3, label: "Step Three", description: "Third" },
      ],
    } as Record<string, unknown>,
  });

  const svg2 = await satori(jsx2, { width: 1080, height: 1350, fonts });
  const svg2Str = svg2.toString();
  
  const zeroWidthMatches2 = [...svg2Str.matchAll(/<rect[^>]*width="0"[^>]*>/g)];
  console.log(`\nmesh-glow zero-width rects: ${zeroWidthMatches2.length}`);
  
  fs.writeFileSync("/tmp/debug-meshglow.svg", svg2Str);
  const resvg2 = new Resvg(svg2, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
  const pngData2 = resvg2.render();
  fs.writeFileSync("/tmp/debug-meshglow.png", pngData2.asPng());
  console.log("Saved to /tmp/debug-meshglow.svg and .png");
}

main().catch(console.error);
