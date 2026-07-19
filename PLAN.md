# Plan: Fix Diagram Rendering + Performance Improvements

## Problem 1: Diagrams Not Rendering on Slides

### Root Cause

The ContentRenderer diagram wrapper (`src/components/carousel/renderers/ContentRenderer.tsx:95`) uses:
```tsx
<div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>
  {wrapped}
</div>
```

This creates a chain of `display: flex` + `width: 100%` nesting:
1. Theme content area: `display: flex; flexDirection: column; flexGrow: 1`
2. Theme inner wrapper: `display: flex; flexDirection: column`
3. ContentRenderer root: `display: flex; flexDirection: column; width: 100%`
4. **Diagram wrapper: `display: flex; width: 100%`** ← problem
5. Diagram root: `display: flex; width: 100%`

Satori's Yoga layout engine fails to resolve `width: 100%` on flex children inside deeply nested flex contexts. The diagram collapses to zero width. This manifests as zero-width SVG `<mask>` rects that clip the diagram content to invisible.

**Why mesh-glow works**: mesh-glow has no card wrapper around the content area. The content section sits directly inside the root div with `flexGrow: 1`, giving Satori a shorter/simpler flex chain to resolve widths through. The percentage chain has fewer intermediate flex containers.

**Why soft-gradient/monochrome fail**: Both have additional nesting layers (card wrapper in soft-gradient, or different flex arrangements in monochrome) that push the flex chain deep enough for Satori to fail width resolution.

### Fix Plan

**Step 1: Fix ContentRenderer diagram wrapper** (`src/components/carousel/renderers/ContentRenderer.tsx`)

Replace the diagram wrapper div at line 95 to avoid the `width: 100%` + `display: flex` combination:

```tsx
// Before:
<div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>
  {wrapped}
</div>

// After:
<div style={{ width: "920px", minHeight: "340px", marginBottom: "20px" }}>
  <div style={{ display: "flex", justifyContent: "center" }}>
    {wrapped}
  </div>
</div>
```

The outer div uses a fixed pixel width (the max content width across all themes) instead of `width: 100%`. The inner flex div handles centering without percentage width. This gives Satori a concrete pixel width to work with.

**Step 2: Make diagram components use `flex: 1` instead of `width: 100%` on their root**

For each diagram component in `src/components/carousel/diagrams/`, replace `width: "100%"` on the root div with `flex: 1`:

- `step-chain.tsx:218`: `width: "100%"` → `flex: 1`
- `flowchart.tsx`, `timeline.tsx`, `venn.tsx`, `concentric.tsx`, `icon-grid.tsx`, `quote-block.tsx`, `stat-display.tsx`, `table-block.tsx`, `before-after.tsx`, `image-grid.tsx`, `architecture.tsx`, `sequence.tsx`, `mini-chart.tsx`: same change

This ensures diagrams fill their container without relying on percentage width resolution.

**Step 3: Verify the fix**

- Run `npx tsx scripts/test-fix.ts` — expect 15/15 pass
- Run `npx tsx scripts/test-render.ts` — expect 94+/97 pass
- Visually inspect sample renders for soft-gradient, monochrome, and mesh-glow themes with step-chain diagrams

---

## Problem 2: Performance Improvements

### 2A. Parallel Slide Rendering

**File**: `src/app/api/render/route.ts`

Replace the sequential `for` loop (lines 244-273) with parallel rendering:

```tsx
// Before: sequential
for (let i = 0; i < slides.length; i++) { await renderSingleSlide(...); }

// After: parallel with concurrency limit
const CONCURRENCY = 3;
const results: PromiseSettledResult<string>[] = [];
for (let batch = 0; batch < slides.length; batch += CONCURRENCY) {
  const batchSlides = slides.slice(batch, batch + CONCURRENCY);
  const batchResults = await Promise.allSettled(
    batchSlides.map((slide, j) => renderSingleSlide(slide, batch + j, ...))
  );
  results.push(...batchResults);
}
```

