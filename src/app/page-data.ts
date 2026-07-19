import type { VisualType, VisualData } from "@/lib/types";

export type ThemeName = "monochrome" | "soft-gradient" | "warm-editorial" | "mesh-glow" | "cyber-horizon" | "linen-rust" | "neo-brutalism" | "neomorphism" | "frosted-grid" | "glassmorphism" | "liquid-glass" | "sketch" | "wireframe-3d";

export interface Shape {
  id: string;
  type: "rect" | "circle" | "text";
  x: number;      // 0 to 100 (%)
  y: number;      // 0 to 100 (%)
  width: number;  // px
  height: number; // px
  color: string;
  text?: string;
  fontSize?: number;
}

export interface Slide {
  id: string;
  type: "COVER" | "CONTENT" | "CLOSING";
  order: number;
  approved: boolean;

  aiTitle: string;
  aiBody: string;
  userTitle: string;
  userBody: string;
  isEdited: boolean;

  imageUrl?: string | null;
  imageLayout?: "background" | "inline";
  shapes?: Shape[];
  visualType?: VisualType;
  visualData?: VisualData | Record<string, unknown>;
  elements?: import("@/components/CanvasEditor").CanvasElement[];
  manuallyEdited?: boolean;
  canvasPngUrl?: string;
}

export const TONES = [
  { value: "professional", label: "👔 Professional & Corporate" },
  { value: "educational", label: "💡 Educational & Informative" },
  { value: "punchy", label: "🔥 Punchy & Minimalist" },
  { value: "contrarian", label: "⚡ Contrarian & Bold" },
  { value: "story-driven", label: "📖 Story-Driven & Narrative" },
];

export const PRESET_COLORS = [
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#2563eb", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Yellow" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#db2777", label: "Pink" },
];

export const PALETTE_INFO: { name: ThemeName; label: string; colors: string[] }[] = [
  { name: "monochrome", label: "Monochrome", colors: ["#050505", "#ffffff", "#6e6e6e"] },
  { name: "soft-gradient", label: "Soft Gradient", colors: ["#fbfbfc", "#c084fc", "#f472b6"] },
  { name: "warm-editorial", label: "Warm Editorial", colors: ["#FDFBF7", "#E05A47", "#2C3E50"] },
  { name: "mesh-glow", label: "Mesh Glow", colors: ["#ffffff", "#ec4899", "#f472b6"] },
  { name: "cyber-horizon", label: "Cyber Horizon", colors: ["#0a0a0a", "#ea580c", "#3b82f6"] },
  { name: "linen-rust", label: "Linen & Rust", colors: ["#d8d7cf", "#c5563c", "#2e2b2a"] },
  { name: "neo-brutalism", label: "Neo Brutalism", colors: ["#E5E5E5", "#161616", "#FF4500"] },
  { name: "neomorphism", label: "Neomorphism", colors: ["#E4E0DA", "#E8503A", "#2B2B2B"] },
  { name: "frosted-grid", label: "Frosted Grid", colors: ["#a855f7", "#ffffff", "#000000"] },
  { name: "glassmorphism", label: "Glassmorphism", colors: ["#0f172a", "#e2e8f0", "#ffffff"] },
  { name: "liquid-glass", label: "Liquid Glass", colors: ["#0ea5e9", "#f97316", "#f8fafc"] },
  { name: "sketch", label: "Sketch", colors: ["#2d2d2d", "#fdfaf6", "#4a4a4a"] },
  { name: "wireframe-3d", label: "Wireframe 3D", colors: ["#ffffff", "#000000", "#e5e5e5"] },
];

export const THEME_DEFAULT_COLORS: Record<string, { background: string; text: string; primary: string; secondary: string; tertiary: string }> = {
  "monochrome": { background: "#050505", text: "#ffffff", primary: "#ffffff", secondary: "#a3a3a3", tertiary: "#525252" },
  "soft-gradient": { background: "#fbfbfc", text: "#0f172a", primary: "#7c3aed", secondary: "#ec4899", tertiary: "#3b82f6" },
  "warm-editorial": { background: "#f5f2eb", text: "#1e1b18", primary: "#e05a47", secondary: "#6b6259", tertiary: "#a8a297" },
  "mesh-glow": { background: "#fdf2f8", text: "#0a0a0a", primary: "#ec4899", secondary: "#f472b6", tertiary: "#3b82f6" },
  "cyber-horizon": { background: "#050505", text: "#ffffff", primary: "#ea580c", secondary: "#3b82f6", tertiary: "#4b5563" },
  "linen-rust": { background: "#d8d7cf", text: "#1c1917", primary: "#b84a30", secondary: "#5c5553", tertiary: "#8b857d" },
  "neo-brutalism": { background: "#F7F3EC", text: "#141414", primary: "#161616", secondary: "#555555", tertiary: "#999999" },
  "neomorphism": { background: "#E4E0DA", text: "#2B2B2B", primary: "#E8503A", secondary: "#C43D2A", tertiary: "#F4A896" },
  "frosted-grid": { background: "#050505", text: "#FFFFFF", primary: "#FDE68A", secondary: "#9CA3AF", tertiary: "#4B5563" },
  "glassmorphism": { background: "#0B0F19", text: "#FFFFFF", primary: "#38bdf8", secondary: "#818cf8", tertiary: "#475569" },
  "liquid-glass": { background: "#0f172a", text: "#F1F5F9", primary: "#0ea5e9", secondary: "#3b82f6", tertiary: "#64748b" },
  "sketch": { background: "#ffffff", text: "#1c1c1c", primary: "#000000", secondary: "#444444", tertiary: "#888888" },
  "wireframe-3d": { background: "#f4f4f4", text: "#000000", primary: "#000000", secondary: "#333333", tertiary: "#888888" },
};

export const PALETTE_PRESETS = [
  { name: "Sunset", background: "#F7F3EC", text: "#141414", primary: "#F4623A", secondary: "#FFD400", tertiary: "#2EC4B6" },
  { name: "Berry", background: "#FAF3EF", text: "#161616", primary: "#D6336C", secondary: "#FFB700", tertiary: "#845EF7" },
  { name: "Forest", background: "#F4F6EE", text: "#1B1B1B", primary: "#2F9E44", secondary: "#FFC078", tertiary: "#1098AD" },
  { name: "Ocean", background: "#F0F4F8", text: "#0F172A", primary: "#2563EB", secondary: "#06B6D4", tertiary: "#7C3AED" },
  { name: "Candy", background: "#FFF5F5", text: "#1A1A2E", primary: "#FF3EA5", secondary: "#FFD400", tertiary: "#00D4AA" },
  { name: "Midnight", background: "#0F0F1A", text: "#E8E8E8", primary: "#FF6B35", secondary: "#FFD93D", tertiary: "#6BCB77" },
  { name: "Rose", background: "#FDF2F2", text: "#1C1917", primary: "#E11D48", secondary: "#FDA4AF", tertiary: "#8B5CF6" },
  { name: "Mint", background: "#F0FDF4", text: "#0F172A", primary: "#059669", secondary: "#34D399", tertiary: "#0284C7" },
];
