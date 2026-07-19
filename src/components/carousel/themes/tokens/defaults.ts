import type { ThemeTokens } from "./types";

export const defaultTokens: ThemeTokens = {
  colors: {
    text: "#1a1a1a",
    mutedText: "rgba(26,26,26,0.5)",
    accent: "#2563eb",
    background: "#ffffff",
    surface: "#ffffff",
    border: "rgba(0,0,0,0.08)",
    codeBg: "#0d1117",
    codeFg: "#e6edf3",
    badgeBg: "#2563eb",
    badgeText: "#ffffff",
    scribble: "#ffffff",
  },
  typography: {
    headingFont: "Outfit",
    bodyFont: "Outfit",
    codeFont: "JetBrains Mono",
    headingWeight: 700,
    bodyWeight: 400,
  },
  spacing: {
    padding: "80px",
    contentMargin: "40px",
    gap: "16px",
  },
  radius: {
    card: "20px",
    badge: "9999px",
    code: "12px",
    image: "20px",
  },
  shadows: {
    card: "none",
    badge: "none",
    raised: "none",
    inset: "none",
  },
  borders: {
    card: "none",
    badge: "none",
    divider: "none",
  },
};
