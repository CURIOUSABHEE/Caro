import type { ThemeTokens } from "../tokens/types";

export const neomorphismTokens: ThemeTokens = {
  colors: {
    text: "#2B2B2B",
    mutedText: "#5a5a5a",
    accent: "#E8503A",
    background: "#E4E0DA",
    surface: "#E4E0DA",
    border: "rgba(0,0,0,0.08)",
    codeBg: "#f6f8fa",
    codeFg: "#24292f",
    badgeBg: "#E4E0DA",
    badgeText: "#2B2B2B",
    scribble: "#E8503A",
  },
  typography: {
    headingFont: "Outfit",
    bodyFont: "Outfit",
    codeFont: "JetBrains Mono",
    headingWeight: 600,
    bodyWeight: 500,
  },
  spacing: {
    padding: "85px",
    contentMargin: "35px",
    gap: "16px",
  },
  radius: {
    card: "20px",
    badge: "9999px",
    code: "12px",
    image: "20px",
  },
  shadows: {
    card: "-12px -12px 24px rgba(255,255,255,0.7), 12px 12px 24px rgba(0,0,0,0.12)",
    badge: "-12px -12px 24px rgba(255,255,255,0.7), 12px 12px 24px rgba(0,0,0,0.12)",
    raised: "-16px -16px 32px rgba(255,255,255,0.8), 16px 16px 32px rgba(0,0,0,0.14)",
    inset: "inset -8px -8px 16px rgba(255,255,255,0.6), inset 8px 8px 16px rgba(0,0,0,0.1)",
  },
  borders: {
    card: "none",
    badge: "none",
    divider: "none",
  },
};
