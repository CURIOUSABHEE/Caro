import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";
import { SwipeArrow } from "../shared/swipe-arrow";

interface FooterBarProps {
  displayUsername: string;
  isLast: boolean;
  tokens?: ThemeTokens;
  usernameStyle?: React.CSSProperties;
  swipeStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  swipeLabel?: string;
}

export function FooterBar({
  displayUsername,
  isLast,
  tokens,
  usernameStyle,
  swipeStyle,
  wrapperStyle,
  swipeLabel = "Swipe",
}: FooterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        ...wrapperStyle,
      }}
    >
      <span
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: tokens?.colors.mutedText || "rgba(0,0,0,0.5)",
          fontFamily: tokens?.typography.bodyFont,
          ...usernameStyle,
        }}
      >
        {displayUsername}
      </span>
      {!isLast && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: tokens?.colors.mutedText || "rgba(0,0,0,0.5)",
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            ...swipeStyle,
          }}
        >
          <span>{swipeLabel}</span>
          <SwipeArrow color={tokens?.colors.mutedText || "currentColor"} />
        </div>
      )}
    </div>
  );
}
