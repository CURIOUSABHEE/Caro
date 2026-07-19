import type { ThemeTokens } from "../tokens/types";

export const cyberHorizonTokens: ThemeTokens = {
  colors: {
    text: "#ffffff",
    mutedText: "#a3a3a3",
    accent: "#ea580c",
    background: "#050505",
    surface: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.15)",
    codeBg: "#0d1117",
    codeFg: "#e6edf3",
    badgeBg: "rgba(20, 20, 20, 0.8)",
    badgeText: "#a3a3a3",
    scribble: "#ea580c",
  },
  typography: { headingFont: "Outfit", bodyFont: "Outfit", codeFont: "JetBrains Mono", headingWeight: 700, bodyWeight: 400 },
  spacing: { padding: "90px 80px", contentMargin: "40px", gap: "16px" },
  radius: { card: "12px", badge: "9999px", code: "12px", image: "12px" },
  shadows: { card: "none", badge: "none", raised: "none", inset: "none" },
  borders: { card: "1.5px solid rgba(255,255,255,0.15)", badge: "1.5px solid rgba(255,255,255,0.15)", divider: "none" },
};
