import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

interface DividerProps {
  tokens?: ThemeTokens;
  color?: string;
  extraStyle?: React.CSSProperties;
}

export function Divider({ tokens, color, extraStyle }: DividerProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "1px",
        backgroundColor: color || tokens?.colors.border || "rgba(0,0,0,0.08)",
        ...extraStyle,
      }}
    />
  );
}
