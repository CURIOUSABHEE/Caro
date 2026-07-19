import type { ThemeTokens } from "../tokens/types";

export const sketchTokens: ThemeTokens = {
  colors: {
    text: "#2d2d2d",
    mutedText: "rgba(45,45,45,0.6)",
    accent: "#2563eb",
    background: "#f8f9fa",
    surface: "#ffffff",
    border: "rgba(45,45,45,0.15)",
    codeBg: "#2d2d2d",
    codeFg: "#e8e8e8",
    badgeBg: "linear-gradient(135deg, #2563eb, #2d2d2d)",
    badgeText: "#ffffff",
    scribble: "#ffffff",
  },
  typography: {
    headingFont: "Caveat",
    bodyFont: "Caveat",
    codeFont: "JetBrains Mono",
    headingWeight: 700,
    bodyWeight: 400,
  },
  spacing: {
    padding: "80px",
    contentMargin: "60px",
    gap: "16px",
  },
  radius: {
    card: "24px",
    badge: "100px",
    code: "8px",
    image: "20px",
  },
  shadows: {
    card: "0px 12px 32px rgba(0,0,0,0.04)",
    badge: "0px 4px 12px rgba(0,0,0,0.06)",
    raised: "0px 12px 32px rgba(0,0,0,0.04)",
    inset: "none",
  },
  borders: {
    card: "1px solid rgba(45,45,45,0.15)",
    badge: "none",
    divider: "1px solid rgba(45,45,45,0.15)",
  },
};
