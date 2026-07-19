import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";
import type { Shape } from "../types";
import { renderSlideShapes } from "../render-slide";
import { Progress } from "../primitives/Progress";
import ScribbleOverlay from "../shared/scribble-overlay";

interface SlideFrameProps {
  children: React.ReactNode;
  tokens?: ThemeTokens;
  order: number;
  totalSlides: number;
  type: string;
  shapes?: Shape[];
  scribble?: boolean;
  themeName: string;
  backgroundColor?: string;
  color?: string;
  overflow?: string;
  bgImageStyle?: React.CSSProperties;
  decorations?: React.ReactNode;
  extraStyle?: React.CSSProperties;
}

export function SlideFrame({
  children,
  tokens,
  order,
  totalSlides,
  type,
  shapes,
  scribble,
  themeName,
  backgroundColor,
  color,
  overflow = "hidden",
  bgImageStyle,
  decorations,
  extraStyle,
}: SlideFrameProps) {
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
        ...bgImageStyle,
        ...extraStyle,
      }}
    >
      {decorations}
      {renderSlideShapes(shapes)}
      {type !== "COVER" && type !== "CLOSING" && scribble && (
        <ScribbleOverlay order={order} totalSlides={totalSlides} theme={themeName} />
      )}
      <Progress order={order} totalSlides={totalSlides} accentColor={tokens?.colors.accent} />
      {children}
    </div>
  );
}
