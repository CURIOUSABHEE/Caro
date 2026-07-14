import React, { useMemo } from "react";
import { CodeBlock } from "./CodeBlock";
import type {
  VisualData,
  ThemeColors,
  StepChainData,
  VennData,
  WheelData,
  ConcentricData,
  IconGridData,
  QuoteData,
  StatData,
  TableData,
  CodeBlockData,
  FlowchartData,
  TimelineData,
  BeforeAfterData,
  ImageGridData,
  ArchitectureData,
  SequenceData,
  MiniChartData,
  VisualType,
} from "@/lib/types";

export type SlideType = "COVER" | "CONTENT" | "CLOSING";

export interface Shape {
  id: string;
  type: "rect" | "circle" | "text";
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
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

// Replaces unicode hyphens, fancy quotes, non-breaking spaces with standard ASCII equivalents to prevent tofu placeholders
export function sanitizeTextForSatori(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-") // replace various dashes/hyphens with standard ASCII hyphen
    .replace(/[\u2018\u2019\u201a\u201b\u2039\u203a]/g, "'")       // replace curly single quotes
    .replace(/[\u201c\u201d\u201e\u201f\u00ab\u00bb]/g, '"')       // replace curly double quotes
    .replace(/[\u00a0\u202f\u205f\u3000]/g, " ")                  // replace non-breaking/wide spaces with regular space
    .replace(/\u2026/g, "...")                                    // replace ellipsis
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "");                  // remove zero-width spaces/invisible characters
}

// Recursively walks through visual data object to sanitize all string values
export function sanitizeObjectStrings<T>(obj: T): T {
  if (!obj) return obj;
  if (typeof obj === "string") {
    return sanitizeTextForSatori(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectStrings(item)) as unknown as T;
  }
  if (typeof obj === "object") {
    const res: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        res[key] = sanitizeObjectStrings((obj as Record<string, unknown>)[key]);
      }
    }
    return res as unknown as T;
  }
  return obj;
}

let currentScribbleState: { scribble: boolean; color: string } | null = null;

// Inline SVGs for design accents compatible with Satori
const SwipeArrow = ({ color = "currentColor" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
    <path d="M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5L19 12L12 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StarAccent = ({ color, size = 24 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" fill={color} stroke="#141414" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const BurstAccent = ({ color, size = 40 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <path d="M20 2L23 12L33 15L23 18L20 28L17 18L7 15L17 12Z" fill={color} stroke="#141414" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const MouseCursorIcon = ({ color = "currentColor" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={color} style={{ marginRight: 6, transform: "rotate(-15deg)" }}>
    <path d="M4.5 3v15.2l3.8-3.8 2.7 6.4 2.6-1.1-2.7-6.4 5.3-.2z" />
  </svg>
);

// Warm Editorial theme hand-drawn transition arrows
const HandDrawnArrowRight = () => (
  <svg width="100" height="24" viewBox="0 0 100 24" fill="none" style={{ position: "absolute", bottom: "180px", right: "90px"}}>
    <path
      d="M10,12 C35,4 65,18 90,10"
      stroke="#1e1b18"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M80,4 L90,10 L83,18"
      stroke="#1e1b18"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const HandDrawnArrowLeft = () => (
  <svg width="100" height="24" viewBox="0 0 100 24" fill="none" style={{ position: "absolute", bottom: "180px", left: "90px"}}>
    <path
      d="M90,12 C65,4 35,18 10,10"
      stroke="#1e1b18"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M20,4 L10,10 L17,18"
      stroke="#1e1b18"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Mesh Glow pink accent underlines & ovals
const PinkScribbleLine = ({ offsetX = 0 }: { offsetX?: number }) => (
  <svg width="180" height="15" viewBox="0 0 180 15" fill="none" style={{ display: "flex", marginTop: "4px", marginLeft: `${offsetX}px` }}>
    <path
      d="M5,8 C45,2 135,2 175,7 C115,12 55,12 5,8"
      stroke="#ec4899"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const PinkScribbleOval = () => (
  <svg width="280" height="72" viewBox="0 0 280 72" fill="none" style={{ position: "absolute", left: "-24px", top: "-16px"}}>
    <path
      d="M20,36 C20,18 130,10 250,20 C265,24 265,48 250,52 C130,62 20,54 20,36 Z"
      stroke="#ec4899"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Seeded pseudo-random number generator to ensure identical coordinates between preview and export calls
function getSeededRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

// Panoramic background component that creates seamless flows of gradient blobs and lines
const PanoramicBackground = ({ theme, order = 0, totalSlides = 1 }: { order?: number; totalSlides?: number; theme: string }) => {
  const width = 1080;
  const height = 1350;

  // Programmatic mesh-glow blobs projection using max two colors per slide
  const meshBlobs: { cx: number; cy: number; r: number; color1: string; color2: string; opacity: number }[] = [];
  if (theme === "mesh-glow") {
    // Limited to Pink (#ec4899) and Purple (#a855f7) — two colors total
    const startSlide = Math.max(0, order - 1);
    const endSlide = order + 1;

    for (let s = startSlide; s <= endSlide; s++) {
      const baseOffset = s * width - order * width;
      if (s === 0) {
        // Slide 0: Cover
        meshBlobs.push(
          { cx: 950 - order * width, cy: 150, r: 250, color1: "#ec4899", color2: "#db2777", opacity: 0.7 },
          { cx: 200 - order * width, cy: 1150, r: 280, color1: "#a855f7", color2: "#9333ea", opacity: 0.75 }
        );
      } else {
        const layoutType = s % 2;
        if (layoutType === 1) {
          // Layout A: Purple top-right + Pink bottom-left
          meshBlobs.push(
            { cx: baseOffset + 850, cy: 200, r: 250, color1: "#a855f7", color2: "#9333ea", opacity: 0.7 },
            { cx: baseOffset + 300, cy: 1150, r: 280, color1: "#ec4899", color2: "#db2777", opacity: 0.75 }
          );
        } else {
          // Layout B: Pink top-right + Purple bottom-left
          meshBlobs.push(
            { cx: baseOffset + 950, cy: 150, r: 260, color1: "#ec4899", color2: "#db2777", opacity: 0.75 },
            { cx: baseOffset + 200, cy: 1150, r: 240, color1: "#a855f7", color2: "#9333ea", opacity: 0.7 }
          );
        }
      }
    }
  }

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", overflow: "hidden" }}>
      {/* Base background color per theme */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme === "warm-editorial" ? "#f5f2eb" : theme === "linen-rust" ? "#d8d7cf" : theme === "cyber-horizon" ? "#050505" : "#fbfbfc"
        }}
      />

      {/* soft-gradient: subtle diagonal gradient */}
      {theme === "soft-gradient" && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <rect x="0" y="0" width={width} height={height} fill="url(#sgBg)" opacity="0.15" />
          <defs>
            <linearGradient id="sgBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* mesh-glow: stunning mesh gradient blobs based on user reference, flowing slide-to-slide */}
      {theme === "mesh-glow" && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <defs>
            {/* Soft blur filter for organic color mixing, reduced blur so it doesn't spread too much */}
            <filter id="mesh-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="80" />
            </filter>
            
            {meshBlobs.map((blob, idx) => (
              <radialGradient key={`rg-${idx}`} id={`rg-blob-${idx}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={blob.color1} stopOpacity={blob.opacity} />
                <stop offset="60%" stopColor={blob.color2} stopOpacity={blob.opacity * 0.4} />
                <stop offset="100%" stopColor={blob.color2} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Glowing blobs inside blur group */}
          <g filter="url(#mesh-glow-blur)">
            {meshBlobs.map((blob, idx) => (
              <circle
                key={`c-${idx}`}
                cx={blob.cx}
                cy={blob.cy}
                r={blob.r}
                fill={`url(#rg-blob-${idx})`}
              />
            ))}
          </g>
        </svg>
      )}

      {/* warm-editorial: subtle horizontal line accents */}
      {theme === "warm-editorial" && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 0", opacity: 0.06 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`wl-${i}`} style={{ height: "1px", backgroundColor: "#e05a47", marginLeft: i % 2 === 0 ? "0" : "200px", width: i % 2 === 0 ? "100%" : "calc(100% - 200px)" }} />
          ))}
        </div>
      )}

      {/* cyber-horizon: blueprint grid */}
      {theme === "cyber-horizon" && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08 }}>
          {Array.from({ length: Math.ceil(width / 120) }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 120} y1={0} x2={i * 120} y2={height} stroke="#ffffff" strokeWidth="1" />
          ))}
          {Array.from({ length: Math.ceil(height / 120) }).map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={i * 120} x2={width} y2={i * 120} stroke="#ffffff" strokeWidth="1" />
          ))}
        </svg>
      )}

      {/* linen-rust: no background decoration (has sparkle dots in theme) */}
    </div>
  );
};

