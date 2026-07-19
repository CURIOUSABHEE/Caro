import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { loadAllFonts } from "../src/lib/fonts";
import { renderThemeSlide } from "../src/components/carousel/render-slide";

async function main() {
  const fonts = await loadAllFonts();
  const fs = await import("fs");

  const themes = ["mesh-glow", "soft-gradient", "monochrome"];
  const diagramTypes: Array<"step-chain" | "flowchart" | "timeline" | "venn" | "concentric"> = ["step-chain", "flowchart", "timeline", "venn", "concentric"];

  const sampleData: Record<string, unknown> = {
    "step-chain": { steps: [{ number: 1, label: "Step One", description: "First" }, { number: 2, label: "Step Two", description: "Second" }, { number: 3, label: "Step Three", description: "Third" }] },
    flowchart: { nodes: [{ label: "Start", shape: "start" }, { label: "Check", shape: "decision" }, { label: "Done", shape: "end" }] },
    timeline: { events: [{ date: "2020", title: "Launch", description: "Started" }, { date: "2022", title: "Scale", description: "Grew" }] },
    venn: { leftLabel: "A", rightLabel: "B", overlapLabel: "Both", leftPoints: ["x"], rightPoints: ["y"] },
    concentric: { title: "Layers", layers: [{ label: "Core", value: 100 }, { label: "Mid", value: 60 }] },
  };

  let pass = 0, fail = 0;

  for (const theme of themes) {
    for (const vt of diagramTypes) {
      try {
        const jsx = renderThemeSlide({
          type: "CONTENT",
          title: `Test ${vt}`,
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

        const paths = (svgStr.match(/<path /g) || []).length;
        const rects = (svgStr.match(/<rect /g) || []).length;
        const pngSize = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } }).render().asPng().length;

        if (paths === 0 && rects < 10) {
          fail++;
          console.error(`\nEMPTY: ${theme}/${vt}: ${paths} paths, ${rects} rects, ${pngSize} bytes`);
        } else {
          pass++;
          process.stdout.write(".");
        }

        if (pass === 1 && fail === 0) {
          fs.writeFileSync("/tmp/fixed-sample.svg", svgStr);
          const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
          const pngData = resvg.render();
          fs.writeFileSync("/tmp/fixed-sample.png", pngData.asPng());
        }
      } catch (e: unknown) {
        fail++;
        console.error(`\nFAIL: ${theme}/${vt}:`, e instanceof Error ? e.message : e);
      }
    }
  }

  console.log(`\n\nResults: ${pass} passed, ${fail} failed out of ${pass + fail}`);
}

main().catch(console.error);
