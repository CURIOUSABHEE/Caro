import React from "react";
import type { ThemeColors, TimelineData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "16px 0" } as const;

const TRACK = {
  top: "14px",
  left: "8%",
  right: "8%",
  height: "3px",
  opacity: 0.35,
} as const;

const DOT = {
  size: 28,
  marginBottom: 12,
} as const;

const CARD = {
  padding: "10px 8px",
  minHeight: 72,
  itemPadding: "0 6px",
} as const;

const FONT = {
  date: { size: "11px", weight: 800, letterSpacing: "0.5px" },
  title: { size: "12px", weight: "bold" as const, lineHeight: "1.3" },
  description: { size: "10px", lineHeight: "1.35" },
  dotNumber: { size: "10px", weight: 800 },
} as const;

const MAX_EVENTS = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  const wf = isWireframeDiagram(colors);
  return {
    wf,
    fontFamily: diagramFont(colors),
    accent: colors.accent,
    text: colors.text,
    muted: colors.muted,
    background: colors.background || "#ffffff",
    cardBg: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.45)"),
    cardBorder: `${wf ? "2" : "1.5"}px solid ${colors.accent}`,
    cardBorderRadius: wf ? "0px" : (colors.cardBorderRadius || "14px"),
    dotBg: wf ? "#ffffff" : colors.accent,
    dotBorder: wf ? `2px solid ${colors.accent}` : `3px solid ${colors.background || "#ffffff"}`,
    dotTextColor: wf ? colors.accent : "#ffffff",
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const TimelineDot: React.FC<{
  index: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ index, theme }) => (
  <div
    style={{
      width: `${DOT.size}px`,
      height: `${DOT.size}px`,
      borderRadius: theme.wf ? "0px" : "50%",
      backgroundColor: theme.dotBg,
      border: theme.dotBorder,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: `${DOT.marginBottom}px`,
      flexShrink: 0,
    }}
  >
    <span style={{ fontSize: FONT.dotNumber.size, fontWeight: FONT.dotNumber.weight, fontFamily: theme.fontFamily, color: theme.dotTextColor }}>
      {index + 1}
    </span>
  </div>
));
TimelineDot.displayName = "TimelineDot";

const TimelineCard: React.FC<{
  event: { date: string; title: string; description?: string };
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ event, theme }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: theme.cardBg,
      border: theme.cardBorder,
      borderRadius: theme.cardBorderRadius,
      padding: CARD.padding,
      minHeight: `${CARD.minHeight}px`,
      width: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
      minWidth: 0,
    }}
  >
    <span style={{ fontSize: FONT.title.size, fontWeight: FONT.title.weight, fontFamily: theme.fontFamily, color: theme.text, textAlign: "center", lineHeight: FONT.title.lineHeight, marginBottom: event.description ? "4px" : "0", ...stableText, ...multilineClamp(2) }}>
      {clampText(event.title, 30)}
    </span>
    {event.description && (
      <span style={{ fontSize: FONT.description.size, color: theme.muted, textAlign: "center", lineHeight: FONT.description.lineHeight, ...stableText, ...multilineClamp(2) }}>
        {clampText(event.description, 44)}
      </span>
    )}
  </div>
));
TimelineCard.displayName = "TimelineCard";

// ─── Main Component ──────────────────────────────────────────────────────────

const Timeline = ({ data, colors }: { data: TimelineData; colors: ThemeColors }) => {
  const events = (data?.events ?? []).slice(0, MAX_EVENTS);
  if (events.length === 0) return null;

  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: CANVAS.padding }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", width: "100%", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: TRACK.top,
            left: TRACK.left,
            right: TRACK.right,
            height: TRACK.height,
            backgroundColor: theme.accent,
            opacity: TRACK.opacity,
          }}
        />
        {events.map((event, eventIndex) => (
          <div
            key={event.date || `event-${eventIndex}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              position: "relative",
              padding: CARD.itemPadding,
              minWidth: 0,
            }}
          >
            <TimelineDot index={eventIndex} theme={theme} />
            <span style={{ fontSize: FONT.date.size, fontWeight: FONT.date.weight, fontFamily: theme.fontFamily, color: theme.accent, textTransform: "uppercase", letterSpacing: FONT.date.letterSpacing, marginBottom: "6px", textAlign: "center", ...stableText, ...multilineClamp(1) }}>
              {clampText(event.date, 16)}
            </span>
            <TimelineCard event={event} theme={theme} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(Timeline);
