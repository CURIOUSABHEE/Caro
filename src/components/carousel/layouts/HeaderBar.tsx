import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

interface HeaderBarProps {
  type: string;
  pageLabel: string;
  tokens?: ThemeTokens;
  badgeLabel?: string;
  badgeStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}

export function HeaderBar({
  type,
  pageLabel,
  tokens,
  badgeLabel,
  badgeStyle,
  labelStyle,
  wrapperStyle,
}: HeaderBarProps) {
  const label = badgeLabel || (type === "COVER" ? "Introduction" : type === "CLOSING" ? "Conclusion" : "Insight");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        ...wrapperStyle,
      }}
    >
      <div
        style={{
          display: "flex",
          padding: "6px 18px",
          borderRadius: tokens?.radius.badge || "9999px",
          backgroundColor: tokens?.colors.badgeBg || tokens?.colors.accent || "#2563eb",
          color: tokens?.colors.badgeText || "#ffffff",
          fontSize: "13px",
          fontWeight: 800,
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontFamily: tokens?.typography.bodyFont,
          ...badgeStyle,
        }}
      >
        {label}
      </div>
      <span
        style={{
          fontSize: "14px",
          color: tokens?.colors.mutedText || "rgba(0,0,0,0.5)",
          fontWeight: 700,
          fontFamily: tokens?.typography.bodyFont,
          ...labelStyle,
        }}
      >
        {pageLabel}
      </span>
    </div>
  );
}
