import React from "react";
import type { ThemeColors, ArchitectureData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "8px 0", maxWidth: 720 } as const;

const LAYER = {
  padding: "14px 18px",
  gap: "10px",
  itemPadding: "8px 14px",
  itemBorderRadius: "8px",
  maxWidth: "100%",
} as const;

const CONNECTOR = {
  width: 16,
  height: 12,
  lineHeight: 16,
} as const;

const FONT = {
  layerLabel: { size: "11px", weight: 800, letterSpacing: "1px" as const },
  item: { size: "12px", weight: "bold" as const },
} as const;

const MAX_LAYERS = 4;
const MAX_ITEMS_PER_LAYER = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  const wf = isWireframeDiagram(colors);
  return {
    wf,
    fontFamily: diagramFont(colors),
    cardBg: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.45)"),
    border: `2px solid ${colors.accent}`,
    itemBorder: `1.5px solid ${colors.accent}`,
    accent: colors.accent,
    text: colors.text,
    cardBorderRadius: wf ? "0px" : (colors.cardBorderRadius || "12px"),
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const ArrowConnector: React.FC<{ color: string }> = React.memo(({ color }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0" }}>
    <div style={{ width: "2px", height: `${CONNECTOR.lineHeight}px`, backgroundColor: color, opacity: 0.7 }} />
    <svg width={CONNECTOR.width} height={CONNECTOR.height} viewBox={`0 0 ${CONNECTOR.width} ${CONNECTOR.height}`}>
      <path
        d={`M2 2 L${CONNECTOR.width / 2} ${CONNECTOR.height - 2} L${CONNECTOR.width - 2} 2`}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
));
ArrowConnector.displayName = "ArrowConnector";

const ArchitectureLayer: React.FC<{
  layer: { label: string; items: string[] };
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ layer, theme }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      maxWidth: `${CANVAS.maxWidth}px`,
      border: theme.border,
      borderRadius: theme.cardBorderRadius,
      backgroundColor: theme.cardBg,
      padding: LAYER.padding,
      boxSizing: "border-box",
      overflow: "hidden",
    }}
  >
    <span style={{ fontSize: FONT.layerLabel.size, fontWeight: FONT.layerLabel.weight, fontFamily: theme.fontFamily, color: theme.accent, textTransform: "uppercase", letterSpacing: FONT.layerLabel.letterSpacing, marginBottom: "10px", ...stableText, ...multilineClamp(1) }}>
      {clampText(layer.label, 32)}
    </span>
    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
      {(layer.items ?? []).slice(0, MAX_ITEMS_PER_LAYER).map((item, itemIndex) => (
        <div
          key={item || `item-${itemIndex}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: LAYER.itemPadding,
            border: theme.itemBorder,
            borderRadius: theme.wf ? "0px" : LAYER.itemBorderRadius,
            backgroundColor: theme.wf && itemIndex === 0 ? theme.accent : "#ffffff",
            minWidth: 0,
            maxWidth: "100%",
            overflow: "hidden",
            marginRight: itemIndex < (layer.items ?? []).slice(0, MAX_ITEMS_PER_LAYER).length - 1 ? "10px" : "0",
            marginBottom: "10px",
          }}
        >
          <span style={{ fontSize: FONT.item.size, fontWeight: FONT.item.weight, fontFamily: theme.fontFamily, color: theme.wf && itemIndex === 0 ? "#ffffff" : theme.text, textAlign: "center", lineHeight: 1.2, ...stableText, ...multilineClamp(2) }}>
            {clampText(item, 34)}
          </span>
        </div>
      ))}
    </div>
  </div>
));
ArchitectureLayer.displayName = "ArchitectureLayer";

// ─── Main Component ──────────────────────────────────────────────────────────

const Architecture = ({ data, colors }: { data: ArchitectureData; colors: ThemeColors }) => {
  const layers = (data?.layers ?? []).slice(0, MAX_LAYERS);
  if (layers.length === 0) return null;

  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: CANVAS.padding }}>
      {layers.map((layer, layerIndex) => (
        <div key={layer.label || `layer-${layerIndex}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <ArchitectureLayer layer={layer} theme={theme} />
          {layerIndex < layers.length - 1 && (
            <ArrowConnector color={theme.accent} />
          )}
        </div>
      ))}
    </div>
  );
};

export default React.memo(Architecture);
