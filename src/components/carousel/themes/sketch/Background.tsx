import React from "react";
import type { ThemeTokens } from "../tokens/types";

interface SketchBackgroundProps {
  order: number;
  tokens: ThemeTokens;
}

export function SketchBackground({ order, tokens }: SketchBackgroundProps) {
  const accent = tokens.colors.accent;
  const gridLineColor = "rgba(45,45,45,0.08)";
  const gridLineStrong = "rgba(45,45,45,0.15)";
  const mutedText = tokens.colors.mutedText;

  return (
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
        <circle cx="540" cy="675" r="400" fill={`url(#skCenterSpread-${order})`} />
        <circle cx="540" cy="675" r="400" stroke={gridLineStrong} strokeWidth="1" fill="none" />
        <path d="M0,675 L1080,675 M540,0 L540,1350" stroke={gridLineColor} strokeWidth="1" />
        <path d="M 540 20 L 540 80 M 510 50 L 570 50" stroke={accent} strokeWidth="1.5" />
      </svg>
      <div style={{ position: "absolute", top: "16px", left: "16px", fontFamily: "JetBrains Mono", fontSize: "14px", color: mutedText }}>01 02 03 04 05</div>
      <div style={{ position: "absolute", bottom: "16px", right: "20px", fontFamily: "JetBrains Mono", fontSize: "14px", color: mutedText }}>1080x1350 px</div>
    </div>
  );
}
