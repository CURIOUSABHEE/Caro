import type { ThemeTokens } from "../tokens/types";

export const monochromeTokens: ThemeTokens = {
  colors: {
    text: "#ffffff",
    mutedText: "#a3a3a3",
    accent: "#ffffff",
    background: "#050505",
    surface: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.1)",
    codeBg: "#0d1117",
    codeFg: "#e6edf3",
    badgeBg: "#ffffff",
    badgeText: "#050505",
    scribble: "#ffffff",
  },
  typography: { headingFont: "Outfit", bodyFont: "Outfit", codeFont: "JetBrains Mono", headingWeight: 700, bodyWeight: 400 },
  spacing: { padding: "90px", contentMargin: "40px", gap: "16px" },
  radius: { card: "4px", badge: "4px", code: "12px", image: "12px" },
  shadows: { card: "none", badge: "none", raised: "none", inset: "none" },
  borders: { card: "none", badge: "none", divider: "1px solid #1c1c1c" },
};
