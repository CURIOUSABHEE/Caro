import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2;
  tokens?: ThemeTokens;
  color?: string;
  align?: "left" | "center" | "right";
  extraStyle?: React.CSSProperties;
}

export function Heading({
  children,
  level = 2,
  tokens,
  color,
  align = "left",
  extraStyle,
}: HeadingProps) {
  const Tag = level === 1 ? "h1" : "h2";
  const sizes = { 1: "64px", 2: "44px" };

  return (
    <Tag
      style={{
        fontSize: sizes[level],
        fontWeight: tokens?.typography.headingWeight || 700,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        color: color || tokens?.colors.text || "#1a1a1a",
        textAlign: align,
        margin: 0,
        fontFamily: tokens?.typography.headingFont,
        ...extraStyle,
      }}
    >
      {children}
    </Tag>
  );
}
