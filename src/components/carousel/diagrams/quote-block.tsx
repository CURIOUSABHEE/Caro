import React from "react";
import type { ThemeColors, QuoteData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "30px 20px" } as const;

const QUOTE = {
  maxWidth: 800,
  decorationSize: 200,
  decorationTop: -60,
  decorationOpacity: 0.12,
} as const;

const ATTRIBUTION = {
  marginTop: 36,
  dividerWidth: 45,
  dividerHeight: 3,
  dividerMargin: 16,
} as const;

const FONT = {
  quote: { size: "32px", lineHeight: 1.5 },
  attribution: { size: "18px", weight: 800, letterSpacing: "1.5px" },
  role: { size: "14px", weight: 600 },
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

const QuoteBlock = ({ data, colors }: { data: QuoteData; colors: ThemeColors }) => {
  if (!data?.quote) return null;

  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, textAlign: "center", padding: CANVAS.padding, position: "relative" }}>
      <div style={{ position: "absolute", top: `${QUOTE.decorationTop}px`, display: "flex", justifyContent: "center", width: "100%" }}>
        <span style={{ fontSize: `${QUOTE.decorationSize}px`, lineHeight: 1, color: theme.accent, opacity: QUOTE.decorationOpacity, fontFamily: "Playfair Display, serif", userSelect: "none" }}>
          &quot;
        </span>
      </div>
      <p style={{ position: "relative", fontSize: FONT.quote.size, fontFamily: "Playfair Display, serif", fontStyle: "italic", lineHeight: FONT.quote.lineHeight, color: theme.text, maxWidth: `${QUOTE.maxWidth}px`, margin: "0", ...stableText, ...multilineClamp(5) }}>
        {clampText(data.quote, 220)}
      </p>
      {data.attribution && (
        <div style={{ position: "relative", marginTop: `${ATTRIBUTION.marginTop}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: `${ATTRIBUTION.dividerWidth}px`, height: `${ATTRIBUTION.dividerHeight}px`, backgroundColor: theme.accent, marginBottom: `${ATTRIBUTION.dividerMargin}px`, borderRadius: "2px" }} />
          <span style={{ fontSize: FONT.attribution.size, fontWeight: FONT.attribution.weight, color: theme.accent, textTransform: "uppercase", letterSpacing: FONT.attribution.letterSpacing, textAlign: "center", ...stableText, ...multilineClamp(2) }}>
            {clampText(data.attribution, 56)}
          </span>
          {data.role && (
            <span style={{ fontSize: FONT.role.size, color: theme.muted, marginTop: "6px", fontWeight: FONT.role.weight, textAlign: "center", ...stableText, ...multilineClamp(2) }}>
              {clampText(data.role, 72)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(QuoteBlock);
