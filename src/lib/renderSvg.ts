import { Resvg } from "@resvg/resvg-js";
import { sanitizeSvgForResvg } from "./sanitize-svg-for-resvg";

function stripAllClipPaths(svg: string): string {
  return svg
    .replace(/<clipPath[^>]*>[\s\S]*?<\/clipPath>/g, "")
    .replace(/\s*clip-path="url\(#[^"]+\)"/g, "");
}

let renderLock: Promise<void> | null = null;
let renderLockResolve: (() => void) | null = null;

async function acquireRenderLock(): Promise<void> {
  while (renderLock !== null) {
    await renderLock;
  }
  renderLock = new Promise<void>((resolve) => {
    renderLockResolve = resolve;
  });
}

function releaseRenderLock(): void {
  const resolve = renderLockResolve;
  renderLock = null;
  renderLockResolve = null;
  resolve?.();
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

export async function renderWithResvg(svg: string, scale: number = 1): Promise<string> {
  await acquireRenderLock();
  try {
    const cleaned = sanitizeSvgForResvg(svg);
    const base64 = renderPng(cleaned, scale);
    return `data:image/png;base64,${base64}`;
  } catch (err) {
    try {
      const fallback = stripAllClipPaths(svg);
      const base64 = renderPng(fallback, scale);
      return `data:image/png;base64,${base64}`;
    } catch (fallbackErr) {
      throw err instanceof Error ? err : new Error("Rendering failed due to an resvg panic");
    }
  } finally {
    releaseRenderLock();
  }
}
