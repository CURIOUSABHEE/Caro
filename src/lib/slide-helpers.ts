import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@/lib/constants";

interface SlidePayloadSlide {
  type: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  imageLayout?: string;
  shapes?: unknown[];
  visualType?: string;
  visualData?: unknown;
  paletteOverride?: unknown;
  scribble?: boolean;
  order?: number;
}

interface RenderPayloadOptions {
  slides: SlidePayloadSlide[];
  themeName: string;
  username: string;
  websiteUrl: string;
  scribble?: boolean;
  backgroundOnly?: boolean;
  fontPairing?: string;
  layoutDensity?: string;
  logoUrl?: string | null;
  noImages?: boolean;
  accentColor?: string | null;
  secondaryColor?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  scale?: number;
}

/**
 * Builds the standard payload for POST /api/render.
 * Deduplicates the 4 identical render payloads in page.tsx.
 */
export function buildRenderPayload(opts: RenderPayloadOptions) {
  return {
    slides: opts.slides,
    themeName: opts.themeName,
    username: opts.username,
    websiteUrl: opts.websiteUrl,
    scribble: opts.scribble ?? false,
    backgroundOnly: opts.backgroundOnly ?? false,
    fontPairing: opts.fontPairing,
    layoutDensity: opts.layoutDensity,
    logoUrl: opts.logoUrl || undefined,
    noImages: opts.noImages,
    accentColor: opts.accentColor || undefined,
    secondaryColor: opts.secondaryColor || undefined,
    bgColor: opts.bgColor || undefined,
    textColor: opts.textColor || undefined,
    scale: opts.scale ?? 1,
  };
}

/**
 * Builds a single-slide payload for /api/render from a Slide-like object.
 * Used by handleRegenerateBlock and the preview render.
 */
export function buildSingleSlidePayload(
  slide: {
    type: string;
    userTitle: string;
    userBody: string;
    imageUrl?: string | null;
    imageLayout?: string;
    shapes?: unknown[];
    visualType?: string;
    visualData?: unknown;
    paletteOverride?: unknown;
  },
  index: number,
  override?: { paletteOverride?: unknown }
): SlidePayloadSlide {
  return {
    type: slide.type,
    title: slide.userTitle,
    body: slide.userBody,
    imageUrl: slide.imageUrl || null,
    imageLayout: slide.imageLayout || "inline",
    shapes: slide.shapes || [],
    visualType: slide.visualType || "text-only",
    visualData: slide.visualData || undefined,
    paletteOverride: override?.paletteOverride ?? slide.paletteOverride,
    order: index,
  };
}

export { SLIDE_WIDTH, SLIDE_HEIGHT };