// Parameterized diagram components compatible with Satori layout engine
// Helper to render high-quality inline SVG icons matching design themes
const renderIcon = (name: string, color: string) => {
  const normalized = (name || "").toLowerCase().trim();
  const svgStyle = { width: "24px", height: "24px" };
  if (normalized === "briefcase") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (normalized === "lightbulb") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" strokeLinecap="round" />
        <path d="M10 22h4" strokeLinecap="round" />
      </svg>
    );
  }
  if (normalized === "star") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (normalized === "settings") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }
  if (normalized === "shield") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (normalized === "alert") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (normalized === "code") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }
  if (normalized === "chart") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    );
  }
  if (normalized === "user") {
    return (
      <svg style={svgStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  return null;
};

const StepChain = ({ data, colors }: { data: StepChainData; colors: ThemeColors }) => {
  const steps = data?.steps || [];
  if (!Array.isArray(steps) || steps.length === 0) return null;
  const visibleSteps = steps.slice(0, 4);
  const cardBorderRadius = colors?.cardBorderRadius || "16px";
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", width: "100%", padding: "20px 0", position: "relative" }}>
      {visibleSteps.map((step, idx) => (
        <div key={idx} style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", flex: 1, position: "relative", marginRight: idx < visibleSteps.length - 1 ? "32px" : "0" }}>
          {/* Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              position: "relative",
              backgroundColor: colors.glassBg || "rgba(255, 255, 255, 0.4)",
              border: `1.5px solid ${colors.glassBorder || "rgba(0, 0, 0, 0.08)"}`,
              boxShadow: colors.cardShadow || `0 8px 24px ${colors.glassBorder ? colors.glassBorder.replace(/[\d.]+\)$/g, '0.15)') : "rgba(0,0,0,0.05)"}`,
              borderRadius: cardBorderRadius,
              padding: "32px 20px 20px 20px",
              boxSizing: "border-box",
              minHeight: "220px",
              marginTop: "25px",
            }}
          >
            {/* Overlapping Badge */}
            <div
              style={{
                position: "absolute",
                top: "-25px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                ...(colors.accentBg ? { background: colors.accentBg } : { backgroundColor: colors.accent }),
                color: colors.accent === "#ffffff" ? "#050505" : "#ffffff",
                fontSize: "20px",
                fontWeight: "bold",
                border: `3px solid ${colors.accent === "#ffffff" ? "#050505" : (colors.background || "#ffffff")}`,
                boxSizing: "border-box",
              }}
            >
              {step.number || (idx + 1)}
            </div>
            <span style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", color: colors.text, marginBottom: "8px" }}>
              {step.label}
            </span>
            <span style={{ fontSize: "13px", textAlign: "center", color: colors.muted, lineHeight: "1.4" }}>
              {step.description}
            </span>
          </div>
          {/* Connector Arrow perfectly aligned in the space between steps */}
          {idx < visibleSteps.length - 1 && (
            <div style={{ position: "absolute", right: "-30px", top: "16px", display: "flex", alignItems: "center", justifyContent: "center", width: "28px", flexShrink: 0 }}>
              <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
                <line x1="0" y1="9" x2="20" y2="9" stroke={colors.accent} strokeWidth="2.5" strokeDasharray="3,2" opacity="0.8" />
                <path d="M15 4 L22 9 L15 14" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="1" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Venn = ({ data, colors }: { data: VennData; colors: ThemeColors }) => {
  if (!data?.leftLabel && !data?.rightLabel && !data?.overlapLabel) return null;
  const leftLabel = data?.leftLabel || "Concept A";
  const rightLabel = data?.rightLabel || "Concept B";
  const overlapLabel = data?.overlapLabel || "Shared";
  const leftPoints: string[] = Array.isArray(data?.leftPoints) ? data.leftPoints.slice(0, 2) : [];
  const rightPoints: string[] = Array.isArray(data?.rightPoints) ? data.rightPoints.slice(0, 2) : [];

  const isDark = colors.text === "#ffffff" || colors.text === "#e5e5e5";
  const labelBg = isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.95)";
  const bodyTextColor = isDark ? "rgba(255,255,255,0.75)" : "rgba(30,30,30,0.75)";
  const fontFamily = diagramFontFamily(colors);
  const overlapWords = overlapLabel.split(" ");

  return (
    <div style={{ display: "flex", width: "620px", height: "360px", position: "relative", justifyContent: "center", alignItems: "center" }}>
      <svg width="620" height="360" viewBox="0 0 620 360" fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx="215" cy="175" r="155" fill={colors.accent} fillOpacity="0.05" stroke={colors.accent} strokeWidth="3.5" opacity="0.85" />
        <circle cx="405" cy="175" r="155" fill={colors.accent} fillOpacity="0.05" stroke={colors.accent} strokeWidth="3.5" opacity="0.85" />
        <ellipse cx="310" cy="175" rx="55" ry="120" fill={colors.accent} fillOpacity="0.18" />
      </svg>

      <div style={{ position: "absolute", left: "60px", top: "155px", width: "115px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: labelBg, border: `1.5px solid ${colors.accent}`, borderRadius: "15px" }}>
        <span style={{ fontSize: leftLabel.length > 15 ? "12px" : "14px", fontWeight: 700, fontFamily, color: colors.text, textAlign: "center" }}>{leftLabel}</span>
      </div>

      <div style={{ position: "absolute", left: "445px", top: "155px", width: "115px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: labelBg, border: `1.5px solid ${colors.accent}`, borderRadius: "15px" }}>
        <span style={{ fontSize: rightLabel.length > 15 ? "12px" : "14px", fontWeight: 700, fontFamily, color: colors.text, textAlign: "center" }}>{rightLabel}</span>
      </div>

      <div style={{ position: "absolute", left: "268px", top: "148px", width: "84px", height: "54px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: colors.accent, borderRadius: "14px" }}>
        <span style={{ fontSize: overlapWords[0].length > 12 ? "10px" : "12px", fontWeight: 700, fontFamily, color: "#ffffff", textAlign: "center" }}>{overlapWords[0]}</span>
        {overlapWords.length > 1 && (
          <span style={{ fontSize: "10px", fontWeight: 600, fontFamily, color: "rgba(255,255,255,0.85)", textAlign: "center" }}>{overlapWords.slice(1).join(" ")}</span>
        )}
      </div>

      {leftPoints.map((pt, i) => (
        <div key={`l-${i}`} style={{ position: "absolute", left: "60px", top: `${210 + i * 20}px`, width: "115px", display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, fontFamily, color: bodyTextColor, textAlign: "center" }}>{pt.length > 18 ? pt.slice(0, 17) + "..." : pt}</span>
        </div>
      ))}

      {rightPoints.map((pt, i) => (
        <div key={`r-${i}`} style={{ position: "absolute", left: "445px", top: `${210 + i * 20}px`, width: "115px", display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, fontFamily, color: bodyTextColor, textAlign: "center" }}>{pt.length > 18 ? pt.slice(0, 17) + "..." : pt}</span>
        </div>
      ))}
    </div>
  );
};

const Wheel = ({ data, colors }: { data: WheelData; colors: ThemeColors }) => {
  if (!data?.centerLabel && (!data?.spokes || data.spokes.length === 0)) return null;
  const centerLabel = data?.centerLabel || "Core";
  const spokes = (data?.spokes || []).slice(0, 6);
  const spokeCount = spokes.length;

  const cx = 300;
  const cy = 180;
  const spokeRadius = 145;
  // Start at top (-90 degrees) and distribute evenly regardless of count (3, 4, 5, or 6)
  const angleStep = (2 * Math.PI) / Math.max(spokeCount, 1);
  const startAngle = -Math.PI / 2;

  const isDark = colors.text === "#ffffff" || colors.text === "#e5e5e5";
  const itemBg = isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.92)";

  return (
    <div style={{ display: "flex", width: "600px", height: "360px", position: "relative", justifyContent: "center", alignItems: "center" }}>
      <svg width="600" height="360" viewBox="0 0 600 360" fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
        {spokes.map((_, idx) => {
          const angle = startAngle + idx * angleStep;
          const startR = 60;
          const endR = spokeRadius - 45;
          const sx = cx + Math.cos(angle) * startR;
          const sy = cy + Math.sin(angle) * startR;
          const ex = cx + Math.cos(angle) * endR;
          const ey = cy + Math.sin(angle) * endR;
          return (
            <line key={idx} x1={sx} y1={sy} x2={ex} y2={ey} stroke={colors.accent} strokeWidth="2.5" opacity="0.35" />
          );
        })}
      </svg>

      {/* Central Core Card */}
      <div
            style={{
              position: "absolute",
              left: `${cx - 58}px`,
              top: `${cy - 58}px`,
              width: "116px",
              height: "116px",
              borderRadius: "50%",
              border: colors.accentBg ? `4px solid ${colors.accent}` : `2px solid ${colors.glassBorder || (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)")}`,
              backgroundColor: colors.accentBg || colors.glassBg || itemBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: "bold", color: colors.accentBg ? "#ffffff" : colors.text, textAlign: "center", lineHeight: "1.2" }}>{centerLabel}</span>
      </div>

      {/* Dynamic spoke label cards — positioned at the spoke endpoint */}
      {spokes.map((spoke, idx) => {
        const angle = startAngle + idx * angleStep;
        const ex = cx + Math.cos(angle) * spokeRadius;
        const ey = cy + Math.sin(angle) * spokeRadius;
        const cardW = spokeCount >= 5 ? 110 : 130;
        const cardH = spoke.description ? 64 : 44;
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${ex - cardW / 2}px`,
              top: `${ey - cardH / 2}px`,
              width: `${cardW}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.glassBg || itemBg,
              padding: spoke.description ? "8px 10px" : "7px 10px",
              borderRadius: "12px",
              border: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.1)"}`,
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontSize: spokeCount >= 5 ? "11px" : "13px", fontWeight: "bold", color: colors.text, textAlign: "center", lineHeight: "1.3" }}>
              {spoke.label}
            </span>
            {spoke.description && (
              <span style={{ fontSize: "10px", color: colors.muted, textAlign: "center", lineHeight: "1.3", marginTop: "3px" }}>
                {spoke.description.length > 30 ? spoke.description.slice(0, 28) + "..." : spoke.description}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Concentric = ({ data, colors }: { data: ConcentricData; colors: ThemeColors }) => {
  const rings = data?.rings || [];
  if (!Array.isArray(rings) || rings.length === 0) return null;

  const sortedRings = [...rings].sort((a, b) => a.depth - b.depth);
  const cx = 300;
  const cy = 180;
  // Radii for inner / middle / outer rings
  const radii = [55, 100, 150];

  const isDark = colors.text === "#ffffff" || colors.text === "#e5e5e5";
  const labelBg = isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.92)";

  // Each ring label is positioned on the right edge of its ring with a short tick connector
  // so the spatial depth order is immediately legible
  const ringConfigs = [
    { r: radii[0], accentFill: true,  labelX: cx + radii[0] + 38, labelY: cy - 6 },
    { r: radii[1], accentFill: false, labelX: cx + radii[1] + 38, labelY: cy - 26 },
    { r: radii[2], accentFill: false, labelX: cx + radii[2] + 38, labelY: cy - 46 },
  ];

  return (
    <div style={{ display: "flex", width: "620px", height: "360px", position: "relative", justifyContent: "center", alignItems: "center" }}>
      <svg width="620" height="360" viewBox="0 0 620 360" fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Ring circles */}
        <circle cx={cx} cy={cy} r={radii[2]} fill={colors.accent} fillOpacity="0.05" stroke={colors.accent} strokeWidth="2" strokeDasharray="6,6" opacity="0.7" />
        <circle cx={cx} cy={cy} r={radii[1]} fill={colors.accent} fillOpacity="0.1" stroke={colors.accent} strokeWidth="3" opacity="0.85" />
        <circle cx={cx} cy={cy} r={radii[0]} fill={colors.accent} fillOpacity="0.22" stroke={colors.accent} strokeWidth="4" />

        {/* Tick connectors — strictly horizontal lines from the circle edge at labelY to the label */}
        {sortedRings.slice(0, 3).map((_, i) => {
          const rc = ringConfigs[i];
          const dy = rc.labelY - cy;
          const dx = Math.sqrt(Math.max(0, rc.r * rc.r - dy * dy));
          const tickStartX = cx + dx;
          return (
            <line key={i} x1={tickStartX} y1={rc.labelY} x2={rc.labelX - 4} y2={rc.labelY} stroke={colors.accent} strokeWidth="1.5" opacity="0.6" />
          );
        })}
      </svg>

      {/* Ring labels — positioned at the right edge of each ring */}
      {sortedRings.slice(0, 3).map((ring, i) => {
        const rc = ringConfigs[i];
        const isInner = i === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${rc.labelX}px`,
              top: `${rc.labelY - 12}px`,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: isInner ? "#ffffff" : colors.text,
                ...(isInner && colors.accentBg ? { background: colors.accentBg } : { backgroundColor: isInner ? colors.accent : (colors.glassBg || labelBg) }),
                border: `1.5px solid ${isInner ? colors.accent : (colors.glassBorder || "rgba(0,0,0,0.1)")}`,
                padding: "5px 10px",
                borderRadius: "12px",
                whiteSpace: "nowrap",
                textShadow: isInner ? "0 1px 2px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {ring.ringLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const IconGrid = ({ data, colors }: { data: IconGridData; colors: ThemeColors }) => {
  const items = data?.items || [];
  if (!Array.isArray(items) || items.length === 0) return null;
  const visibleItems = items.slice(0, 6); // Support up to 6 items
  // For 4 items: 2-column 2-row; for 5-6 items: 3-column 2-row with slightly smaller tiles
  const is6Col = visibleItems.length >= 5;
  const tileWidth = is6Col ? "30%" : "46%";
  const tileMargin = is6Col ? "1% 1.5%" : "1.5% 2%";
  const iconSize = is6Col ? 42 : 52;
  const labelSize = is6Col ? "12px" : "14px";
  const iconBorderRadius = colors?.iconBorderRadius || "50%";
  const cardBorderRadius = colors?.cardBorderRadius || "18px";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", width: "100%", padding: "10px 0" }}>
      {visibleItems.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            width: tileWidth,
            margin: tileMargin,
            borderRadius: cardBorderRadius,
            backgroundColor: colors.glassBg || "rgba(255, 255, 255, 0.4)",
            border: `1.5px solid ${colors.glassBorder || "rgba(0, 0, 0, 0.08)"}`,
            boxShadow: colors.cardShadow || `0 8px 24px ${colors.glassBorder ? colors.glassBorder.replace(/[\d.]+\)$/g, '0.15)') : "rgba(0,0,0,0.05)"}`,
            boxSizing: "border-box",
            padding: "20px 10px",
            minHeight: is6Col ? "130px" : "150px",
          }}
        >
          <div
            style={{
              width: `${iconSize}px`,
              height: `${iconSize}px`,
              borderRadius: iconBorderRadius,
              ...(colors.accentBg ? { background: colors.accentBg } : { backgroundColor: colors.accent }),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "10px",
              flexShrink: 0,
              border: `2px solid ${colors.accent === "#ffffff" ? "#050505" : (colors.glassBorder || "rgba(255,255,255,0.2)")}`,
            }}
          >
            {(() => {
              const iconColor = colors.accent === "#ffffff" ? "#050505" : "#ffffff";
              return renderIcon(item.icon, iconColor) || (
                <span style={{ fontSize: is6Col ? "18px" : "24px", fontWeight: 700, color: iconColor }}>
                  {(item.label || "?").charAt(0).toUpperCase()}
                </span>
              );
            })()}
          </div>
          <span style={{ fontSize: labelSize, fontWeight: "bold", textAlign: "center", color: colors.text, lineHeight: "1.3", marginBottom: item.description ? "5px" : "0" }}>
            {item.label}
          </span>
          {item.description && (
            <span style={{ fontSize: "11px", textAlign: "center", color: colors.muted, lineHeight: "1.35" }}>
              {item.description.length > 40 ? item.description.slice(0, 38) + "..." : item.description}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// --- QuoteBlock (large stylized pull-quote) ---
const QuoteBlock = ({ data, colors }: { data: QuoteData; colors: ThemeColors }) => {
  if (!data?.quote) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, textAlign: "center", padding: "30px 20px", position: "relative" }}>
      <div style={{ position: "absolute", top: "-60px", display: "flex", justifyContent: "center", width: "100%", zIndex: 0 }}>
        <span style={{ fontSize: "200px", lineHeight: 1, color: colors.accent, opacity: 0.12, fontFamily: "Playfair Display, serif", userSelect: "none" }}>&quot;</span>
      </div>
      <p style={{ position: "relative", zIndex: 1, fontSize: "32px", fontFamily: "Playfair Display, serif", fontStyle: "italic", lineHeight: 1.5, color: colors.text, maxWidth: "800px", margin: "0" }}>
        {data.quote}
      </p>
      {data.attribution && (
        <div style={{ position: "relative", zIndex: 1, marginTop: "36px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "45px", height: "3px", backgroundColor: colors.accent, marginBottom: "16px", borderRadius: "2px" }} />
          <span style={{ fontSize: "18px", fontWeight: 800, color: colors.accent, textTransform: "uppercase", letterSpacing: "1.5px" }}>{data.attribution}</span>
          {data.role && (
            <span style={{ fontSize: "14px", color: colors.muted, marginTop: "6px", fontWeight: 600 }}>{data.role}</span>
          )}
        </div>
      )}
    </div>
  );
};

// --- Stat Display (big bold number with label) ---
const StatDisplay = ({ data, colors }: { data: StatData; colors: ThemeColors }) => {
  if (!data?.number) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, textAlign: "center", padding: "30px" }}>
      <span style={{ fontSize: "110px", fontWeight: 900, lineHeight: 1, color: colors.accent, letterSpacing: "-4px" }}>
        {data.number}
      </span>
      {data.label && (
        <span style={{ fontSize: "24px", fontWeight: 700, color: colors.text, marginTop: "20px", maxWidth: "600px", lineHeight: 1.3, letterSpacing: "-0.5px" }}>
          {data.label}
        </span>
      )}
      {data.context && (
        <span style={{ fontSize: "16px", color: colors.muted, marginTop: "12px", maxWidth: "600px", lineHeight: 1.5, fontWeight: 500 }}>
          {data.context}
        </span>
      )}
    </div>
  );
};

// --- Comparison Table (structured grid for side-by-side comparison) ---
const TableBlock = ({ data, colors }: { data: TableData; colors: ThemeColors }) => {
  if (!data?.headers || !data?.rows) return null;
  const numCols = data.headers.length;
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "10px 0", flexGrow: 1 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px", lineHeight: 1.3 }}>
        <thead>
          <tr>
            {data.headers.map((h: string, i: number) => (
              <th
                key={i}
                style={{
                  textAlign: i === 0 ? "left" : "center",
                  padding: "14px 12px",
                  fontWeight: 800,
                  fontSize: "18px",
                  color: colors.accent,
                  borderBottom: `3px solid ${colors.accent}`,
                  borderRight: i < numCols - 1 ? `1px solid ${colors.accent}33` : "none",
                  letterSpacing: "0.5px",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri}>
              <td
                style={{
                  padding: "14px 12px",
                  fontWeight: 700,
                  color: colors.text,
                  borderBottom: `1px solid ${colors.text}1a`,
                  borderRight: `1px solid ${colors.text}1a`,
                  fontSize: "15px",
                  whiteSpace: "nowrap",
                }}
              >
                {row.label}
              </td>
              {(row.values || []).map((v, vi) => (
                <td
                  key={vi}
                  style={{
                    padding: "14px 12px",
                    textAlign: "center",
                    color: colors.text,
                    borderBottom: `1px solid ${colors.text}1a`,
                    borderRight: vi < row.values.length - 1 ? `1px solid ${colors.text}1a` : "none",
                    fontSize: "15px",
                  }}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const isWireframeDiagram = (colors: ThemeColors) => colors.diagramStyle === "wireframe-3d";
const diagramFontFamily = (colors: ThemeColors) => (isWireframeDiagram(colors) ? "JetBrains Mono" : "Outfit");

// --- Flowchart (vertical process / decision flow) ---
const Flowchart = ({ data, colors }: { data: FlowchartData; colors: ThemeColors }) => {
  const nodes = (data?.nodes || []).slice(0, 5);
  if (nodes.length === 0) return null;
  const wf = isWireframeDiagram(colors);
  const cardBorderRadius = wf ? "0px" : (colors?.cardBorderRadius || "12px");
  const fontFamily = diagramFontFamily(colors);

  const renderNode = (node: { label: string; shape: string }, idx: number) => {
    const isStart = node.shape === "start";
    const isEnd = node.shape === "end";
    const isDecision = node.shape === "decision";
    const label = node.label || `Step ${idx + 1}`;

    if (isDecision) {
      const displayLabel = label.length > 16 ? label.slice(0, 15) + "…" : label;
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "180px", height: "90px", position: "relative" }}>
          <svg width="180" height="90" viewBox="0 0 180 90" style={{ position: "absolute", top: 0, left: 0 }}>
            <polygon
              points="90,4 176,45 90,86 4,45"
              fill={wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.5)")}
              stroke={colors.accent}
              strokeWidth={wf ? "2" : "2.5"}
            />
          </svg>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "180px", height: "90px", padding: "0 28px", boxSizing: "border-box" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, fontFamily, color: colors.text, textAlign: "center", lineHeight: 1.3 }}>
              {displayLabel}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: isStart || isEnd ? "220px" : "260px",
          minHeight: isStart || isEnd ? "48px" : "56px",
          padding: "12px 20px",
          borderRadius: wf ? "0px" : (isStart || isEnd ? "999px" : cardBorderRadius),
          backgroundColor: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.45)"),
          border: `${wf ? "2" : "2"}px solid ${colors.accent}`,
          boxShadow: wf ? "none" : (colors.cardShadow || `0 4px 16px ${colors.glassBorder ? colors.glassBorder.replace(/[\d.]+\)$/g, "0.12)") : "rgba(0,0,0,0.06)"}`),
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 700, fontFamily, color: colors.text, textAlign: "center", lineHeight: 1.3 }}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "10px 0" }}>
      {nodes.map((node, idx) => (
        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {renderNode(node, idx)}
          {idx < nodes.length - 1 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0" }}>
              <div style={{ width: "2px", height: "18px", backgroundColor: colors.accent, opacity: 0.6 }} />
              <svg width="16" height="12" viewBox="0 0 16 12">
                <path d="M2 2 L8 10 L14 2" stroke={colors.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Timeline (horizontal milestone track) ---
const Timeline = ({ data, colors }: { data: TimelineData; colors: ThemeColors }) => {
  const events = (data?.events || []).slice(0, 5);
  if (events.length === 0) return null;
  const wf = isWireframeDiagram(colors);
  const cardBorderRadius = wf ? "0px" : (colors?.cardBorderRadius || "14px");
  const fontFamily = diagramFontFamily(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "16px 0" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", width: "100%", position: "relative" }}>
        {/* Horizontal connector line */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "8%",
            right: "8%",
            height: "3px",
            backgroundColor: colors.accent,
            opacity: 0.35,
          }}
        />
        {events.map((event, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              position: "relative",
              padding: "0 6px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: wf ? "0px" : "50%",
                backgroundColor: wf ? "#ffffff" : colors.accent,
                border: wf ? `2px solid ${colors.accent}` : `3px solid ${colors.background || "#ffffff"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 800, fontFamily, color: wf ? colors.accent : "#ffffff" }}>{idx + 1}</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, fontFamily, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", textAlign: "center" }}>
              {event.date}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.45)"),
                border: `${wf ? "2" : "1.5"}px solid ${colors.accent}`,
                borderRadius: cardBorderRadius,
                padding: "10px 8px",
                minHeight: "72px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700, fontFamily, color: colors.text, textAlign: "center", lineHeight: 1.3, marginBottom: event.description ? "4px" : "0" }}>
                {event.title}
              </span>
              {event.description && (
                <span style={{ fontSize: "10px", color: colors.muted, textAlign: "center", lineHeight: 1.35 }}>
                  {event.description.length > 36 ? event.description.slice(0, 34) + "…" : event.description}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Before / After split comparison ---
const BeforeAfter = ({ data, colors }: { data: BeforeAfterData; colors: ThemeColors }) => {
  const beforeItems = (data?.beforeItems || []).slice(0, 4);
  const afterItems = (data?.afterItems || []).slice(0, 4);
  if (beforeItems.length === 0 && afterItems.length === 0) return null;

  const beforeTitle = data?.beforeTitle || "Before";
  const afterTitle = data?.afterTitle || "After";
  const wf = isWireframeDiagram(colors);
  const cardBorderRadius = wf ? "0px" : (colors?.cardBorderRadius || "16px");
  const fontFamily = diagramFontFamily(colors);
  const isDark = colors.text === "#ffffff" || colors.text === "#e5e5e5";
  const beforeBg = wf ? "#ffffff" : (isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)");
  const afterBg = wf ? colors.accent : (isDark ? "rgba(34, 197, 94, 0.12)" : "rgba(34, 197, 94, 0.08)");
  const beforeAccent = wf ? colors.text : "#ef4444";
  const afterAccent = wf ? colors.accent : "#22c55e";

  const renderColumn = (title: string, items: string[], bg: string, accentColor: string, marker: string, inverted?: boolean) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        backgroundColor: bg,
        border: `2px solid ${accentColor}`,
        borderRadius: cardBorderRadius,
        padding: "20px 16px",
        boxSizing: "border-box",
        minHeight: "200px",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 800, fontFamily, color: inverted ? "#ffffff" : accentColor, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", textAlign: "center" }}>
        {title}
      </span>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", marginBottom: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 800, fontFamily, color: inverted ? "#ffffff" : accentColor, marginRight: "8px", flexShrink: 0 }}>{marker}</span>
          <span style={{ fontSize: "12px", fontFamily, color: inverted ? "#ffffff" : colors.text, lineHeight: 1.4, fontWeight: 500 }}>{item}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch", width: "100%", gap: "16px", padding: "10px 0" }}>
      {renderColumn(beforeTitle, beforeItems, beforeBg, beforeAccent, wf ? "−" : "✕")}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="32" height="32" viewBox="0 0 32 32">
          <path d="M8 16 H20 M16 12 L22 16 L16 20" stroke={colors.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {renderColumn(afterTitle, afterItems, afterBg, afterAccent, wf ? "+" : "✓", wf)}
    </div>
  );
};

// --- Image Grid (visual tile collage with labeled panels) ---
const ImageGrid = ({ data, colors }: { data: ImageGridData; colors: ThemeColors }) => {
  const items = (data?.items || []).slice(0, 4);
  if (items.length === 0) return null;
  const wf = isWireframeDiagram(colors);
  const cardBorderRadius = wf ? "0px" : (colors?.cardBorderRadius || "16px");
  const fontFamily = diagramFontFamily(colors);
  const tileGradients = wf
    ? ["#ffffff", "#ffffff", "#ffffff", "#ffffff"]
    : [
        `linear-gradient(135deg, ${colors.accent}33 0%, ${colors.accent}11 100%)`,
        `linear-gradient(135deg, ${colors.accent}22 0%, ${colors.glassBg || "rgba(255,255,255,0.2)"} 100%)`,
        `linear-gradient(225deg, ${colors.accent}28 0%, ${colors.accent}08 100%)`,
        `linear-gradient(45deg, ${colors.accent}18 0%, ${colors.glassBg || "rgba(255,255,255,0.15)"} 100%)`,
      ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", width: "100%", padding: "8px 0" }}>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            flexDirection: "column",
            width: "48%",
            marginBottom: "12px",
            borderRadius: cardBorderRadius,
            overflow: "hidden",
            border: `${wf ? "2" : "1.5"}px solid ${wf ? colors.accent : (colors.glassBorder || "rgba(0,0,0,0.08)")}`,
            boxShadow: wf ? "none" : (colors.cardShadow || `0 6px 20px ${colors.glassBorder ? colors.glassBorder.replace(/[\d.]+\)$/g, "0.12)") : "rgba(0,0,0,0.05)"}`),
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100px",
              background: tileGradients[idx % tileGradients.length],
              borderBottom: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.06)"}`,
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: wf ? "0px" : "12px",
                backgroundColor: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.6)"),
                border: `2px solid ${colors.accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily, color: colors.accent }}>
                {(item.label || "?").charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "12px 14px", backgroundColor: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.4)") }}>
            <span style={{ fontSize: "13px", fontWeight: 700, fontFamily, color: colors.text, marginBottom: item.description ? "4px" : "0" }}>
              {item.label}
            </span>
            {item.description && (
              <span style={{ fontSize: "11px", color: colors.muted, lineHeight: 1.35 }}>
                {item.description.length > 48 ? item.description.slice(0, 46) + "…" : item.description}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Architecture (layered system diagram) ---
const Architecture = ({ data, colors }: { data: ArchitectureData; colors: ThemeColors }) => {
  const layers = (data?.layers || []).slice(0, 4);
  if (layers.length === 0) return null;
  const wf = isWireframeDiagram(colors);
  const cardBorderRadius = wf ? "0px" : (colors?.cardBorderRadius || "12px");
  const fontFamily = diagramFontFamily(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "8px 0" }}>
      {layers.map((layer, idx) => (
        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: "720px",
              border: `2px solid ${colors.accent}`,
              borderRadius: cardBorderRadius,
              backgroundColor: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.45)"),
              padding: "14px 18px",
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 800, fontFamily, color: colors.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
              {layer.label}
            </span>
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "10px" }}>
              {(layer.items || []).slice(0, 4).map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 14px",
                    border: `1.5px solid ${colors.accent}`,
                    borderRadius: wf ? "0px" : "8px",
                    backgroundColor: wf && i === 0 ? colors.accent : "#ffffff",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, fontFamily, color: wf && i === 0 ? "#ffffff" : colors.text }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {idx < layers.length - 1 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0" }}>
              <div style={{ width: "2px", height: "16px", backgroundColor: colors.accent, opacity: 0.7 }} />
              <svg width="16" height="12" viewBox="0 0 16 12">
                <path d="M2 2 L8 10 L14 2" stroke={colors.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Sequence (interaction / API flow diagram) ---
const Sequence = ({ data, colors }: { data: SequenceData; colors: ThemeColors }) => {
  const participants = (data?.participants || []).slice(0, 4);
  const steps = (data?.steps || []).slice(0, 6);
  if (participants.length === 0) return null;
  const wf = isWireframeDiagram(colors);
  const cardBorderRadius = wf ? "0px" : "10px";
  const fontFamily = diagramFontFamily(colors);
  const stepGap = 38;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "8px 0" }}>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: "16px" }}>
        {participants.map((p, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 12px",
                border: `2px solid ${colors.accent}`,
                borderRadius: cardBorderRadius,
                backgroundColor: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.5)"),
                minWidth: "80px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, fontFamily, color: colors.text, textAlign: "center" }}>
                {p.length > 12 ? p.slice(0, 11) + "…" : p}
              </span>
            </div>
            <div style={{ width: "2px", height: `${steps.length * stepGap + 20}px`, backgroundColor: colors.accent, opacity: 0.25, marginTop: "8px" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: "-10px" }}>
        {steps.map((step, i) => {
          const fromPct = ((step.from + 0.5) / participants.length) * 100;
          const toPct = ((step.to + 0.5) / participants.length) * 100;
          const leftPct = Math.min(fromPct, toPct);
          const widthPct = Math.abs(toPct - fromPct);
          const goingRight = toPct > fromPct;
          const displayLabel = step.label.length > 24 ? step.label.slice(0, 23) + "…" : step.label;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", width: "100%", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, fontFamily, color: colors.muted, textAlign: "center" }}>
                  {displayLabel}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "row", width: "100%", alignItems: "center", height: "12px" }}>
                <div style={{ width: `${leftPct}%`, height: "2px", flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: `${widthPct}%`, flexShrink: 0 }}>
                  <div style={{ flex: 1, height: "2px", backgroundColor: colors.accent }} />
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                    <polygon points={goingRight ? "2,1 8,5 2,9" : "8,1 2,5 8,9"} fill={colors.accent} />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Mini Chart (bar chart for metrics) ---
const MiniChart = ({ data, colors }: { data: MiniChartData; colors: ThemeColors }) => {
  const bars = (data?.bars || []).slice(0, 6);
  if (bars.length === 0) return null;
  const wf = isWireframeDiagram(colors);
  const fontFamily = diagramFontFamily(colors);
  const maxValue = Math.max(...bars.map(b => b.value), 1);
  const chartHeight = 180;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "8px 0", alignItems: "center" }}>
      {data.title && (
        <span style={{ fontSize: "13px", fontWeight: 800, fontFamily, color: colors.text, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
          {data.title}
        </span>
      )}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: "20px", height: `${chartHeight + 40}px`, width: "100%", maxWidth: "640px", borderBottom: wf ? `2px solid ${colors.accent}` : `2px solid ${colors.glassBorder || "rgba(0,0,0,0.1)"}`, paddingBottom: "4px" }}>
        {bars.map((bar, i) => {
          const barH = Math.max(12, (bar.value / maxValue) * chartHeight);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "90px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, fontFamily, color: colors.accent, marginBottom: "6px" }}>
                {bar.displayValue || `${bar.value}`}
              </span>
              <div
                style={{
                  width: "100%",
                  height: `${barH}px`,
                  backgroundColor: wf ? (i === bars.length - 1 ? colors.accent : "#ffffff") : colors.accent,
                  border: wf ? `2px solid ${colors.accent}` : "none",
                  opacity: wf ? 1 : 0.7 + (i / bars.length) * 0.3,
                  borderRadius: wf ? "0px" : "6px 6px 0 0",
                }}
              />
              <span style={{ fontSize: "11px", fontWeight: 600, fontFamily, color: colors.muted, marginTop: "8px", textAlign: "center" }}>
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderDiagram = (
  visualType: string,
  visualData: Record<string, unknown> | undefined,
  colors: ThemeColors
) => {
  if (visualType === "step-chain") return <StepChain data={visualData as unknown as StepChainData} colors={colors} />;
  if (visualType === "venn") return <Venn data={visualData as unknown as VennData} colors={colors} />;
  if (visualType === "wheel") return <Wheel data={visualData as unknown as WheelData} colors={colors} />;
  if (visualType === "concentric") return <Concentric data={visualData as unknown as ConcentricData} colors={colors} />;
  if (visualType === "icon-grid") return <IconGrid data={visualData as unknown as IconGridData} colors={colors} />;
  if (visualType === "quote") return <QuoteBlock data={visualData as unknown as QuoteData} colors={colors} />;
  if (visualType === "stat") return <StatDisplay data={visualData as unknown as StatData} colors={colors} />;
  if (visualType === "table") return <TableBlock data={visualData as unknown as TableData} colors={colors} />;
  if (visualType === "flowchart") return <Flowchart data={visualData as unknown as FlowchartData} colors={colors} />;
  if (visualType === "timeline") return <Timeline data={visualData as unknown as TimelineData} colors={colors} />;
  if (visualType === "before-after") return <BeforeAfter data={visualData as unknown as BeforeAfterData} colors={colors} />;
  if (visualType === "image-grid") return <ImageGrid data={visualData as unknown as ImageGridData} colors={colors} />;
  if (visualType === "architecture") return <Architecture data={visualData as unknown as ArchitectureData} colors={colors} />;
  if (visualType === "sequence") return <Sequence data={visualData as unknown as SequenceData} colors={colors} />;
  if (visualType === "mini-chart") return <MiniChart data={visualData as unknown as MiniChartData} colors={colors} />;
  return null;
};

const renderCodeBlock = (visualData: Record<string, unknown> | undefined, theme: "dark" | "light", variant: "default" | "macos" = "default") => {
  const data = visualData as unknown as CodeBlockData | undefined;
  if (!data?.code || !data?.tokens) return null;
  return <CodeBlock language={data.language || "plaintext"} code={data.code} highlightLines={data.highlightLines || []} tokens={data.tokens} theme={theme} variant={variant} />;
};

// Parses asterisk emphasis wrapped in *text* to render formatted Playfair Display Italic inline
const darkCodeStyle: React.CSSProperties = {
  fontFamily: "JetBrains Mono",
  fontSize: "22px",
  backgroundColor: "#2d2d2d",
  color: "#d4d4d4",
  padding: "2px 8px",
  borderRadius: "4px",
  margin: "0 2px",
  letterSpacing: "0px",
  lineHeight: 1.4,
};
const lightCodeStyle: React.CSSProperties = {
  fontFamily: "JetBrains Mono",
  fontSize: "22px",
  backgroundColor: "#e2e8f0",
  color: "#1e293b",
  padding: "2px 8px",
  borderRadius: "4px",
  margin: "0 2px",
  letterSpacing: "0px",
  lineHeight: 1.4,
};

const renderFormattedText = (
  text: string,
  serifStyle: React.CSSProperties = {},
  regularStyle: React.CSSProperties = {},
  justifyContent: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" = "flex-start",
  codeStyle?: React.CSSProperties,
  scribbleConfig?: { scribble?: boolean; color?: string; fontSize?: number }
) => {
  if (!text) return "";
  const sanitized = sanitizeTextForSatori(text);

  // Detect if base text is dark, indicating a light-themed background context
  const textColorStr = String(regularStyle.color || serifStyle.color || "").toLowerCase();
  const isContextLight = ["#141414", "#161616", "#1c1917", "#0f172a", "#1a1a2e", "#2c3e50", "#1c1c1c", "#2d2d2d", "#000000", "#333333"].some(c => textColorStr.includes(c));

  const resolvedCodeStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono",
    fontSize: "22px",
    backgroundColor: isContextLight ? "#e2e8f0" : "#1e1e1e",
    color: isContextLight ? "#1f2937" : "#d4d4d4",
    padding: "2px 8px",
    borderRadius: "4px",
    margin: "0 2px",
    letterSpacing: "0px",
    lineHeight: 1.4,
    ...codeStyle,
  };

  const renderScribble = scribbleConfig?.scribble !== undefined ? scribbleConfig.scribble : currentScribbleState?.scribble;
  const scribbleColor = scribbleConfig?.color || currentScribbleState?.color || serifStyle.color || "#ec4899";

  const renderSegments = (segment: string, baseKey: string) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return <span key={baseKey} style={resolvedCodeStyle}>{segment.slice(1, -1)}</span>;
    }
    const asteriskParts = segment.split(/\*(.*?)\*/g);
    return asteriskParts.map((part, i) => {
      if (!part) return null;
      if (i % 2 === 1) {
        const seedValue = part.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const scribbleType = seedValue % 2; // 0: Underline, 1: Loop circle

        return (
          <span key={`${baseKey}-a${i}`} style={{
            position: "relative",
            fontFamily: "Playfair Display",
            fontStyle: "italic",
            fontWeight: 400,
            paddingLeft: "4px",
            paddingRight: "6px",
            ...serifStyle,
          }}>
            {part}
            {renderScribble && (
              <span
                style={{
                  position: "absolute",
                  left: "-4px",
                  right: "-4px",
                  top: "-2px",
                  bottom: "-4px",
                  display: "flex",
                  pointerEvents: "none",
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
                  {scribbleType === 0 ? (
                    <path d="M 2,82 C 30,88 70,88 98,82" stroke={scribbleColor} strokeWidth="5.5" strokeLinecap="round" opacity="0.9" />
                  ) : (
                    <path d="M 12,50 C 10,18 88,10 88,48 C 88,86 15,84 20,54" stroke={scribbleColor} strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
                  )}
                </svg>
              </span>
            )}
          </span>
        );
      }
      return <span key={`${baseKey}-a${i}`} style={regularStyle}>{part}</span>;
    });
  };

  const backtickParts = sanitized.split(/(`[^`]+`)/g);

  return (
    <span style={{ display: "flex", flexWrap: "wrap", justifyContent, alignItems: "center" }}>
      {backtickParts.map((part, idx) => renderSegments(part, `bt${idx}`))}
    </span>
  );
};

const ScribbleOverlay = ({ order, totalSlides, theme }: { order: number; totalSlides: number; theme: string }) => {
  const rng = getSeededRandom(`scribble-${order}`);
  const color = theme === "cyber-horizon" ? "#ea580c" : theme === "linen-rust" ? "#c5563c" : theme === "warm-editorial" ? "#e05a47" : theme === "soft-gradient" ? "#7c3aed" : theme === "mesh-glow" ? "#ec4899" : theme === "neo-brutalism" ? "#161616" : theme === "neomorphism" ? "#6D8CAE" : theme === "frosted-grid" ? "#FDE68A" : theme === "glassmorphism" ? "#38bdf8" : theme === "liquid-glass" ? "#0ea5e9" : "#ffffff";

  const elements: React.ReactElement[] = [];

  const scribbleCount = Math.floor(rng() * 3) + 2; // 2 to 4 scribbles

  for (let i = 0; i < scribbleCount; i++) {
    const scribbleType = Math.floor(rng() * 5);
    // Keep coordinates within safe container margins (80px - 900px horizontally, 180px - 1050px vertically)
    const x = Math.floor(80 + rng() * 820);
    const y = Math.floor(180 + rng() * 870);

    if (scribbleType === 0) {
      const endX = Math.floor(x + 60 + rng() * 100);
      elements.push(
        <svg key={`su-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width={endX - x + 20} height="24" viewBox={`0 0 ${endX - x + 20} 24`} fill="none">
          <path d={`M0,12 Q${(endX - x) / 4},${18 + (rng() > 0.5 ? 6 : -6)} ${(endX - x) / 2},12 T${endX - x},12`} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
        </svg>
      );
    } else if (scribbleType === 1) {
      elements.push(
        <svg key={`star-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d={`M12,2 L14,9 L21,9 L15,14 L17,21 L12,17 L7,21 L9,14 L3,9 L10,9 Z`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
        </svg>
      );
    } else if (scribbleType === 2) {
      const w = Math.floor(60 + rng() * 120);
      const h = Math.floor(40 + rng() * 80);
      elements.push(
        <svg key={`bracket-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width={w + 10} height={h + 10} viewBox={`0 0 ${w + 10} ${h + 10}`} fill="none">
          <path d={`M6,0 Q0,0 0,${h / 2} Q0,${h} 6,${h}`} stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d={`M${w + 4},0 Q${w + 10},0 ${w + 10},${h / 2} Q${w + 10},${h} ${w + 4},${h}`} stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        </svg>
      );
    } else if (scribbleType === 3) {
      const endX = Math.floor(x + 60 + rng() * 80);
      const endY = Math.floor(y + 30 + rng() * 40);
      elements.push(
        <svg key={`arrow-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width={endX - x + 30} height={endY - y + 20} viewBox={`0 0 ${endX - x + 30} ${endY - y + 20}`} fill="none">
          <path d={`M0,0 C${(endX - x) / 3},${(endY - y) / 3} ${(endX - x) * 2 / 3},${(endY - y) * 2 / 3} ${endX - x},${endY - y}`} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
          <path d={`M${endX - x - 8},${endY - y - 6} L${endX - x},${endY - y} L${endX - x - 6},${endY - y - 10}`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
        </svg>
      );
    } else {
      elements.push(
        <svg key={`dots-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width="40" height="12" viewBox="0 0 40 12" fill="none">
          <path d={`M4,6 Q10,${6 + (rng() > 0.5 ? 4 : -4)} 16,6 Q22,${6 + (rng() > 0.5 ? 4 : -4)} 28,6 Q34,${6 + (rng() > 0.5 ? 4 : -4)} 40,6`} stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" />
        </svg>
      );
    }
  }

  return <div style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", pointerEvents: "none", display: "contents" }}>{elements}</div>;
};

// Overlay custom graphic shapes / diagrams
const renderSlideShapes = (shapes?: Shape[]) => {
  if (!shapes || shapes.length === 0) return null;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", pointerEvents: "none"}}>
      {shapes.map((shape) => {
        const isText = shape.type === "text";
        return (
          <div
            key={shape.id}
            style={{
              position: "absolute",
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: isText ? "auto" : `${shape.width}px`,
              height: isText ? "auto" : `${shape.height}px`,
              backgroundColor: isText ? "transparent" : shape.color,
              borderRadius: shape.type === "circle" ? "50%" : "0px",
              color: isText ? shape.color : "transparent",
              fontSize: isText ? `${shape.fontSize || 24}px` : "0px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isText ? shape.text : ""}
          </div>
        );
      })}
    </div>
  );
};


// 2.9 — Progress bar: 2px bar at the top edge of every slide, filled proportionally
const ProgressBar = ({ order, totalSlides, accentColor }: { order: number; totalSlides: number; accentColor: string }) => {
  const pct = totalSlides > 1 ? Math.round(((order + 1) / totalSlides) * 100) : 100;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", display: "flex"}}>
      <div style={{ width: `${pct}%`, height: "3px", backgroundColor: accentColor, opacity: 0.85 }} />
    </div>
  );
};

// 2.8 — Text-only bullet hierarchy: first bullet rendered larger/bolder in accent, rest in muted
const BulletDot = ({ color, size }: { color: string; size?: number }) => {
  const s = size || 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill={color} />
    </svg>
  );
};

const BulletArrow = ({ color, size }: { color: string; size?: number }) => {
  const s = size || 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <polygon points="8,4 20,12 8,20" fill={color} />
    </svg>
  );
};

const BulletStar = ({ color, size }: { color: string; size?: number }) => {
  const s = size || 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill={color} />
    </svg>
  );
};

const renderBulletIcon = (char: string, color: string, size?: number) => {
  if (char === "▸") return <BulletArrow color={color} size={size} />;
  if (char === "✦") return <BulletStar color={color} size={size} />;
  return <BulletDot color={color} size={size} />;
};

const renderBulletList = (
  body: string,
  accentColor: string,
  textColor: string,
  mutedColor: string,
  bulletChar: string = "•",
  isDark: boolean = false,
  serifStyle?: React.CSSProperties,
  codeStyle?: React.CSSProperties,
  bulletColors?: string[]
) => {
  if (!body) return null;
  const lines = body.split("\n").filter(Boolean).map(l => l.replace(/^[•\-\*\s]+/, "").trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const isLead = idx === 0;
    const colorIdx = bulletColors ? idx % bulletColors.length : 0;
    const bulletColor = bulletColors ? bulletColors[colorIdx] : (isLead ? accentColor : mutedColor);
    const lineTextColor = bulletColors ? textColor : (isLead ? textColor : mutedColor);
    const lineWeight = bulletColors ? 500 : (isLead ? 700 : 400);
    return (
      <div key={idx} style={{ display: "flex", alignItems: "flex-start", marginBottom: isLead ? "18px" : "12px" }}>
        <span style={{ marginRight: "12px", flexShrink: 0, color: bulletColor, fontSize: isLead ? "22px" : "18px", fontWeight: "bold", lineHeight: 1.4 }}>
          {renderBulletIcon(bulletChar, bulletColor, isLead ? 22 : 18)}
        </span>
        <p style={{ fontSize: isLead ? "26px" : "21px", color: lineTextColor, lineHeight: 1.5, margin: 0, fontWeight: lineWeight }}>
          {renderFormattedText(line, serifStyle || {}, { color: lineTextColor }, "flex-start", codeStyle)}
        </p>
      </div>
    );
  });
};

const ABSOLUTE_LAYOUT_THEMES = new Set(["wireframe-3d", "sketch"]);

function applyOverridesToTree(
  node: React.ReactNode,
  headingFont: string,
  bodyFont: string,
  density: "compact" | "comfortable" | "minimal",
  logoUrl: string | undefined,
  displayUsername: string,
  isRoot: boolean = true,
  themeName?: string,
): React.ReactNode {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(child => applyOverridesToTree(child, headingFont, bodyFont, density, logoUrl, displayUsername, false, themeName)) as React.ReactNode;
  }

  const obj = node as unknown as { type?: any; props?: Record<string, unknown> } & Record<string, unknown>;
  if (obj.props) {
    const nextProps = { ...obj.props };
    let nextStyle = nextProps.style ? { ...(nextProps.style as Record<string, unknown>) } : undefined;

    // 1. Font Overrides
    if (isRoot || obj.type === "h1" || obj.type === "h2" || obj.type === "h3") {
      if (!nextStyle) nextStyle = {};
    }

    if (nextStyle) {
      if (nextStyle.fontFamily) {
        const ff = String(nextStyle.fontFamily).toLowerCase();
        if (
          obj.type === "h1" ||
          obj.type === "h2" ||
          obj.type === "h3" ||
          ff.includes("playfair") ||
          ff.includes("editorial") ||
          ff.includes("cinzel") ||
          ff.includes("pacifico") ||
          ff.includes("lora") ||
          ff.includes("jakarta")
        ) {
          nextStyle.fontFamily = headingFont;
        } else if (ff.includes("caveat")) {
          nextStyle.fontFamily = headingFont === "Playfair Display" ? "Caveat" : headingFont;
        } else {
          nextStyle.fontFamily = bodyFont;
        }
      } else {
        if (obj.type === "h1" || obj.type === "h2" || obj.type === "h3") {
          nextStyle.fontFamily = headingFont;
        } else if (isRoot) {
          nextStyle.fontFamily = bodyFont;
        }
      }
    }

    // 2. Density Overrides
    if (isRoot && nextStyle && themeName && !ABSOLUTE_LAYOUT_THEMES.has(themeName)) {
      if (density === "compact") {
        nextStyle.padding = "50px 60px";
      } else if (density === "minimal") {
        nextStyle.padding = "100px 90px";
      } else {
        nextStyle.padding = "80px 80px";
      }
    }

    if (nextStyle && nextStyle.fontSize && typeof nextStyle.fontSize === "string" && nextStyle.fontSize.endsWith("px")) {
      const sizeNum = parseInt(nextStyle.fontSize);
      if (!isNaN(sizeNum)) {
        let sizeOffset = 0;
        if (density === "compact") sizeOffset = -6;
        else if (density === "minimal") sizeOffset = 4;
        
        if (sizeOffset !== 0) {
          nextStyle.fontSize = `${Math.max(12, sizeNum + sizeOffset)}px`;
        }
      }
    }

    if (nextStyle && typeof nextStyle.margin === "string" && nextStyle.margin.endsWith("px")) {
      const parts = nextStyle.margin.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        const n = parseInt(parts[0]);
        if (!isNaN(n)) {
          const adj = density === "compact" ? Math.max(10, Math.floor(n * 0.6)) : density === "minimal" ? Math.floor(n * 1.3) : n;
          nextStyle.margin = `${adj}px`;
        }
      } else if (parts.length === 2) {
        const nV = parseInt(parts[0]);
        const nH = parseInt(parts[1]);
        if (!isNaN(nV) && !isNaN(nH)) {
          const adjV = density === "compact" ? Math.max(10, Math.floor(nV * 0.6)) : density === "minimal" ? Math.floor(nV * 1.3) : nV;
          nextStyle.margin = `${adjV}px ${nH}px`;
        }
      } else if (parts.length >= 3) {
        const nT = parseInt(parts[0]), nH = parseInt(parts[1]), nB = parseInt(parts[2]);
        if (!isNaN(nT) && !isNaN(nH) && !isNaN(nB)) {
          const adjT = density === "compact" ? Math.max(10, Math.floor(nT * 0.6)) : density === "minimal" ? Math.floor(nT * 1.3) : nT;
          const adjB = density === "compact" ? Math.max(10, Math.floor(nB * 0.6)) : density === "minimal" ? Math.floor(nB * 1.3) : nB;
          nextStyle.margin = `${adjT}px ${nH}px ${adjB}px${parts[3] ? ` ${parts[3]}` : ""}`;
        }
      }
    }

    if (nextStyle && nextStyle.marginBottom && typeof nextStyle.marginBottom === "string" && nextStyle.marginBottom.endsWith("px")) {
      const sizeNum = parseInt(nextStyle.marginBottom);
      if (!isNaN(sizeNum)) {
        if (density === "compact") {
          nextStyle.marginBottom = `${Math.max(10, Math.floor(sizeNum * 0.6))}px`;
        } else if (density === "minimal") {
          nextStyle.marginBottom = `${Math.floor(sizeNum * 1.3)}px`;
        }
      }
    }
    if (nextStyle && nextStyle.marginTop && typeof nextStyle.marginTop === "string" && nextStyle.marginTop.endsWith("px")) {
      const sizeNum = parseInt(nextStyle.marginTop);
      if (!isNaN(sizeNum)) {
        if (density === "compact") {
          nextStyle.marginTop = `${Math.max(10, Math.floor(sizeNum * 0.6))}px`;
        } else if (density === "minimal") {
          nextStyle.marginTop = `${Math.floor(sizeNum * 1.3)}px`;
        }
      }
    }

    // 3. Logo Injection in footer
    if (nextProps.children) {
      let hasUsernameChild = false;
      const childrenArray = Array.isArray(nextProps.children) ? nextProps.children : [nextProps.children];
      
      for (const child of childrenArray) {
        if (child && typeof child === "object" && child.props && typeof child.props.children === "string") {
          const text = child.props.children.trim();
          if (text.startsWith("@") || (text.length > 0 && text === displayUsername)) {
            hasUsernameChild = true;
          }
        }
      }
      
      if (hasUsernameChild && logoUrl) {
        const logoElement = (
          <img
            key="brand-kit-logo"
            src={logoUrl}
            style={{
              height: density === "compact" ? "24px" : "32px",
              marginRight: "10px",
              objectFit: "contain",
            }}
          />
        );
        
        const newChildren = childrenArray.map((child: any) => {
          if (child && typeof child === "object" && child.props && typeof child.props.children === "string") {
            const text = child.props.children.trim();
            if (text.startsWith("@") || (text.length > 0 && text === displayUsername)) {
              return (
                <div key="username-row" style={{ display: "flex", alignItems: "center" }}>
                  {logoElement}
                  {child}
                </div>
              );
            }
          }
          if (child && typeof child === "object" && child.props) {
            return applyOverridesToTree(child, headingFont, bodyFont, density, logoUrl, displayUsername, false, themeName);
          }
          return child;
        });
        
        nextProps.children = newChildren;
      } else {
        nextProps.children = applyOverridesToTree(
          nextProps.children as React.ReactNode,
          headingFont,
          bodyFont,
          density,
          logoUrl,
          displayUsername,
          false,
          themeName
        );
      }
    }

    if (nextStyle) {
      nextProps.style = nextStyle;
    }

    return {
      ...obj,
      props: nextProps
    } as React.ReactNode;
  }

  return node;
}

export function renderThemeSlide(slide: RenderSlideInput): React.ReactElement {
  const { themeName, fontPairing, layoutDensity, logoUrl, username } = slide;
  
  const defaultFonts: Record<string, { heading: string; body: string }> = {
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

  const currentDefaults = defaultFonts[themeName] || { heading: "Outfit", body: "Outfit" };
  
  let headingFont = currentDefaults.heading;
  let bodyFont = currentDefaults.body;

  if (fontPairing) {
    const parts = fontPairing.split("+").map(p => p.trim());
    if (parts[0]) headingFont = parts[0];
    if (parts[1]) bodyFont = parts[1];
    else if (parts[0]) bodyFont = parts[0];
  }

  const resultElement = renderThemeSlideBase(slide);
  const displayUsername = username ? (username.startsWith("@") ? username : `@${username}`) : "";

  return applyOverridesToTree(
    resultElement,
    headingFont,
    bodyFont,
    layoutDensity || "comfortable",
    logoUrl || undefined,
    displayUsername,
    true,
    themeName
  ) as React.ReactElement;
}

export function renderThemeSlideBase(slide: RenderSlideInput): React.ReactElement {
  const sanitizedTitle = sanitizeTextForSatori(slide.title);
  const sanitizedBody = sanitizeTextForSatori(slide.body);
  const sanitizedUsername = sanitizeTextForSatori(slide.username || "");
  const sanitizedWebsiteUrl = sanitizeTextForSatori(slide.websiteUrl || "");
  const sanitizedVisualData = sanitizeObjectStrings(slide.visualData);
  const { type, themeName, order, totalSlides, imageUrl, imageLayout, shapes, visualType, scribble } = slide;
  
  const title = sanitizedTitle;
  const body = sanitizedBody;
  const username = sanitizedUsername;
  const websiteUrl = sanitizedWebsiteUrl;
  const visualData = sanitizedVisualData;

  const isLast = order === totalSlides - 1;
  const pageLabel = `${order + 1}/${totalSlides}`;
  const displayUsername = username ? (username.startsWith("@") ? username : `@${username}`) : "";

  // Common background image setup
  const hasBgImage = imageUrl && imageLayout === "background";
  const bgImageStyle: React.CSSProperties = hasBgImage ? {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  } : {};

  // Setup the thread-local scribble variables
  const scribbleColor = themeName === "cyber-horizon" ? "#ea580c" : themeName === "linen-rust" ? "#c5563c" : themeName === "warm-editorial" ? "#e05a47" : themeName === "soft-gradient" ? "#7c3aed" : themeName === "mesh-glow" ? "#ec4899" : themeName === "neo-brutalism" ? "#161616" : themeName === "neomorphism" ? "#6D8CAE" : themeName === "frosted-grid" ? "#FDE68A" : themeName === "glassmorphism" ? "#38bdf8" : themeName === "liquid-glass" ? "#0ea5e9" : themeName === "wireframe-3d" ? "#000000" : "#ffffff";
  currentScribbleState = scribble && type !== "COVER" && type !== "CLOSING" ? { scribble: true, color: scribbleColor } : null;

  try {
    // ==========================================
    // THEME 1: MONOCHROME (Dark, stark, brutalist)
    // ==========================================
    if (themeName === "monochrome") {
    const po = slide.paletteOverride;
    const monoBg = po?.background || "#050505";
    const monoText = po?.text || "#ffffff";
    const monoAccent = po?.primary || "#ffffff";
    const monoMuted = po?.text ? "#a3a3a3" : "#a3a3a3";
    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: monoBg,
          color: monoText,
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "90px 90px",
          boxSizing: "border-box",
          position: "relative",
          ...bgImageStyle,
        }}
      >
        {!hasBgImage && (() => {
          const rng = getSeededRandom(`mono-border-${order}`);
          const t = Math.floor(20 + rng() * 60);
          const l = Math.floor(20 + rng() * 60);
          const b = Math.floor(20 + rng() * 60);
          const rOff = Math.floor(20 + rng() * 60);
          return (
            <div
              style={{
                position: "absolute",
                top: `${t}px`,
                left: `${l}px`,
                right: `${rOff}px`,
                bottom: `${b}px`,
                border: "1px solid #1c1c1c",
                pointerEvents: "none",
              }}
            />
          );
        })()}

        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        {/* 2.9 Progress bar */}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor="#ffffff" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "4px", color: "#6e6e6e", textTransform: "uppercase" }}>
            {type === "COVER" ? "Introduction" : type === "CLOSING" ? "Action Item" : "Insight"}
          </span>
          <span style={{ fontSize: "14px", color: "#6e6e6e", fontWeight: 700, letterSpacing: "1px" }}>{pageLabel}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "40px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "74px", fontWeight: 700, lineHeight: 1.15, marginBottom: "40px", letterSpacing: "-1.5px" }}>
                {renderFormattedText(title, { color: "#e5e5e5" }, {}, "center")}
              </h1>
              <p style={{ fontSize: "28px", color: "#a3a3a3", lineHeight: 1.5, maxWidth: "800px" }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
            </div>
          ) : type === "CLOSING" ? (
            // Monochrome: full-width inverted block — sharp, high-contrast signature
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
              <div style={{ width: "80px", height: "3px", backgroundColor: "#ffffff", marginBottom: "40px" }} />
              <span style={{ fontSize: "13px", color: "#5a5a5a", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "6px", fontWeight: 700 }}>Conclusion</span>
              <h1 style={{ fontSize: "60px", fontWeight: 900, lineHeight: 1.15, marginBottom: "50px", letterSpacing: "-1.5px", color: "#ffffff" }}>
                {renderFormattedText(title, {}, {}, "center")}
              </h1>
              {/* Inverted pill CTA — white bg, black text — signature monochrome closer */}
              <div style={{ padding: "20px 50px", backgroundColor: "#ffffff", borderRadius: "4px", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "22px", fontWeight: 900, color: "#000000", letterSpacing: "1px" }}>{body || "Let's discuss"}</span>
              </div>
              <div style={{ width: "80px", height: "3px", backgroundColor: "#ffffff", marginTop: "40px" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <h2 style={{ fontSize: "56px", fontWeight: 700, lineHeight: 1.2, marginBottom: "35px", color: "#ffffff", letterSpacing: "-1px" }}>
                {renderFormattedText(title)}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    const codeBlock = renderCodeBlock(visualData, "dark");
                    if (codeBlock) return codeBlock;
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text: monoText, accent: monoAccent, muted: monoMuted, glassBg: "rgba(255, 255, 255, 0.05)", glassBorder: "rgba(255, 255, 255, 0.1)" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: "20px" }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column", padding: "0 10px" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ marginRight: "10px", flexShrink: 0, color: "#ffffff", fontSize: "18px", fontWeight: "bold" }}>•</span>
                                    <p style={{ fontSize: "20px", color: "#a3a3a3", lineHeight: 1.45, margin: 0 }}>
                                      {renderFormattedText(cleanBullet, {}, {}, "flex-start", darkCodeStyle)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, "#ffffff", "#ffffff", "#a3a3a3", "•", true, {}, darkCodeStyle)}</div>;
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <img
                    src={imageUrl}
                    style={{ marginTop: "40px", borderRadius: "12px", maxHeight: "350px", objectFit: "cover", border: "1px solid #222" }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", letterSpacing: "1px" }}>
            {displayUsername}
          </span>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: "#6e6e6e", fontSize: "16px", fontWeight: 700 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
              <SwipeArrow color="#6e6e6e" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
    // THEME 2: SOFT GRADIENT (Aesthetic agency glassmorphism with seamless flow)
    // ==========================================
    if (themeName === "soft-gradient") {
    const po = slide.paletteOverride;
    const sgText = po?.text || "#1e293b";
    const sgAccent = po?.primary || "#7c3aed";
    const sgMuted = po?.text || "#475569";
    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          color: "#1e293b",
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px",
          boxSizing: "border-box",
          position: "relative",
          ...bgImageStyle,
        }}
      >
        {/* Seamless Panoramic Background */}
        {!hasBgImage && <PanoramicBackground theme="soft-gradient" order={order} totalSlides={totalSlides} />}

        {/* Custom Diagram Shapes Overlay */}
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        {/* 2.9 Progress bar */}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor="#7c3aed" />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "rgba(255, 255, 255, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            borderRadius: "32px",
            padding: "70px",
            width: "920px",
            height: "1190px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ padding: "6px 16px", backgroundColor: "rgba(255, 255, 255, 0.5)", borderRadius: "9999px", display: "flex", border: "1px solid rgba(255, 255, 255, 0.6)" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#475569" }}>
                {type === "COVER" ? "Cover Story" : type === "CLOSING" ? "CTA" : "Takeaway"}
              </span>
            </div>
            <span style={{ fontSize: "14px", color: "#475569", fontWeight: 800 }}>{pageLabel}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "35px 0" }}>
            {type === "COVER" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <h1 style={{ fontSize: "66px", fontWeight: 800, lineHeight: 1.15, color: "#0f172a", marginBottom: "35px", letterSpacing: "-1.5px" }}>
                  {renderFormattedText(title, { color: "#7c3aed" }, {}, "center")}
                </h1>
                <p style={{ fontSize: "26px", color: "#475569", lineHeight: 1.5, maxWidth: "780px" }}>
                  {renderFormattedText(body, {}, {}, "center", lightCodeStyle)}
                </p>
              </div>
            ) : type === "CLOSING" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <h1 style={{ fontSize: "60px", fontWeight: 800, lineHeight: 1.2, color: "#0f172a", marginBottom: "35px", letterSpacing: "-1px" }}>
                  {renderFormattedText(title, { color: "#7c3aed" }, {}, "center")}
                </h1>
                <p style={{ fontSize: "26px", color: "#475569", lineHeight: 1.5, marginBottom: "40px", maxWidth: "700px" }}>
                  {renderFormattedText(body, {}, {}, "center", lightCodeStyle)}
                </p>
                <div style={{ display: "flex", alignItems: "center", padding: "16px 36px", backgroundColor: "#0f172a", borderRadius: "9999px", color: "#ffffff", fontWeight: 800, fontSize: "18px", letterSpacing: "0.5px" }}>
                  {displayUsername || "Join The Conversation"}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <h2 style={{ fontSize: "50px", fontWeight: 800, lineHeight: 1.25, color: "#0f172a", marginBottom: "25px", letterSpacing: "-1px" }}>
                  {renderFormattedText(title, { color: "#7c3aed" })}
                </h2>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(() => {
                    if (visualType === "code-block") {
                      const codeBlock = renderCodeBlock(visualData, "light");
                      if (codeBlock) return codeBlock;
                    }
                    if (visualType && visualType !== "text-only") {
                      const diagram = renderDiagram(visualType, visualData, { text: sgText, accent: sgAccent, muted: sgMuted, glassBg: "rgba(124, 58, 237, 0.04)", glassBorder: "rgba(124, 58, 237, 0.08)" });
                      if (diagram) {
                        return (
                          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                            <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: "20px" }}>{diagram}</div>
                            {body && (
                              <div style={{ display: "flex", flexDirection: "column", padding: "0 10px" }}>
                                {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                  const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                  if (!cleanBullet) return null;
                                  return (
                                    <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                      <span style={{ marginRight: "10px", flexShrink: 0, color: "#7c3aed", fontSize: "18px", fontWeight: "bold" }}>•</span>
                                      <p style={{ fontSize: "20px", color: "#475569", lineHeight: 1.45, margin: 0 }}>
                                        {renderFormattedText(cleanBullet, {}, {}, "flex-start", lightCodeStyle)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }
                    return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, "#7c3aed", "#0f172a", "#475569", "•", false, {}, lightCodeStyle)}</div>;
                  })()}
                  {imageUrl && imageLayout === "inline" && (
                    <img
                      src={imageUrl}
                      style={{ marginTop: "40px", borderRadius: "12px", maxHeight: "350px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                    />
                  )}
                </div>
              </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#475569", letterSpacing: "1px" }}>
            {displayUsername}
          </span>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: "#0f172a", fontSize: "14px", fontWeight: 800 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
              <SwipeArrow color="#0f172a" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

  // ==========================================
    // THEME 4: WARM EDITORIAL (cream-sand, terracotta accents, seamless connecting line)
    // ==========================================
    if (themeName === "warm-editorial") {
    const po = slide.paletteOverride;
    const weText = po?.text || "#1e1b18";
    const weAccent = po?.primary || "#e05a47";
    const weMuted = po?.text ? "#6b6259" : "#6b6259";
    const weBg = po?.background || "#f5f2eb";
    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          color: "#1e1b18",
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "90px 90px",
          boxSizing: "border-box",
          position: "relative",
          ...bgImageStyle,
        }}
      >
        {/* Seamless Panoramic Background with ribbon wave */}
        {!hasBgImage && <PanoramicBackground theme="warm-editorial" order={order} totalSlides={totalSlides} />}

        {/* Custom Diagram Shapes Overlay */}
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        {/* 2.9 Progress bar */}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor="#ff5d2b" />

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#e05a47", letterSpacing: "2px", textTransform: "uppercase" }}>
              {displayUsername ? displayUsername.replace("@", "") : "CARO"}
            </span>
          </div>
          <span style={{ fontSize: "13px", color: "#e05a47", fontWeight: 800, letterSpacing: "1px" }}>{pageLabel}</span>
        </div>

        {/* Content Box */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "30px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#e05a47", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "20px" }}>
                Step-by-Step Guide
              </span>
              <h1 style={{ fontSize: "74px", fontWeight: 700, fontFamily: "Playfair Display", lineHeight: 1.15, marginBottom: "40px", color: "#1e1b18" }}>
                {renderFormattedText(title, { color: "#e05a47" })}
              </h1>
              <p style={{ fontSize: "28px", color: "#6b6259", lineHeight: 1.5, maxWidth: "780px" }}>
                {renderFormattedText(body, {}, {}, "flex-start", lightCodeStyle)}
              </p>
            </div>
          ) : type === "CLOSING" ? (
            // Mesh Glow: glowing neon pill CTA — dark bg, neon border glow
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
              <span style={{ fontSize: "13px", color: "rgba(255,93,43,0.6)", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>Wrap Up</span>
              <h1 style={{ fontSize: "58px", fontWeight: 800, lineHeight: 1.2, marginBottom: "40px", letterSpacing: "-1px", color: "#ffffff" }}>
                {renderFormattedText(title, { color: "#ff5d2b" }, {}, "center")}
              </h1>
              {/* Neon pill with outer glow effect */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: "-8px", borderRadius: "9999px", background: "rgba(255, 93, 43, 0.25)", filter: "blur(12px)" }} />
                <div style={{ padding: "18px 48px", border: "2px solid #ff5d2b", borderRadius: "9999px", backgroundColor: "rgba(255,93,43,0.08)", display: "flex", alignItems: "center", position: "relative"}}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#ff5d2b", letterSpacing: "0.5px" }}>{body || "Follow for more"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <span style={{ fontSize: "40px", fontWeight: 800, color: "#e05a47", marginBottom: "15px" }}>
                {order}
              </span>
              <h2 style={{ fontSize: "52px", fontWeight: 700, fontFamily: "Playfair Display", lineHeight: 1.25, marginBottom: "30px", color: "#1e1b18" }}>
                {renderFormattedText(title, { color: "#e05a47" })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    const codeBlock = renderCodeBlock(visualData, "light");
                    if (codeBlock) return codeBlock;
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text: weText, accent: weAccent, muted: weMuted, glassBg: "rgba(224, 90, 71, 0.04)", glassBorder: "rgba(224, 90, 71, 0.08)" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: "20px" }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column", padding: "0 10px" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ marginRight: "10px", flexShrink: 0, color: "#e05a47", fontSize: "18px", fontWeight: "bold" }}>•</span>
                                    <p style={{ fontSize: "20px", color: "#6b6259", lineHeight: 1.45, margin: 0 }}>
                                      {renderFormattedText(cleanBullet, {}, {}, "flex-start", lightCodeStyle)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, "#ff5d2b", "#1c1512", "#6b6360", "•", false, {}, lightCodeStyle)}</div>;
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <img
                    src={imageUrl}
                    style={{ marginTop: "40px", borderRadius: "12px", maxHeight: "350px", objectFit: "cover", border: "1px solid #e2d9ce" }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#6b6259", letterSpacing: "1px" }}>
            {displayUsername}
          </span>
          {!isLast && (
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#1e1b18", letterSpacing: "1px", textTransform: "uppercase" }}>
              Swipe next
            </span>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
    // THEME 5: MESH GLOW (Clean gradient backgrounds with seamless flowing blobs, asterisk)
    // ==========================================
    if (themeName === "mesh-glow") {
    const po = slide.paletteOverride;
    const mgText = po?.text || "#0a0a0a";
    const mgAccent = po?.primary || "#3b82f6";
    const mgMuted = po?.text || "#374151";
    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          color: "#0a0a0a",
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "90px 90px",
          boxSizing: "border-box",
          position: "relative",
          ...bgImageStyle,
        }}
      >
        {/* Seamless Panoramic Background with subtle mesh corner glows */}
        {!hasBgImage && <PanoramicBackground theme="mesh-glow" order={order} totalSlides={totalSlides} />}

        {/* Custom Diagram Shapes Overlay */}
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        {/* 2.9 Progress bar */}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor="#e8673a" />

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          {/* Blue Asterisk Accent Logo */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "42px", fontWeight: 800, color: "#3b82f6", transform: "translateY(-6px)" }}>
              *
            </span>
          </div>
        </div>

        {/* Content Box */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "40px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <h1 style={{ fontSize: "78px", fontWeight: 900, lineHeight: 1.05, marginBottom: "40px", letterSpacing: "-2px", color: "#0a0a0a" }}>
                {renderFormattedText(title, { color: "#ec4899" })}
              </h1>
              
              <div style={{ display: "flex", marginTop: "45px" }}>
                <div style={{ border: "1.5px solid #0a0a0a", borderRadius: "9999px", padding: "10px 24px", display: "flex" }}>
                  <span style={{ fontSize: "14px", fontWeight: 850, letterSpacing: "1px", textTransform: "uppercase" }}>
                    {body || "Swipe to learn"}
                  </span>
                </div>
              </div>
            </div>
          ) : type === "CLOSING" ? (
            // Warm Editorial: serif pull-quote closer with thin divider rule
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", width: "100%", paddingLeft: "10px" }}>
              <div style={{ width: "60px", height: "2px", backgroundColor: "#e8673a", marginBottom: "32px" }} />
              <span style={{ fontSize: "13px", color: "#9d8976", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>Final Take</span>
              <h1 style={{ fontSize: "54px", fontWeight: 900, lineHeight: 1.15, marginBottom: "36px", letterSpacing: "-1px", color: "#1c1612", fontFamily: "Playfair Display, serif" }}>
                {renderFormattedText(title, { color: "#e8673a" }, {}, "flex-start")}
              </h1>
              <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(232,103,58,0.25)", marginBottom: "28px" }} />
              {/* Serif pull-quote pill */}
              <div style={{ padding: "14px 32px", border: "1.5px solid #e8673a", borderRadius: "6px", display: "flex", alignItems: "center", backgroundColor: "rgba(232,103,58,0.06)" }}>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#e8673a", fontStyle: "italic" }}>{body || "Share this insight →"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              {/* Step indicator pill */}
              <div style={{ display: "flex", marginBottom: "25px" }}>
                <div style={{ display: "flex", border: "1.5px solid #0a0a0a", borderRadius: "9999px", padding: "6px 18px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Step {order}
                  </span>
                </div>
              </div>

              <h2 style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: "30px", color: "#0a0a0a" }}>
                {renderFormattedText(title, { color: "#3b82f6" }, {}, "flex-start", undefined, { scribble, color: scribbleColor, fontSize: 56 })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    const codeBlock = renderCodeBlock(visualData, "light");
                    if (codeBlock) return codeBlock;
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text: mgText, accent: mgAccent, muted: mgMuted, glassBg: "rgba(10, 10, 10, 0.04)", glassBorder: "rgba(10, 10, 10, 0.08)" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: "20px" }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column", padding: "0 10px" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ marginRight: "10px", flexShrink: 0, color: "#3b82f6", fontSize: "18px", fontWeight: "bold" }}>•</span>
                                    <p style={{ fontSize: "20px", color: "#374151", lineHeight: 1.45, margin: 0 }}>
                                      {renderFormattedText(cleanBullet, {}, {}, "flex-start", lightCodeStyle, { scribble, color: scribbleColor, fontSize: 20 })}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, "#e8673a", "#1c1612", "#6b6058", "•", false, {}, lightCodeStyle)}</div>;
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <img
                    src={imageUrl}
                    alt="Inline"
                    style={{ marginTop: "30px", borderRadius: "12px", border: "1.5px solid #e5e7eb", maxHeight: "350px", objectFit: "cover" }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "1.5px", color: "#4b5563", textTransform: "uppercase" }}>
            {websiteUrl || "reallygreatsite.com"}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "1px", color: "#4b5563" }}>
            2026
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
    // THEME 6: CYBER HORIZON (Dark, neon-copper blueprint glow)
    // ==========================================
    if (themeName === "cyber-horizon") {
    const po = slide.paletteOverride;
    const chText = po?.text || "#ffffff";
    const chAccent = po?.primary || "#ea580c";
    const chMuted = po?.text ? "#a3a3a3" : "#a3a3a3";
    const chBg = po?.background || "#050505";
    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          display: "flex",
          flexDirection: "column",
          padding: "90px 80px",
          boxSizing: "border-box",
          backgroundColor: "#050505",
          color: "#ffffff",
          fontFamily: "Outfit",
          position: "relative",
          justifyContent: "space-between",
          overflow: "hidden",
          ...bgImageStyle,
        }}
      >
        {/* Seamless Panoramic Background with blueprint mesh corner glows */}
        {!hasBgImage && <PanoramicBackground theme="cyber-horizon" order={order} totalSlides={totalSlides} />}

        {/* Custom Diagram Shapes Overlay */}
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        {/* 2.9 Progress bar */}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor="#ea580c" />

        {/* corner accent brackets */}
        {!hasBgImage && (() => {
          const rng = getSeededRandom(`cyber-brackets-${order}`);
          const showTop = rng() > 0.5;
          const showBottom = rng() > 0.5;
          return (
            <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
              {showTop && (
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ position: "absolute", top: "30px", right: "30px" }}>
                  <path d="M60 0 L60 60 M0 0 L60 0" stroke="#ea580c" strokeWidth="2" opacity="0.3" />
                </svg>
              )}
              {showBottom && (
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ position: "absolute", bottom: "30px", left: "30px" }}>
                  <path d="M0 60 L0 0 M0 60 L60 60" stroke="#ea580c" strokeWidth="2" opacity="0.3" />
                </svg>
              )}
            </div>
          );
        })()}

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <div style={{ display: "flex", backgroundColor: "rgba(20, 20, 20, 0.8)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "6px 16px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#a3a3a3" }}>
              {type === "COVER" ? "Introduction" : type === "CLOSING" ? "Roadmap" : `Step ${order}`}
            </span>
          </div>
          <span style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 700, letterSpacing: "1px" }}>{pageLabel}</span>
        </div>

        {/* Content Box */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "40px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "74px", fontWeight: 700, lineHeight: 1.15, marginBottom: "40px", letterSpacing: "-1.5px", textTransform: "uppercase" }}>
                {renderFormattedText(title, { color: "#ea580c" }, {}, "center")}
              </h1>
              <div style={{ display: "flex", backgroundColor: "rgba(20, 20, 20, 0.8)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "16px 28px" }}>
                <p style={{ fontSize: "24px", color: "#cccccc", lineHeight: 1.5, margin: 0, textAlign: "center" }}>
                  {renderFormattedText(body, { color: "#ea580c" }, {}, "center")}
                </p>
              </div>
            </div>
          ) : type === "CLOSING" ? (
            // Cyber Horizon: scanline grid overlay on a dark CTA — grid + mono text
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%", position: "relative" }}>
              <span style={{ fontSize: "12px", color: "rgba(234,88,12,0.7)", marginBottom: "22px", textTransform: "uppercase", letterSpacing: "6px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{"// END TRANSMISSION"}</span>
              <h1 style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1.15, marginBottom: "40px", letterSpacing: "-1px", color: "#ffffff", fontFamily: "JetBrains Mono, monospace" }}>
                {renderFormattedText(title, { color: "#ea580c" }, {}, "center")}
              </h1>
              {/* Scanline grid CTA button */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Grid overlay using SVG pattern */}
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.2 }} viewBox="0 0 200 56" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#ea580c" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="200" height="56" fill="url(#grid)" rx="6" />
                </svg>
                <div style={{ padding: "16px 44px", border: "1.5px solid #ea580c", borderRadius: "6px", backgroundColor: "rgba(234,88,12,0.1)", display: "flex", alignItems: "center", position: "relative"}}>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#ea580c", fontFamily: "JetBrains Mono, monospace", letterSpacing: "1px" }}>{body || "$ follow --now"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <h2 style={{ fontSize: "56px", fontWeight: 700, lineHeight: 1.2, marginBottom: "35px", color: "#ffffff", letterSpacing: "-1px", textTransform: "uppercase" }}>
                {renderFormattedText(title, { color: "#ea580c" })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    const codeBlock = renderCodeBlock(visualData, "dark");
                    if (codeBlock) return codeBlock;
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text: chText, accent: chAccent, muted: chMuted, glassBg: "rgba(255,255,255,0.05)", glassBorder: "rgba(255,255,255,0.1)" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: "20px" }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column", padding: "0 10px" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ marginRight: "10px", flexShrink: 0, color: "#ea580c", fontSize: "18px", fontWeight: "bold" }}>•</span>
                                    <p style={{ fontSize: "20px", color: "#cccccc", lineHeight: 1.45, margin: 0 }}>
                                      {renderFormattedText(cleanBullet, { color: "#ea580c" }, {}, "flex-start", darkCodeStyle)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, "#ea580c", "#cccccc", "#a3a3a3", "•", true, { color: "#ea580c" }, darkCodeStyle)}</div>;
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <img
                    src={imageUrl}
                    alt="Inline"
                    style={{ marginTop: "40px", borderRadius: "12px", maxHeight: "350px", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.15)" }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <div style={{ display: "flex", backgroundColor: "rgba(20, 20, 20, 0.8)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "6px 16px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: "#ffffff" }}>
              {displayUsername || "cyber-horizon"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: "rgba(255, 255, 255, 0.4)" }}>
              SWIPE
            </span>
            <SwipeArrow color="rgba(255, 255, 255, 0.4)" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // THEME 7: LINEN & RUST (Editorial, organic tactile)
  // ==========================================
  if (themeName === "linen-rust") {
    const po = slide.paletteOverride;
    const lrText = po?.text || "#2a2827";
    const lrAccent = po?.primary || "#b84a30"; // Deepened rust
    const lrMuted = po?.text ? "#5c5553" : "#5c5553";
    const lrBg = po?.background || "#d8d7cf";
    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          display: "flex",
          flexDirection: "column",
          padding: "100px 90px",
          boxSizing: "border-box",
          backgroundColor: "#d8d7cf",
          color: "#2e2b2a",
          fontFamily: "Outfit",
          position: "relative",
          justifyContent: "space-between",
          overflow: "hidden",
          ...bgImageStyle,
        }}
      >
        {/* Seamless Panoramic Background with subtle linen paths */}
        {!hasBgImage && <PanoramicBackground theme="linen-rust" order={order} totalSlides={totalSlides} />}

        {/* SVG Texture Pattern Overlay */}
        <svg width="1080" height="1350" style={{ position: "absolute", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }}>
          <defs>
            <pattern id="linen-pattern" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="none" />
              <path d="M 0 0 L 2 2 M 4 0 L 6 2 M 0 4 L 2 6" stroke={lrAccent} strokeWidth="0.5" opacity="0.08" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#linen-pattern)" />
        </svg>

        {/* Floating background diamond accents (randomized based on slide index/order) */}
        {!hasBgImage && (() => {
          const rng = getSeededRandom(`linen-stars-${order}`);
          const numDiamonds = Math.floor(rng() * 3) + 2; // 2 to 4 diamonds
          const diamonds = [];
          for (let sIdx = 0; sIdx < numDiamonds; sIdx++) {
            const sx = Math.floor(80 + rng() * 920);
            const sy = Math.floor(80 + rng() * 1190);
            const size = Math.floor(14 + rng() * 18);
            const opacity = (0.15 + rng() * 0.25).toFixed(2);
            const half = size / 2;
            const d = `M${half} 0 L${size} ${half} L${half} ${size} L0 ${half} Z`;
            diamonds.push(
              <svg key={sIdx} style={{ position: "absolute", left: `${sx}px`, top: `${sy}px`, width: `${size}px`, height: `${size}px` }}>
                <path d={d} fill={lrAccent} opacity={opacity} />
              </svg>
            );
          }
          return <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>{diamonds}</div>;
        })()}

        {/* Custom Diagram Shapes Overlay */}
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        {/* 2.9 Progress bar */}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor={lrAccent} />

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(46, 43, 42, 0.55)" }}>
            {type === "COVER" ? "* Overview" : type === "CLOSING" ? "* Wrap-up" : `* Insight ${order}`}
          </span>
          <span style={{ fontSize: "13px", color: "rgba(46, 43, 42, 0.55)", fontWeight: 700 }}>{pageLabel}</span>
        </div>

        {/* Content Box */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "40px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", position: "relative", zIndex: 1 }}>
              <h1 style={{ fontSize: "74px", fontWeight: 700, lineHeight: 1.15, marginBottom: "30px", letterSpacing: "-1px", color: lrText }}>
                {renderFormattedText(title, { fontFamily: "Caveat", fontSize: "86px", color: lrAccent, fontWeight: 400, fontStyle: "normal" })}
              </h1>
              <div style={{ width: "80px", height: "4px", backgroundColor: lrAccent, marginBottom: "40px" }} />
              <p style={{ fontSize: "28px", color: lrMuted, lineHeight: 1.5, maxWidth: "750px" }}>
                {renderFormattedText(body, { fontFamily: "Caveat", fontSize: "36px", color: lrAccent, fontWeight: 400, fontStyle: "normal" }, {}, "flex-start", lightCodeStyle)}
              </p>
            </div>
          ) : type === "CLOSING" ? (
            // Linen & Rust: hand-written Caveat-font closer with warm texture rule
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%", position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: "14px", color: "#9d8471", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>One Last Thing</span>
              <h1 style={{ fontSize: "58px", fontWeight: 700, lineHeight: 1.2, marginBottom: "36px", letterSpacing: "-0.5px", color: "#1c1612", fontFamily: "Playfair Display, serif" }}>
                {renderFormattedText(title, { color: lrAccent }, {}, "center")}
              </h1>
              {/* Linen rule */}
              <div style={{ width: "100px", height: "2px", background: `linear-gradient(to right, transparent, ${lrAccent}, transparent)`, marginBottom: "32px" }} />
              {/* Caveat hand-written CTA pill */}
              <div style={{ padding: "18px 50px", border: `2.5px solid ${lrAccent}`, borderRadius: "9999px", backgroundColor: "rgba(184,74,48,0.07)", display: "flex", alignItems: "center", boxShadow: `4px 6px 0px rgba(184,74,48,0.2)` }}>
                <span style={{ fontSize: "28px", fontWeight: 700, color: lrAccent, fontFamily: "Caveat, cursive" }}>{body || "Share with someone this helps"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left", position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "52px", fontWeight: 700, lineHeight: 1.2, marginBottom: "30px", color: lrText, letterSpacing: "-0.5px" }}>
                {renderFormattedText(title, { fontFamily: "Caveat", fontSize: "62px", color: lrAccent, fontWeight: 400, fontStyle: "normal" })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    const codeBlock = renderCodeBlock(visualData, "light");
                    if (codeBlock) return codeBlock;
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text: lrText, accent: lrAccent, muted: lrMuted, glassBg: "rgba(197, 86, 60, 0.03)", glassBorder: "rgba(197, 86, 60, 0.06)", background: lrBg });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: "20px" }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ marginRight: "10px", flexShrink: 0, color: lrAccent, fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>*</span>
                                    <p style={{ fontSize: "20px", color: lrMuted, lineHeight: 1.45, margin: 0 }}>
                                      {renderFormattedText(cleanBullet, { fontFamily: "Caveat", fontSize: "24px", color: lrAccent, fontWeight: 400, fontStyle: "normal" }, {}, "flex-start", lightCodeStyle)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {body.split("\n").filter(Boolean).map((para, pIdx) => (
                        <div key={pIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "16px" }}>
                          <span style={{ marginRight: "12px", flexShrink: 0, width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", color: "#c5563c", fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>*</span>
                          <p style={{ fontSize: "26px", color: "#5c5553", lineHeight: 1.5, margin: 0 }}>
                            {renderFormattedText(para, { fontFamily: "Caveat", fontSize: "32px", color: "#c5563c", fontWeight: 400, fontStyle: "normal" }, {}, "flex-start", lightCodeStyle)}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <img
                    src={imageUrl}
                    alt="Inline"
                    style={{ marginTop: "35px", borderRadius: "6px", maxHeight: "350px", objectFit: "cover", border: "1px solid rgba(46, 43, 42, 0.15)" }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: "rgba(46, 43, 42, 0.45)" }}>
            {displayUsername || "linen-rust"}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: "rgba(46, 43, 42, 0.45)" }}>
            * swipe
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
  // THEME 8: NEO-BRUTALISM (Vibrant poster style — 5-color palette, rounded corners, colored shadows, color-blocked)
  // ==========================================
  if (themeName === "neo-brutalism") {
    const po = slide.paletteOverride;
    const cream = po?.background || "#F7F3EC";
    const text = po?.text || "#141414";
    const orange = po?.primary || "#F4623A";
    const yellow = po?.secondary || "#FFD400";
    const teal = po?.tertiary || "#2EC4B6";
    const pop = po?.tertiary || "#FF3EA5";
    const slideVariant = order % 2 === 0 ? "orange" : "teal";
    const headerColor = slideVariant === "orange" ? orange : teal;
    const pct = totalSlides > 1 ? Math.round(((order + 1) / totalSlides) * 100) : 100;
    const shadowCream = `10px 10px 0px ${slideVariant === "orange" ? teal : yellow}`;
    const shadowSolid = `10px 10px 0px ${text}`;

    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: type === "CLOSING" ? orange : cream,
          color: text,
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          ...bgImageStyle,
        }}
      >
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}

        {/* SVG Dot Grid Pattern Overlay */}
        <svg width="1080" height="1350" style={{ position: "absolute", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }}>
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill={text} opacity="0.1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {type === "COVER" ? (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div style={{ backgroundColor: headerColor, padding: "18px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: cream, letterSpacing: "3px", textTransform: "uppercase" }}>Introduction</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: cream }}>{pageLabel}</span>
            </div>
            <div style={{ display: "flex", height: "6px", backgroundColor: "rgba(0,0,0,0.1)" }}>
              <div style={{ width: `${pct}%`, height: "6px", backgroundColor: yellow }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "60px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flexGrow: 1, justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: "-10px", right: "40px", display: "flex" }}>
                <StarAccent color={pop} size={36} />
              </div>
              <h1 style={{ fontSize: "86px", fontWeight: 900, lineHeight: 1.05, marginBottom: "40px", letterSpacing: "-3.5px", textTransform: "uppercase", position: "relative", zIndex: 1 }}>
                {renderFormattedText(title, { color: orange, fontFamily: "Playfair Display", fontStyle: "italic" }, { color: text }, "flex-start")}
              </h1>
              {body && (
                <div style={{ display: "flex", padding: "24px 32px", border: `3.5px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, backgroundColor: cream, maxWidth: "85%", position: "relative", zIndex: 1 }}>
                  <p style={{ fontSize: "22px", color: text, lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
                    {renderFormattedText(body, {}, {}, "flex-start")}
                  </p>
                </div>
              )}
              <div style={{ marginTop: "50px", display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ padding: "6px 18px", border: `3px solid ${text}`, borderRadius: "9999px", fontSize: "13px", fontWeight: 800, color: text, textTransform: "uppercase" }}>
                  {displayUsername || "Featured"}
                </span>
                <div style={{ width: "80px", height: "3px", backgroundColor: orange }} />
              </div>
              </div>
            </div>
          </div>
        ) : type === "CLOSING" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, padding: "60px", position: "relative" }}>
            <div style={{ position: "absolute", top: "-10px", right: "40px", display: "flex" }}>
              <StarAccent color={pop} size={36} />
            </div>
            <h1 style={{ fontSize: "76px", fontWeight: 900, lineHeight: 1.1, marginBottom: "40px", letterSpacing: "-3px", textTransform: "uppercase", textAlign: "center", maxWidth: "850px", position: "relative", zIndex: 1 }}>
              {renderFormattedText(title, { color: yellow, fontFamily: "Playfair Display", fontStyle: "italic" }, { color: cream }, "center")}
            </h1>
            {body && (
              <p style={{ fontSize: "24px", color: cream, lineHeight: 1.5, fontWeight: 500, textAlign: "center", maxWidth: "650px", marginBottom: "50px" }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
            )}
            <div style={{ display: "flex", padding: "22px 60px", backgroundColor: yellow, border: `3.5px solid ${text}`, borderRadius: "9999px", boxShadow: shadowSolid, position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: "24px", fontWeight: 900, color: text, letterSpacing: "1px" }}>{displayUsername || "Get Started"}</span>
            </div>
            <div style={{ position: "absolute", bottom: "60px", right: "60px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: cream, textTransform: "uppercase", letterSpacing: "2px" }}>{pageLabel}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div style={{ backgroundColor: headerColor, padding: "18px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: cream, letterSpacing: "3px", textTransform: "uppercase" }}>
                Insight
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: cream }}>{pageLabel}</span>
            </div>
            <div style={{ display: "flex", height: "6px", backgroundColor: "rgba(0,0,0,0.1)" }}>
              <div style={{ width: `${pct}%`, height: "6px", backgroundColor: yellow }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "30px 60px 20px 60px", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <div style={{ display: "flex", marginBottom: "8px" }}>
                <StarAccent color={pop} size={20} />
              </div>

              <h2 style={{ fontSize: "46px", fontWeight: 900, lineHeight: 1.15, marginBottom: "20px", letterSpacing: "-2px", textTransform: "uppercase", position: "relative", zIndex: 1 }}>
                {renderFormattedText(title, { color: orange, fontFamily: "Playfair Display", fontStyle: "italic" }, {}, "center")}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
                {(() => {
                  if (visualType === "code-block") {
                    return (
                      <div style={{ border: `3px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, display: "flex", overflow: "hidden", backgroundColor: cream, width: "100%", maxWidth: "800px" }}>
                        {renderCodeBlock(visualData, "dark")}
                      </div>
                    );
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text, accent: orange, muted: text, iconBorderRadius: "50%", cardBorderRadius: "20px", glassBg: orange, glassBorder: text });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", maxWidth: "800px", justifyContent: "center", alignItems: "center", border: `3px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, padding: "24px", boxSizing: "border-box", backgroundColor: cream }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column", padding: "20px 0 0 0", alignItems: "center", textAlign: "center", width: "100%", maxWidth: "700px" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ marginRight: "12px", flexShrink: 0, color: orange, fontSize: "16px", fontWeight: "bold", display: "flex", alignItems: "center", marginTop: "4px" }}>
                                      {renderBulletIcon("▸", orange, 16)}
                                    </span>
                                    <p style={{ fontSize: "18px", color: text, lineHeight: 1.45, margin: 0, fontWeight: 500, textAlign: "left" }}>
                                      {renderFormattedText(cleanBullet, {}, {}, "flex-start")}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                    return (
                    <div style={{ display: "flex", flexDirection: "column", border: `3px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, padding: "24px", backgroundColor: cream, width: "100%", maxWidth: "800px", textAlign: "left" }}>
                      {renderBulletList(body, orange, text, text, "▸", true, {}, {}, [orange, yellow, teal, pop])}
                    </div>
                  );
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <div style={{ display: "flex", border: `3px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, marginTop: "24px", overflow: "hidden", backgroundColor: cream, width: "100%", maxWidth: "800px" }}>
                    <img src={imageUrl} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: teal, padding: "14px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: cream }}>{displayUsername}</span>
              </div>
              {!isLast && (
                <div style={{ display: "flex", alignItems: "center", color: cream, fontSize: "13px", fontWeight: 700 }}>
                  <span style={{ textTransform: "uppercase", letterSpacing: "2px" }}>Swipe</span>
                  <SwipeArrow color={cream} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // THEME 9: NEOMORPHISM (Soft extruded surfaces, dual shadows)
  // ==========================================
  if (themeName === "neomorphism") {
    const po = slide.paletteOverride;
    const bg = po?.background || "#E4E0DA";
    const text = po?.text || "#2B2B2B";
    const mutedText = po?.text ? "#5a5a5a" : "#5a5a5a";
    const accent = po?.primary || "#E8503A";
    const accentBg = "radial-gradient(circle at 35% 30%, #F4A896 0%, #E8503A 60%, #C43D2A 100%)";
    const lightShadow = "-12px -12px 24px rgba(255,255,255,0.7)";
    const darkShadow = "12px 12px 24px rgba(0,0,0,0.12)";
    const raisedShadow = "-16px -16px 32px rgba(255,255,255,0.8), 16px 16px 32px rgba(0,0,0,0.14)";
    const insetShadow = "inset -8px -8px 16px rgba(255,255,255,0.6), inset 8px 8px 16px rgba(0,0,0,0.1)";
const extrudedCard = (content: React.ReactNode, extraStyle: React.CSSProperties = {}) => (
  <div style={{ display: "flex", flex: 1, backgroundColor: bg, borderRadius: "20px", padding: "24px", boxShadow: `${lightShadow}, ${darkShadow}`, boxSizing: "border-box", ...extraStyle }}>
    {content}
  </div>
);
const insetCard = (content: React.ReactNode, extraStyle: React.CSSProperties = {}) => (
  <div style={{ display: "flex", flex: 1, backgroundColor: bg, borderRadius: "20px", padding: "24px", boxShadow: insetShadow, boxSizing: "border-box", ...extraStyle }}>
    {content}
  </div>
);
    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: bg,
          background: `radial-gradient(circle at top left, rgba(255,255,255,0.4) 0%, ${bg} 60%, rgba(0,0,0,0.05) 100%)`,
          color: text,
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "85px",
          boxSizing: "border-box",
          position: "relative",
          ...bgImageStyle,
        }}
      >
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <div style={{ display: "flex", padding: "6px 18px", backgroundColor: bg, borderRadius: "9999px", boxShadow: `${lightShadow}, ${darkShadow}` }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: text, letterSpacing: "3px", textTransform: "uppercase" }}>
                  {type === "COVER" ? "Introduction" : type === "CLOSING" ? "Conclusion" : "Insight"}
                </span>
              </div>
              <div style={{ display: "flex", padding: "4px 14px", backgroundColor: bg, borderRadius: "9999px", boxShadow: `${lightShadow}, ${darkShadow}` }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: mutedText }}>{pageLabel}</span>
              </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "35px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "64px", fontWeight: 600, lineHeight: 1.15, marginBottom: "40px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              {body && extrudedCard(
                <p style={{ fontSize: "22px", color: mutedText, lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                  {renderFormattedText(body, {}, {}, "center")}
                </p>, { padding: 0 }
              )}
              <div style={{ marginTop: "50px", width: "180px", height: "180px", borderRadius: "50%", background: accentBg, boxShadow: "16px 16px 32px rgba(0,0,0,0.14), -16px -16px 32px rgba(255,255,255,0.8)" }} />
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: mutedText, marginBottom: "20px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>Next Steps</span>
              <h1 style={{ fontSize: "52px", fontWeight: 600, lineHeight: 1.2, marginBottom: "35px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
            <div style={{ display: "flex", padding: "18px 48px", backgroundColor: accent, borderRadius: "9999px", boxShadow: "16px 16px 32px rgba(0,0,0,0.14), -16px -16px 32px rgba(255,255,255,0.8)" }}>
              <span style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", letterSpacing: "1px" }}>{body || displayUsername || "Get Started"}</span>
            </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "44px", fontWeight: 600, lineHeight: 1.25, marginBottom: "25px", letterSpacing: "-0.5px", color: text }}>
                {renderFormattedText(title, { color: accent })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {extrudedCard(
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    {(() => {
                      if (visualType === "code-block") {
                        return (
                          <div style={{ display: "flex", width: "100%", marginBottom: body ? "30px" : "0" }}>
                            {renderCodeBlock(visualData, "light")}
                          </div>
                        );
                      }
                      if (visualType && visualType !== "text-only") {
                        const diagram = renderDiagram(visualType, visualData, { text, accent, muted: mutedText, accentBg });
                        if (diagram) {
                          return (
                            <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: body ? "30px" : "0" }}>
                              {diagram}
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                    {body && (
                      <div style={{ display: "flex", flexDirection: "column", padding: "0 10px" }}>
                        {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                          const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                          if (!cleanBullet) return null;
                          return (
                            <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                              <span style={{ marginRight: "10px", flexShrink: 0, color: accent, fontSize: "16px", fontWeight: "bold" }}>•</span>
                              <p style={{ fontSize: "18px", color: mutedText, lineHeight: 1.45, margin: 0 }}>
                                {renderFormattedText(cleanBullet, {}, {}, "flex-start")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {imageUrl && imageLayout === "inline" && (
                  <div style={{ display: "flex", marginTop: "20px", borderRadius: "20px", overflow: "hidden", boxShadow: insetShadow }}>
                    <img src={imageUrl} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: bg, boxShadow: `${lightShadow}, ${darkShadow}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: accent }}>{username ? username.replace("@", "").substring(0, 2).toUpperCase() : "CA"}</span>
          </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: mutedText, fontSize: "14px", fontWeight: 600 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
              <SwipeArrow color={mutedText} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // THEME 10: FROSTED GRID (Minimal white, accent shape, small frosted grid)
  // ==========================================
  if (themeName === "frosted-grid") {
    const po = slide.paletteOverride;
    const text = po?.text || "#1a1a1a";
    const mutedText = po?.text ? "rgba(26,26,26,0.6)" : "#737373";
    const accent = po?.primary || "#a855f7"; // Purple accent
    
    const glassFill = "rgba(255,255,255,0.6)";
    const glassBorder = "rgba(0,0,0,0.03)";
    const glassBorderTop = "rgba(255,255,255,0.9)";

    // Define the top edge of the frosted blocks (y-index for each of the 10 columns)
    const blockHeights = [6, 5, 5, 6, 7, 8, 8, 7, 7, 6];

    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: "#F8F9FA",
          color: text,
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          ...bgImageStyle,
        }}
      >
        {/* Thin vertical lines */}
        <svg width="1080" height="1350" style={{ position: "absolute", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={i} x1={i * 108} y1={0} x2={i * 108} y2={1350} stroke="rgba(0,0,0,0.03)" strokeWidth="1.5" />
          ))}
          <defs>
            <radialGradient id="purple-blob" cx="50%" cy="80%" r="65%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1080" height="1350" fill="url(#purple-blob)" />
        </svg>
        
        {/* Frosted blocks grid */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", display: "flex", zIndex: 1 }}>
          {[
            // Top Right Cluster
            { r: 0, c: 9, o: 0.6 },
            { r: 1, c: 9, o: 0.5 },
            { r: 0, c: 8, o: 0.4 },
            { r: 1, c: 8, o: 0.35 },
            { r: 2, c: 9, o: 0.25 },
            // Bottom Left Cluster
            { r: 12, c: 0, o: 0.5 },
            { r: 11, c: 0, o: 0.4 },
            { r: 12, c: 1, o: 0.3 },
            { r: 11, c: 1, o: 0.25 },
            { r: 10, c: 0, o: 0.15 },
          ].map((block, i) => (
            <div key={i} style={{
              width: "108px",
              height: "108px",
              backgroundColor: `rgba(255, 255, 255, ${block.o})`,
              borderTop: "1.5px solid rgba(255, 255, 255, 0.9)",
              borderLeft: "1.5px solid rgba(255, 255, 255, 0.9)",
              borderRight: "1px solid rgba(0, 0, 0, 0.03)",
              borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
              boxShadow: "inset 4px 4px 12px rgba(255, 255, 255, 0.6), 6px 6px 15px rgba(0, 0, 0, 0.05)",
              borderRadius: "20px",
              position: "absolute",
              left: `${block.c * 108}px`,
              top: `${block.r * 108}px`,
              boxSizing: "border-box"
            }} />
          ))}
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", zIndex: 10, padding: "80px", justifyContent: "space-between" }}>
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

        {type === "COVER" ? null : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px", backgroundColor: glassFill, border: `1px solid ${glassBorder}`, borderTop: `1px solid ${glassBorderTop}`, borderLeft: `1px solid ${glassBorderTop}`, borderRadius: "9999px", width: "auto", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: accent, textTransform: "uppercase" }}>
              {type === "CLOSING" ? "Conclusion" : "Insight"}
            </span>
            <span style={{ fontSize: "13px", color: text, fontWeight: 700, marginLeft: "10px" }}>{pageLabel}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, margin: type === "COVER" ? "0" : "30px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
              {/* Top Text Section */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", maxWidth: "900px", marginTop: "20px" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "rgba(0,0,0,0.3)", textTransform: "uppercase", marginBottom: "20px", letterSpacing: "1px" }}>{pageLabel || "Design Resources"}</span>
                <div style={{ display: "flex", position: "relative" }}>
                  <h1 style={{ fontSize: "120px", fontWeight: 900, lineHeight: 1.05, color: text, letterSpacing: "-4px", margin: 0, position: "relative" }}>
                    {renderFormattedText(title, { color: accent }, { color: text }, "flex-start")}
                  </h1>
                  <svg width="50" height="50" viewBox="0 0 60 60" style={{ position: "absolute", right: "-50px", top: "-10px" }}>
                    <path d="M30 0 C30 20 40 30 60 30 C40 30 30 40 30 60 C30 40 20 30 0 30 C20 30 30 20 30 0" fill={text} opacity="0.6" />
                  </svg>
                  <svg width="30" height="30" viewBox="0 0 60 60" style={{ position: "absolute", right: "-80px", top: "10px" }}>
                    <path d="M30 0 C30 20 40 30 60 30 C40 30 30 40 30 60 C30 40 20 30 0 30 C20 30 30 20 30 0" fill={text} opacity="0.4" />
                  </svg>
                </div>
              </div>
              
              {/* Bottom Body Section (Inside the purple/glass area) */}
              {body && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginTop: "auto", marginBottom: "40px" }}>
                  <p style={{ fontSize: "32px", color: "#ffffff", lineHeight: 1.3, maxWidth: "700px", fontWeight: 600, textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                    {renderFormattedText(body, {}, {}, "flex-start")}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", padding: "10px 24px", backgroundColor: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: "9999px", marginTop: "24px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>{displayUsername || "By Author"}</span>
                  </div>
                </div>
              )}
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center", flexGrow: 1 }}>
              <svg width="60" height="60" viewBox="0 0 60 60" style={{ marginBottom: "30px" }}>
                <path d="M30 0 C30 20 40 30 60 30 C40 30 30 40 30 60 C30 40 20 30 0 30 C20 30 30 20 30 0" fill={text} opacity="0.6" />
              </svg>
              <h1 style={{ fontSize: "80px", fontWeight: 900, lineHeight: 1.1, marginBottom: "35px", letterSpacing: "-2px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              <p style={{ fontSize: "28px", color: mutedText, lineHeight: 1.5, marginBottom: "50px", maxWidth: "700px", fontWeight: 500 }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
            <div style={{ display: "flex", padding: "20px 54px", backgroundColor: text, borderRadius: "9999px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "1px" }}>{displayUsername || "Join Now"}</span>
            </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", padding: "40px", backgroundColor: glassFill, border: `1.5px solid ${glassBorder}`, borderTop: `1.5px solid ${glassBorderTop}`, borderLeft: `1.5px solid ${glassBorderTop}`, borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", marginTop: "20px" }}>
              <h2 style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.25, marginBottom: "24px", letterSpacing: "-1px", color: text }}>
                {renderFormattedText(title, { color: accent })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    return (
                  <div style={{ display: "flex", backgroundColor: "#0F172A", borderRadius: "16px", overflow: "hidden", marginBottom: "16px" }}>
                    {renderCodeBlock(visualData, "dark")}
                  </div>
                    );
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text, accent, muted: mutedText, glassBg: glassFill, glassBorder });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "16px" }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <span style={{ marginRight: "12px", flexShrink: 0, color: accent, fontSize: "16px", fontWeight: "bold", display: "flex", alignItems: "center" }}>
                                      {renderBulletIcon("▪", accent, 16)}
                                    </span>
                                    <p style={{ fontSize: "18px", color: mutedText, lineHeight: 1.5, margin: 0 }}>
                                      {renderFormattedText(cleanBullet, {}, {}, "flex-start")}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, accent, text, mutedText, "▪", false, {}, {})}</div>;
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <div style={{ display: "flex", marginTop: "16px", borderRadius: "16px", overflow: "hidden", border: `1px solid ${glassBorder}` }}>
                    <img src={imageUrl} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <div style={{ display: "flex", padding: "8px 20px", backgroundColor: "#F8FAFC", border: `1px solid #E2E8F0`, borderRadius: "9999px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: text }}>{displayUsername}</span>
              </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: accent, fontSize: "14px", fontWeight: 700 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
              <SwipeArrow color={accent} />
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // THEME 11: GLASSMORPHISM (Premium thin glass on lush mesh orbs)
  // ==========================================
  if (themeName === "glassmorphism") {
    const po = slide.paletteOverride;
    const glassFill = "rgba(255,255,255,0.55)";
    const glassBorder = "rgba(255,255,255,0.4)";
    const glassBorderTop = "rgba(255,255,255,0.9)";
    const lightShadow = "0 24px 48px rgba(15,23,42,0.04), inset 0 0 0 1px rgba(255,255,255,0.3)";
    const text = po?.text || "#1e293b";
    const mutedText = "rgba(30,41,59,0.6)";
    const accent = po?.primary || "#0f172a";
    
    // Soft, airy background
    const bgGradients = (
      <div style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", zIndex: 0, display: "flex", background: "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%)" }}>
        {/* Subtle highlights */}
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "80%", height: "80%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "80%", height: "80%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
      </div>
    );

    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: "#e2e8f0",
          color: text,
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          ...bgImageStyle,
        }}
      >
        {!hasBgImage && bgGradients}
        
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", zIndex: 10, padding: "90px", justifyContent: "space-between" }}>
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

        {type === "COVER" ? null : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", backgroundColor: glassFill, border: `1px solid ${glassBorder}`, borderTop: `1.5px solid ${glassBorderTop}`, borderLeft: `1.5px solid ${glassBorderTop}`, borderRadius: "16px", boxShadow: lightShadow }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mutedText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "12px" }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={{ fontSize: "14px", fontWeight: 700, color: mutedText }}>
                {type === "CLOSING" ? "Conclusion" : "Insight"}
              </span>
            </div>
            <span style={{ fontSize: "14px", color: text, fontWeight: 700 }}>{pageLabel}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: type === "COVER" ? "0" : "30px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flexGrow: 1, justifyContent: "center" }}>
              <h1 style={{ fontSize: "72px", fontWeight: 800, lineHeight: 1.1, marginBottom: "30px", letterSpacing: "-1.5px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              {body && (
                <p style={{ fontSize: "24px", color: mutedText, lineHeight: 1.5, maxWidth: "800px", fontWeight: 500 }}>
                  {renderFormattedText(body, {}, {}, "center")}
                </p>
              )}
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", backgroundColor: glassFill, padding: "80px", borderRadius: "32px", border: `1px solid ${glassBorder}`, borderTop: `1.5px solid ${glassBorderTop}`, borderLeft: `1.5px solid ${glassBorderTop}`, boxShadow: lightShadow }}>
              <h1 style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1.2, marginBottom: "35px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              <p style={{ fontSize: "24px", color: mutedText, lineHeight: 1.5, marginBottom: "50px", maxWidth: "700px", fontWeight: 500 }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
            <div style={{ display: "flex", padding: "18px 48px", backgroundColor: accent, borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", letterSpacing: "1px" }}>{displayUsername || "Join Now"}</span>
            </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", padding: "48px", backgroundColor: glassFill, border: `1px solid ${glassBorder}`, borderTop: `1.5px solid ${glassBorderTop}`, borderLeft: `1.5px solid ${glassBorderTop}`, borderRadius: "32px", boxShadow: lightShadow }}>
              <h2 style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.25, marginBottom: "20px", letterSpacing: "-0.5px" }}>
                {renderFormattedText(title, { color: accent })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    return (
                  <div style={{ display: "flex", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "16px", overflow: "hidden", marginBottom: "16px", border: `1px solid ${glassBorder}` }}>
                    {renderCodeBlock(visualData, "dark")}
                  </div>
                    );
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text, accent, muted: mutedText, glassBg: glassFill, glassBorder: glassBorderTop });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "16px" }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ marginRight: "10px", flexShrink: 0, color: accent, fontSize: "16px", fontWeight: "bold", display: "flex", alignItems: "center" }}>
                                      {renderBulletIcon("✦", accent, 16)}
                                    </span>
                                    <p style={{ fontSize: "17px", color: mutedText, lineHeight: 1.45, margin: 0 }}>
                                      {renderFormattedText(cleanBullet, {}, {}, "flex-start")}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, accent, text, mutedText, "✦", false, {}, {})}</div>;
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <div style={{ display: "flex", marginTop: "16px", borderRadius: "20px", overflow: "hidden", border: `1px solid ${glassBorderTop}` }}>
                    <img src={imageUrl} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <div style={{ display: "flex", padding: "8px 20px", backgroundColor: glassFill, border: `1px solid ${glassBorder}`, borderTop: `1px solid ${glassBorderTop}`, borderLeft: `1px solid ${glassBorderTop}`, borderRadius: "9999px", boxShadow: lightShadow }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: mutedText }}>{displayUsername}</span>
              </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: mutedText, fontSize: "13px", fontWeight: 700 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
              <SwipeArrow color={mutedText} />
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // THEME 12: LIQUID GLASS (Thick refractive liquid glass UI)
  // ==========================================
  if (themeName === "liquid-glass") {
    const po = slide.paletteOverride;
    // Thick glass styles for cards
    const glassFill = "rgba(255,255,255,0.4)";
    const glassBorder = "rgba(255,255,255,0.9)";
    const insetShadow = "inset 0px 8px 16px rgba(255,255,255,1), inset 0px -8px 16px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.1)";
    const text = po?.text || "#0f172a";
    const mutedText = "rgba(15, 23, 42, 0.6)";
    // We will use gradients or solid vibrant accents
    const accent = po?.primary || "#0ea5e9";
    const accentBg = po?.primary ? po.primary : "linear-gradient(135deg, #7dd3fc, #1e40af)";

    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: "#f8fafc",
          color: text,
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          ...bgImageStyle,
        }}
      >
        {/* Colorful Abstract Background for Liquid Glass */}
        {!bgImageStyle.backgroundImage && (
          <svg style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", zIndex: 0, pointerEvents: "none" }}>
            <defs>
              <radialGradient id="lg-blob-1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={type === "COVER" ? "0.7" : "0.4"} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lg-blob-2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={type === "COVER" ? "0.6" : "0.3"} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lg-blob-3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity={type === "COVER" ? "0.5" : "0.2"} />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="400" fill="url(#lg-blob-1)" />
            <circle cx="800" cy="1100" r="450" fill="url(#lg-blob-2)" />
            <circle cx="800" cy="500" r="350" fill="url(#lg-blob-3)" />
          </svg>
        )}

        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", zIndex: 10, padding: "80px", justifyContent: "space-between" }}>
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}
        {/* Progress bar integrated into the top bar */}
        {type === "COVER" ? null : (
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 24px", backgroundColor: glassFill, border: `2px solid ${glassBorder}`, borderRadius: "9999px", boxShadow: insetShadow, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${((order + 1) / totalSlides) * 100}%`, background: accentBg, opacity: 0.4, zIndex: 0 }} />
            <span style={{ position: "relative", fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: mutedText, textTransform: "uppercase", zIndex: 1 }}>
              {type === "CLOSING" ? "Conclusion" : "Insight"}
            </span>
            <span style={{ position: "relative", fontSize: "13px", color: mutedText, fontWeight: 800, zIndex: 1 }}>{pageLabel}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: type === "COVER" ? "0" : "30px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flexGrow: 1, justifyContent: "center" }}>
              <div style={{ padding: "40px 60px", backgroundColor: glassFill, border: `3px solid ${glassBorder}`, borderRadius: "40px", boxShadow: insetShadow, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h1 style={{ fontSize: "72px", fontWeight: 900, lineHeight: 1.1, marginBottom: "30px", letterSpacing: "-2px" }}>
                  {renderFormattedText(title, { color: accent }, { color: text }, "center")}
                </h1>
                {body && (
                  <p style={{ fontSize: "24px", color: mutedText, lineHeight: 1.5, maxWidth: "800px", fontWeight: 600 }}>
                    {renderFormattedText(body, {}, {}, "center")}
                  </p>
                )}
              </div>
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "60px", fontWeight: 900, lineHeight: 1.2, marginBottom: "35px", letterSpacing: "-1.5px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              <p style={{ fontSize: "24px", color: mutedText, lineHeight: 1.5, marginBottom: "40px", maxWidth: "700px", fontWeight: 600 }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
            <div style={{ display: "flex", padding: "20px 60px", background: accentBg, border: `2px solid rgba(255,255,255,0.3)`, borderRadius: "9999px", boxShadow: "inset 0px 4px 10px rgba(255,255,255,0.5), 0 15px 30px rgba(14, 165, 233, 0.3)" }}>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", letterSpacing: "1px" }}>{displayUsername || "Join Now"}</span>
            </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", padding: "40px", backgroundColor: glassFill, border: `3px solid ${glassBorder}`, borderRadius: "40px", boxShadow: insetShadow }}>
              <h2 style={{ fontSize: "46px", fontWeight: 900, lineHeight: 1.2, marginBottom: "25px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: accent })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    return (
                  <div style={{ display: "flex", backgroundColor: "#ffffff", borderRadius: "24px", overflow: "hidden", marginBottom: "16px", border: `2px solid ${glassBorder}` }}>
                    {renderCodeBlock(visualData, "light")}
                  </div>
                    );
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text, accent, muted: mutedText, glassBg: glassFill, glassBorder: glassBorder, accentBg: accentBg, diagramStyle: "liquid-glass" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>{diagram}</div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "10px" }}>
                                    <div style={{ marginRight: "12px", width: "16px", height: "16px", marginTop: "5px", borderRadius: "50%", background: accentBg, flexShrink: 0, boxShadow: "inset 0 2px 4px rgba(255,255,255,0.6)" }} />
                                    <p style={{ fontSize: "18px", color: mutedText, lineHeight: 1.45, margin: 0, fontWeight: 500 }}>
                                      {renderFormattedText(cleanBullet, {}, {}, "flex-start")}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, accent, text, mutedText, "•", false, {}, {})}</div>;
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <div style={{ display: "flex", marginTop: "20px", borderRadius: "24px", overflow: "hidden", border: `3px solid ${glassBorder}` }}>
                    <img src={imageUrl} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <div style={{ display: "flex", padding: "10px 24px", backgroundColor: glassFill, border: `2px solid ${glassBorder}`, borderRadius: "9999px", boxShadow: insetShadow }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: mutedText }}>{displayUsername}</span>
              </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: mutedText, fontSize: "14px", fontWeight: 800 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1.5px" }}>Swipe</span>
              <SwipeArrow color={mutedText} />
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 14. WIREFRAME 3D (Isometric technical blueprint)
  // ==========================================
  if (themeName === "wireframe-3d") {
    const po = slide.paletteOverride;
    const text = po?.text || "#000000";
    const mutedText = po?.text ? "rgba(0,0,0,0.7)" : "#333333";
    const accent = po?.primary || "#000000"; 
    const bgFill = "#f4f4f4"; // Slightly off-white for the background
    const gridLine = "rgba(0,0,0,0.06)";
    const borderThick = "3px solid #000000";
    const borderThin = "1px solid #000000";

    const fgV = Array.from({ length: 55 }, (_, i) => `M${i*20} 0 L${i*20} 1350`).join(" ");
    const fgH = Array.from({ length: 68 }, (_, i) => `M0 ${i*20} L1080 ${i*20}`).join(" ");
    const fineGridPath = `${fgV} ${fgH}`;
    const mgV = Array.from({ length: 11 }, (_, i) => `M${i*100} 0 L${i*100} 1350`).join(" ");
    const mgH = Array.from({ length: 14 }, (_, i) => `M0 ${i*100} L1080 ${i*100}`).join(" ");
    const majorGridPath = `${mgV} ${mgH}`;

    const wireCodeStyle: React.CSSProperties = {
      fontFamily: "JetBrains Mono",
      fontWeight: 600,
      backgroundColor: "rgba(0,0,0,0.05)",
      color: accent,
      padding: "4px 12px",
      borderRadius: "0px",
      margin: "0 4px",
      border: borderThin,
    };

    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: bgFill,
          color: text,
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          ...bgImageStyle,
        }}
      >
        {/* Grid background using native SVG path elements (Satori-compatible) */}
        {!hasBgImage && (
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            <svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none">
              <rect width="1080" height="1350" fill={bgFill} />
              <path d={fineGridPath} stroke={gridLine} strokeWidth="1" fill="none" />
              <path d={majorGridPath} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
            </svg>
          </div>
        )}

        <div style={{ position: "absolute", top: "120px", left: "100px", width: "920px", height: "1130px", backgroundColor: "#ffffff", border: borderThick, borderRadius: "30px", zIndex: 10, display: "flex", flexDirection: "column", padding: "60px", boxSizing: "border-box" }}>
          {renderSlideShapes(shapes)}

          {/* Top Header inside card */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "4px" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="1" y="1" width="11" height="11" stroke={text} strokeWidth="1.5" />
                <rect x="16" y="1" width="11" height="11" stroke={text} strokeWidth="1.5" />
                <rect x="1" y="16" width="11" height="11" stroke={text} strokeWidth="1.5" />
                <rect x="16" y="16" width="5" height="5" fill={text} />
              </svg>
            </div>
            {type !== "COVER" && (
              <span style={{ fontSize: "14px", fontFamily: "JetBrains Mono", fontWeight: 700, color: text, letterSpacing: "2px", textTransform: "uppercase" }}>
                {type === "CLOSING" ? "Conclusion" : "Insight"}
              </span>
            )}
            <span style={{ fontFamily: "JetBrains Mono", fontSize: "14px", fontWeight: 700, color: text }}>
              {order} / {totalSlides}
            </span>
          </div>



          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flexGrow: 1, margin: type === "COVER" ? "0" : "40px 0 0 0" }}>
            {type === "COVER" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", flexGrow: 1, justifyContent: "center" }}>
                <h1 style={{ fontSize: "76px", fontFamily: "JetBrains Mono", fontWeight: 700, lineHeight: 1.1, marginBottom: "30px", letterSpacing: "-1px" }}>
                  {renderFormattedText(title, { color: text }, { color: text }, "flex-start", wireCodeStyle)}
                </h1>
                {body && (
                  <p style={{ fontSize: "28px", color: mutedText, lineHeight: 1.4, maxWidth: "800px", fontWeight: 500, fontFamily: "JetBrains Mono" }}>
                    {renderFormattedText(body, {}, { color: mutedText }, "flex-start", wireCodeStyle)}
                  </p>
                )}
              </div>
            ) : type === "CLOSING" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                <div style={{ padding: "6px 20px", border: borderThick, fontFamily: "JetBrains Mono", fontSize: "16px", fontWeight: 700, letterSpacing: "1px", marginBottom: "40px", backgroundColor: "#ffffff", color: text, textTransform: "uppercase" }}>
                  {"> NEXT STEPS _"}
                </div>
                <h1 style={{ fontSize: "64px", fontFamily: "JetBrains Mono", fontWeight: 700, lineHeight: 1.1, marginBottom: "30px", letterSpacing: "-1.5px" }}>
                  {renderFormattedText(title, { color: text }, { color: text }, "flex-start", wireCodeStyle)}
                </h1>
                <p style={{ fontSize: "28px", color: mutedText, lineHeight: 1.4, marginBottom: "50px", maxWidth: "700px", fontWeight: 500, fontFamily: "JetBrains Mono" }}>
                  {renderFormattedText(body, {}, { color: mutedText }, "flex-start", wireCodeStyle)}
                </p>
                {/* Brutalist box CTA */}
                <div style={{ display: "flex", padding: "20px 50px", border: borderThick, backgroundColor: text }}>
                  <span style={{ fontSize: "24px", fontFamily: "JetBrains Mono", fontWeight: 700, letterSpacing: "1px", color: "#ffffff" }}>{displayUsername || "GET STARTED"}</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2 style={{ fontSize: "52px", fontFamily: "JetBrains Mono", fontWeight: 700, lineHeight: 1.2, marginBottom: "30px", letterSpacing: "-1px" }}>
                  {renderFormattedText(title, { color: text }, { color: text }, "flex-start", wireCodeStyle)}
                </h2>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(() => {
                    if (visualType === "code-block") {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", border: borderThick, padding: "16px", backgroundColor: "#ffffff" }}>
                          {renderCodeBlock(visualData, "light")}
                        </div>
                      );
                    }
                    if (visualType && visualType !== "text-only") {
                      const wireDiagramColors: ThemeColors = { text, accent, muted: mutedText, glassBg: "#ffffff", glassBorder: "#000000", accentBg: text, cardBorderRadius: "0px", iconBorderRadius: "0px", cardShadow: "none", diagramStyle: "wireframe-3d" };
                      const diagram = renderDiagram(visualType, visualData, wireDiagramColors);
                      if (diagram) {
                        return (
                          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                            <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: body ? "20px" : "0", border: borderThick, padding: "20px", backgroundColor: "#ffffff" }}>
                              {diagram}
                            </div>
                            {body && (
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                  const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                  if (!cleanBullet) return null;
                                  return (
                                    <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "16px" }}>
                                      <span style={{ marginRight: "16px", flexShrink: 0, color: text, fontSize: "22px", fontFamily: "JetBrains Mono", fontWeight: 700, marginTop: "2px" }}>{">"}</span>
                                      <p style={{ fontSize: "24px", fontFamily: "JetBrains Mono", color: mutedText, lineHeight: 1.4, margin: 0, fontWeight: 500 }}>
                                        {renderFormattedText(cleanBullet, {}, { color: mutedText }, "flex-start", wireCodeStyle)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }
                    return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, text, text, mutedText, ">", false, { fontSize: "26px", fontFamily: "JetBrains Mono", fontWeight: 500 }, { ...wireCodeStyle, fontSize: "26px", fontWeight: 700 })}</div>;
                  })()}
                  {imageUrl && imageLayout === "inline" && (
                    <div style={{ display: "flex", flexDirection: "column", marginTop: "30px", border: borderThin, overflow: "hidden" }}>
                      <img src={imageUrl} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
                        <span style={{ fontFamily: "JetBrains Mono", fontSize: "18px", fontWeight: 700, color: text }}>
                          {"> READY TO EXECUTE _"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer anchored to slide bottom — outside the main card */}
        <div style={{ position: "absolute", bottom: "36px", left: "100px", right: "60px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20, paddingTop: "12px", borderTop: borderThin }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: "8px" }}>
              <circle cx="7" cy="7" r="6" stroke={text} strokeWidth="1" />
              <circle cx="7" cy="7" r="2" fill={text} />
            </svg>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: mutedText, border: borderThin, padding: "4px 10px", backgroundColor: "#ffffff" }}>
              {displayUsername}
            </span>
          </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2 L14 8 L8 14" stroke={text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="14" y1="8" x2="2" y2="8" stroke={text} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: mutedText, fontWeight: 700 }}>NEXT</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 13. SKETCH (Blueprint / Technical Draft)
  // ==========================================
  if (themeName === "sketch") {
    const po = slide.paletteOverride;
    const text = po?.text || "#2d2d2d";
    const mutedText = "rgba(45,45,45,0.6)";
    const accent = po?.primary || "#2563eb"; // Blue accent for pills, crosshairs
    const bgFill = "#f8f9fa"; // Very light grey paper

    const badgeShadow = `0px 4px 12px rgba(0,0,0,0.06)`;
    const cardShadow = `0px 12px 32px rgba(0,0,0,0.04)`;
    const gridLineColor = "rgba(45,45,45,0.08)";
    const gridLineStrong = "rgba(45,45,45,0.15)";
    
    const sketchCodeStyle: React.CSSProperties = {
      fontFamily: "JetBrains Mono",
      fontSize: "inherit",
      backgroundColor: "#2d2d2d",
      color: "#e8e8e8",
      padding: "4px 12px",
      borderRadius: "8px",
      margin: "0 4px",
      border: `1px solid rgba(45,45,45,0.4)`,
      letterSpacing: "0px",
    };

    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: bgFill,
          color: text,
          fontFamily: "Outfit",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          ...bgImageStyle,
        }}
      >
        {/* Architectural Grid Background */}
        {!hasBgImage && (
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            <svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none">
              <defs>
                <pattern id={`skSmallGrid-${order}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke={gridLineColor} strokeWidth="0.5" />
                </pattern>
                <pattern id={`skGrid-${order}`} width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill={`url(#skSmallGrid-${order})`} />
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke={gridLineStrong} strokeWidth="1" />
                </pattern>
                <radialGradient id={`skCenterSpread-${order}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="1080" height="1350" fill={`url(#skGrid-${order})`} />
              {/* Technical Accents */}
              <circle cx="540" cy="675" r="400" fill={`url(#skCenterSpread-${order})`} />
              <circle cx="540" cy="675" r="400" stroke={gridLineStrong} strokeWidth="1" fill="none" />
              <path d="M0,675 L1080,675 M540,0 L540,1350" stroke={gridLineColor} strokeWidth="1" />
              {/* Top crosshair */}
              <path d="M 540 20 L 540 80 M 510 50 L 570 50" stroke={accent} strokeWidth="1.5" />
            </svg>
            <div style={{ position: "absolute", top: "16px", left: "16px", fontFamily: "JetBrains Mono", fontSize: "14px", color: mutedText }}>01 02 03 04 05</div>
            <div style={{ position: "absolute", bottom: "16px", right: "20px", fontFamily: "JetBrains Mono", fontSize: "14px", color: mutedText }}>1080x1350 px</div>
          </div>
        )}
        
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", zIndex: 10, padding: "80px", justifyContent: "space-between" }}>
        {renderSlideShapes(shapes)}
        
        {/* Precise Coordinate Progress */}
        <div style={{ display: "flex", justifyContent: "center", position: "absolute", top: "50px", left: "0", right: "0" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} style={{ display: "flex", width: "8px", height: "8px", borderRadius: "4px", backgroundColor: i === order ? accent : gridLineStrong }} />
            ))}
          </div>
        </div>

        {type === "COVER" ? null : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: `1px solid ${gridLineStrong}` }}>
            <div style={{ display: "flex", padding: "8px 24px", borderRadius: "100px", background: `linear-gradient(135deg, ${accent}, ${text})`, color: "#fff", boxShadow: badgeShadow, fontFamily: "Outfit", fontSize: "22px" }}>
              {type === "CLOSING" ? "conclusion" : "insight"}
            </div>
            <span style={{ fontSize: "20px", fontWeight: 400, fontFamily: "JetBrains Mono", color: mutedText }}>{pageLabel}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: type === "COVER" ? "0" : "60px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flexGrow: 1, justifyContent: "center", position: "relative" }}>
              <div style={{ display: "flex", padding: "12px 32px", borderRadius: "100px", background: `linear-gradient(135deg, ${accent}, ${text})`, color: "#fff", boxShadow: badgeShadow, fontFamily: "Outfit", fontSize: "28px", fontWeight: 500, marginBottom: "40px" }}>
                {displayUsername}
              </div>
              <h1 style={{ fontSize: "110px", fontWeight: 700, lineHeight: 1.05, marginBottom: "30px", letterSpacing: "-0.03em" }}>
                {renderFormattedText(title, { color: text }, {}, "center", sketchCodeStyle)}
              </h1>
              {body && (
                <p style={{ fontSize: "36px", color: mutedText, lineHeight: 1.4, maxWidth: "800px", fontWeight: 400 }}>
                  {renderFormattedText(body, {}, {}, "center", sketchCodeStyle)}
                </p>
              )}
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", backgroundColor: "#fff", padding: "80px 60px", borderRadius: "24px", border: `1px solid ${gridLineStrong}`, boxShadow: cardShadow }}>
              <h1 style={{ fontSize: "80px", fontWeight: 700, lineHeight: 1.1, marginBottom: "40px", letterSpacing: "-0.02em" }}>
                {renderFormattedText(title, { color: text }, {}, "center", sketchCodeStyle)}
              </h1>
              <p style={{ fontSize: "34px", color: mutedText, lineHeight: 1.4, marginBottom: "60px", maxWidth: "700px", fontWeight: 400 }}>
                {renderFormattedText(body, {}, {}, "center", sketchCodeStyle)}
              </p>
              <div style={{ display: "flex", padding: "20px 48px", borderRadius: "100px", background: `linear-gradient(135deg, ${accent}, ${text})`, color: "#fff", boxShadow: badgeShadow }}>
                <span style={{ fontSize: "32px", fontWeight: 600 }}>{displayUsername || "Join Now"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "72px", fontWeight: 700, lineHeight: 1.1, marginBottom: "40px", letterSpacing: "-0.02em" }}>
                {renderFormattedText(title, { color: text }, {}, "flex-start", sketchCodeStyle)}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    return (
                      <div style={{ display: "flex", marginBottom: "30px", borderRadius: "12px", overflow: "hidden", boxShadow: cardShadow, maxWidth: "900px" }}>
                        {renderCodeBlock(visualData, "dark", "macos")}
                      </div>
                    );
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text, accent, muted: mutedText, glassBg: "transparent", glassBorder: gridLineStrong, accentBg: accent, cardShadow: cardShadow });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "32px", backgroundColor: "#fff", borderRadius: "20px", border: `1px solid ${gridLineStrong}`, boxShadow: cardShadow, padding: "24px" }}>
                            {diagram}
                          </div>
                          {body && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                                const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                                if (!cleanBullet) return null;
                                return (
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "16px" }}>
                                    <div style={{ display: "flex", marginTop: "12px", marginRight: "20px", width: "8px", height: "8px", backgroundColor: accent, borderRadius: "50%", flexShrink: 0 }} />
                                    <p style={{ fontSize: "32px", color: text, lineHeight: 1.4, margin: 0, fontWeight: 400 }}>
                                      {renderFormattedText(cleanBullet, {}, {}, "flex-start", sketchCodeStyle)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return <div style={{ display: "flex", flexDirection: "column" }}>{renderBulletList(body, text, text, mutedText, "", true, { fontSize: "34px", lineHeight: 1.4 }, { fontSize: "34px", lineHeight: 1.4, color: text })}</div>;
                })()}
                {imageUrl && imageLayout === "inline" && (
                  <div style={{ display: "flex", marginTop: "40px", borderRadius: "20px", border: `1px solid ${gridLineStrong}`, backgroundColor: "#fff", boxShadow: cardShadow, overflow: "hidden", padding: "12px" }}>
                    <img src={imageUrl} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block", borderRadius: "12px" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "24px", borderTop: `1px solid ${gridLineStrong}` }}>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "JetBrains Mono", fontSize: "18px", color: mutedText }}>
            <span style={{ border: `1px solid ${gridLineStrong}`, padding: "6px 16px", borderRadius: "100px", backgroundColor: "#fff" }}>
              {displayUsername}
            </span>
          </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: accent, fontSize: "18px", fontFamily: "JetBrains Mono", fontWeight: 600 }}>
              <span>SWIPE</span>
              <div style={{ marginLeft: "12px", display: "flex" }}>
                <SwipeArrow color={accent} />
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // Fallback
  return <div />;
  } finally {
    currentScribbleState = null;
  }
}
