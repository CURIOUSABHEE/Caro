import type { VisualType } from "@/lib/types";

export type SlideType = "COVER" | "CONTENT" | "CLOSING";

export interface Shape {
  id: string;
  type: "rect" | "circle" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  fontSize?: number;
}

export interface PaletteOverride {
  background?: string;
  text?: string;
  primary?: string;
  secondary?: string;
  tertiary?: string;
}

export interface RenderSlideInput {
  type: SlideType;
  title: string;
  body: string;
  themeName: string;
  username: string;
  order: number;
  totalSlides: number;
  imageUrl?: string | null;
  imageLayout?: "background" | "inline";
  shapes?: Shape[];
  visualType?: VisualType;
  visualData?: Record<string, unknown>;
  websiteUrl?: string;
  scribble?: boolean;
  paletteOverride?: PaletteOverride;
  fontPairing?: string;
  layoutDensity?: "compact" | "comfortable" | "minimal";
  logoUrl?: string;
}
