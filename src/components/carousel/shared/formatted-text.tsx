import React from "react";
import { sanitizeTextForSatori } from "../lib/sanitize";

export const darkCodeStyle: React.CSSProperties = {
  fontFamily: "JetBrains Mono",
  fontSize: "22px",
  backgroundColor: "#e2e8f0",
  color: "#1f2937",
  padding: "2px 8px",
  borderRadius: "4px",
  margin: "0 2px",
  letterSpacing: "0px",
  lineHeight: 1.4,
};
export const lightCodeStyle: React.CSSProperties = {
  fontFamily: "JetBrains Mono",
  fontSize: "22px",
  backgroundColor: "#e2e8f0",
  color: "#1e293b",
  padding: "2px 8px",
  borderRadius: "4px",
  margin: "0 2px",
  letterSpacing: "0px",
  lineHeight: 1.4,
};

export let currentScribbleState: { scribble: boolean; color: string } | null = null;

export function setCurrentScribbleState(state: { scribble: boolean; color: string } | null) {
  currentScribbleState = state;
}

export const renderFormattedText = (
  text: string,
  serifStyle: React.CSSProperties = {},
  regularStyle: React.CSSProperties = {},
  justifyContent: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" = "flex-start",
  codeStyle?: React.CSSProperties,
  scribbleConfig?: { scribble?: boolean; color?: string; fontSize?: number }
) => {
  if (!text) return "";
  const sanitized = sanitizeTextForSatori(text);

  const resolvedCodeStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono",
    fontSize: "22px",
    backgroundColor: "#e2e8f0",
    color: "#1f2937",
    padding: "2px 8px",
    borderRadius: "4px",
    margin: "0 2px",
    letterSpacing: "0px",
    lineHeight: 1.4,
    ...codeStyle,
  };

  const renderScribble = scribbleConfig?.scribble !== undefined ? scribbleConfig.scribble : currentScribbleState?.scribble;
  const scribbleColor = scribbleConfig?.color || currentScribbleState?.color || serifStyle.color || "#ec4899";

  const renderSegments = (segment: string, baseKey: string) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return <span key={baseKey} style={resolvedCodeStyle}>{segment.slice(1, -1)}</span>;
    }
    const asteriskParts = segment.split(/\*(.*?)\*/g);
    return asteriskParts.map((part, i) => {
      if (!part) return null;
      if (i % 2 === 1) {
        const seedValue = part.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const scribbleType = seedValue % 2;

        return (
          <span key={`${baseKey}-a${i}`} style={{
            position: "relative",
            fontFamily: "Playfair Display",
            fontStyle: "italic",
            fontWeight: 400,
            paddingLeft: "4px",
            paddingRight: "6px",
            ...serifStyle,
          }}>
            {part}
            {renderScribble && (
              <span
                style={{
                  position: "absolute",
                  left: "-4px",
                  right: "-4px",
                  top: "-2px",
                  bottom: "-4px",
                  display: "flex",
                  pointerEvents: "none",
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
                  {scribbleType === 0 ? (
                    <path d="M 2,82 C 30,88 70,88 98,82" stroke={scribbleColor} strokeWidth="5.5" strokeLinecap="round" opacity="0.9" />
                  ) : (
                    <path d="M 12,50 C 10,18 88,10 88,48 C 88,86 15,84 20,54" stroke={scribbleColor} strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
                  )}
                </svg>
              </span>
            )}
          </span>
        );
      }
      return <span key={`${baseKey}-a${i}`} style={regularStyle}>{part}</span>;
    });
  };

  const backtickParts = sanitized.split(/(`[^`]+`)/g);

  return (
    <span style={{ display: "flex", flexWrap: "wrap", justifyContent, alignItems: "center" }}>
      {backtickParts.map((part, idx) => renderSegments(part, `bt${idx}`))}
    </span>
  );
};
