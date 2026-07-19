import React from "react";
import type { ThemeColors, BeforeAfterData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont, isDiagramDark } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "10px 0", gap: "16px" } as const;

const COLUMN = {
  padding: "20px 16px",
  minHeight: 200,
  markerMarginRight: 8,
  itemMarginBottom: 10,
} as const;

const ARROW = { size: 32 } as const;

const FONT = {
  title: { size: "13px", weight: 800, letterSpacing: "1px" },
  item: { size: "12px", weight: 500, lineHeight: "1.4" },
  marker: { size: "13px", weight: 800 },
} as const;

const MAX_ITEMS = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  const wf = isWireframeDiagram(colors);
  const isDark = isDiagramDark(colors.text);
  return {
    wf,
    fontFamily: diagramFont(colors),
    beforeBg: wf ? "#ffffff" : (isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)"),
    afterBg: wf ? colors.accent : (isDark ? "rgba(34, 197, 94, 0.12)" : "rgba(34, 197, 94, 0.08)"),
    beforeAccent: wf ? colors.text : "#ef4444",
    afterAccent: wf ? colors.accent : "#22c55e",
    accent: colors.accent,
    text: colors.text,
    cardBorderRadius: wf ? "0px" : (colors.cardBorderRadius || "16px"),
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const BeforeAfterColumn: React.FC<{
  title: string;
  items: string[];
  bg: string;
  accentColor: string;
  marker: string;
  inverted?: boolean;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ title, items, bg, accentColor, marker, inverted, theme }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      flex: 1,
      backgroundColor: bg,
      border: `2px solid ${accentColor}`,
      borderRadius: theme.cardBorderRadius,
      padding: COLUMN.padding,
      boxSizing: "border-box",
      minHeight: `${COLUMN.minHeight}px`,
      overflow: "hidden",
      minWidth: 0,
    }}
  >
    <span style={{ fontSize: FONT.title.size, fontWeight: FONT.title.weight, fontFamily: theme.fontFamily, color: inverted ? "#ffffff" : accentColor, textTransform: "uppercase", letterSpacing: FONT.title.letterSpacing, marginBottom: "16px", textAlign: "center", ...stableText, ...multilineClamp(2) }}>
      {clampText(title, 26)}
    </span>
    {items.map((item, itemIndex) => (
      <div key={item || `item-${itemIndex}`} style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", marginBottom: `${COLUMN.itemMarginBottom}px` }}>
        <span style={{ fontSize: FONT.marker.size, fontWeight: FONT.marker.weight, fontFamily: theme.fontFamily, color: inverted ? "#ffffff" : accentColor, marginRight: `${COLUMN.markerMarginRight}px`, flexShrink: 0 }}>
          {marker}
        </span>
        <span style={{ fontSize: FONT.item.size, fontFamily: theme.fontFamily, color: inverted ? "#ffffff" : theme.text, lineHeight: FONT.item.lineHeight, fontWeight: FONT.item.weight, ...stableText, ...multilineClamp(2) }}>
          {clampText(item, 54)}
        </span>
      </div>
    ))}
  </div>
));
BeforeAfterColumn.displayName = "BeforeAfterColumn";

const BeforeAfterArrow: React.FC<{ color: string }> = React.memo(({ color }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width={ARROW.size} height={ARROW.size} viewBox={`0 0 ${ARROW.size} ${ARROW.size}`}>
      <path d={`M8 ${ARROW.size / 2} H${ARROW.size * 0.625} M${ARROW.size * 0.5} ${ARROW.size * 0.375} L${ARROW.size * 0.6875} ${ARROW.size / 2} L${ARROW.size * 0.5} ${ARROW.size * 0.625}`} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
));
BeforeAfterArrow.displayName = "BeforeAfterArrow";

// ─── Main Component ──────────────────────────────────────────────────────────

const BeforeAfter = ({ data, colors }: { data: BeforeAfterData; colors: ThemeColors }) => {
  const beforeItems = (data?.beforeItems ?? []).slice(0, MAX_ITEMS);
  const afterItems = (data?.afterItems ?? []).slice(0, MAX_ITEMS);
  if (beforeItems.length === 0 && afterItems.length === 0) return null;

  const beforeTitle = data?.beforeTitle ?? "Before";
  const afterTitle = data?.afterTitle ?? "After";
  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch", width: "100%", padding: CANVAS.padding }}>
      <div style={{ flex: 1, marginRight: "16px" }}>
        <BeforeAfterColumn
          title={beforeTitle}
          items={beforeItems}
          bg={theme.beforeBg}
          accentColor={theme.beforeAccent}
          marker={theme.wf ? "\u2212" : "\u2715"}
          theme={theme}
        />
      </div>
      <BeforeAfterArrow color={theme.accent} />
      <div style={{ flex: 1, marginLeft: "16px" }}>
        <BeforeAfterColumn
          title={afterTitle}
          items={afterItems}
          bg={theme.afterBg}
          accentColor={theme.afterAccent}
          marker={theme.wf ? "+" : "\u2713"}
          inverted
          theme={theme}
        />
      </div>
    </div>
  );
};

export default React.memo(BeforeAfter);
