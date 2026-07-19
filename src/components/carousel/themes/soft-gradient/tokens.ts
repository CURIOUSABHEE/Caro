import type { ThemeTokens } from "../tokens/types";

export const softGradientTokens: ThemeTokens = {
  colors: {
    text: "#1e293b",
    mutedText: "#475569",
    accent: "#7c3aed",
    background: "#e2e8f0",
    surface: "rgba(255, 255, 255, 0.45)",
    border: "rgba(255, 255, 255, 0.6)",
    codeBg: "#f6f8fa",
    codeFg: "#24292f",
    badgeBg: "rgba(255, 255, 255, 0.5)",
    badgeText: "#475569",
    scribble: "#7c3aed",
  },
  typography: { headingFont: "Outfit", bodyFont: "Outfit", codeFont: "JetBrains Mono", headingWeight: 800, bodyWeight: 400 },
  spacing: { padding: "80px", contentMargin: "35px", gap: "16px" },
  radius: { card: "32px", badge: "9999px", code: "12px", image: "12px" },
  shadows: { card: "none", badge: "none", raised: "none", inset: "none" },
  borders: { card: "1px solid rgba(255, 255, 255, 0.6)", badge: "1px solid rgba(255, 255, 255, 0.6)", divider: "none" },
};
