import type { ThemeTokens } from "../tokens/types";

export const wireframe3dTokens: ThemeTokens = {
  colors: {
    text: "#000000",
    mutedText: "#333333",
    accent: "#000000",
    background: "#f4f4f4",
    surface: "#ffffff",
    border: "1px solid #000000",
    codeBg: "rgba(0,0,0,0.05)",
    codeFg: "#000000",
    badgeBg: "#000000",
    badgeText: "#ffffff",
    scribble: "#ffffff",
  },
  typography: {
    headingFont: "JetBrains Mono",
    bodyFont: "JetBrains Mono",
    codeFont: "JetBrains Mono",
    headingWeight: 700,
    bodyWeight: 500,
  },
  spacing: {
    padding: "60px",
    contentMargin: "40px",
    gap: "16px",
  },
  radius: {
    card: "0px",
    badge: "0px",
    code: "0px",
    image: "0px",
  },
  shadows: {
    card: "none",
    badge: "none",
    raised: "none",
    inset: "none",
  },
  borders: {
    card: "3px solid #000000",
    badge: "none",
    divider: "1px solid #000000",
  },
};
