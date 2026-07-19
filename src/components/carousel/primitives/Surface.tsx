import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

type SurfaceVariant = "card" | "inset" | "raised" | "glass" | "flat";

interface SurfaceProps {
  children: React.ReactNode;
  variant?: SurfaceVariant;
  tokens?: ThemeTokens;
  extraStyle?: React.CSSProperties;
}

export function Surface({
  children,
  variant = "card",
  tokens,
  extraStyle,
}: SurfaceProps) {
  const base: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    ...extraStyle,
  };

  const variants: Record<SurfaceVariant, React.CSSProperties> = {
    card: {
      backgroundColor: tokens?.colors.surface || "#ffffff",
      borderRadius: tokens?.radius.card || "20px",
      boxShadow: tokens?.shadows.card || "none",
      border: tokens?.borders.card || "none",
      padding: "24px",
    },
    inset: {
      backgroundColor: tokens?.colors.surface || "#ffffff",
      borderRadius: tokens?.radius.card || "20px",
      boxShadow: tokens?.shadows.inset || "inset 0 2px 4px rgba(0,0,0,0.06)",
      padding: "24px",
    },
    raised: {
      backgroundColor: tokens?.colors.surface || "#ffffff",
      borderRadius: tokens?.radius.card || "20px",
      boxShadow: tokens?.shadows.raised || "0 8px 24px rgba(0,0,0,0.12)",
      padding: "24px",
    },
    glass: {
      backgroundColor: tokens?.colors.surface || "rgba(255,255,255,0.55)",
      borderRadius: tokens?.radius.card || "32px",
      border: tokens?.borders.card || "1px solid rgba(255,255,255,0.4)",
      boxShadow: tokens?.shadows.card || "0 24px 48px rgba(15,23,42,0.04)",
      padding: "24px",
    },
    flat: {
      backgroundColor: "transparent",
      padding: "24px",
    },
  };

  return (
    <div style={{ ...base, ...variants[variant] }}>
      {children}
    </div>
  );
}
