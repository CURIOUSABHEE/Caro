import React from "react";
import type { ThemeColors, StatData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "30px" } as const;

const FONT = {
  number: { size: "96px", weight: 900, letterSpacing: "0px", lineHeight: 1 },
  label: { size: "24px", weight: 700, letterSpacing: "0px", lineHeight: 1.3, maxWidth: 600 },
  context: { size: "16px", weight: 500, lineHeight: 1.5, maxWidth: 600 },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  return {
    accent: colors.accent,
    text: colors.text,
    muted: colors.muted,
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────

const StatDisplay = ({ data, colors }: { data: StatData; colors: ThemeColors }) => {
  if (!data?.number) return null;

  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, textAlign: "center", padding: CANVAS.padding }}>
      <span style={{ fontSize: FONT.number.size, fontWeight: FONT.number.weight, lineHeight: FONT.number.lineHeight, color: theme.accent, letterSpacing: FONT.number.letterSpacing, textAlign: "center", maxWidth: "100%", ...stableText, ...multilineClamp(1) }}>
        {clampText(data.number, 18)}
      </span>
      {data.label && (
        <span style={{ fontSize: FONT.label.size, fontWeight: FONT.label.weight, color: theme.text, marginTop: "20px", maxWidth: `${FONT.label.maxWidth}px`, lineHeight: FONT.label.lineHeight, letterSpacing: FONT.label.letterSpacing, ...stableText, ...multilineClamp(2) }}>
          {clampText(data.label, 72)}
        </span>
      )}
      {data.context && (
        <span style={{ fontSize: FONT.context.size, color: theme.muted, marginTop: "12px", maxWidth: `${FONT.context.maxWidth}px`, lineHeight: FONT.context.lineHeight, fontWeight: FONT.context.weight, ...stableText, ...multilineClamp(3) }}>
          {clampText(data.context, 130)}
        </span>
      )}
    </div>
  );
};

export default React.memo(StatDisplay);
