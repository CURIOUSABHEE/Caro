import satori from "satori";
import { loadAllFonts } from "../src/lib/fonts";
import { renderThemeSlide } from "../src/components/carousel/render-slide";

async function main() {
  const fonts = await loadAllFonts();
  const themes = ["mesh-glow", "soft-gradient", "monochrome"];
  const vt = "step-chain";
  const data = { steps: [{ number: 1, label: "Step One", description: "First" }, { number: 2, label: "Step Two", description: "Second" }, { number: 3, label: "Step Three", description: "Third" }] };

  for (const theme of themes) {
    const jsx = renderThemeSlide({
      type: "CONTENT", title: "Test", body: "• First\n• Second",
      themeName: theme, username: "@u", order: 2, totalSlides: 5,
      websiteUrl: "ex.com", visualType: vt, visualData: data as Record<string, unknown>,
    });
    const svg = await satori(jsx, { width: 1080, height: 1350, fonts });
    const s = svg.toString();

    console.log(`\n=== ${theme} ===`);
    
    // Find all rects in the diagram area (y roughly 400-900)
    const diagramRects = [...s.matchAll(/<rect\s[^>]*>/g)].filter(m => {
      const yMatch = m[0].match(/y="(\d+)"/);
      if (!yMatch) return false;
      const y = parseInt(yMatch[1]);
      return y >= 400 && y <= 900;
    });
    
    console.log(`  Rects in diagram area (y 400-900): ${diagramRects.length}`);
    for (const r of diagramRects) {
      const x = r[0].match(/x="([^"]+)"/)?.[1] || "?";
      const y = r[0].match(/y="([^"]+)"/)?.[1] || "?";
      const w = r[0].match(/width="([^"]+)"/)?.[1] || "?";
      const h = r[0].match(/height="([^"]+)"/)?.[1] || "?";
      console.log(`    x=${x} y=${y} w=${w} h=${h}`);
    }
    
    // Find text elements in diagram area
    const diagramTexts = [...s.matchAll(/<text[^>]*>[^<]*<\/text>/g)].filter(m => {
      const yMatch = m[0].match(/y="([^"]+)"/);
      if (!yMatch) return false;
      const y = parseFloat(yMatch[1]);
      return y >= 400 && y <= 900;
    });
    
    console.log(`  Texts in diagram area (y 400-900): ${diagramTexts.length}`);
    for (const t of diagramTexts.slice(0, 10)) {
      const content = t[0].replace(/<[^>]*>/g, "").trim();
      const y = t[0].match(/y="([^"]+)"/)?.[1] || "?";
      const x = t[0].match(/x="([^"]+)"/)?.[1] || "?";
      const w = t[0].match(/width="([^"]+)"/)?.[1] || "auto";
      console.log(`    x=${x} y=${y} w=${w} text="${content.substring(0, 30)}"`);
    }

    // Find masks that reference diagram area
    const maskDefs = [...s.matchAll(/<mask\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/mask>/g)];
    const diagramMasks = maskDefs.filter(m => {
      const inner = m[2];
      const rects = [...inner.matchAll(/<rect[^>]*>/g)];
      return rects.some(r => {
        const yMatch = r[0].match(/y="(\d+)"/);
        const wMatch = r[0].match(/width="(\d+)"/);
        if (!yMatch || !wMatch) return false;
        const y = parseInt(yMatch[1]);
        const w = parseInt(wMatch[1]);
        return y >= 400 && y <= 900;
      });
    });
    
    console.log(`  Masks touching diagram area: ${diagramMasks.length}`);
    for (const m of diagramMasks) {
      const id = m[1];
      const rects = [...m[2].matchAll(/<rect[^>]*>/g)];
      console.log(`    mask #${id}: ${rects.length} rects`);
      for (const r of rects) {
        const x = r[0].match(/x="([^"]+)"/)?.[1] || "?";
        const y = r[0].match(/y="([^"]+)"/)?.[1] || "?";
        const w = r[0].match(/width="([^"]+)"/)?.[1] || "?";
        const h = r[0].match(/height="([^"]+)"/)?.[1] || "?";
        console.log(`      rect x=${x} y=${y} w=${w} h=${h}`);
      }
    }
    
    // Find which elements reference these masks
    for (const m of diagramMasks) {
      const id = m[1];
      const refs = [...s.matchAll(new RegExp(`mask="url\\(#${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)"`, "g"))];
      console.log(`  Elements referencing mask #${id}: ${refs.length}`);
      for (const ref of refs) {
        const start = Math.max(0, ref.index! - 200);
        const context = s.substring(start, ref.index! + ref[0].length + 50);
        const tagMatch = context.match(/<(\w+)[^>]*$/);
        console.log(`    Parent tag: <${tagMatch?.[1] || "?"}>...${ref[0]}`);
      }
    }
  }
}

main().catch(console.error);
