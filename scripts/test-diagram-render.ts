import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { loadAllFonts } from "../src/lib/fonts";
import { renderThemeSlide } from "../src/components/carousel/render-slide";

async function main() {
  const fonts = await loadAllFonts();

  const themes = ["mesh-glow", "soft-gradient", "monochrome", "sketch", "wireframe-3d"];
  const diagramTypes: Array<"step-chain" | "flowchart" | "timeline" | "venn" | "concentric" | "icon-grid"> = ["step-chain", "flowchart", "timeline", "venn", "concentric", "icon-grid"];

  const sampleData: Record<string, unknown> = {
    "step-chain": {
      steps: [
        { number: 1, label: "Step One", description: "First thing" },
        { number: 2, label: "Step Two", description: "Second thing" },
        { number: 3, label: "Step Three", description: "Third thing" },
      ],
    },
    "flowchart": {
      nodes: [
        { label: "Start", shape: "start" },
        { label: "Check", shape: "decision" },
        { label: "Done", shape: "end" },
      ],
    },
    "timeline": {
      events: [
        { date: "2020", title: "Launch", description: "Started" },
        { date: "2022", title: "Scale", description: "Grew" },
        { date: "2024", title: "Exit", description: "Sold" },
      ],
    },
    venn: { leftLabel: "A", rightLabel: "B", overlapLabel: "Both", leftPoints: ["x"], rightPoints: ["y"] },
    concentric: { title: "Layers", layers: [{ label: "Core", value: 100 }, { label: "Mid", value: 60 }, { label: "Outer", value: 30 }] },
    "icon-grid": { items: [{ icon: "star", label: "Fast", description: "Quick" }, { icon: "code", label: "Clean", description: "Nice" }] },
  };

  let pass = 0, fail = 0;

  for (const theme of themes) {
    for (const vt of diagramTypes) {
      try {
        const jsx = renderThemeSlide({
          type: "CONTENT",
          title: `Test ${vt} diagram`,
          body: "• First point\n• Second point",
          themeName: theme,
          username: "@testuser",
          order: 2,
          totalSlides: 5,
          websiteUrl: "example.com",
          visualType: vt,
          visualData: sampleData[vt] as Record<string, unknown>,
        });
        const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
        const svgStr = svg.toString();

        // Check SVG for diagram content
        const textCount = (svgStr.match(/<text /g) || []).length;
        const rectCount = (svgStr.match(/<rect /g) || []).length;
        const lineCount = (svgStr.match(/<line /g) || []).length;
        const pathCount = (svgStr.match(/<path /g) || []).length;

        // Save first one as sample
        if (pass === 0) {
          const fs = await import("fs");
          fs.writeFileSync("/tmp/sample-diagram.svg", svgStr);
          const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
          const pngData = resvg.render();
          fs.writeFileSync("/tmp/sample-diagram.png", pngData.asPng());
        }

        pass++;
        process.stdout.write(".");
      } catch (e: unknown) {
        fail++;
        console.error(`\nFAIL: ${theme} / ${vt}:`, e instanceof Error ? e.message : e);
      }
    }
  }

  console.log(`\n\nResults: ${pass} passed, ${fail} failed out of ${pass + fail}`);
}

main().catch(console.error);
