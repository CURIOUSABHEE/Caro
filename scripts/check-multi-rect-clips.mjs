import satori from "satori";
import { loadAllFonts } from "../src/lib/fonts.ts";
import { renderThemeSlide } from "../src/lib/themes.tsx";
import { Resvg } from "@resvg/resvg-js";

const themes = ["wireframe-3d", "monochrome", "glassmorphism", "sketch", "neo-brutalism", "cyber-horizon", "frosted-grid"];
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
  const fonts = await loadAllFonts();
  const imageUrl = "https://picsum.photos/seed/caro/800/600";

  for (const theme of themes) {
    for (const vt of visualTypes) {
      for (const withImage of [false, true]) {
        const jsx = renderThemeSlide({
          type: "CONTENT",
          title: "Test *slide* title",
          body: "• Bullet one\n• Bullet two",
          themeName: theme,
          username: "@test",
          order: 2,
          totalSlides: 5,
          visualType: vt,
          visualData: sampleData[vt] || {},
          imageUrl: withImage ? imageUrl : null,
          imageLayout: "inline",
        });
        const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
        const clipPaths = svg.match(/<clipPath[^>]*>[\s\S]*?<\/clipPath>/g) || [];
        const multiRect = clipPaths.filter((cp) => (cp.match(/<rect/g) || []).length > 1);
        if (multiRect.length > 0) {
          console.log("MULTI-RECT:", theme, vt, withImage ? "+img" : "no-img", multiRect.length);
          try {
            const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
            resvg.render();
            console.log("  resvg OK");
          } catch (e) {
            console.log("  resvg FAIL:", e.message);
          }
        }
      }
    }
  }
  console.log("Done scanning");
}

main().catch(console.error);
