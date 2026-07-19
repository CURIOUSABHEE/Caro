import React from "react";
import type { ThemeColors, IconGridData } from "@/lib/types";
import renderIcon from "../shared/icons";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "10px 0", gap: "12px" } as const;

const TILE = {
  compactWidth: "calc(33.333% - 12px)",
  regularWidth: "calc(50% - 12px)",
  compactHeight: 130,
  regularHeight: 150,
  compactThreshold: 5,
  padding: "20px 10px",
} as const;

const ICON = {
  compactSize: 42,
  regularSize: 52,
  borderWidth: 2,
  fallbackSize: { compact: "18px", regular: "24px" },
} as const;

const FONT = {
  label: { size: { compact: "12px", regular: "14px" }, weight: "bold" as const, lineHeight: "1.3" },
  description: { size: "11px", lineHeight: "1.35" },
} as const;

const MAX_ITEMS = 6;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    cardBorderRadius: colors.cardBorderRadius || "18px",
    iconBorderRadius: colors.iconBorderRadius || "50%",
    iconBg: colors.accentBg || colors.accent,
    iconBorder: `2px solid ${colors.accent === "#ffffff" ? "#050505" : (colors.glassBorder || "rgba(255,255,255,0.2)")}`,
    iconFallbackColor: colors.accent === "#ffffff" ? "#050505" : "#ffffff",
    accent: colors.accent,
    text: colors.text,
    muted: colors.muted,
  };
}

function getLayout(isCompact: boolean) {
  return {
    tileWidth: isCompact ? TILE.compactWidth : TILE.regularWidth,
    iconSize: isCompact ? ICON.compactSize : ICON.regularSize,
    labelSize: isCompact ? FONT.label.size.compact : FONT.label.size.regular,
    fallbackSize: isCompact ? ICON.fallbackSize.compact : ICON.fallbackSize.regular,
    minHeight: isCompact ? TILE.compactHeight : TILE.regularHeight,
    descriptionLines: isCompact ? 2 : 3,
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const IconTile: React.FC<{
  item: { label: string; description?: string; icon?: string };
  itemIndex: number;
  layout: ReturnType<typeof getLayout>;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ item, itemIndex, layout, theme }) => (
  <div
    key={item.label || `tile-${itemIndex}`}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      width: layout.tileWidth,
      borderRadius: theme.cardBorderRadius,
      backgroundColor: theme.cardBg,
      border: theme.cardBorder,
      boxShadow: theme.cardShadow,
      boxSizing: "border-box",
      padding: TILE.padding,
      minHeight: `${layout.minHeight}px`,
      maxHeight: `${layout.minHeight}px`,
      overflow: "hidden",
      minWidth: 0,
    }}
  >
    <div
      style={{
        width: `${layout.iconSize}px`,
        height: `${layout.iconSize}px`,
        borderRadius: theme.iconBorderRadius,
        backgroundColor: theme.iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "10px",
        flexShrink: 0,
        border: theme.iconBorder,
      }}
    >
      {(() => {
        const rendered = item.icon ? renderIcon(item.icon, theme.iconFallbackColor) : null;
        return rendered || (
          <span style={{ fontSize: layout.fallbackSize, fontWeight: 700, color: theme.iconFallbackColor }}>
            {(item.label || "?").charAt(0).toUpperCase()}
          </span>
        );
      })()}
    </div>
    <span style={{ fontSize: layout.labelSize, fontWeight: FONT.label.weight, textAlign: "center", color: theme.text, lineHeight: FONT.label.lineHeight, marginBottom: item.description ? "5px" : "0", ...stableText, ...multilineClamp(2) }}>
      {clampText(item.label, 28)}
    </span>
    {item.description && (
      <span style={{ fontSize: FONT.description.size, textAlign: "center", color: theme.muted, lineHeight: FONT.description.lineHeight, ...stableText, ...multilineClamp(layout.descriptionLines) }}>
        {clampText(item.description, 54)}
      </span>
    )}
  </div>
));
IconTile.displayName = "IconTile";

// ─── Main Component ──────────────────────────────────────────────────────────

const IconGrid = ({ data, colors }: { data: IconGridData; colors: ThemeColors }) => {
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  const visibleItems = items.slice(0, MAX_ITEMS);
  const isCompact = visibleItems.length >= TILE.compactThreshold;
  const layout = getLayout(isCompact);
  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: "100%", padding: CANVAS.padding, boxSizing: "border-box", justifyContent: "center" }}>
      {visibleItems.map((item, itemIndex) => (
        <div key={item.label || `tile-${itemIndex}`} style={{ marginRight: "12px", marginBottom: "12px" }}>
          <IconTile
            item={item}
            itemIndex={itemIndex}
            layout={layout}
            theme={theme}
          />
        </div>
      ))}
    </div>
  );
};

export default React.memo(IconGrid);
