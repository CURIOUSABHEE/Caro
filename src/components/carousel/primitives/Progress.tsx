import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

interface ProgressProps {
  order: number;
  totalSlides: number;
  tokens?: ThemeTokens;
  accentColor?: string;
}

export function Progress({
  order,
  totalSlides,
  tokens,
  accentColor,
}: ProgressProps) {
  const pct = totalSlides > 1 ? Math.round(((order + 1) / totalSlides) * 100) : 100;
  const color = accentColor || tokens?.colors.accent || "#2563eb";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        display: "flex",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "3px",
          backgroundColor: color,
          opacity: 0.85,
        }}
      />
    </div>
  );
}
