import type { ThemeTokens } from "../tokens/types";

export const warmEditorialTokens: ThemeTokens = {
  colors: {
    text: "#1e1b18",
    mutedText: "#6b6259",
    accent: "#e05a47",
    background: "#f5f2eb",
    surface: "rgba(224, 90, 71, 0.04)",
    border: "rgba(224, 90, 71, 0.08)",
    codeBg: "#f5f2eb",
    codeFg: "#1e1b18",
    badgeBg: "#e05a47",
    badgeText: "#ffffff",
    scribble: "#e05a47",
  },
  typography: { headingFont: "Playfair Display", bodyFont: "Outfit", codeFont: "JetBrains Mono", headingWeight: 700, bodyWeight: 400 },
  spacing: { padding: "90px", contentMargin: "30px", gap: "16px" },
  radius: { card: "12px", badge: "9999px", code: "8px", image: "12px" },
  shadows: { card: "none", badge: "none", raised: "none", inset: "none" },
  borders: { card: "1px solid #e2d9ce", badge: "none", divider: "1px solid #e2d9ce" },
};
