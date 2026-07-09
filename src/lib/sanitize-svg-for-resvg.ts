interface SvgRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function parseAttr(tag: string, name: string): number | null {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseRectTag(tag: string): SvgRect | null {
  const width = parseAttr(tag, "width");
  const height = parseAttr(tag, "height");
  if (width === null || height === null || width <= 0 || height <= 0) return null;
  return {
    x: parseAttr(tag, "x") ?? 0,
    y: parseAttr(tag, "y") ?? 0,
    width,
    height,
  };
}

function unionRects(rects: SvgRect[]): SvgRect | null {
  if (rects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 0 || height <= 0) return null;
  return { x: minX, y: minY, width, height };
}

function formatRect(rect: SvgRect): string {
  return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}"/>`;
}

/**
 * Work around resvg panics (geom.rs:27) on nested clip-paths with multi-rect
 * or zero-area clips — a known bug in resvg 0.34–0.36 used by @resvg/resvg-js 2.6+.
 * See: https://github.com/thx/resvg-js/issues/413
 */
export function sanitizeSvgForResvg(svg: string): string {
  const removedClipPathIds = new Set<string>();

  let sanitized = svg.replace(
    /<clipPath([^>]*)>([\s\S]*?)<\/clipPath>/g,
    (match, attrs: string, inner: string) => {
      const idMatch = attrs.match(/\bid="([^"]+)"/);
      const id = idMatch?.[1];

      const rectTags = inner.match(/<rect[^>]*\/?>/g) ?? [];
      const parsedRects = rectTags.map(parseRectTag).filter((rect): rect is SvgRect => rect !== null);

      if (parsedRects.length === 0) {
        if (id) removedClipPathIds.add(id);
        return "";
      }

      if (parsedRects.length === 1) {
        return `<clipPath${attrs}>${formatRect(parsedRects[0])}</clipPath>`;
      }

      const bounds = unionRects(parsedRects);
      if (!bounds) {
        if (id) removedClipPathIds.add(id);
        return "";
      }

      return `<clipPath${attrs}>${formatRect(bounds)}</clipPath>`;
    }
  );

  if (removedClipPathIds.size > 0) {
    for (const id of removedClipPathIds) {
      const pattern = new RegExp(`\\sclip-path="url\\(#${id}\\)"`, "g");
      sanitized = sanitized.replace(pattern, "");
    }
  }

  return sanitized;
}
