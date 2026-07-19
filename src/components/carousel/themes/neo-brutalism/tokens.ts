import type { ThemeTokens } from "../tokens/types";

export const neoBrutalismTokens: ThemeTokens = {
  colors: {
    text: "#141414",
    mutedText: "rgba(20,20,20,0.6)",
    accent: "#F4623A",
    background: "#F7F3EC",
    surface: "#F7F3EC",
    border: "#141414",
    codeBg: "#141414",
    codeFg: "#F7F3EC",
    badgeBg: "#FFD400",
    badgeText: "#141414",
    scribble: "#FF3EA5",
  },
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Outfit",
    codeFont: "JetBrains Mono",
    headingWeight: 900,
    bodyWeight: 600,
  },
  spacing: {
    padding: "60px",
    contentMargin: "30px",
    gap: "16px",
  },
  radius: {
    card: "20px",
    badge: "9999px",
    code: "20px",
    image: "20px",
  },
  shadows: {
    card: "10px 10px 0px #141414",
    badge: "none",
    raised: "10px 10px 0px #141414",
    inset: "none",
  },
  borders: {
    card: "3.5px solid #141414",
    badge: "3px solid #141414",
    divider: "3px solid #141414",
  },
};
