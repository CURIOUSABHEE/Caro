import React from "react";
import type { ThemeColors, ImageGridData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "8px 0", gap: "12px" } as const;

const TILE = {
  width: "calc(50% - 12px)",
  imageHeight: 100,
  contentPadding: "12px 14px",
  iconSize: 48,
  iconBorderRadius: "12px",
  iconBorderWidth: 2,
} as const;

const FONT = {
  label: { size: "13px", weight: "bold" as const },
  description: { size: "11px", lineHeight: "1.35" },
  icon: { size: "20px", weight: 800 },
} as const;

const MAX_ITEMS = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCardShadow(colors: ThemeColors) {
  if (colors.cardShadow) return colors.cardShadow;
  const border = colors.glassBorder;
  if (border) {
    const match = border.match(/[\d.]+\)$/);
    if (match) return `0 6px 20px ${border.replace(match[0], "0.12)")}`;
  }
  return "0 6px 20px rgba(0,0,0,0.05)";
}

function computeTheme(colors: ThemeColors) {
  const wf = isWireframeDiagram(colors);
  const fontFamily = diagramFont(colors);
  return {
    wf,
    fontFamily,
    cardBorderRadius: wf ? "0px" : (colors.cardBorderRadius || "16px"),
    tileBorder: `${wf ? "2" : "1.5"}px solid ${wf ? colors.accent : (colors.glassBorder || "rgba(0,0,0,0.08)")}`,
    tileShadow: wf ? "none" : getCardShadow(colors),
    contentBg: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.4)"),
    iconBg: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.6)"),
    iconBorder: `2px solid ${colors.accent}`,
    accent: colors.accent,
    text: colors.text,
    muted: colors.muted,
    imageBorder: `1.5px solid ${colors.glassBorder || "rgba(0,0,0,0.06)"}`,
  };
}

function getGradients(colors: ThemeColors, wf: boolean) {
  if (wf) return ["#ffffff", "#ffffff", "#ffffff", "#ffffff"];
  const glassBg = colors.glassBg || "rgba(255,255,255,0.2)";
  return [
    `linear-gradient(135deg, ${colors.accent}33 0%, ${colors.accent}11 100%)`,
    `linear-gradient(135deg, ${colors.accent}22 0%, ${glassBg} 100%)`,
    `linear-gradient(225deg, ${colors.accent}28 0%, ${colors.accent}08 100%)`,
    `linear-gradient(45deg, ${colors.accent}18 0%, ${glassBg} 100%)`,
  ];
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const ImageTile: React.FC<{
  item: { label: string; description?: string };
  gradient: string;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ item, gradient, theme }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      width: TILE.width,
      borderRadius: theme.cardBorderRadius,
      overflow: "hidden",
      border: theme.tileBorder,
      boxShadow: theme.tileShadow,
      boxSizing: "border-box",
      minWidth: 0,
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: `${TILE.imageHeight}px`,
        background: gradient,
        borderBottom: theme.imageBorder,
      }}
    >
      <div
        style={{
          width: `${TILE.iconSize}px`,
          height: `${TILE.iconSize}px`,
          borderRadius: theme.wf ? "0px" : TILE.iconBorderRadius,
          backgroundColor: theme.iconBg,
          border: theme.iconBorder,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: FONT.icon.size, fontWeight: FONT.icon.weight, fontFamily: theme.fontFamily, color: theme.accent }}>
          {(item.label || "?").charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", padding: TILE.contentPadding, backgroundColor: theme.contentBg, minHeight: "74px", boxSizing: "border-box" }}>
      <span style={{ fontSize: FONT.label.size, fontWeight: FONT.label.weight, fontFamily: theme.fontFamily, color: theme.text, marginBottom: item.description ? "4px" : "0", lineHeight: 1.2, ...stableText, ...multilineClamp(2) }}>
        {clampText(item.label, 32)}
      </span>
      {item.description && (
        <span style={{ fontSize: FONT.description.size, color: theme.muted, lineHeight: FONT.description.lineHeight, ...stableText, ...multilineClamp(2) }}>
          {clampText(item.description, 54)}
        </span>
      )}
    </div>
  </div>
));
ImageTile.displayName = "ImageTile";

// ─── Main Component ──────────────────────────────────────────────────────────

const ImageGrid = ({ data, colors }: { data: ImageGridData; colors: ThemeColors }) => {
  const items = (data?.items ?? []).slice(0, MAX_ITEMS);
  if (items.length === 0) return null;

  const theme = computeTheme(colors);
  const gradients = getGradients(colors, theme.wf);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: "100%", padding: CANVAS.padding, boxSizing: "border-box", justifyContent: "center" }}>
      {items.map((item, itemIndex) => (
        <div key={item.label || `tile-${itemIndex}`} style={{ marginRight: "12px", marginBottom: "12px" }}>
          <ImageTile
            item={item}
            gradient={gradients[itemIndex % gradients.length]}
            theme={theme}
          />
        </div>
      ))}
    </div>
  );
};

export default React.memo(ImageGrid);