Keep a concurrency limit (3) instead of full parallelism to avoid overwhelming resvg's rayon workers. Remove the `acquireRenderLock` / `releaseRenderLock` mutex in `renderSvg.ts` since the concurrency limit in the route handler now controls this.

### 2B. SVG/PNG Caching

**File**: `src/app/api/render/route.ts` + new `src/lib/render-cache.ts`

Add a content-hash-based cache for rendered PNG output:

```tsx
// New file: src/lib/render-cache.ts
import { createHash } from "crypto";

const pngCache = new Map<string, string>(); // hash → data URI
const MAX_CACHE_SIZE = 100;

export function getCachedPng(key: string): string | undefined { ... }
export function setCachedPng(key: string, value: string): void { ... }
export function buildCacheKey(jsx: ReactNode, scale: number): string { ... }
```

Cache key = hash of `(themeName + visualType + JSON.stringify(visualData) + title + body + scale)`. Skip satori + resvg entirely on cache hit.

### 2C. Merge Tree Traversals

**Files**: `src/app/api/render/route.ts`, `src/components/carousel/render-slide.tsx`

Currently the JSX tree goes through three passes:
1. `renderThemeSlideBase()` builds it
2. `applyOverridesToTree()` clones entire tree (injects fonts, density, logo)
3. `removeZIndexFromTree()` clones entire tree again (strips z-index)

Merge steps 2 and 3 into a single `prepareTreeForSatori()` function that does both in one traversal:

```tsx
// In render-slide.tsx, combine into one function:
function prepareTreeForSatori(
  node: ReactNode,
  headingFont: string,
  bodyFont: string,
  density?: "compact" | "comfortable" | "minimal",
  logoUrl?: string,
  username?: string,
): ReactNode {
  // Single recursive walk that:
  // 1. Strips z-index from style
  // 2. Applies font overrides to text elements
  // 3. Injects density padding
  // 4. Injects logo/username
}
```

### 2D. Fix Base64 Encoding

**File**: `src/lib/prefetch-image.ts` (lines 36-43)

Replace the character-by-character base64 conversion:

```tsx
// Before (slow):
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// After (fast):
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}
```

### 2E. Additional Fixes

1. **Glassmorphism border**: Fix the double `1px solid` prefix in `tokensToThemeColors` → the `glassBorder` extra override is being concatenated with the token's border prefix. Ensure `tokensToThemeColors` doesn't prepend `"1px solid "` when the override already contains it.

2. **CodeBlock overflow**: In `src/components/carousel/renderers/ContentRenderer.tsx` or wherever `overflow: "auto"` is used for code blocks, change to `overflow: "hidden"` (Satori only supports `visible` | `hidden`).

3. **Reduce retry delay**: In `route.ts:187`, change `setTimeout(r, 150)` to `setTimeout(r, 50)`.

4. **Image deduplication**: In `prefetch-image.ts`, add deduplication for in-flight requests (if a URL is already being fetched, return the existing promise instead of starting a new fetch).

### 2F. Remove Render Lock

**File**: `src/lib/renderSvg.ts`

Once parallel rendering is controlled by the concurrency limit in the route handler, the `acquireRenderLock`/`releaseRenderLock` mutex is no longer needed. Remove it to eliminate the serialization bottleneck. The concurrency limit (3) ensures at most 3 resvg renders run concurrently.

---

## Implementation Order

1. Fix diagram rendering (Step 1-3) — this is the critical blocker
2. Fix glassmorphism border + CodeBlock overflow — quick wins
3. Fix base64 encoding — quick win
4. Merge tree traversals — reduces per-slide overhead
5. Add caching — biggest performance win for repeated renders
6. Parallel rendering + remove render lock — improves throughput for multi-slide decks
7. Image deduplication + retry delay — minor optimizations

## Verification

After each step:
- `npx tsc --noEmit` — no type errors
- `npx tsx scripts/test-render.ts` — 94+/97 pass
- `npx tsx scripts/test-fix.ts` — 15/15 pass (after diagram fix)
