import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

interface ContainerProps {
  children: React.ReactNode;
  tokens?: ThemeTokens;
  backgroundColor?: string;
  color?: string;
  backgroundImage?: string;
  overflow?: string;
  extraStyle?: React.CSSProperties;
}

export function Container({
  children,
  tokens,
  backgroundColor,
  color,
  backgroundImage,
  overflow = "hidden",
  extraStyle,
}: ContainerProps) {
  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: backgroundColor || tokens?.colors.background || "#ffffff",
        color: color || tokens?.colors.text || "#1a1a1a",
        fontFamily: tokens?.typography.bodyFont || "Outfit",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        overflow,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}
