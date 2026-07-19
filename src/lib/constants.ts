/** Canvas slide dimensions (pixels at 1× scale) */
export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

/** Default monospace font used by the Canvas editor */
export const CANVAS_FONT = "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

/** Valid CTA style values — mirrors the Zod enum in validators */
export const CTA_STYLES = ["soft", "direct", "newsletter", "product", "no-cta"] as const;
export type CtaStyle = (typeof CTA_STYLES)[number];

/** Dark detection threshold for diagram components */
export function isDark(textColor: string): boolean {
  return textColor === "#ffffff" || textColor === "#e5e5e5";
}

/**
 * Normalize a username for display: ensures leading "@" and trims whitespace.
 * Returns empty string if input is falsy after trimming.
 */
export function displayUsername(raw: string | undefined | null): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/**
 * Scribble overlay accent color per theme name.
 * Used by `render-slide.tsx` and `ScribbleOverlay`.
 */
export const SCRIBBLE_THEME_COLORS: Record<string, string> = {
  "cyber-horizon": "#ea580c",
  "linen-rust": "#c5563c",
  "warm-editorial": "#e05a47",
  "soft-gradient": "#7c3aed",
  "mesh-glow": "#ec4899",
  "neo-brutalism": "#161616",
  "neomorphism": "#E8503A",
  "frosted-grid": "#FDE68A",
  "glassmorphism": "#38bdf8",
  "liquid-glass": "#0ea5e9",
  "wireframe-3d": "#000000",
};

/** Returns the scribble accent color for the given theme (fallback: white). */
export function scribbleColor(themeName: string): string {
  return SCRIBBLE_THEME_COLORS[themeName] || "#ffffff";
}

/** Default font pairings per theme */
export const THEME_DEFAULT_FONTS: Record<string, { heading: string; body: string }> = {
  "monochrome": { heading: "Outfit", body: "Outfit" },
  "soft-gradient": { heading: "Outfit", body: "Outfit" },
  "warm-editorial": { heading: "Playfair Display", body: "Outfit" },
  "mesh-glow": { heading: "Outfit", body: "Outfit" },
  "cyber-horizon": { heading: "Outfit", body: "Outfit" },
  "linen-rust": { heading: "Playfair Display", body: "Outfit" },
  "neo-brutalism": { heading: "Playfair Display", body: "Outfit" },
  "neomorphism": { heading: "Outfit", body: "Outfit" },
  "frosted-grid": { heading: "Outfit", body: "Outfit" },
  "glassmorphism": { heading: "Outfit", body: "Outfit" },
  "liquid-glass": { heading: "Outfit", body: "Outfit" },
  "sketch": { heading: "Caveat", body: "Caveat" },
  "wireframe-3d": { heading: "JetBrains Mono", body: "JetBrains Mono" },
};

/**
 * Theme names whose code-block tokenization should use Shiki's dark variant.
 */
export const DARK_CODE_THEMES = [
  "monochrome",
  "cyber-horizon",
  "neo-brutalism",
  "frosted-grid",
  "glassmorphism",
  "sketch",
] as const;

export function codeThemeType(themeName: string): "dark" | "light" {
  return (DARK_CODE_THEMES as readonly string[]).includes(themeName) ? "dark" : "light";
}

// ---------------------------------------------------------------------------
// Diagram helpers (duplicated across 9 diagram files)
// ---------------------------------------------------------------------------

/** Returns true when the theme is wireframe-style (cardBorderRadius = "0px"). */
export function isWireframeDiagram(colors: { cardBorderRadius?: string }): boolean {
  return colors.cardBorderRadius === "0px";
}

/**
 * Diagram font family: JetBrains Mono for wireframe themes, Outfit for everything else.
 * Mirrors the `font(colors)` function duplicated across 8 diagram files.
 */
export function diagramFont(colors: { cardBorderRadius?: string }): string {
  return isWireframeDiagram(colors) ? "JetBrains Mono" : "Outfit";
}

/**
 * Dark-mode detection for diagram backgrounds.
 * Mirrors `const isDark = colors.text === "#ffffff" || colors.text === "#e5e5e5"` from 4 diagrams.
 */
export function isDiagramDark(textColor: string): boolean {
  return textColor === "#ffffff" || textColor === "#e5e5e5";
}
