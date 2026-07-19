import type { ThemeTokens } from "../tokens/types";

export const glassmorphismTokens: ThemeTokens = {
  colors: {
    text: "#1e293b",
    mutedText: "rgba(30,41,59,0.6)",
    accent: "#0f172a",
    background: "#e2e8f0",
    surface: "rgba(255,255,255,0.55)",
    border: "rgba(255,255,255,0.4)",
    codeBg: "rgba(0,0,0,0.5)",
    codeFg: "#e2e8f0",
    badgeBg: "rgba(255,255,255,0.55)",
    badgeText: "rgba(30,41,59,0.6)",
    scribble: "#0f172a",
  },
  typography: { headingFont: "Outfit", bodyFont: "Outfit", codeFont: "JetBrains Mono", headingWeight: 800, bodyWeight: 500 },
  spacing: { padding: "90px", contentMargin: "30px", gap: "8px" },
  radius: { card: "32px", badge: "9999px", code: "16px", image: "20px" },
  shadows: { card: "0 24px 48px rgba(15,23,42,0.04), inset 0 0 0 1px rgba(255,255,255,0.3)", badge: "0 24px 48px rgba(15,23,42,0.04), inset 0 0 0 1px rgba(255,255,255,0.3)", raised: "0 10px 30px rgba(0,0,0,0.15)", inset: "none" },
  borders: { card: "1px solid rgba(255,255,255,0.4)", badge: "1px solid rgba(255,255,255,0.4)", divider: "none" },
};
