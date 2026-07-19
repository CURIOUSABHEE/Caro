import React from "react";
import type { ThemeColors, SequenceData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "8px 0", bottomMargin: "16px" } as const;

const PARTICIPANT = {
  padding: "8px 12px",
  minWidth: 80,
  borderWidth: 2,
} as const;

const LIFELINE = {
  width: 2,
  marginTop: 8,
  offset: -10,
} as const;

const ARROW = {
  height: 12,
  labelMargin: 4,
  bottomMargin: 10,
} as const;

const STEP_GAP = 38;

const MAX_PARTICIPANTS = 4;
const MAX_STEPS = 6;

const FONT = {
  participant: { size: "11px", weight: "bold" as const },
  label: { size: "10px", weight: 600 },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  const wf = isWireframeDiagram(colors);
  return {
    wf,
    fontFamily: diagramFont(colors),
    participantBg: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.5)"),
    participantBorder: `2px solid ${colors.accent}`,
    lifelineColor: colors.accent,
    accent: colors.accent,
    muted: colors.muted,
    cardBorderRadius: wf ? "0px" : "10px",
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const ParticipantHeader: React.FC<{
  name: string;
  lifelineHeight: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ name, lifelineHeight, theme }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: PARTICIPANT.padding,
        border: theme.participantBorder,
        borderRadius: theme.cardBorderRadius,
        backgroundColor: theme.participantBg,
        minWidth: `${PARTICIPANT.minWidth}px`,
        maxWidth: "120px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: FONT.participant.size, fontWeight: FONT.participant.weight, fontFamily: theme.fontFamily, color: theme.accent, textAlign: "center", lineHeight: 1.15, ...stableText, ...multilineClamp(2) }}>
        {clampText(name, 24)}
      </span>
    </div>
    <div style={{ width: `${LIFELINE.width}px`, height: `${lifelineHeight}px`, backgroundColor: theme.lifelineColor, opacity: 0.25, marginTop: `${LIFELINE.marginTop}px` }} />
  </div>
));
ParticipantHeader.displayName = "ParticipantHeader";

const SequenceArrow: React.FC<{
  step: { label: string; from: number; to: number };
  participantCount: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ step, participantCount, theme }) => {
  const fromPct = ((step.from + 0.5) / participantCount) * 100;
  const toPct = ((step.to + 0.5) / participantCount) * 100;
  const leftPct = Math.min(fromPct, toPct);
  const widthPct = Math.abs(toPct - fromPct);
  const goingRight = toPct > fromPct;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", marginBottom: `${ARROW.bottomMargin}px` }}>
      <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: `${ARROW.labelMargin}px` }}>
        <span style={{ fontSize: FONT.label.size, fontWeight: FONT.label.weight, fontFamily: theme.fontFamily, color: theme.muted, textAlign: "center", lineHeight: 1.2, maxWidth: "75%", ...stableText, ...multilineClamp(2) }}>
          {clampText(step.label, 42)}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "row", width: "100%", alignItems: "center", height: `${ARROW.height}px` }}>
        <div style={{ width: `${leftPct}%`, height: "2px", flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: `${Math.max(widthPct, 8)}%`, flexShrink: 0 }}>
          <div style={{ flex: 1, height: "2px", backgroundColor: theme.accent }} />
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
            <polygon points={goingRight ? "2,1 8,5 2,9" : "8,1 2,5 8,9"} fill={theme.accent} />
          </svg>
        </div>
      </div>
    </div>
  );
});
SequenceArrow.displayName = "SequenceArrow";

// ─── Main Component ──────────────────────────────────────────────────────────

const Sequence = ({ data, colors }: { data: SequenceData; colors: ThemeColors }) => {
  const participants = (data?.participants ?? []).slice(0, MAX_PARTICIPANTS);
  const steps = (data?.steps ?? []).slice(0, MAX_STEPS);
  if (participants.length === 0) return null;

  const theme = computeTheme(colors);
  const lifelineHeight = steps.length * STEP_GAP + 20;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: CANVAS.padding }}>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: CANVAS.bottomMargin }}>
        {participants.map((participant, participantIndex) => (
          <ParticipantHeader
            key={participant || `participant-${participantIndex}`}
            name={participant}
            lifelineHeight={lifelineHeight}
            theme={theme}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: `${LIFELINE.offset}px` }}>
        {steps.map((step, stepIndex) => (
          <SequenceArrow
            key={step.label || `step-${stepIndex}`}
            step={step}
            participantCount={participants.length}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(Sequence);
