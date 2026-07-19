import React from "react";
import type { ThemeColors, ConcentricData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { fixedCanvas, multilineClamp, stableText } from "./diagram-utils";
import { isDiagramDark } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { width: 620, height: 360 } as const;
const CENTER = { x: 300, y: 180 } as const;
const RADII = [55, 100, 150] as const;
const MAX_RINGS = 3;

const RING_CONFIGS = RADII.map((r, i) => ({
  r,
  accentFill: i === 0,
  labelX: CENTER.x + r + 38,
  labelY: CENTER.y - 6 - i * 20,
}));

const FONT = {
  label: { size: "12px", weight: "bold" as const },
} as const;

const LABEL = {
  maxWidth: 150,
  padding: "5px 10px",
  borderRadius: "12px",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  const isDark = isDiagramDark(colors.text);
  return {
    labelBg: isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.92)",
    accent: colors.accent,
    accentBg: colors.accentBg,
    text: colors.text,
    glassBg: colors.glassBg,
    glassBorder: colors.glassBorder,
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const ConcentricRings: React.FC<{ theme: ReturnType<typeof computeTheme> }> = React.memo(({ theme }) => (
  <svg width={CANVAS.width} height={CANVAS.height} viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`} fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
    <circle cx={CENTER.x} cy={CENTER.y} r={RADII[2]} fill={theme.accent} fillOpacity="0.05" stroke={theme.accent} strokeWidth="2" strokeDasharray="6,6" opacity="0.7" />
    <circle cx={CENTER.x} cy={CENTER.y} r={RADII[1]} fill={theme.accent} fillOpacity="0.1" stroke={theme.accent} strokeWidth="3" opacity="0.85" />
    <circle cx={CENTER.x} cy={CENTER.y} r={RADII[0]} fill={theme.accent} fillOpacity="0.22" stroke={theme.accent} strokeWidth="4" />

    {RING_CONFIGS.slice(0, MAX_RINGS).map((rc, ringIndex) => {
      const dy = rc.labelY - CENTER.y;
      const dx = Math.sqrt(Math.max(0, rc.r * rc.r - dy * dy));
      const tickStartX = CENTER.x + dx;
      return (
        <line key={ringIndex} x1={tickStartX} y1={rc.labelY} x2={rc.labelX - 4} y2={rc.labelY} stroke={theme.accent} strokeWidth="1.5" opacity="0.6" />
      );
    })}
  </svg>
));
ConcentricRings.displayName = "ConcentricRings";

const ConcentricLabel: React.FC<{
  ring: { ringLabel: string };
  config: (typeof RING_CONFIGS)[number];
  isInner: boolean;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ ring, config, isInner, theme }) => {
  const bg = isInner && theme.accentBg
    ? { background: theme.accentBg }
    : { backgroundColor: isInner ? theme.accent : (theme.glassBg || theme.labelBg) };

  return (
    <div
      style={{
        position: "absolute",
        left: `${config.labelX}px`,
        top: `${config.labelY - 12}px`,
        display: "flex",
        alignItems: "center",
        maxWidth: `${LABEL.maxWidth}px`,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: FONT.label.size,
          fontWeight: FONT.label.weight,
          color: isInner ? "#ffffff" : theme.text,
          ...bg,
          border: `1.5px solid ${isInner ? theme.accent : (theme.glassBorder || "rgba(0,0,0,0.1)")}`,
          padding: LABEL.padding,
          borderRadius: LABEL.borderRadius,
          lineHeight: 1.15,
          textShadow: isInner ? "0 1px 2px rgba(0,0,0,0.15)" : "none",
          ...stableText,
          ...multilineClamp(2),
        }}
      >
        {clampText(ring.ringLabel, 32)}
      </span>
    </div>
  );
});
ConcentricLabel.displayName = "ConcentricLabel";

// ─── Main Component ──────────────────────────────────────────────────────────

const Concentric = ({ data, colors }: { data: ConcentricData; colors: ThemeColors }) => {
  const rings = data?.rings ?? [];
  if (rings.length === 0) return null;

  const sortedRings = [...rings].sort((a, b) => a.depth - b.depth).slice(0, MAX_RINGS);
  const theme = computeTheme(colors);

  return (
    <div style={fixedCanvas(CANVAS.width, CANVAS.height)}>
      <ConcentricRings theme={theme} />
      {sortedRings.map((ring, ringIndex) => (
        <ConcentricLabel
          key={ring.ringLabel || `ring-${ringIndex}`}
          ring={ring}
          config={RING_CONFIGS[ringIndex]}
          isInner={ringIndex === 0}
          theme={theme}
        />
      ))}
    </div>
  );
};

export default React.memo(Concentric);
