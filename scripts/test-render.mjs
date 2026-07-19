import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "fs";
import { loadAllFonts } from "../src/lib/fonts.ts";

// Dynamic import for themes (tsx needs transpile - use simpler approach)
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const visualTypes = [
  "text-only", "flowchart", "timeline", "before-after", "image-grid",
  "architecture", "sequence", "mini-chart", "step-chain", "venn",
  "code-block", "stat", "table", "icon-grid",
];

const sampleData = {
  flowchart: { nodes: [{ label: "Start", shape: "start" }, { label: "Check", shape: "decision" }, { label: "Done", shape: "end" }] },
  timeline: { events: [{ date: "2020", title: "Launch", description: "Started" }, { date: "2022", title: "Scale", description: "Grew" }] },
  "before-after": { beforeItems: ["Slow"], afterItems: ["Fast"] },
  "image-grid": { items: [{ label: "UI", description: "Dashboard" }] },
  architecture: { layers: [{ label: "Frontend", items: ["React"] }, { label: "Backend", items: ["API"] }] },
  sequence: { participants: ["Client", "API"], steps: [{ from: 0, to: 1, label: "Request" }] },
  "mini-chart": { title: "Perf", bars: [{ label: "A", value: 40, displayValue: "40ms" }, { label: "B", value: 80, displayValue: "80ms" }] },
  "step-chain": { steps: [{ number: 1, label: "Step 1", description: "Do thing" }] },
  venn: { leftLabel: "A", rightLabel: "B", overlapLabel: "Both" },
  "code-block": { code: "const x = 1;\nconsole.log(x);", language: "javascript" },
  stat: { number: "80%", label: "Growth" },
  table: { headers: ["", "A", "B"], rows: [{ label: "Speed", values: ["Fast", "Slow"] }] },
  "icon-grid": { items: [{ icon: "star", label: "Fast", description: "Quick" }] },
};

async function main() {
  // Use dynamic import with tsx if available, else skip
  const { renderThemeSlide } = await import("../src/lib/themes.tsx");
  const fonts = await loadAllFonts();

  for (const vt of visualTypes) {
    for (const theme of ["wireframe-3d", "monochrome"]) {
      try {
        const jsx = renderThemeSlide({
          type: "CONTENT",
          title: "Test *slide*",
          body: "• Bullet one\n• Bullet two",
          themeName: theme,
          username: "@test",
          order: 2,
          totalSlides: 5,
          visualType: vt,
          visualData: sampleData[vt] || {},
        });
        const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
        const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
        resvg.render();
        console.log(`OK: ${theme} + ${vt}`);
      } catch (e) {
        console.error(`FAIL: ${theme} + ${vt}:`, e.message);
        if (theme === "wireframe-3d" && vt === "flowchart") {
          const jsx = renderThemeSlide({ type: "CONTENT", title: "Test", body: "• b", themeName: theme, username: "@t", order: 2, totalSlides: 5, visualType: vt, visualData: sampleData[vt] });
          const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
          console.log("SVG snippet:", svg.slice(0, 2000));
        }
      }
    }
  }
}

main().catch(console.error);
