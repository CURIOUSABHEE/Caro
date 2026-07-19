import type { ThemeTokens } from "../tokens/types";

export const meshGlowTokens: ThemeTokens = {
  colors: {
    text: "#0a0a0a",
    mutedText: "#374151",
    accent: "#3b82f6",
    background: "#fdf2f8",
    surface: "rgba(10, 10, 10, 0.04)",
    border: "rgba(10, 10, 10, 0.08)",
    codeBg: "#0a0a0a",
    codeFg: "#f0f0f0",
    badgeBg: "#ec4899",
    badgeText: "#ffffff",
    scribble: "#ec4899",
  },
  typography: {
    headingFont: "Outfit",
    bodyFont: "Outfit",
    codeFont: "JetBrains Mono",
    headingWeight: 900,
    bodyWeight: 400,
  },
  spacing: {
    padding: "90px",
    contentMargin: "40px",
    gap: "8px",
  },
  radius: {
    card: "12px",
    badge: "9999px",
    code: "8px",
    image: "12px",
  },
  shadows: {
    card: "none",
    badge: "none",
    raised: "none",
    inset: "none",
  },
  borders: {
    card: "1.5px solid rgba(10, 10, 10, 0.08)",
    badge: "none",
    divider: "1px solid rgba(232,103,58,0.25)",
  },
};
