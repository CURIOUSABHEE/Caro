import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { loadAllFonts } from "../src/lib/fonts";
import { renderThemeSlide } from "../src/components/carousel/render-slide";

const themes = [
  "monochrome", "soft-gradient", "warm-editorial", "mesh-glow",
  "cyber-horizon", "linen-rust", "neo-brutalism", "neomorphism",
  "frosted-grid", "glassmorphism", "liquid-glass", "wireframe-3d", "sketch",
] as const;

const slideTypes = ["COVER", "CONTENT", "CLOSING"] as const;

const visualTypes = [
  "text-only", "flowchart", "timeline", "before-after", "image-grid",
  "architecture", "sequence", "mini-chart", "step-chain", "venn",
  "code-block", "stat", "table", "icon-grid",
] as const;

const sampleData: Record<string, unknown> = {
  flowchart: { nodes: [{ label: "Start", shape: "start" }, { label: "Check", shape: "decision" }, { label: "Done", shape: "end" }] },
  timeline: { events: [{ date: "2020", title: "Launch", description: "Started" }, { date: "2022", title: "Scale", description: "Grew" }, { date: "2024", title: "Exit", description: "Sold" }] },
  "before-after": { beforeItems: ["Slow", "Manual"], afterItems: ["Fast", "Auto"] },
  "image-grid": { items: [{ label: "UI", description: "Dashboard" }, { label: "API", description: "Backend" }] },
  architecture: { layers: [{ label: "Frontend", items: ["React", "CDN"] }, { label: "Backend", items: ["API", "Auth"] }] },
  sequence: { participants: ["Client", "API", "DB"], steps: [{ from: 0, to: 1, label: "Request" }, { from: 1, to: 2, label: "Query" }] },
  "mini-chart": { title: "Perf", bars: [{ label: "A", value: 40, displayValue: "40ms" }, { label: "B", value: 80, displayValue: "80ms" }] },
  "step-chain": { steps: [{ number: 1, label: "Step 1", description: "Do thing" }, { number: 2, label: "Step 2", description: "Done" }] },
  venn: { leftLabel: "A", rightLabel: "B", overlapLabel: "Both", leftPoints: ["x"], rightPoints: ["y"] },
  "code-block": { code: "apiVersion: v1\nkind: Service\nmetadata:\n  name: web", language: "yaml" },
  stat: { number: "80%", label: "Growth" },
  table: { headers: ["", "A", "B"], rows: [{ label: "Speed", values: ["Fast", "Slow"] }] },
  "icon-grid": { items: [{ icon: "star", label: "Fast", description: "Quick" }, { icon: "code", label: "Clean", description: "Nice" }] },
};

async function main() {
  const fonts = await loadAllFonts();
  let pass = 0, fail = 0;

  // Test each theme once with basic CONTENT slide
  for (const theme of themes) {
    try {
      const jsx = renderThemeSlide({
        type: "CONTENT",
        title: "Test slide title",
        body: "• Bullet one\n• Bullet two",
        themeName: theme,
        username: "@testuser",
        order: 2,
        totalSlides: 5,
        visualType: "text-only",
        visualData: {} as Record<string, unknown>,
      });
      const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
      const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
      resvg.render();
      pass++;
      process.stdout.write(".");
    } catch (e: unknown) {
      fail++;
      console.error(`\nFAIL: ${theme} basic:`, e instanceof Error ? e.message : e);
    }
  }

  // Comprehensive wireframe-3d test: all slide types × all visual types
  for (const st of slideTypes) {
    for (const vt of visualTypes) {
      try {
        const jsx = renderThemeSlide({
          type: st,
          title: `Test ${st} slide title`,
          body: st === "COVER" ? "Cover subtitle" : "• Bullet one\n• Bullet two",
          themeName: "wireframe-3d",
          username: "@testuser",
          order: 2,
          totalSlides: 5,
          visualType: vt,
          visualData: (sampleData[vt] || {}) as Record<string, unknown>,
        });
        const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
        const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
        resvg.render();
        pass++;
        process.stdout.write("+");
      } catch (e: unknown) {
        fail++;
        console.error(`\nFAIL: wireframe-3d / ${st} / ${vt}:`, e instanceof Error ? e.message : e);
      }
    }
  }

  // Sketch comprehensive test too (also uses absolute layout)
  for (const st of slideTypes) {
    for (const vt of visualTypes) {
      try {
        const jsx = renderThemeSlide({
          type: st,
          title: `Test ${st} slide title`,
          body: st === "COVER" ? "Cover subtitle" : "• Bullet one\n• Bullet two",
          themeName: "sketch",
          username: "@testuser",
          order: 2,
          totalSlides: 5,
          visualType: vt,
          visualData: (sampleData[vt] || {}) as Record<string, unknown>,
        });
        const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
        const resvg = new Resvg(svg, { background: "rgba(0,0,0,0)", fitTo: { mode: "width", value: 1080 } });
        resvg.render();
        pass++;
        process.stdout.write("^");
      } catch (e: unknown) {
        fail++;
        console.error(`\nFAIL: sketch / ${st} / ${vt}:`, e instanceof Error ? e.message : e);
      }
    }
  }

  console.log(`\n\nResults: ${pass} passed, ${fail} failed out of ${pass + fail} tests`);
}

main().catch(console.error);
