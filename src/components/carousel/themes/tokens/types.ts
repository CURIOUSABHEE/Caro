import type { ThemeColors } from "@/lib/types";

export interface TokenColors {
  text: string;
  mutedText: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  codeBg: string;
  codeFg: string;
  badgeBg: string;
  badgeText: string;
  scribble: string;
}

export interface TokenTypography {
  headingFont: string;
  bodyFont: string;
  codeFont: string;
  headingWeight: number;
  bodyWeight: number;
}

export interface TokenSpacing {
  padding: string;
  contentMargin: string;
  gap: string;
}

export interface TokenRadius {
  card: string;
  badge: string;
  code: string;
  image: string;
}

export interface TokenShadows {
  card: string;
  badge: string;
  raised: string;
  inset: string;
}

export interface TokenBorders {
  card: string;
  badge: string;
  divider: string;
}

export interface ThemeTokens {
  colors: TokenColors;
  typography: TokenTypography;
  spacing: TokenSpacing;
  radius: TokenRadius;
  shadows: TokenShadows;
  borders: TokenBorders;
}

export function tokensToThemeColors(tokens: ThemeTokens, extra?: Partial<ThemeColors>): ThemeColors {
  const glassBorderRaw = tokens.borders.card;
  const glassBorder = glassBorderRaw === "none" ? glassBorderRaw : glassBorderRaw.replace(/^[\d.]+px\s+solid\s+/, '');

  return {
    text: tokens.colors.text,
    accent: tokens.colors.accent,
    muted: tokens.colors.mutedText,
    glassBg: tokens.colors.surface,
    glassBorder,
    background: tokens.colors.background,
    accentBg: `${tokens.colors.accent}15`,
    cardShadow: tokens.shadows.card,
    cardBorderRadius: tokens.radius.card,
    ...extra,
  };
}
