import satori from "satori";
import { writeFileSync } from "fs";
import { loadAllFonts } from "../src/lib/fonts.ts";
import { renderThemeSlide } from "../src/lib/themes.tsx";

async function main() {
  const fonts = await loadAllFonts();
  const theme = process.argv[2] || "wireframe-3d";
  const vt = process.argv[3] || "before-after";

  const jsx = renderThemeSlide({
    type: "CONTENT",
    title: "Test *slide* title with enough text to wrap",
    body: "• Bullet one\n• Bullet two\n• Bullet three",
    themeName: theme,
    username: "@testuser",
    order: 2,
    totalSlides: 5,
    visualType: vt,
    visualData: { beforeItems: ["Slow", "Bad"], afterItems: ["Fast", "Good"] },
    imageUrl: process.argv[4] || null,
    imageLayout: "inline",
  });

  const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
  writeFileSync("debug-slide.svg", svg);

  const clipPaths = svg.match(/<clipPath[^>]*>[\s\S]*?<\/clipPath>/g) || [];
  console.log("clipPaths:", clipPaths.length);
  for (const cp of clipPaths) {
    const rects = cp.match(/<rect/g) || [];
    if (rects.length > 1) console.log("MULTI:", cp.slice(0, 400));
  }
}

main().catch(console.error);
