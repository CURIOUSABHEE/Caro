import React from "react";
import { CodeBlock } from "./CodeBlock";

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
  visualType?: "step-chain" | "venn" | "wheel" | "concentric" | "icon-grid" | "code-block" | "text-only";
  visualData?: any;
  websiteUrl?: string;
  scribble?: boolean;
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
export function sanitizeObjectStrings(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === "string") {
    return sanitizeTextForSatori(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectStrings);
  }
  if (typeof obj === "object") {
    const res: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        res[key] = sanitizeObjectStrings(obj[key]);
      }
    }
    return res;
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

const MouseCursorIcon = ({ color = "currentColor" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={color} style={{ marginRight: 6, transform: "rotate(-15deg)" }}>
    <path d="M4.5 3v15.2l3.8-3.8 2.7 6.4 2.6-1.1-2.7-6.4 5.3-.2z" />
  </svg>
);

// Warm Editorial theme hand-drawn transition arrows
const HandDrawnArrowRight = () => (
  <svg width="100" height="24" viewBox="0 0 100 24" fill="none" style={{ position: "absolute", bottom: "180px", right: "90px", zIndex: 10 }}>
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
  <svg width="100" height="24" viewBox="0 0 100 24" fill="none" style={{ position: "absolute", bottom: "180px", left: "90px", zIndex: 10 }}>
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
  <svg width="280" height="72" viewBox="0 0 280 72" fill="none" style={{ position: "absolute", left: "-24px", top: "-16px", zIndex: -1 }}>
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
    // Limited to Orange-Red (#ff5d2b), Blue (#0077ff), and Purple (#8a2be2) — two per slide
    const startSlide = Math.max(0, order - 1);
    const endSlide = order + 1;

    for (let s = startSlide; s <= endSlide; s++) {
      const baseOffset = s * width - order * width;
      if (s === 0) {
        // Slide 0: Cover — Orange-Red + Blue
        meshBlobs.push(
          { cx: 950 - order * width, cy: 120, r: 420, color1: "#ff5d2b", color2: "#ff863b", opacity: 0.9 },
          { cx: 310 - order * width, cy: 1180, r: 460, color1: "#0077ff", color2: "#00bfff", opacity: 0.95 }
        );
      } else {
        const layoutType = s % 3;
        if (layoutType === 1) {
          // Layout A: Blue top-right + Orange bottom-right
          meshBlobs.push(
            { cx: baseOffset + 920, cy: 150, r: 410, color1: "#0077ff", color2: "#00bfff", opacity: 0.9 },
            { cx: baseOffset + 370, cy: 1200, r: 450, color1: "#ff5d2b", color2: "#ff863b", opacity: 0.85 }
          );
        } else if (layoutType === 2) {
          // Layout B: Purple top-right + Blue bottom-right
          meshBlobs.push(
            { cx: baseOffset + 950, cy: 200, r: 430, color1: "#8a2be2", color2: "#ba55d3", opacity: 0.85 },
            { cx: baseOffset + 330, cy: 1180, r: 440, color1: "#0077ff", color2: "#00bfff", opacity: 0.9 }
          );
        } else {
          // Layout C: Orange top-right + Blue bottom-left
          meshBlobs.push(
            { cx: baseOffset + 900, cy: 100, r: 400, color1: "#ff5d2b", color2: "#ff863b", opacity: 0.9 },
            { cx: baseOffset + 250, cy: 1180, r: 460, color1: "#0077ff", color2: "#00bfff", opacity: 0.95 }
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
            {/* Soft, heavy blur filter for organic color mixing */}
            <filter id="mesh-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="130" />
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

const StepChain = ({ data, colors }: { data: any; colors: any }) => {
  const steps = data?.steps || [];
  if (!Array.isArray(steps) || steps.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", width: "100%", padding: "20px 0" }}>
      {steps.slice(0, 4).map((step: any, idx: number) => (
        <div
          key={idx}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            position: "relative",
            backgroundColor: colors.glassBg || "rgba(255, 255, 255, 0.4)",
            border: `1.5px solid ${colors.glassBorder || "rgba(0, 0, 0, 0.08)"}`,
            borderRadius: "16px",
            padding: "24px 16px",
            margin: "0 10px",
            boxSizing: "border-box",
            minHeight: "220px",
            marginTop: "20px",
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
              backgroundColor: colors.accent,
              color: colors.accent === "#ffffff" ? "#050505" : "#ffffff",
              fontSize: "20px",
              fontWeight: "bold",
              zIndex: 10,
              border: `3px solid ${colors.accent === "#ffffff" ? "#050505" : (colors.background?.color || "#ffffff")}`,
            }}
          >
            {step.number || (idx + 1)}
          </div>

          <span style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", color: colors.text, marginBottom: "8px", marginTop: "15px" }}>
            {step.label}
          </span>
          <span style={{ fontSize: "13px", textAlign: "center", color: colors.muted, lineHeight: "1.4" }}>
            {step.description}
          </span>
        </div>
      ))}
    </div>
  );
};

const Venn = ({ data, colors }: { data: any; colors: any }) => {
  if (!data?.leftLabel && !data?.rightLabel && !data?.overlapLabel) return null;
  const leftLabel = data?.leftLabel || "Concept A";
  const rightLabel = data?.rightLabel || "Concept B";
  const overlapLabel = data?.overlapLabel || "Shared";

  const isDark = colors.text === "#ffffff" || colors.text === "#e5e5e5";
  const labelBg = isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.92)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "320px", position: "relative", justifyContent: "center" }}>
      <svg width="600" height="320" viewBox="0 0 600 320" fill="none" style={{ position: "absolute", top: 0 }}>
        {/* Left Circle with translucent accent fill */}
        <circle cx="220" cy="160" r="140" fill={colors.accent} fillOpacity="0.08" stroke={colors.accent} strokeWidth="3" opacity="0.9" />
        {/* Right Circle with translucent accent fill */}
        <circle cx="380" cy="160" r="140" fill={colors.accent} fillOpacity="0.08" stroke={colors.accent} strokeWidth="3" opacity="0.9" />
      </svg>
      
      {/* Left Concept Box */}
      <div
        style={{
          position: "absolute",
          left: "90px",
          top: "125px",
          width: "140px",
          height: "70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: labelBg,
          border: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.1)"}`,
          borderRadius: "14px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "bold", color: colors.text, textAlign: "center" }}>{leftLabel}</span>
      </div>
      
      {/* Right Concept Box */}
      <div
        style={{
          position: "absolute",
          right: "90px",
          top: "125px",
          width: "140px",
          height: "70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: labelBg,
          border: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.1)"}`,
          borderRadius: "14px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "bold", color: colors.text, textAlign: "center" }}>{rightLabel}</span>
      </div>

      {/* Intersect Box */}
      <div
        style={{
          position: "absolute",
          left: "215px",
          top: "120px",
          width: "170px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accent,
          borderRadius: "16px",
          padding: "8px",
          boxSizing: "border-box",
          border: `3px solid ${colors.background?.color || (isDark ? "#050505" : "#ffffff")}`,
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff", textAlign: "center" }}>{overlapLabel}</span>
      </div>
    </div>
  );
};

const Wheel = ({ data, colors }: { data: any; colors: any }) => {
  if (!data?.centerLabel && (!data?.spokes || data.spokes.length === 0)) return null;
  const centerLabel = data?.centerLabel || "Core";
  const spokes = data?.spokes || [];
  
  const cx = 300;
  const cy = 180;

  const isDark = colors.text === "#ffffff" || colors.text === "#e5e5e5";
  const itemBg = isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.92)";

  return (
    <div style={{ display: "flex", width: "600px", height: "360px", position: "relative", justifyContent: "center", alignItems: "center" }}>
      <svg width="600" height="360" viewBox="0 0 600 360" fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
        {spokes.slice(0, 4).map((_: any, idx: number) => {
          const rx = idx % 2 === 0 ? 160 : 0;
          const ry = idx % 2 === 1 ? 115 : 0;
          const ex = cx + (idx === 0 ? rx : idx === 2 ? -rx : 0);
          const ey = cy + (idx === 1 ? ry : idx === 3 ? -ry : 0);
          return (
            <line key={idx} x1={cx} y1={cy} x2={ex} y2={ey} stroke={colors.accent} strokeWidth="3" opacity="0.35" />
          );
        })}
      </svg>

      {/* Central Core Card */}
      <div
        style={{
          position: "absolute",
          left: `${cx - 65}px`,
          top: `${cy - 65}px`,
          width: "130px",
          height: "130px",
          borderRadius: "50%",
          border: `4px solid ${colors.accent}`,
          backgroundColor: colors.background?.color || (isDark ? "#050505" : "#ffffff"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          padding: "12px",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: "bold", color: colors.text, textAlign: "center", lineHeight: "1.2" }}>{centerLabel}</span>
      </div>

      {spokes.slice(0, 4).map((spoke: any, idx: number) => {
        const rx = idx % 2 === 0 ? 160 : 0;
        const ry = idx % 2 === 1 ? 115 : 0;
        const ex = cx + (idx === 0 ? rx : idx === 2 ? -rx : 0);
        const ey = cy + (idx === 1 ? ry : idx === 3 ? -ry : 0);
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${ex - 70}px`,
              top: `${ey - 35}px`,
              width: "140px",
              height: "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: "bold", color: colors.text, textAlign: "center", backgroundColor: itemBg, padding: "8px 12px", borderRadius: "14px", border: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.1)"}`, lineHeight: "1.3" }}>
              {spoke.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Concentric = ({ data, colors }: { data: any; colors: any }) => {
  const rings = data?.rings || [];
  if (!Array.isArray(rings) || rings.length === 0) return null;

  const sortedRings = [...rings].sort((a: any, b: any) => a.depth - b.depth);
  const cx = 300;
  const cy = 180;

  const isDark = colors.text === "#ffffff" || colors.text === "#e5e5e5";
  const labelBg = isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.92)";

  return (
    <div style={{ display: "flex", width: "600px", height: "360px", position: "relative", justifyContent: "center", alignItems: "center" }}>
      <svg width="600" height="360" viewBox="0 0 600 360" fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Outer Ring Circle */}
        <circle cx={cx} cy={cy} r="150" fill={colors.accent} fillOpacity="0.04" stroke={colors.accent} strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
        {/* Middle Ring Circle */}
        <circle cx={cx} cy={cy} r="100" fill={colors.accent} fillOpacity="0.08" stroke={colors.accent} strokeWidth="2.5" opacity="0.8" />
        {/* Inner Ring Circle */}
        <circle cx={cx} cy={cy} r="55" fill={colors.accent} fillOpacity="0.15" stroke={colors.accent} strokeWidth="3.5" />
      </svg>

      {/* Concentric labels vertically stacked - with identical structure, padding, and text sizing for perfect consistency */}
      {sortedRings[0] && (
        <div style={{ position: "absolute", left: `${cx - 80}px`, top: `${cy - 18}px`, width: "160px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: "#ffffff", backgroundColor: colors.accent, border: `1.5px solid ${colors.accent}`, padding: "6px 12px", borderRadius: "16px", textAlign: "center", width: "100%", boxSizing: "border-box", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
            {sortedRings[0].ringLabel}
          </span>
        </div>
      )}

      {sortedRings[1] && (
        <div style={{ position: "absolute", left: `${cx - 80}px`, top: `${cy - 90}px`, width: "160px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: colors.text, backgroundColor: labelBg, border: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.1)"}`, padding: "6px 12px", borderRadius: "16px", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
            {sortedRings[1].ringLabel}
          </span>
        </div>
      )}

      {sortedRings[2] && (
        <div style={{ position: "absolute", left: `${cx - 80}px`, top: `${cy - 145}px`, width: "160px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: colors.muted, backgroundColor: labelBg, border: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.06)"}`, padding: "6px 12px", borderRadius: "16px", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
            {sortedRings[2].ringLabel}
          </span>
        </div>
      )}
    </div>
  );
};

const IconGrid = ({ data, colors }: { data: any; colors: any }) => {
  const items = data?.items || [];
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 0" }}>
      {items.slice(0, 4).map((item: any, idx: number) => (
        <div
          key={idx}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "46%",
            margin: "1.5% 2%",
            padding: "20px 15px",
            borderRadius: "18px",
            backgroundColor: colors.glassBg || "rgba(255, 255, 255, 0.4)",
            border: `1.5px solid ${colors.glassBorder || "rgba(0, 0, 0, 0.08)"}`,
            boxSizing: "border-box",
            minHeight: "130px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: colors.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
              border: `2px solid ${colors.accent === "#ffffff" ? "#050505" : (colors.glassBorder || "rgba(255,255,255,0.2)")}`,
            }}
          >
            {(() => {
              const iconColor = colors.accent === "#ffffff" ? "#050505" : "#ffffff";
              return renderIcon(item.icon, iconColor) || (
                <span style={{ fontSize: "24px", fontWeight: 700, color: iconColor }}>
                  {(item.label || "?").charAt(0).toUpperCase()}
                </span>
              );
            })()}
          </div>
          <span style={{ fontSize: "14px", fontWeight: "bold", textAlign: "center", color: colors.text, lineHeight: "1.3" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const renderDiagram = (
  visualType: string,
  visualData: any,
  colors: { text: string; accent: string; muted: string; glassBg?: string; glassBorder?: string; background?: any }
) => {
  if (visualType === "step-chain") return <StepChain data={visualData} colors={colors} />;
  if (visualType === "venn") return <Venn data={visualData} colors={colors} />;
  if (visualType === "wheel") return <Wheel data={visualData} colors={colors} />;
  if (visualType === "concentric") return <Concentric data={visualData} colors={colors} />;
  if (visualType === "icon-grid") return <IconGrid data={visualData} colors={colors} />;
  return null;
};

const renderCodeBlock = (visualData: any, theme: "dark" | "light") => {
  if (!visualData?.code || !visualData?.tokens) return null;
  return (
    <div style={{ display: "flex", width: "100%", justifyContent: "center", alignItems: "center", flexGrow: 1, minHeight: "360px" }}>
      <CodeBlock
        language={visualData.language || "plaintext"}
        code={visualData.code}
        highlightLines={visualData.highlightLines || []}
        tokens={visualData.tokens}
        theme={theme}
      />
    </div>
  );
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

  const resolvedCodeStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono",
    fontSize: "22px",
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
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
  const color = theme === "cyber-horizon" ? "#ea580c" : theme === "linen-rust" ? "#c5563c" : theme === "warm-editorial" ? "#e05a47" : theme === "soft-gradient" ? "#7c3aed" : theme === "mesh-glow" ? "#ec4899" : "#ffffff";

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

  return <div style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", pointerEvents: "none", zIndex: 30, display: "contents" }}>{elements}</div>;
};

// Overlay custom graphic shapes / diagrams
const renderSlideShapes = (shapes?: Shape[]) => {
  if (!shapes || shapes.length === 0) return null;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", pointerEvents: "none", zIndex: 25 }}>
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



export function renderThemeSlide(slide: RenderSlideInput): React.ReactElement {
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
  const scribbleColor = themeName === "cyber-horizon" ? "#ea580c" : themeName === "linen-rust" ? "#c5563c" : themeName === "warm-editorial" ? "#e05a47" : themeName === "soft-gradient" ? "#7c3aed" : themeName === "mesh-glow" ? "#ec4899" : "#ffffff";
  currentScribbleState = scribble && type !== "COVER" && type !== "CLOSING" ? { scribble: true, color: scribbleColor } : null;

  try {
    // ==========================================
    // THEME 1: MONOCHROME (Dark, stark, brutalist)
    // ==========================================
    if (themeName === "monochrome") {
    return (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: "#050505",
          color: "#ffffff",
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "4px", color: "#6e6e6e", textTransform: "uppercase" }}>
            {type === "COVER" ? "Introduction" : type === "CLOSING" ? "Action Item" : "Insight"}
          </span>
          <span style={{ fontSize: "14px", color: "#6e6e6e", fontWeight: 700, letterSpacing: "1px" }}>{pageLabel}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, zIndex: 10, margin: "40px 0" }}>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ fontSize: "20px", color: "#8a8a8a", marginBottom: "25px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>
                Conclusion
              </span>
              <h1 style={{ fontSize: "62px", fontWeight: 700, lineHeight: 1.25, marginBottom: "50px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, {}, {}, "center")}
              </h1>
              <div style={{ padding: "18px 45px", border: "2px solid #ffffff", borderRadius: "9999px", display: "flex", alignItems: "center", backgroundColor: "#ffffff", color: "#000000" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "0.5px" }}>{body || "Let's discuss"}</span>
              </div>
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
                    const diagram = renderDiagram(visualType, visualData, { text: "#ffffff", accent: "#ffffff", muted: "#a3a3a3", glassBg: "rgba(255, 255, 255, 0.05)", glassBorder: "rgba(255, 255, 255, 0.1)" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>{diagram}</div>
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
                  return <p style={{ fontSize: "30px", color: "#cccccc", lineHeight: 1.6, fontWeight: 400 }}>{renderFormattedText(body)}</p>;
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
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
            zIndex: 10,
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
                      const diagram = renderDiagram(visualType, visualData, { text: "#1e293b", accent: "#7c3aed", muted: "#475569", glassBg: "rgba(124, 58, 237, 0.04)", glassBorder: "rgba(124, 58, 237, 0.08)" });
                      if (diagram) {
                        return (
                          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                            <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>{diagram}</div>
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
                    return <p style={{ fontSize: "26px", color: "#334155", lineHeight: 1.6 }}>{renderFormattedText(body, {}, {}, "flex-start", lightCodeStyle)}</p>;
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
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

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 10 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#e05a47", letterSpacing: "2px", textTransform: "uppercase" }}>
              {displayUsername ? displayUsername.replace("@", "") : "CARO"}
            </span>
          </div>
          <span style={{ fontSize: "13px", color: "#e05a47", fontWeight: 800, letterSpacing: "1px" }}>{pageLabel}</span>
        </div>

        {/* Content Box */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, zIndex: 10, margin: "30px 0" }}>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              {/* Circular placeholder avatar mockup */}
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#e05a47", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "28px", fontWeight: 900, marginBottom: "25px" }}>
                {displayUsername ? displayUsername.replace("@", "").substring(0, 1).toUpperCase() : "C"}
              </div>
              <h1 style={{ fontSize: "66px", fontWeight: 700, fontFamily: "Playfair Display", lineHeight: 1.2, marginBottom: "45px", color: "#1e1b18" }}>
                {renderFormattedText(title, { color: "#e05a47" }, {}, "center")}
              </h1>
              <div style={{ borderBottom: "3px solid #e05a47", paddingBottom: "10px", display: "flex" }}>
                <span style={{ fontSize: "24px", fontWeight: 800, color: "#e05a47", letterSpacing: "1px", textTransform: "uppercase" }}>
                  {body || "Save This Roadmap"}
                </span>
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
                    const diagram = renderDiagram(visualType, visualData, { text: "#1e1b18", accent: "#e05a47", muted: "#6b6259", glassBg: "rgba(224, 90, 71, 0.04)", glassBorder: "rgba(224, 90, 71, 0.08)" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>{diagram}</div>
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
                  return <p style={{ fontSize: "28px", color: "#3d3630", lineHeight: 1.6 }}>{renderFormattedText(body, {}, {}, "flex-start", lightCodeStyle)}</p>;
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
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

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          {/* Blue Asterisk Accent Logo */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "42px", fontWeight: 800, color: "#3b82f6", transform: "translateY(-6px)" }}>
              *
            </span>
          </div>
        </div>

        {/* Content Box */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, zIndex: 10, margin: "40px 0" }}>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", position: "relative" }}>
              
              <h1 style={{ fontSize: "68px", fontWeight: 900, lineHeight: 1.15, marginBottom: "35px", letterSpacing: "-1px" }}>
                {renderFormattedText(title)}
              </h1>
              <p style={{ fontSize: "28px", color: "#374151", lineHeight: 1.5, maxWidth: "780px" }}>
                {renderFormattedText(body, {}, {}, "flex-start", lightCodeStyle)}
              </p>
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
                    const diagram = renderDiagram(visualType, visualData, { text: "#0a0a0a", accent: "#3b82f6", muted: "#374151", glassBg: "rgba(10, 10, 10, 0.04)", glassBorder: "rgba(10, 10, 10, 0.08)" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>{diagram}</div>
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
                  return <p style={{ fontSize: "28px", color: "#374151", lineHeight: 1.6 }}>{renderFormattedText(body, {}, {}, "flex-start", lightCodeStyle, { scribble, color: scribbleColor, fontSize: 28 })}</p>;
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <div style={{ display: "flex", backgroundColor: "rgba(20, 20, 20, 0.8)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "6px 16px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#a3a3a3" }}>
              {type === "COVER" ? "Introduction" : type === "CLOSING" ? "Roadmap" : `Step ${order}`}
            </span>
          </div>
          <span style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 700, letterSpacing: "1px" }}>{pageLabel}</span>
        </div>

        {/* Content Box */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, zIndex: 10, margin: "40px 0" }}>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.4)", marginBottom: "25px", textTransform: "uppercase", letterSpacing: "4px", fontWeight: 700 }}>
                Conclusion
              </span>
              <h1 style={{ fontSize: "62px", fontWeight: 700, lineHeight: 1.25, marginBottom: "50px", letterSpacing: "-1px", textTransform: "uppercase" }}>
                {renderFormattedText(title, { color: "#ea580c" }, {}, "center")}
              </h1>
              <div style={{ padding: "18px 45px", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: "9999px", display: "flex", alignItems: "center", backgroundColor: "#ffffff", color: "#000000" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "0.5px" }}>{body || "Let's connect"}</span>
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
                    const diagram = renderDiagram(visualType, visualData, { text: "#ffffff", accent: "#ea580c", muted: "#a3a3a3", glassBg: "rgba(255,255,255,0.05)", glassBorder: "rgba(255,255,255,0.1)" });
                    if (diagram) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>{diagram}</div>
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
                  return <p style={{ fontSize: "28px", color: "#cccccc", lineHeight: 1.6, fontWeight: 400 }}>{renderFormattedText(body, { color: "#ea580c" })}</p>;
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
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
                <path d={d} fill="#c5563c" opacity={opacity} />
              </svg>
            );
          }
          return <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>{diamonds}</div>;
        })()}

        {/* Custom Diagram Shapes Overlay */}
        {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} /> : null}

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(46, 43, 42, 0.55)" }}>
            {type === "COVER" ? "* Overview" : type === "CLOSING" ? "* Wrap-up" : `* Insight ${order}`}
          </span>
          <span style={{ fontSize: "13px", color: "rgba(46, 43, 42, 0.55)", fontWeight: 700 }}>{pageLabel}</span>
        </div>

        {/* Content Box */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, zIndex: 10, margin: "40px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
              <h1 style={{ fontSize: "74px", fontWeight: 700, lineHeight: 1.15, marginBottom: "30px", letterSpacing: "-1px", color: "#2e2b2a" }}>
                {renderFormattedText(title, { fontFamily: "Caveat", fontSize: "86px", color: "#c5563c", fontWeight: 400, fontStyle: "normal" })}
              </h1>
              <div style={{ width: "80px", height: "4px", backgroundColor: "#c5563c", marginBottom: "40px" }} />
              <p style={{ fontSize: "28px", color: "#5c5553", lineHeight: 1.5, maxWidth: "750px" }}>
                {renderFormattedText(body, { fontFamily: "Caveat", fontSize: "36px", color: "#c5563c", fontWeight: 400, fontStyle: "normal" }, {}, "flex-start", lightCodeStyle)}
              </p>
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
              <span style={{ fontSize: "32px", fontFamily: "Caveat", color: "#c5563c", marginBottom: "15px" }}>
                Next Steps...
              </span>
              <h1 style={{ fontSize: "64px", fontWeight: 700, lineHeight: 1.2, marginBottom: "40px", color: "#2e2b2a" }}>
                {renderFormattedText(title, { fontFamily: "Caveat", fontSize: "74px", color: "#c5563c", fontWeight: 400, fontStyle: "normal" })}
              </h1>
              <div style={{ padding: "14px 35px", border: "2px solid #c5563c", borderRadius: "4px", display: "flex", alignItems: "center", backgroundColor: "transparent", color: "#c5563c" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{body || "Join the conversation"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <h2 style={{ fontSize: "52px", fontWeight: 700, lineHeight: 1.2, marginBottom: "30px", color: "#2e2b2a", letterSpacing: "-0.5px" }}>
                {renderFormattedText(title, { fontFamily: "Caveat", fontSize: "62px", color: "#c5563c", fontWeight: 400, fontStyle: "normal" })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  if (visualType === "code-block") {
                    const codeBlock = renderCodeBlock(visualData, "light");
                    if (codeBlock) return codeBlock;
                  }
                  if (visualType && visualType !== "text-only") {
                    const diagram = renderDiagram(visualType, visualData, { text: "#2e2b2a", accent: "#c5563c", muted: "#5c5553", glassBg: "rgba(197, 86, 60, 0.03)", glassBorder: "rgba(197, 86, 60, 0.06)", background: { color: "#d8d7cf" } });
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
                                  <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <span style={{ marginRight: "10px", flexShrink: 0, color: "#c5563c", fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>*</span>
                                    <p style={{ fontSize: "20px", color: "#5c5553", lineHeight: 1.45, margin: 0 }}>
                                      {renderFormattedText(cleanBullet, { fontFamily: "Caveat", fontSize: "24px", color: "#c5563c", fontWeight: 400, fontStyle: "normal" }, {}, "flex-start", lightCodeStyle)}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
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

  // Fallback
  return <div />;
  } finally {
    currentScribbleState = null;
  }
}
