import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { loadAllFonts } from "../src/lib/fonts";

async function main() {
  const fonts = await loadAllFonts();

  // Import old and new
  const { renderThemeSlide: oldRender } = await import("../src/lib/themes");
  const { renderThemeSlide: newRender } = await import("../src/components/carousel/render-slide");

  const slideArgs = {
    type: "CONTENT" as const,
    title: "Test Diagram",
    body: "• First point\n• Second point",
    themeName: "mesh-glow",
    username: "@testuser",
    order: 2,
    totalSlides: 5,
    websiteUrl: "example.com",
    visualType: "step-chain" as const,
    visualData: {
      steps: [
        { number: 1, label: "Step One", description: "First thing" },
        { number: 2, label: "Step Two", description: "Second thing" },
        { number: 3, label: "Step Three", description: "Third thing" },
      ],
    } as Record<string, unknown>,
  };

  // Test old
  try {
    const oldJsx = oldRender(slideArgs);
    const oldSvg = await satori(oldJsx, { width: 1080, height: 1350, fonts });
    const oldSvgStr = oldSvg.toString();
    const oldMask0 = (oldSvgStr.match(/width="0"/g) || []).length;
    const oldPaths = (oldSvgStr.match(/<path /g) || []).length;
    console.log(`OLD: paths=${oldPaths}, zeroWidthMasks=${oldMask0}, size=${oldSvgStr.length}`);
    
    const resvg = new Resvg(oldSvg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
    resvg.render();
    const fs = await import("fs");
    fs.writeFileSync("/tmp/old-theme.svg", oldSvgStr);
  } catch (e: unknown) {
    console.error("OLD failed:", e instanceof Error ? e.message : e);
  }

  // Test new
  try {
    const newJsx = newRender(slideArgs);
    const newSvg = await satori(newJsx, { width: 1080, height: 1350, fonts });
    const newSvgStr = newSvg.toString();
    const newMask0 = (newSvgStr.match(/width="0"/g) || []).length;
    const newPaths = (newSvgStr.match(/<path /g) || []).length;
    console.log(`NEW: paths=${newPaths}, zeroWidthMasks=${newMask0}, size=${newSvgStr.length}`);
    
    const resvg = new Resvg(newSvg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
    resvg.render();
    const fs = await import("fs");
    fs.writeFileSync("/tmp/new-theme.svg", newSvgStr);
  } catch (e: unknown) {
    console.error("NEW failed:", e instanceof Error ? e.message : e);
  }
}

main().catch(console.error);
