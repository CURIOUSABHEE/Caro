interface SvgRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function parseAttr(tag: string, name: string): number | null {
  const match = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`));
  if (!match) return null;
  const value = parseFloat(match[1] ?? match[2]);
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
 * Work around resvg panics (geom.rs:27) on nested clip-paths/masks with multi-rect
 * or zero-area clips — a known bug in resvg 0.34–0.36 used by @resvg/resvg-js 2.6+.
 * See: https://github.com/thx/resvg-js/issues/413
 */
export function sanitizeSvgForResvg(svg: string): string {
  const removedIds = new Set<string>();

  // 1. Sanitize clipPath elements: union multi-rect, remove zero-area
  let sanitized = svg.replace(
    /<clipPath([^>]*)>([\s\S]*?)<\/clipPath>/g,
    (match, attrs: string, inner: string) => {
      const idMatch = attrs.match(/\bid="([^"]+)"/);
      const id = idMatch?.[1];

      const rectTags = inner.match(/<rect[^>]*\/?>/g) ?? [];
      const parsedRects = rectTags.map(parseRectTag).filter((rect): rect is SvgRect => rect !== null);

      if (parsedRects.length === 0) {
        if (id) removedIds.add(id);
        return "";
      }

      // If clipPath has non-rect children (circle, path, etc.), preserve the inner content
      const hasNonRectChildren = rectTags.length < (inner.match(/<\w+/g) ?? []).length;
      if (hasNonRectChildren) {
        return match;
      }

      if (parsedRects.length === 1) {
        return `<clipPath${attrs}>${formatRect(parsedRects[0])}</clipPath>`;
      }

      const bounds = unionRects(parsedRects);
      if (!bounds) {
        if (id) removedIds.add(id);
        return "";
      }

      return `<clipPath${attrs}>${formatRect(bounds)}</clipPath>`;
    }
  );

  // 2. Sanitize mask elements: remove masks that contain only zero-area rects.
  //    Zero-area rects (width=0 or height=0) inside masks trigger the same resvg
  //    panic at geom.rs:27 as zero-area clip-paths.
  sanitized = sanitized.replace(
    /<mask([^>]*)>([\s\S]*?)<\/mask>/g,
    (match, attrs: string, inner: string) => {
      const idMatch = attrs.match(/\bid="([^"]+)"/);
      const id = idMatch?.[1];

      const rectTags = inner.match(/<rect[^>]*\/?>/g) ?? [];
      if (rectTags.length === 0) {
        if (id) removedIds.add(id);
        return "";
      }

      // Keep only rects that have positive area
      const validRects = rectTags.filter((tag) => {
        const w = parseAttr(tag, "width");
        const h = parseAttr(tag, "height");
        return w !== null && h !== null && w > 0 && h > 0;
      });

      if (validRects.length === 0) {
        // All rects are zero-area — remove the entire mask
        if (id) removedIds.add(id);
        return "";
      }

      // Some rects are valid — rebuild mask with only valid rects
      if (validRects.length < rectTags.length) {
        return `<mask${attrs}>${validRects.join("")}</mask>`;
      }

      return match;
    }
  );

  // 3. Strip all removed references (clip-path and mask attributes)
  if (removedIds.size > 0) {
    for (const id of removedIds) {
      sanitized = sanitized.replace(new RegExp(`\\sclip-path="url\\(#${id}\\)"`, "g"), "");
      sanitized = sanitized.replace(new RegExp(`\\smask="url\\(#${id}\\)"`, "g"), "");
    }
  }

  return sanitized;
}
