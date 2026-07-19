import { Resvg } from "@resvg/resvg-js";
import { sanitizeSvgForResvg } from "./sanitize-svg-for-resvg";

function stripAllClipPaths(svg: string): string {
  return svg
    .replace(/<clipPath[^>]*>[\s\S]*?<\/clipPath>/g, "")
    .replace(/\s*clip-path="url\(#[^"]+\)"/g, "")
    .replace(/<mask[^>]*>[\s\S]*?<\/mask>/g, "")
    .replace(/\s*mask="url\(#[^"]+\)"/g, "");
}

const INVALID_SVG_CSS_PATTERNS = [
  /(?:width|height|min-width|max-width|min-height|max-height)\s*:\s*fit-content/gi,
  /(?:width|height|min-width|max-width|min-height|max-height)\s*:\s*min-content/gi,
  /(?:width|height|min-width|max-width|min-height|max-height)\s*:\s*max-content/gi,
  /(?:width|height|min-width|max-width|min-height|max-height)\s*:\s*calc\([^)]+\)/gi,
];

function sanitizeInvalidCssStyles(svg: string): string {
  let result = svg;
  for (const pattern of INVALID_SVG_CSS_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const prop = match.split(":")[0].trim();
      return `${prop}: auto`;
    });
  }
  return result;
}

function renderPng(svg: string, scale: number): string {
  const width = Math.round(1080 * scale);
  const resvg = new Resvg(svg, {
    background: "rgba(0, 0, 0, 0)",
    fitTo: { mode: "width", value: width },
  });
  const pngData = resvg.render();
  return pngData.asPng().toString("base64");
}

function doRender(svg: string, scale: number): string {
  try {
    const cleaned = sanitizeSvgForResvg(svg);
    return renderPng(cleaned, scale);
  } catch (err) {
    try {
      let fallback = stripAllClipPaths(svg);
      fallback = sanitizeInvalidCssStyles(fallback);
      return renderPng(fallback, scale);
    } catch {
      throw err instanceof Error ? err : new Error("Rendering failed due to an resvg panic");
    }
  }
}

// Chain renders through a promise so only one resvg call runs at a time.
// The native resvg binding (rayon) panics when multiple renders run concurrently.
// Chaining via a single promise avoids the race condition of the old
// acquire/release lock pattern.
let renderChain: Promise<string> = Promise.resolve("");

export function renderWithResvg(svg: string, scale: number = 1): Promise<string> {
  const next = renderChain.then(
    () => `data:image/png;base64,${doRender(svg, scale)}`,
    () => `data:image/png;base64,${doRender(svg, scale)}`,
  );
  renderChain = next.catch((err) => {
    console.error("[renderSvg] Render failed, resetting chain:", err instanceof Error ? err.message : err);
    return "";
  });
  return next;
}
