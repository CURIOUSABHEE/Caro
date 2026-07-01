import React from "react";
import type { TokenizedLine } from "./tokenize-code";

interface CodeBlockProps {
  language: string;
  code: string;
  highlightLines?: number[];
  tokens?: TokenizedLine[];
  theme: "dark" | "light";
}

const CARD_BG: Record<string, string> = {
  dark: "#0d1117",
  light: "#f6f8fa",
};

const BORDER_COLOR: Record<string, string> = {
  dark: "#30363d",
  light: "#d0d7de",
};

const LABEL_BG: Record<string, string> = {
  dark: "#21262d",
  light: "#eaeef2",
};

const LABEL_TEXT: Record<string, string> = {
  dark: "#8b949e",
  light: "#656d76",
};

const LINE_NUM_COLOR: Record<string, string> = {
  dark: "#484f58",
  light: "#8c959f",
};

const HIGHLIGHT_BG: Record<string, string> = {
  dark: "rgba(56, 139, 253, 0.12)",
  light: "rgba(9, 105, 218, 0.08)",
};

export function CodeBlock({ language, code, highlightLines = [], tokens, theme }: CodeBlockProps) {
  if (!tokens || tokens.length === 0) return null;

  const maxLineDigits = String(tokens.length).length;
  const lineNumWidth = Math.max(maxLineDigits * 12 + 24, 48);
  const isBash = ["bash", "sh", "shell", "cmd", "powershell", "zsh"].includes((language || "").toLowerCase());

  const langLabel = language || "code";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "900px",
        borderRadius: "12px",
        border: `1.5px solid ${BORDER_COLOR[theme]}`,
        backgroundColor: CARD_BG[theme],
        fontFamily: "JetBrains Mono",
        fontSize: "14px",
        lineHeight: "1.6",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderBottom: `1px solid ${BORDER_COLOR[theme]}`,
          backgroundColor: LABEL_BG[theme],
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: LABEL_TEXT[theme],
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {langLabel}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "12px 0",
          overflow: "hidden",
        }}
      >
        {tokens.map((line) => {
          const isHighlighted = highlightLines.includes(line.lineNumber);
          return (
            <div
              key={line.lineNumber}
              style={{
                display: "flex",
                backgroundColor: isHighlighted ? HIGHLIGHT_BG[theme] : "transparent",
              }}
            >
              {!isBash && (
                <div
                  style={{
                    display: "flex",
                    width: `${lineNumWidth}px`,
                    minWidth: `${lineNumWidth}px`,
                    paddingRight: "16px",
                    textAlign: "right",
                    color: LINE_NUM_COLOR[theme],
                    fontSize: "13px",
                    userSelect: "none",
                    fontFamily: "JetBrains Mono",
                  }}
                >
                  {line.lineNumber}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  whiteSpace: "pre",
                  fontFamily: "JetBrains Mono",
                  paddingLeft: isBash ? "24px" : "0px",
                }}
              >
                {line.tokens.length > 0
                  ? line.tokens.map((token, ti) => (
                      <span
                        key={ti}
                        style={{
                          color: token.color || "#e6edf3",
                          fontFamily: "JetBrains Mono",
                          whiteSpace: "pre",
                        }}
                      >
                        {token.content}
                      </span>
                    ))
                  : (
                    <span
                      style={{
                        color: "#e6edf3",
                        fontFamily: "JetBrains Mono",
                        whiteSpace: "pre",
                      }}
                    >
                      {" "}
                    </span>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
