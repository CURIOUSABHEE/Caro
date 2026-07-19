import type React from "react";

export function multilineClamp(lines: number): React.CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
    wordBreak: "break-word",
  };
}

export const stableText: React.CSSProperties = {
  minWidth: 0,
  overflowWrap: "break-word",
};

export function fixedCanvas(width: number, height: number): React.CSSProperties {
  return {
    display: "flex",
    width: "100%",
    maxWidth: `${width}px`,
    height: `${height}px`,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  };
}
