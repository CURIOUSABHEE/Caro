import type { ThemeTokens } from "../tokens/types";

export const linenRustTokens: ThemeTokens = {
  colors: {
    text: "#2a2827",
    mutedText: "#5c5553",
    accent: "#b84a30",
    background: "#d8d7cf",
    surface: "rgba(197, 86, 60, 0.03)",
    border: "rgba(197, 86, 60, 0.06)",
    codeBg: "#f6f8fa",
    codeFg: "#24292f",
    badgeBg: "rgba(197, 86, 60, 0.1)",
    badgeText: "#b84a30",
    scribble: "#b84a30",
  },
  typography: { headingFont: "Outfit", bodyFont: "Outfit", codeFont: "JetBrains Mono", headingWeight: 700, bodyWeight: 400 },
  spacing: { padding: "100px 90px", contentMargin: "40px", gap: "16px" },
  radius: { card: "6px", badge: "9999px", code: "12px", image: "6px" },
  shadows: { card: "none", badge: "none", raised: "none", inset: "none" },
  borders: { card: "1px solid rgba(46, 43, 42, 0.15)", badge: "none", divider: "none" },
};
