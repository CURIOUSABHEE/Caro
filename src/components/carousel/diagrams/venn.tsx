import React from "react";
import type { ThemeColors, VennData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { fixedCanvas, multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont, isDiagramDark } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { width: 620, height: 360 } as const;

const CIRCLES = {
  leftCx: 215,
  rightCx: 405,
  cy: 175,
  r: 155,
  strokeWidth: 3.5,
} as const;

const OVERLAP = {
  cx: 310,
  cy: 175,
  rx: 55,
  ry: 120,
  fillOpacity: 0.18,
} as const;

const LABEL = {
  width: 115,
  height: 30,
  borderRadius: "15px",
  borderWidth: 1.5,
} as const;

const LEFT_LABEL = { x: 60, y: 155 } as const;
const RIGHT_LABEL = { x: 445, y: 155 } as const;

const OVERLAP_LABEL = {
  x: 268,
  y: 148,
  width: 84,
  height: 54,
  borderRadius: "14px",
} as const;

const BODY_TEXT = {
  topOffset: 210,
  rowHeight: 20,
  width: 115,
  size: "11px",
  weight: 500,
} as const;

const LEFT_POINTS = { x: 60 } as const;
const RIGHT_POINTS = { x: 445 } as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  const isDark = isDiagramDark(colors.text);
  const fontFamily = diagramFont(colors);
  return {
    fontFamily,
    labelBg: isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.95)",
    bodyTextColor: isDark ? "rgba(255,255,255,0.75)" : "rgba(30,30,30,0.75)",
    accent: colors.accent,
    text: colors.text,
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const VennCircles: React.FC<{ accent: string }> = React.memo(({ accent }) => (
  <svg width={CANVAS.width} height={CANVAS.height} viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`} fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
    <circle cx={CIRCLES.leftCx} cy={CIRCLES.cy} r={CIRCLES.r} fill={accent} fillOpacity="0.05" stroke={accent} strokeWidth={CIRCLES.strokeWidth} opacity="0.85" />
    <circle cx={CIRCLES.rightCx} cy={CIRCLES.cy} r={CIRCLES.r} fill={accent} fillOpacity="0.05" stroke={accent} strokeWidth={CIRCLES.strokeWidth} opacity="0.85" />
    <ellipse cx={OVERLAP.cx} cy={OVERLAP.cy} rx={OVERLAP.rx} ry={OVERLAP.ry} fill={accent} fillOpacity={OVERLAP.fillOpacity} />
  </svg>
));
VennCircles.displayName = "VennCircles";

const VennSideLabel: React.FC<{
  label: string;
  x: number;
  y: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ label, x, y, theme }) => (
  <div style={{ position: "absolute", left: `${x}px`, top: `${y}px`, width: `${LABEL.width}px`, minHeight: `${LABEL.height}px`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: theme.labelBg, border: `${LABEL.borderWidth}px solid ${theme.accent}`, borderRadius: LABEL.borderRadius, padding: "4px 8px", boxSizing: "border-box", overflow: "hidden" }}>
    <span style={{ fontSize: label.length > 15 ? "11px" : "13px", fontWeight: 700, fontFamily: theme.fontFamily, color: theme.text, textAlign: "center", lineHeight: 1.15, ...stableText, ...multilineClamp(2) }}>
      {clampText(label, 26)}
    </span>
  </div>
));
VennSideLabel.displayName = "VennSideLabel";

const VennOverlapLabel: React.FC<{
  overlapLabel: string;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ overlapLabel, theme }) => {
  const words = overlapLabel.split(" ");
  return (
    <div style={{ position: "absolute", left: `${OVERLAP_LABEL.x}px`, top: `${OVERLAP_LABEL.y}px`, width: `${OVERLAP_LABEL.width}px`, height: `${OVERLAP_LABEL.height}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: theme.accent, borderRadius: OVERLAP_LABEL.borderRadius, padding: "6px", boxSizing: "border-box", overflow: "hidden" }}>
      <span style={{ fontSize: words[0].length > 12 ? "10px" : "12px", fontWeight: 700, fontFamily: theme.fontFamily, color: "#ffffff", textAlign: "center", lineHeight: 1.1, ...stableText, ...multilineClamp(1) }}>
        {clampText(words[0], 14)}
      </span>
      {words.length > 1 && (
        <span style={{ fontSize: "10px", fontWeight: 600, fontFamily: theme.fontFamily, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.1, ...stableText, ...multilineClamp(2) }}>
          {clampText(words.slice(1).join(" "), 18)}
        </span>
      )}
    </div>
  );
});
VennOverlapLabel.displayName = "VennOverlapLabel";

const VennPoints: React.FC<{
  points: string[];
  x: number;
  color: string;
  fontFamily: string;
}> = React.memo(({ points, x, color, fontFamily }) => (
  <>
    {points.map((pt, pointIndex) => (
      <div key={`point-${x}-${pointIndex}`} style={{ position: "absolute", left: `${x}px`, top: `${BODY_TEXT.topOffset + pointIndex * BODY_TEXT.rowHeight}px`, width: `${BODY_TEXT.width}px`, display: "flex", justifyContent: "center" }}>
        <span style={{ fontSize: BODY_TEXT.size, fontWeight: BODY_TEXT.weight, fontFamily, color, textAlign: "center", lineHeight: 1.15, ...stableText, ...multilineClamp(2) }}>
          {clampText(pt, 28)}
        </span>
      </div>
    ))}
  </>
));
VennPoints.displayName = "VennPoints";

// ─── Main Component ──────────────────────────────────────────────────────────

const Venn = ({ data, colors }: { data: VennData; colors: ThemeColors }) => {
  if (!data?.leftLabel && !data?.rightLabel && !data?.overlapLabel) return null;

  const leftLabel = data?.leftLabel ?? "Concept A";
  const rightLabel = data?.rightLabel ?? "Concept B";
  const overlapLabel = data?.overlapLabel ?? "Shared";
  const leftPoints: string[] = Array.isArray(data?.leftPoints) ? data.leftPoints.slice(0, 2) : [];
  const rightPoints: string[] = Array.isArray(data?.rightPoints) ? data.rightPoints.slice(0, 2) : [];

  const theme = computeTheme(colors);

  return (
    <div style={fixedCanvas(CANVAS.width, CANVAS.height)}>
      <VennCircles accent={theme.accent} />
      <VennSideLabel label={leftLabel} x={LEFT_LABEL.x} y={LEFT_LABEL.y} theme={theme} />
      <VennSideLabel label={rightLabel} x={RIGHT_LABEL.x} y={RIGHT_LABEL.y} theme={theme} />
      <VennOverlapLabel overlapLabel={overlapLabel} theme={theme} />
      <VennPoints points={leftPoints} x={LEFT_POINTS.x} color={theme.bodyTextColor} fontFamily={theme.fontFamily} />
      <VennPoints points={rightPoints} x={RIGHT_POINTS.x} color={theme.bodyTextColor} fontFamily={theme.fontFamily} />
    </div>
  );
};

export default React.memo(Venn);
