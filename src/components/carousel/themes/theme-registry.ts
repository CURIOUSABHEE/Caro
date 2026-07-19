import type { ThemeRenderFn } from "./theme-types";

import monochrome from "./monochrome";
import softGradient from "./soft-gradient";
import warmEditorial from "./warm-editorial";
import meshGlow from "./mesh-glow";
import cyberHorizon from "./cyber-horizon";
import linenRust from "./linen-rust";
import neoBrutalism from "./neo-brutalism";
import neomorphism from "./neomorphism";
import frostedGrid from "./frosted-grid";
import glassmorphism from "./glassmorphism";
import liquidGlass from "./liquid-glass";
import wireframe3d from "./wireframe-3d";
import sketch from "./sketch";

const themeRegistry: Record<string, ThemeRenderFn> = {
  "monochrome": monochrome,
  "soft-gradient": softGradient,
  "warm-editorial": warmEditorial,
  "mesh-glow": meshGlow,
  "cyber-horizon": cyberHorizon,
  "linen-rust": linenRust,
  "neo-brutalism": neoBrutalism,
  "neomorphism": neomorphism,
  "frosted-grid": frostedGrid,
  "glassmorphism": glassmorphism,
  "liquid-glass": liquidGlass,
  "wireframe-3d": wireframe3d,
  "sketch": sketch,
};

export function getThemeRenderer(themeName: string): ThemeRenderFn | undefined {
  return themeRegistry[themeName];
}

export default themeRegistry;
