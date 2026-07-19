import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

interface BadgeProps {
  children: React.ReactNode;
  tokens?: ThemeTokens;
  variant?: "default" | "accent" | "outline";
  extraStyle?: React.CSSProperties;
}

export function Badge({
  children,
  tokens,
  variant = "default",
  extraStyle,
}: BadgeProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 18px",
    borderRadius: tokens?.radius.badge || "9999px",
    fontFamily: tokens?.typography.bodyFont || "Outfit",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    ...extraStyle,
  };

  const variants: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: tokens?.colors.badgeBg || tokens?.colors.accent || "#2563eb",
      color: tokens?.colors.badgeText || "#ffffff",
      boxShadow: tokens?.shadows.badge || "none",
    },
    accent: {
      backgroundColor: "transparent",
      color: tokens?.colors.accent || "#2563eb",
      border: `1px solid ${tokens?.colors.accent || "#2563eb"}`,
    },
    outline: {
      backgroundColor: tokens?.colors.surface || "transparent",
      color: tokens?.colors.mutedText || "rgba(0,0,0,0.5)",
      border: `1px solid ${tokens?.borders.badge || tokens?.colors.border || "rgba(0,0,0,0.08)"}`,
    },
  };

  return (
    <div style={{ ...base, ...variants[variant] }}>
      {children}
    </div>
  );
}
