import React from "react";
import type { ThemeColors, WheelData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { fixedCanvas, multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont, isDiagramDark } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { width: 600, height: 360 } as const;
const CENTER = { x: 300, y: 180 } as const;
const SPOKE_RADIUS = 145;
const CENTER_RADIUS = 58;
const CENTER_DIAMETER = CENTER_RADIUS * 2;
const CONNECTOR_INNER = 60;
const CONNECTOR_OUTER = SPOKE_RADIUS - 45;
const MAX_SPOKES = 6;

const CARD = {
  defaultWidth: 130,
  compactWidth: 110,
  heightWithDesc: 64,
  heightWithoutDesc: 44,
  compactThreshold: 5,
} as const;

const FONT = {
  centerLabel: { size: "13px", weight: "bold" as const, lineHeight: "1.2" },
  spokeLabel: { size: "13px", weight: "bold" as const, lineHeight: "1.3" },
  spokeCompact: { size: "11px", weight: "bold" as const, lineHeight: "1.3" },
  spokeDesc: { size: "10px", lineHeight: "1.3" },
} as const;

const START_ANGLE = -Math.PI / 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeSpokes(data: WheelData) {
  const centerLabel = data?.centerLabel ?? "Core";
  const spokes = (data?.spokes ?? []).slice(0, MAX_SPOKES);
  return { centerLabel, spokes };
}

function polarToCartesian(angle: number, radius: number) {
  return {
    x: CENTER.x + Math.cos(angle) * radius,
    y: CENTER.y + Math.sin(angle) * radius,
  };
}

function computeTheme(colors: ThemeColors) {
  const isDark = isDiagramDark(colors.text);
  const fallbackBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const fallbackBg = isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.92)";

  return {
    cardBg: colors.glassBg || fallbackBg,
    cardBorder: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.1)"}`,
    centerBg: colors.accentBg || colors.glassBg || fallbackBg,
    centerBorder: colors.accentBg
      ? `4px solid ${colors.accent}`
      : `2px solid ${colors.glassBorder || fallbackBorder}`,
    centerLabelColor: colors.accentBg ? "#ffffff" : colors.text,
    spokeLabelColor: colors.text,
    spokeDescColor: colors.muted,
    lineColor: colors.accent,
    fontFamily: diagramFont(colors),
  };
}

function getCardDimensions(spokeCount: number, hasDescription: boolean) {
  const isCompact = spokeCount >= CARD.compactThreshold;
  return {
    width: isCompact ? CARD.compactWidth : CARD.defaultWidth,
    height: hasDescription ? CARD.heightWithDesc : CARD.heightWithoutDesc,
    labelFont: isCompact ? FONT.spokeCompact : FONT.spokeLabel,
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const WheelConnector: React.FC<{
  angle: number;
  color: string;
}> = React.memo(({ angle, color }) => {
  const start = polarToCartesian(angle, CONNECTOR_INNER);
  const end = polarToCartesian(angle, CONNECTOR_OUTER);
  return (
    <line
      x1={start.x}
      y1={start.y}
      x2={end.x}
      y2={end.y}
      stroke={color}
      strokeWidth="2.5"
      opacity="0.35"
    />
  );
});
WheelConnector.displayName = "WheelConnector";

const WheelCenter: React.FC<{
  label: string;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ label, theme }) => (
  <div
    style={{
      position: "absolute",
      left: `${CENTER.x - CENTER_RADIUS}px`,
      top: `${CENTER.y - CENTER_RADIUS}px`,
      width: `${CENTER_DIAMETER}px`,
      height: `${CENTER_DIAMETER}px`,
      borderRadius: "50%",
      border: theme.centerBorder,
      backgroundColor: theme.centerBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px",
      boxSizing: "border-box",
      overflow: "hidden",
    }}
  >
    <span
      style={{
        fontSize: FONT.centerLabel.size,
        fontWeight: FONT.centerLabel.weight,
        color: theme.centerLabelColor,
        textAlign: "center",
        lineHeight: FONT.centerLabel.lineHeight,
        ...stableText,
        ...multilineClamp(3),
      }}
    >
      {clampText(label, 32)}
    </span>
  </div>
));
WheelCenter.displayName = "WheelCenter";

const WheelSpoke: React.FC<{
  label: string;
  description?: string;
  angle: number;
  spokeCount: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ label, description, angle, spokeCount, theme }) => {
  const pos = polarToCartesian(angle, SPOKE_RADIUS);
  const { width, height, labelFont } = getCardDimensions(spokeCount, !!description);

  return (
    <div
      style={{
        position: "absolute",
        left: `${pos.x - width / 2}px`,
        top: `${pos.y - height / 2}px`,
        width: `${width}px`,
        minHeight: `${height}px`,
        maxHeight: `${height}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.cardBg,
        padding: description ? "8px 10px" : "7px 10px",
        borderRadius: "12px",
        border: theme.cardBorder,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize: labelFont.size,
          fontWeight: labelFont.weight,
          color: theme.spokeLabelColor,
          textAlign: "center",
          lineHeight: labelFont.lineHeight,
          ...stableText,
          ...multilineClamp(description ? 2 : 1),
        }}
      >
        {clampText(label, 16)}
      </span>
      {description && (
        <span
          style={{
            fontSize: FONT.spokeDesc.size,
            color: theme.spokeDescColor,
            textAlign: "center",
            lineHeight: FONT.spokeDesc.lineHeight,
            marginTop: "3px",
            ...stableText,
            ...multilineClamp(2),
          }}
        >
          {clampText(description, 30)}
        </span>
      )}
    </div>
  );
});
WheelSpoke.displayName = "WheelSpoke";

// ─── Main Component ──────────────────────────────────────────────────────────

const Wheel = ({ data, colors }: { data: WheelData; colors: ThemeColors }) => {
  const { centerLabel, spokes } = normalizeSpokes(data);
  if (!centerLabel && spokes.length === 0) return null;

  const spokeCount = spokes.length;
  const angleStep = (2 * Math.PI) / Math.max(spokeCount, 1);
  const theme = computeTheme(colors);

  const angles = spokes.map((_, idx) => START_ANGLE + idx * angleStep);

  return (
    <div
      style={fixedCanvas(CANVAS.width, CANVAS.height)}
    >
      <svg
        width={CANVAS.width}
        height={CANVAS.height}
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        fill="none"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {angles.map((angle, idx) => (
          <WheelConnector key={idx} angle={angle} color={theme.lineColor} />
        ))}
      </svg>

      <WheelCenter label={centerLabel} theme={theme} />

      {spokes.map((spoke, idx) => (
        <WheelSpoke
          key={spoke.label ?? idx}
          label={spoke.label}
          description={spoke.description}
          angle={angles[idx]}
          spokeCount={spokeCount}
          theme={theme}
        />
      ))}
    </div>
  );
};

export default React.memo(Wheel);
