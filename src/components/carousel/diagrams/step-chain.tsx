import React from "react";
import type { ThemeColors, StepChainData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { maxWidth: 900, padding: "20px 0" } as const;

const CARD = {
  height: 220,
  minWidth: 180,
  padding: "32px 20px 20px",
  gap: 16,
  marginRight: 32,
} as const;

const BADGE = {
  size: 50,
  borderWidth: 3,
  offset: -25,
} as const;

const CONNECTOR = {
  width: 28,
  height: 18,
  topOffset: 16,
} as const;

const MAX_VISIBLE_STEPS = 4;

const FONT = {
  title: { size: "16px", weight: "bold" as const, lineHeight: "1.3" },
  body: { size: "13px", weight: "normal" as const, lineHeight: "1.4" },
  badge: { size: "20px", weight: "bold" as const },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeSteps(data: StepChainData) {
  return (data?.steps ?? []).slice(0, MAX_VISIBLE_STEPS);
}

function getCardShadow(colors: ThemeColors) {
  if (colors.cardShadow) return colors.cardShadow;
  const border = colors.glassBorder;
  if (border) {
    const match = border.match(/[\d.]+\)$/);
    if (match) return `0 8px 24px ${border.replace(match[0], "0.15)")}`;
  }
  return "0 8px 24px rgba(0,0,0,0.05)";
}

function computeTheme(colors: ThemeColors) {
  return {
    cardBg: colors.glassBg || "rgba(255, 255, 255, 0.4)",
    cardBorder: `1.5px solid ${colors.glassBorder || "rgba(0, 0, 0, 0.08)"}`,
    cardShadow: getCardShadow(colors),
    cardBorderRadius: colors.cardBorderRadius || "16px",
    badgeBg: colors.accentBg || colors.accent,
    badgeTextColor: colors.accent === "#ffffff" ? "#050505" : "#ffffff",
    badgeBorder: `3px solid ${colors.accent === "#ffffff" ? "#050505" : (colors.background || "#ffffff")}`,
    connectorColor: colors.accent,
    titleColor: colors.text,
    bodyColor: colors.muted,
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const StepBadge: React.FC<{
  number: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ number, theme }) => (
  <div
    style={{
      position: "absolute",
      top: `${BADGE.offset}px`,
      left: "50%",
      marginLeft: `-${BADGE.size / 2}px`,
      width: `${BADGE.size}px`,
      height: `${BADGE.size}px`,
      borderRadius: "50%",
      backgroundColor: theme.badgeBg,
      color: theme.badgeTextColor,
      border: theme.badgeBorder,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: FONT.badge.size,
      fontWeight: FONT.badge.weight,
      boxSizing: "border-box",
    }}
    aria-label={`Step ${number}`}
  >
    {number}
  </div>
));
StepBadge.displayName = "StepBadge";

const StepCard: React.FC<{
  step: { label: string; description?: string; number?: number };
  stepIndex: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ step, stepIndex, theme }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      flex: 1,
      position: "relative",
      backgroundColor: theme.cardBg,
      border: theme.cardBorder,
      boxShadow: theme.cardShadow,
      borderRadius: theme.cardBorderRadius,
      padding: CARD.padding,
      boxSizing: "border-box",
      minHeight: `${CARD.height}px`,
      maxHeight: `${CARD.height}px`,
      overflow: "hidden",
      minWidth: 0,
    }}
  >
    <StepBadge number={step.number ?? stepIndex + 1} theme={theme} />

    <span
      style={{
        fontSize: FONT.title.size,
        fontWeight: FONT.title.weight,
        textAlign: "center",
        color: theme.titleColor,
        marginBottom: "8px",
        maxWidth: "160px",
        minHeight: "42px",
        ...stableText,
        ...multilineClamp(2),
      }}
    >
      {step.label}
    </span>

    <span
      style={{
        fontSize: FONT.body.size,
        textAlign: "center",
        color: theme.bodyColor,
        lineHeight: FONT.body.lineHeight,
        ...stableText,
        ...multilineClamp(4),
      }}
    >
      {clampText(step.description ?? "", 60)}
    </span>
  </div>
));
StepCard.displayName = "StepCard";

const StepConnector: React.FC<{
  color: string;
}> = React.memo(({ color }) => (
  <div
    style={{
      position: "absolute",
      right: `-${CONNECTOR.width + 2}px`,
      top: `${CONNECTOR.topOffset}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: `${CONNECTOR.width}px`,
      flexShrink: 0,
    }}
  >
    <svg
      width={CONNECTOR.width}
      height={CONNECTOR.height}
      viewBox={`0 0 ${CONNECTOR.width} ${CONNECTOR.height}`}
      fill="none"
    >
      <line
        x1="0"
        y1={CONNECTOR.height / 2}
        x2={CONNECTOR.width * 0.7}
        y2={CONNECTOR.height / 2}
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="3,2"
        opacity="0.8"
      />
      <path
        d={`M${CONNECTOR.width * 0.54} ${CONNECTOR.height * 0.22} L${CONNECTOR.width * 0.79} ${CONNECTOR.height / 2} L${CONNECTOR.width * 0.54} ${CONNECTOR.height * 0.78}`}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
));
StepConnector.displayName = "StepConnector";

// ─── Main Component ──────────────────────────────────────────────────────────

const StepChain = ({ data, colors }: { data: StepChainData; colors: ThemeColors }) => {
  const visibleSteps = normalizeSteps(data);
  if (visibleSteps.length === 0) return null;

  const theme = computeTheme(colors);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        width: "100%",
        maxWidth: `${CANVAS.maxWidth}px`,
        padding: CANVAS.padding,
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {visibleSteps.map((step, stepIndex) => (
        <div
          key={step.label || `step-${stepIndex}`}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            flex: 1,
            position: "relative",
            minWidth: 0,
            marginRight:
              stepIndex < visibleSteps.length - 1 ? `${CARD.marginRight}px` : "0",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <StepCard step={step} stepIndex={stepIndex} theme={theme} />
          </div>

          {stepIndex < visibleSteps.length - 1 && (
            <StepConnector color={theme.connectorColor} />
          )}
        </div>
      ))}
    </div>
  );
};

export default React.memo(StepChain);
