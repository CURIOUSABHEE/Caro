import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

interface ParagraphProps {
  children: React.ReactNode;
  tokens?: ThemeTokens;
  color?: string;
  size?: string;
  weight?: number;
  align?: "left" | "center" | "right";
  maxWidth?: string;
  lineHeight?: number;
  extraStyle?: React.CSSProperties;
}

export function Paragraph({
  children,
  tokens,
  color,
  size = "22px",
  weight,
  align = "left",
  maxWidth,
  lineHeight = 1.5,
  extraStyle,
}: ParagraphProps) {
  return (
    <p
      style={{
        fontSize: size,
        fontWeight: weight || tokens?.typography.bodyWeight || 400,
        color: color || tokens?.colors.mutedText || "rgba(0,0,0,0.5)",
        lineHeight,
        margin: 0,
        textAlign: align,
        maxWidth,
        fontFamily: tokens?.typography.bodyFont,
        ...extraStyle,
      }}
    >
      {children}
    </p>
  );
}
