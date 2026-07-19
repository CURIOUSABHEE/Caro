import React from "react";
import type { ThemeColors, MiniChartData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "8px 0", maxWidth: 640 } as const;

const CHART = {
  height: 180,
  bottomPadding: 4,
  barMaxWidth: 90,
  barMinHeight: 12,
  barGap: 20,
} as const;

const FONT = {
  title: { size: "13px", weight: 800, letterSpacing: "0.5px" },
  value: { size: "11px", weight: "bold" as const },
  label: { size: "11px", weight: 600 },
} as const;

const MAX_BARS = 6;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  const wf = isWireframeDiagram(colors);
  return {
    wf,
    fontFamily: diagramFont(colors),
    accent: colors.accent,
    text: colors.text,
    muted: colors.muted,
    axisBorder: wf ? `2px solid ${colors.accent}` : `2px solid ${colors.glassBorder || "rgba(0,0,0,0.1)"}`,
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const Bar: React.FC<{
  bar: { label: string; value: number; displayValue?: string };
  barIndex: number;
  maxValue: number;
  barCount: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ bar, barIndex, maxValue, barCount, theme }) => {
  const value = Number.isFinite(bar.value) ? Math.max(0, bar.value) : 0;
  const barHeight = Math.max(CHART.barMinHeight, (value / maxValue) * CHART.height);
  const isLast = barIndex === barCount - 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: `${CHART.barMaxWidth}px` }}>
      <span style={{ fontSize: FONT.value.size, fontWeight: FONT.value.weight, fontFamily: theme.fontFamily, color: theme.accent, marginBottom: "6px", textAlign: "center", ...stableText, ...multilineClamp(1) }}>
        {clampText(bar.displayValue || `${bar.value}`, 14)}
      </span>
      <div
        style={{
          width: "100%",
          height: `${barHeight}px`,
          backgroundColor: theme.wf ? (isLast ? theme.accent : "#ffffff") : theme.accent,
          border: theme.wf ? `2px solid ${theme.accent}` : "none",
          opacity: theme.wf ? 1 : 0.7 + (barIndex / barCount) * 0.3,
          borderRadius: theme.wf ? "0px" : "6px 6px 0 0",
        }}
      />
      <span style={{ fontSize: FONT.label.size, fontWeight: FONT.label.weight, fontFamily: theme.fontFamily, color: theme.muted, marginTop: "8px", textAlign: "center", lineHeight: 1.2, ...stableText, ...multilineClamp(2) }}>
        {clampText(bar.label, 24)}
      </span>
    </div>
  );
});
Bar.displayName = "Bar";

// ─── Main Component ──────────────────────────────────────────────────────────

const MiniChart = ({ data, colors }: { data: MiniChartData; colors: ThemeColors }) => {
  const bars = (data?.bars ?? []).slice(0, MAX_BARS);
  if (bars.length === 0) return null;

  const maxValue = Math.max(...bars.map(b => Number.isFinite(b.value) ? Math.max(0, b.value) : 0), 1);
  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: CANVAS.padding, alignItems: "center" }}>
      {data.title && (
        <span style={{ fontSize: FONT.title.size, fontWeight: FONT.title.weight, fontFamily: theme.fontFamily, color: theme.text, textTransform: "uppercase", letterSpacing: FONT.title.letterSpacing, marginBottom: "16px", textAlign: "center", ...stableText, ...multilineClamp(1) }}>
          {clampText(data.title, 48)}
        </span>
      )}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", height: `${CHART.height + 40}px`, width: "100%", maxWidth: `${CANVAS.maxWidth}px`, borderBottom: theme.axisBorder, paddingBottom: `${CHART.bottomPadding}px` }}>
        {bars.map((bar, barIndex) => (
          <div key={bar.label || `bar-${barIndex}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: `${CHART.barMaxWidth}px`, marginRight: barIndex < bars.length - 1 ? `${CHART.barGap}px` : "0" }}>
            <Bar
              bar={bar}
              barIndex={barIndex}
              maxValue={maxValue}
              barCount={bars.length}
              theme={theme}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(MiniChart);
