import satori from "satori";
import { loadAllFonts } from "../src/lib/fonts.ts";
import { renderThemeSlide } from "../src/lib/themes.tsx";
import { Resvg } from "@resvg/resvg-js";

async function main() {
  const fonts = await loadAllFonts();
  const themes = ["wireframe-3d", "monochrome", "glassmorphism", "sketch", "neo-brutalism", "cyber-horizon"];
  const vts = ["text-only", "flowchart", "code-block", "mini-chart", "venn", "table", "timeline"];

  for (const theme of themes) {
    for (const vt of vts) {
      const jsx = renderThemeSlide({
        type: "CONTENT",
        title: "Test *slide*",
        body: "• Bullet one\n• Bullet two",
        themeName: theme,
        username: "@test",
        order: 2,
        totalSlides: 5,
        visualType: vt,
        visualData: vt === "code-block" ? { code: "const x = 1;\nconsole.log(x);", language: "javascript" } : {},
      });
      const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
      const clipPaths = svg.match(/<clipPath[^>]*>[\s\S]*?<\/clipPath>/g) || [];
      const multiRect = clipPaths.filter((cp) => (cp.match(/<rect/g) || []).length > 1);
      if (multiRect.length > 0) {
        console.log("MULTI-RECT:", theme, vt, multiRect.length);
      }
      try {
        const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
        resvg.render();
        console.log("OK:", theme, vt);
      } catch (e) {
        console.log("JS-CATCH:", theme, vt, e.message);
      }
    }
  }
}

main().catch(console.error);
