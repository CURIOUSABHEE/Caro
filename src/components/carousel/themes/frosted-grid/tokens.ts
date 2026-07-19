import type { ThemeTokens } from "../tokens/types";

export const frostedGridTokens: ThemeTokens = {
  colors: {
    text: "#1a1a1a",
    mutedText: "rgba(26,26,26,0.6)",
    accent: "#a855f7",
    background: "#F8F9FA",
    surface: "rgba(255,255,255,0.6)",
    border: "rgba(0,0,0,0.03)",
    codeBg: "#0F172A",
    codeFg: "#FFFFFF",
    badgeBg: "#1a1a1a",
    badgeText: "#FFFFFF",
    scribble: "#FFFFFF",
  },
  typography: {
    headingFont: "Outfit",
    bodyFont: "Outfit",
    codeFont: "JetBrains Mono",
    headingWeight: 800,
    bodyWeight: 600,
  },
  spacing: {
    padding: "80px",
    contentMargin: "30px",
    gap: "16px",
  },
  radius: {
    card: "24px",
    badge: "9999px",
    code: "16px",
    image: "16px",
  },
  shadows: {
    card: "0 20px 40px rgba(0,0,0,0.05)",
    badge: "0 10px 20px rgba(0,0,0,0.05)",
    raised: "0 10px 30px rgba(0,0,0,0.15)",
    inset: "inset 4px 4px 12px rgba(255, 255, 255, 0.6), 6px 6px 15px rgba(0, 0, 0, 0.05)",
  },
  borders: {
    card: "1.5px solid rgba(0,0,0,0.03)",
    badge: "none",
    divider: "1px solid rgba(0,0,0,0.03)",
  },
};
