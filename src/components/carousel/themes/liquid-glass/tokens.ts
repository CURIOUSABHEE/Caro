import type { ThemeTokens } from "../tokens/types";

export const liquidGlassTokens: ThemeTokens = {
  colors: {
    text: "#0f172a",
    mutedText: "rgba(15, 23, 42, 0.6)",
    accent: "#0ea5e9",
    background: "#f8fafc",
    surface: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.9)",
    codeBg: "#ffffff",
    codeFg: "#0f172a",
    badgeBg: "rgba(255,255,255,0.4)",
    badgeText: "rgba(15, 23, 42, 0.6)",
    scribble: "#0ea5e9",
  },
  typography: { headingFont: "Outfit", bodyFont: "Outfit", codeFont: "JetBrains Mono", headingWeight: 900, bodyWeight: 600 },
  spacing: { padding: "80px", contentMargin: "30px", gap: "25px" },
  radius: { card: "40px", badge: "9999px", code: "24px", image: "24px" },
  shadows: {
    card: "inset 0px 8px 16px rgba(255,255,255,1), inset 0px -8px 16px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.1)",
    badge: "inset 0px 8px 16px rgba(255,255,255,1), inset 0px -8px 16px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.1)",
    raised: "0 20px 40px rgba(0,0,0,0.1)",
    inset: "inset 0px 8px 16px rgba(255,255,255,1), inset 0px -8px 16px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.1)",
  },
  borders: {
    card: "3px solid rgba(255,255,255,0.9)",
    badge: "2px solid rgba(255,255,255,0.9)",
    divider: "2px solid rgba(255,255,255,0.9)",
  },
};
