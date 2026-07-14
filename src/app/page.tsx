"use client";

import axios from "axios";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { CanvasElement } from "@/components/CanvasEditor";
import { StageErrorBoundary } from "@/components/StageErrorBoundary";

const CanvasEditor = dynamic(() => import("@/components/CanvasEditor"), { ssr: false });
import type { VisualType, VisualData } from "@/lib/types";

import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Image as ImageIcon,
  AlertCircle,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Square as SquareIcon,
  Circle as CircleIcon,
  Type as TypeIcon,
  Layers
} from "lucide-react";

const THEME_DEFAULT_COLORS: Record<string, { background: string; text: string; primary: string; secondary: string; tertiary: string }> = {
  "monochrome": { background: "#050505", text: "#ffffff", primary: "#ffffff", secondary: "#a3a3a3", tertiary: "#525252" },
  "soft-gradient": { background: "#fbfbfc", text: "#0f172a", primary: "#7c3aed", secondary: "#ec4899", tertiary: "#3b82f6" },
  "warm-editorial": { background: "#f5f2eb", text: "#1e1b18", primary: "#e05a47", secondary: "#6b6259", tertiary: "#a8a297" },
  "mesh-glow": { background: "#fdf2f8", text: "#0a0a0a", primary: "#ec4899", secondary: "#f472b6", tertiary: "#3b82f6" },
  "cyber-horizon": { background: "#050505", text: "#ffffff", primary: "#ea580c", secondary: "#3b82f6", tertiary: "#4b5563" },
  "linen-rust": { background: "#d8d7cf", text: "#1c1917", primary: "#b84a30", secondary: "#5c5553", tertiary: "#8b857d" },
  "neo-brutalism": { background: "#F7F3EC", text: "#141414", primary: "#161616", secondary: "#555555", tertiary: "#999999" },
  "neomorphism": { background: "#E4E0DA", text: "#2C3E50", primary: "#6D8CAE", secondary: "#95A5A6", tertiary: "#BDC3C7" },
  "frosted-grid": { background: "#050505", text: "#FFFFFF", primary: "#FDE68A", secondary: "#9CA3AF", tertiary: "#4B5563" },
  "glassmorphism": { background: "#0B0F19", text: "#FFFFFF", primary: "#38bdf8", secondary: "#818cf8", tertiary: "#475569" },
  "liquid-glass": { background: "#0f172a", text: "#F1F5F9", primary: "#0ea5e9", secondary: "#3b82f6", tertiary: "#64748b" },
  "sketch": { background: "#ffffff", text: "#1c1c1c", primary: "#000000", secondary: "#444444", tertiary: "#888888" },
  "wireframe-3d": { background: "#f4f4f4", text: "#000000", primary: "#000000", secondary: "#333333", tertiary: "#888888" },
};

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

interface Slide {
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
  elements?: CanvasElement[];
  manuallyEdited?: boolean;
  canvasPngUrl?: string;
}

const TONES = [
  { value: "professional", label: "👔 Professional & Corporate" },
  { value: "educational", label: "💡 Educational & Informative" },
  { value: "punchy", label: "🔥 Punchy & Minimalist" },
  { value: "contrarian", label: "⚡ Contrarian & Bold" },
  { value: "story-driven", label: "📖 Story-Driven & Narrative" },
];

const PRESET_COLORS = [
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#2563eb", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Yellow" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#db2777", label: "Pink" }
];

type ThemeName = "monochrome" | "soft-gradient" | "warm-editorial" | "mesh-glow" | "cyber-horizon" | "linen-rust" | "neo-brutalism" | "neomorphism" | "frosted-grid" | "glassmorphism" | "liquid-glass" | "sketch" | "wireframe-3d";

const PALETTE_INFO: { name: ThemeName; label: string; colors: string[] }[] = [
  { name: "monochrome", label: "Monochrome", colors: ["#050505", "#ffffff", "#6e6e6e"] },
  { name: "soft-gradient", label: "Soft Gradient", colors: ["#fbfbfc", "#c084fc", "#f472b6"] },
  { name: "warm-editorial", label: "Warm Editorial", colors: ["#FDFBF7", "#E05A47", "#2C3E50"] },
  { name: "mesh-glow", label: "Mesh Glow", colors: ["#ffffff", "#ec4899", "#f472b6"] },
  { name: "cyber-horizon", label: "Cyber Horizon", colors: ["#0a0a0a", "#ea580c", "#3b82f6"] },
  { name: "linen-rust", label: "Linen & Rust", colors: ["#d8d7cf", "#c5563c", "#2e2b2a"] },
  { name: "neo-brutalism", label: "Neo Brutalism", colors: ["#E5E5E5", "#161616", "#FF4500"] },
  { name: "neomorphism", label: "Neomorphism", colors: ["#E0E5EC", "#6D8CAE", "#ffffff"] },
  { name: "frosted-grid", label: "Frosted Grid", colors: ["#a855f7", "#ffffff", "#000000"] },
  { name: "glassmorphism", label: "Glassmorphism", colors: ["#0f172a", "#e2e8f0", "#ffffff"] },
  { name: "liquid-glass", label: "Liquid Glass", colors: ["#0ea5e9", "#f97316", "#f8fafc"] },
  { name: "sketch", label: "Sketch", colors: ["#2d2d2d", "#fdfaf6", "#4a4a4a"] },
  { name: "wireframe-3d", label: "Wireframe 3D", colors: ["#ffffff", "#000000", "#e5e5e5"] },
];

const convertBase64PngToJpg = (pngBase64Uri: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = (err) => reject(err);
    img.src = pngBase64Uri;
  });
};

const sanitizeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50)
    || "slide";
};

export default function Home() {
  // Wizard flow state & Gating
  const [step, setStep] = useState<number>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Stage 1 State
  const [url, setUrl] = useState<string>("");
  const [pastedText, setPastedText] = useState<string>("");
  const [usePastedText, setUsePastedText] = useState<boolean>(false);
  const [preferences, setPreferences] = useState({
    tone: "professional",
    focus: "",
    slideCount: "auto" as number | "auto"
  });
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState<boolean>(false);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);

  // Content Intelligence State
  const [targetPlatform, setTargetPlatform] = useState<"linkedin" | "instagram" | "twitter" | "pitch-deck">("linkedin");
  const [audience, setAudience] = useState<"founders" | "engineers" | "marketers" | "beginners" | "executives">("founders");
  const [goal, setGoal] = useState<"teach" | "sell" | "summarize" | "announce" | "persuade">("teach");
  const [ctaStyle, setCtaStyle] = useState<"soft" | "direct" | "newsletter" | "product" | "no-cta">("soft");

  // Outlines State
  const [outlines, setOutlines] = useState<{
    id: string;
    title: string;
    description: string;
    slides: { title: string; type: "COVER" | "CONTENT" | "CLOSING"; visualType: VisualType }[];
  }[]>([]);
  const [selectedOutlineId, setSelectedOutlineId] = useState<string>("");
  const [isGeneratingOutlines, setIsGeneratingOutlines] = useState<boolean>(false);

  // Brand Kit State
  const [brandKit, setBrandKit] = useState<{
    logoUrl?: string;
    colors?: { primary: string; secondary: string; background: string; text: string };
    fontPairing?: string;
    handle?: string;
    website?: string;
    defaultCTA?: string;
    defaultTone?: string;
    defaultTheme?: string;
  }>({});
  const [isBrandKitOpen, setIsBrandKitOpen] = useState<boolean>(false);

  // Custom Theme Variations State
  const [customFontPairing, setCustomFontPairing] = useState<string>("Outfit + Outfit");
  const [customLayoutDensity, setCustomLayoutDensity] = useState<"compact" | "comfortable" | "minimal">("comfortable");
  const [customLogoUrl, setCustomLogoUrl] = useState<string>("");
  const [noImages, setNoImages] = useState<boolean>(false);
  const [customAccentColor, setCustomAccentColor] = useState<string>("");

  // Alternatives Modal / Swapper State
  const [alternativesSlideType, setAlternativesSlideType] = useState<"COVER" | "CLOSING" | null>(null);
  const [alternativesSlideIdx, setAlternativesSlideIdx] = useState<number | null>(null);
  const [alternativesList, setAlternativesList] = useState<{ title: string; body: string }[]>([]);
  const [isGeneratingAlternatives, setIsGeneratingAlternatives] = useState<boolean>(false);

  // Stage 2 State
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isRegenerating, setIsRegenerating] = useState<Record<string, boolean>>({});
  const [aiInstructions, setAiInstructions] = useState<Record<string, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [themeName, setThemeName] = useState<ThemeName>("monochrome");
  const activeThemeRef = React.useRef(themeName);
  activeThemeRef.current = themeName;
  const [username, setUsername] = useState<string>("");
  const [paletteOverride, setPaletteOverride] = useState<Record<string, string> | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "pdf">("png");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [showWebsiteModal, setShowWebsiteModal] = useState<boolean>(false);
  const [scribble, setScribble] = useState<boolean>(false);

  // Live Theme Preview State
  const PALETTE_PRESETS = [
    { name: "Sunset", background: "#F7F3EC", text: "#141414", primary: "#F4623A", secondary: "#FFD400", tertiary: "#2EC4B6" },
    { name: "Berry", background: "#FAF3EF", text: "#161616", primary: "#D6336C", secondary: "#FFB700", tertiary: "#845EF7" },
    { name: "Forest", background: "#F4F6EE", text: "#1B1B1B", primary: "#2F9E44", secondary: "#FFC078", tertiary: "#1098AD" },
    { name: "Ocean", background: "#F0F4F8", text: "#0F172A", primary: "#2563EB", secondary: "#06B6D4", tertiary: "#7C3AED" },
    { name: "Candy", background: "#FFF5F5", text: "#1A1A2E", primary: "#FF3EA5", secondary: "#FFD400", tertiary: "#00D4AA" },
    { name: "Midnight", background: "#0F0F1A", text: "#E8E8E8", primary: "#FF6B35", secondary: "#FFD93D", tertiary: "#6BCB77" },
    { name: "Rose", background: "#FDF2F2", text: "#1C1917", primary: "#E11D48", secondary: "#FDA4AF", tertiary: "#8B5CF6" },
    { name: "Mint", background: "#F0FDF4", text: "#0F172A", primary: "#059669", secondary: "#34D399", tertiary: "#0284C7" },
  ];
  const [themePreviewUri, setThemePreviewUri] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  const [previewSlideIdx, setPreviewSlideIdx] = useState<number>(0);

  // Stage 4 State
  const [renderedImages, setRenderedImages] = useState<string[]>([]);
  const [selectedForExport, setSelectedForExport] = useState<Record<number, boolean>>({});
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [allThemeImages, setAllThemeImages] = useState<Record<string, string[]>>({});
  const [themeLoadingStates, setThemeLoadingStates] = useState<Record<string, boolean>>({});
  
  const [editingSlideIdx, setEditingSlideIdx] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCanvasEditorOpen, setIsCanvasEditorOpen] = useState<boolean>(false);
  const [canvasBgImage, setCanvasBgImage] = useState<string | null>(null);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState<boolean>(false);
  const [showRegenerateAllConfirm, setShowRegenerateAllConfirm] = useState<boolean>(false);

  // Social Preview State
  const [viewMode, setViewMode] = useState<"grid" | "social">("grid");
  const [activeSocialSlide, setActiveSocialSlide] = useState<number>(0);
  const [socialLiked, setSocialLiked] = useState<boolean>(false);

  // Hardcoded theme previews — instant, no API call needed
  const THEME_PREVIEWS: Record<string, string> = {
    "monochrome": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#050505"/><rect x="35" y="35" width="330" height="430" fill="none" stroke="#1c1c1c" stroke-width="1"/><text x="200" y="55" font-family="system-ui,sans-serif" font-size="11" fill="#6e6e6e" font-weight="700" text-anchor="middle">INTRODUCTION</text><text x="320" y="55" font-family="system-ui,sans-serif" font-size="11" fill="#6e6e6e" font-weight="700" text-anchor="end">1/5</text><text x="200" y="240" text-anchor="middle" font-family="Georgia,serif" font-size="36" fill="white" font-weight="400">Monochrome</text><line x1="150" y1="260" x2="250" y2="260" stroke="#333" stroke-width="1"/><text x="200" y="295" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#a3a3a3" font-weight="400">Minimal. Bold. Timeless.</text><text x="40" y="455" font-family="system-ui,sans-serif" font-size="13" fill="white" font-weight="800">@username</text><text x="330" y="455" font-family="system-ui,sans-serif" font-size="12" fill="#7a7a7a" font-weight="700" text-anchor="end">SWIPE &gt;</text></svg>`),
    "soft-gradient": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c084fc"/><stop offset="100%" stop-color="#f472b6"/></linearGradient></defs><rect width="400" height="500" fill="#fbfbfc"/><circle cx="200" cy="460" r="260" fill="url(#sg)" opacity="0.12"/><circle cx="80" cy="80" r="180" fill="#c084fc" opacity="0.06"/><circle cx="340" cy="120" r="140" fill="#f472b6" opacity="0.08"/><rect x="25" y="30" width="350" height="440" rx="24" fill="white" opacity="0.55" stroke="rgba(255,255,255,0.6)" stroke-width="1"/><rect x="35" y="42" width="80" height="22" rx="9999" fill="white" opacity="0.5" stroke="rgba(255,255,255,0.3)" stroke-width="1"/><text x="75" y="57" font-family="system-ui,sans-serif" font-size="9" fill="#475569" font-weight="800" text-anchor="middle" text-transform="uppercase" letter-spacing="1">Cover Story</text><text x="310" y="57" font-family="system-ui,sans-serif" font-size="10" fill="#475569" font-weight="800">1/5</text><text x="200" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" fill="#0f172a" font-weight="800" letter-spacing="-1">Soft Gradient</text><text x="200" y="260" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#475569">Lush. Flowing. Vibrant.</text><rect x="35" y="420" width="100" height="26" rx="9999" fill="rgba(15,23,42,0.04)" stroke="rgba(15,23,42,0.05)" stroke-width="1"/><text x="85" y="438" font-family="system-ui,sans-serif" font-size="11" fill="#0f172a" font-weight="800" text-anchor="middle">@username</text></svg>`),
    "warm-editorial": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#f5f2eb"/><rect x="0" y="0" width="400" height="4" fill="#e05a47"/><text x="40" y="55" font-family="system-ui,sans-serif" font-size="11" fill="#e05a47" font-weight="800" letter-spacing="2">CARO</text><text x="340" y="55" font-family="system-ui,sans-serif" font-size="10" fill="#e05a47" font-weight="800">1/5</text><text x="40" y="105" font-family="system-ui,sans-serif" font-size="12" fill="#e05a47" font-weight="800" letter-spacing="3" text-transform="uppercase">Step-by-Step Guide</text><text x="40" y="175" font-family="Georgia,serif" font-size="36" fill="#1e1b18" font-weight="700">Warm</text><text x="40" y="220" font-family="Georgia,serif" font-size="36" fill="#e05a47" font-weight="700">Editorial</text><line x1="40" y1="245" x2="140" y2="245" stroke="#e05a47" stroke-width="2" opacity="0.4"/><text x="40" y="285" font-family="system-ui,sans-serif" font-size="15" fill="#6b6259">Elegant serif titles,</text><text x="40" y="310" font-family="system-ui,sans-serif" font-size="15" fill="#6b6259">terracotta red highlights.</text><text x="40" y="455" font-family="system-ui,sans-serif" font-size="11" fill="#e05a47" font-weight="800" letter-spacing="2">REALLYGREATSITE.COM</text><text x="330" y="455" font-family="system-ui,sans-serif" font-size="10" fill="#1e1b18" font-weight="800" text-anchor="end" text-transform="uppercase">Swipe next</text></svg>`),
    "mesh-glow": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><radialGradient id="mg1" cx="0%" cy="0%" r="25%"><stop offset="0%" stop-color="#ec4899" stop-opacity="0.25"/><stop offset="100%" stop-color="#ec4899" stop-opacity="0"/></radialGradient><radialGradient id="mg2" cx="100%" cy="100%" r="25%"><stop offset="0%" stop-color="#f472b6" stop-opacity="0.2"/><stop offset="100%" stop-color="#f472b6" stop-opacity="0"/></radialGradient></defs><rect width="400" height="500" fill="#fdf2f8"/><rect width="400" height="500" fill="url(#mg1)"/><rect width="400" height="500" fill="url(#mg2)"/><text x="30" y="50" font-family="Georgia,serif" font-size="28" fill="#ec4899" font-weight="800">*</text><text x="40" y="220" font-family="system-ui,sans-serif" font-size="36" fill="#0a0a0a" font-weight="900">Mesh Glow</text><path d="M 42 235 S 130 228 220 235 S 290 242 330 238" stroke="#ec4899" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="40" y="265" width="140" height="28" rx="9999" fill="none" stroke="#0a0a0a" stroke-width="1.5"/><text x="110" y="284" font-family="system-ui,sans-serif" font-size="10" fill="#0a0a0a" font-weight="850" text-anchor="middle" letter-spacing="1" text-transform="uppercase">Swipe to learn</text><circle cx="340" cy="50" r="50" fill="#f472b6" opacity="0.12"/></svg>`),
    "cyber-horizon": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#0a0a0a"/>${Array.from({length:10}).map((_,i)=>`<line x1="0" y1="${i*50}" x2="400" y2="${i*50}" stroke="#ea580c" stroke-opacity="0.1" stroke-width="1"/><line x1="${i*40}" y1="0" x2="${i*40}" y2="500" stroke="#ea580c" stroke-opacity="0.1" stroke-width="1"/>`).join("")}<text x="40" y="200" font-family="monospace" font-size="36" fill="#ea580c" font-weight="bold" letter-spacing="-1">Cyber</text><text x="40" y="240" font-family="monospace" font-size="36" fill="#ffffff" font-weight="bold" letter-spacing="-1">Horizon</text><rect x="40" y="270" width="120" height="4" fill="#3b82f6"/><rect x="40" y="300" width="100" height="30" fill="#ea580c" opacity="0.1" stroke="#ea580c" stroke-width="1"/><text x="90" y="318" font-family="monospace" font-size="10" fill="#ea580c" text-anchor="middle">[SYSTEM_READY]</text></svg>`),
    "linen-rust": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><pattern id="lr-noise" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M 0 0 L 1 1 M 2 0 L 3 1" stroke="#b84a30" stroke-width="0.5" opacity="0.15"/></pattern></defs><rect width="400" height="500" fill="#d8d7cf"/><rect width="400" height="500" fill="url(#lr-noise)"/><text x="200" y="45" text-anchor="middle" font-family="system-ui,sans-serif" font-size="8" fill="#a8a79a" font-weight="700" letter-spacing="3">* EDITORIAL *</text><text x="40" y="130" font-family="Georgia,serif" font-size="36" fill="#b84a30" font-style="italic" font-weight="400">Linen &amp; Rust</text><path d="M 40 165 Q 100 148 160 170 Q 220 192 280 168 Q 330 148 360 168" stroke="#b84a30" stroke-width="1.5" fill="none" opacity="0.35"/><rect x="40" y="190" width="60" height="3" fill="#b84a30"/><text x="40" y="235" font-family="system-ui,sans-serif" font-size="15" fill="#5c5553">Warm oatmeal, terracotta</text><text x="40" y="260" font-family="system-ui,sans-serif" font-size="15" fill="#5c5553">accents, organic texture.</text><text x="58" y="340" font-family="system-ui,sans-serif" font-size="18" fill="#b84a30" opacity="0.45">*</text><text x="125" y="420" font-family="system-ui,sans-serif" font-size="14" fill="#b84a30" opacity="0.35">*</text><text x="290" y="300" font-family="system-ui,sans-serif" font-size="22" fill="#b84a30" opacity="0.3">*</text><text x="340" y="460" font-family="system-ui,sans-serif" font-size="12" fill="#b84a30" opacity="0.25">*</text><rect x="250" y="435" width="110" height="30" rx="15" fill="rgba(184,74,48,0.07)" stroke="#b84a30" stroke-width="1.5"/><text x="305" y="455" font-family="Georgia,serif" font-style="italic" font-size="12" fill="#b84a30" font-weight="700" text-anchor="middle">Swipe next</text></svg>`),
    "neo-brutalism": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><pattern id="dot-grid" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#141414" opacity="0.1"/></pattern></defs><rect width="400" height="500" fill="#F7F3EC"/><rect width="400" height="500" fill="url(#dot-grid)"/><rect x="0" y="0" width="400" height="40" fill="#F4623A"/><text x="20" y="24" font-family="system-ui,sans-serif" font-size="10" fill="#F7F3EC" font-weight="800" letter-spacing="2">INTRODUCTION</text><text x="380" y="24" font-family="system-ui,sans-serif" font-size="10" fill="#F7F3EC" font-weight="800" text-anchor="end">1/5</text><rect x="35" y="150" width="330" height="150" rx="12" fill="#2EC4B6"/><rect x="25" y="140" width="330" height="150" rx="12" fill="#F7F3EC" stroke="#141414" stroke-width="3"/><text x="45" y="195" font-family="Georgia,serif" font-size="38" fill="#F4623A" font-weight="900" font-style="italic" letter-spacing="-1">Neo-Brutalism</text><text x="45" y="235" font-family="system-ui,sans-serif" font-size="15" fill="#141414" font-weight="700">Loud, proud, heavily shadowed.</text><rect x="25" y="420" width="100" height="24" rx="12" fill="#FFD400"/><rect x="20" y="415" width="100" height="24" rx="12" fill="#FFD400" stroke="#141414" stroke-width="2"/><text x="70" y="432" font-family="system-ui,sans-serif" font-size="10" fill="#141414" font-weight="800" text-anchor="middle">@username</text></svg>`),
    "neomorphism": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><radialGradient id="neo-bg" cx="0%" cy="0%" r="100%"><stop offset="0%" stop-color="rgba(255,255,255,0.4)"/><stop offset="60%" stop-color="#E4E0DA"/><stop offset="100%" stop-color="rgba(0,0,0,0.05)"/></radialGradient><filter id="neo-shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur1"/><feOffset dx="-6" dy="-6" result="offset1"/><feFlood flood-color="#ffffff" flood-opacity="0.8"/><feComposite in2="offset1" operator="in" result="shadow1"/><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur2"/><feOffset dx="6" dy="6" result="offset2"/><feFlood flood-color="#000000" flood-opacity="0.15"/><feComposite in2="offset2" operator="in" result="shadow2"/><feMerge><feMergeNode in="shadow1"/><feMergeNode in="shadow2"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="400" height="500" fill="url(#neo-bg)"/><rect x="40" y="140" width="320" height="200" rx="20" fill="#E4E0DA" filter="url(#neo-shadow)"/><text x="200" y="220" font-family="system-ui,sans-serif" font-size="34" fill="#E8503A" font-weight="700" letter-spacing="-1" text-anchor="middle">Neomorphism</text><text x="200" y="260" font-family="system-ui,sans-serif" font-size="15" fill="#5a5a5a" font-weight="500" text-anchor="middle">Soft extruded clay-like UI.</text><rect x="150" y="380" width="100" height="30" rx="15" fill="#E4E0DA" filter="url(#neo-shadow)"/><text x="200" y="400" font-family="system-ui,sans-serif" font-size="12" fill="#5a5a5a" font-weight="700" text-anchor="middle">SWIPE &gt;</text></svg>`),
    "frosted-grid": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#f8fafc"/>${Array.from({length: 10}).map((_, i) => `<line x1="${i*40}" y1="0" x2="${i*40}" y2="500" stroke="rgba(0,0,0,0.03)" stroke-width="1"/>`).join("")}<defs><radialGradient id="fg1" cx="50%" cy="100%" r="60%"><stop offset="0%" stop-color="#a855f7" stop-opacity="0.8"/><stop offset="100%" stop-color="#a855f7" stop-opacity="0"/></radialGradient></defs><rect width="400" height="500" fill="url(#fg1)"/>${Array.from({length: 20}).map((_, i) => { const col = i%4; const row = Math.floor(i/4); const startRow = [2, 1, 2, 3][col]; if (row >= startRow) return `<rect x="${col*40+40}" y="${row*40+150}" width="40" height="40" rx="8" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.8)" stroke-width="1"/>`; return ""; }).join("")}<text x="40" y="100" font-family="system-ui,sans-serif" font-size="42" fill="#000000" font-weight="900">Frosted</text><text x="40" y="140" font-family="system-ui,sans-serif" font-size="42" fill="#a855f7" font-weight="900">Grid</text></svg>`),
    "glassmorphism": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="gl-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#f8fafc"/></linearGradient></defs><rect width="400" height="500" fill="url(#gl-bg)"/>${Array.from({length: 3}).map((_, i) => `<rect x="${40 + i*10}" y="${150 + i*20}" width="280" height="180" rx="16" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" style="box-shadow: 0 20px 40px rgba(15,23,42,0.04), inset 0 0 0 1px rgba(255,255,255,0.3)"/>`).join("")}<text x="180" y="250" font-family="system-ui,sans-serif" font-size="28" fill="#1e293b" font-weight="800" text-anchor="middle" letter-spacing="-1">Glassmorphism</text></svg>`),
    "liquid-glass": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="lq-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0ea5e9"/><stop offset="100%" stop-color="#f97316"/></linearGradient></defs><rect width="400" height="500" fill="#f8fafc"/><rect x="40" y="150" width="320" height="200" rx="100" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.9)" stroke-width="3" style="box-shadow: inset 0px 8px 16px rgba(255,255,255,1), inset 0px -8px 16px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.1)"/><circle cx="90" cy="250" r="30" fill="url(#lq-grad)"/><text x="220" y="262" font-family="system-ui,sans-serif" font-size="32" fill="#0f172a" font-weight="800" text-anchor="middle" letter-spacing="-1">Liquid Glass</text></svg>`),
    "sketch": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#fdfaf6"/><defs><pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="8" stroke="#2d2d2d" stroke-width="1" opacity="0.3"/></pattern></defs><rect x="40" y="150" width="320" height="200" fill="url(#hatch)"/><path d="M 38 148 L 362 152 L 358 352 L 42 348 Z" fill="none" stroke="#2d2d2d" stroke-width="2" stroke-linecap="round"/><path d="M 42 152 L 358 148 L 362 348 L 38 352 Z" fill="none" stroke="#2d2d2d" stroke-width="1.5" stroke-linecap="round"/><text x="200" y="260" font-family="cursive, system-ui" font-size="42" fill="#2d2d2d" font-weight="700" text-anchor="middle" transform="rotate(-2 200 260)">Sketch</text></svg>`),
    "wireframe-3d": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#f4f4f4"/><defs><pattern id="w3Grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1"/></pattern></defs><rect width="400" height="500" fill="url(#w3Grid)"/><rect x="20" y="80" width="320" height="380" rx="16" fill="rgba(0,0,0,0.08)"/><rect x="30" y="70" width="320" height="380" rx="16" fill="rgba(0,0,0,0.15)"/><rect x="40" y="60" width="320" height="380" rx="16" fill="#ffffff" stroke="#000000" stroke-width="2"/><rect x="60" y="85" width="12" height="12" fill="#000000"/><rect x="76" y="85" width="6" height="4" fill="#000000"/><rect x="76" y="93" width="6" height="4" fill="#000000"/><text x="340" y="95" font-family="monospace" font-size="12" font-weight="700" fill="#000000" text-anchor="end">01/05</text><text x="60" y="190" font-family="monospace" font-size="34" fill="#000000" font-weight="700" letter-spacing="-1">Wireframe</text><text x="60" y="230" font-family="monospace" font-size="34" fill="#000000" font-weight="700" letter-spacing="-1">3D</text><text x="60" y="260" font-family="monospace" font-size="14" fill="#333333" font-weight="600">Brutalist layout</text><text x="60" y="410" font-family="monospace" font-size="12" font-weight="700" fill="#000000">&gt; READY TO EXECUTE _</text></svg>`),
  };

  const lastThemeNameRef = React.useRef<string>(themeName);

  // Show hardcoded preview instantly, then upgrade with live render in background
  useEffect(() => {
    if (step === 3 && slides.length > 0) {
      // 1. Show hardcoded SVG immediately ONLY if theme changed or we don't have a preview yet
      if (lastThemeNameRef.current !== themeName || !themePreviewUri) {
        setThemePreviewUri(THEME_PREVIEWS[themeName] || null);
        lastThemeNameRef.current = themeName;
      }
      setIsGeneratingPreview(true);

      // 2. Fire real render in background with 300ms debounce to prevent API spamming
      let active = true;
      const timer = setTimeout(() => {
        const upgradePreview = async () => {
          try {
            const targetIdx = previewSlideIdx < slides.length ? previewSlideIdx : 0;
            const s = slides[targetIdx] || slides[0];
            const { data } = await axios.post("/api/render", {
              slides: [{
                type: s.type,
                title: s.userTitle,
                body: s.userBody,
                imageUrl: s.imageUrl || null,
                imageLayout: s.imageLayout || "inline",
                visualType: s.visualType || "text-only",
                visualData: s.visualData || undefined,
                paletteOverride,
                order: targetIdx,
              }],
              themeName,
              username,
              websiteUrl,
              fontPairing: customFontPairing,
              layoutDensity: customLayoutDensity,
              logoUrl: customLogoUrl || undefined,
              noImages,
              accentColor: customAccentColor || undefined,
            });
            if (active) {
              if (data.success && data.data?.images && data.data.images.length > 0) {
                setThemePreviewUri(data.data.images[0]);
              }
            }
          } catch { /* keep hardcoded fallback */ }
          finally {
            if (active) {
              setIsGeneratingPreview(false);
            }
          }
        };
        upgradePreview();
      }, 300);

      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [step, themeName, username, websiteUrl, slides, paletteOverride, customFontPairing, customLayoutDensity, customLogoUrl, noImages, customAccentColor, previewSlideIdx]);

  // Load draft & brand kit from localStorage on mount
  useEffect(() => {
    const savedBrand = localStorage.getItem("caro_brand_kit");
    if (savedBrand) {
      try {
        const bk = JSON.parse(savedBrand);
        setBrandKit(bk);
        if (bk.handle) setUsername(bk.handle);
        if (bk.website) setWebsiteUrl(bk.website);
        if (bk.defaultTheme) setThemeName(bk.defaultTheme as ThemeName);
        if (bk.fontPairing) setCustomFontPairing(bk.fontPairing);
        if (bk.logoUrl) setCustomLogoUrl(bk.logoUrl);
        if (bk.colors?.primary) setCustomAccentColor(bk.colors.primary);
      } catch (e) {
        console.warn("Failed to load brand kit from localStorage", e);
      }
    }

    const saved = localStorage.getItem("caro_draft_project");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.url) setUrl(parsed.url);
        if (parsed.preferences) setPreferences(parsed.preferences);
        if (parsed.slides) setSlides(parsed.slides);
        if (parsed.themeName) setThemeName(parsed.themeName);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.websiteUrl) setWebsiteUrl(parsed.websiteUrl);
        if (typeof parsed.scribble === "boolean") setScribble(parsed.scribble);
        if (parsed.extractedData) setExtractedData(parsed.extractedData);
        if (parsed.maxUnlockedStep) setMaxUnlockedStep(parsed.maxUnlockedStep);
        if (parsed.paletteOverride) setPaletteOverride(parsed.paletteOverride);
        
        // Load content intelligence
        if (parsed.targetPlatform) setTargetPlatform(parsed.targetPlatform);
        if (parsed.audience) setAudience(parsed.audience);
        if (parsed.goal) setGoal(parsed.goal);
        if (parsed.ctaStyle) setCtaStyle(parsed.ctaStyle);
        if (parsed.outlines) setOutlines(parsed.outlines);
        if (parsed.selectedOutlineId) setSelectedOutlineId(parsed.selectedOutlineId);
        
        // Load custom theme variations
        if (parsed.customFontPairing) setCustomFontPairing(parsed.customFontPairing);
        if (parsed.customLayoutDensity) setCustomLayoutDensity(parsed.customLayoutDensity);
        if (parsed.customLogoUrl) setCustomLogoUrl(parsed.customLogoUrl);
        if (typeof parsed.noImages === "boolean") setNoImages(parsed.noImages);
        if (parsed.customAccentColor) setCustomAccentColor(parsed.customAccentColor);
      } catch (e) {
        console.warn("Failed to restore draft from localStorage", e);
      }
    }
  }, []);

  // Save draft on key changes
  const saveDraftLocally = (updatedSlides = slides, maxStep = maxUnlockedStep) => {
    localStorage.setItem(
      "caro_draft_project",
      JSON.stringify({
        url,
        preferences,
        slides: updatedSlides,
        themeName,
        username,
        websiteUrl,
        scribble,
        extractedData,
        maxUnlockedStep: maxStep,
        paletteOverride,
        targetPlatform,
        audience,
        goal,
        ctaStyle,
        outlines,
        selectedOutlineId,
        customFontPairing,
        customLayoutDensity,
        customLogoUrl,
        noImages,
        customAccentColor
      })
    );
  };

  // Invalidate rendered image cache when palette changes
  useEffect(() => {
    setAllThemeImages({});
  }, [paletteOverride]);

  // Re-trigger rendering on step 4 transition — renders only the active theme
  useEffect(() => {
    if (step === 4) {
      setAllThemeImages({});
      setThemeLoadingStates({});
      
      const renderSequence = async () => {
        await handleRender();
      };

      renderSequence();
      saveDraftLocally();
    }
  }, [step, scribble]);

  // ==========================================
  // STAGE 1: Extract Blog Post
  // ==========================================
  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (usePastedText) {
      if (!pastedText || pastedText.trim().length < 50) {
        setError("Please paste at least 50 characters of text.");
        return;
      }
      setExtractedData({
        title: "Pasted Content",
        content: pastedText
      });
      setShowExtractedPreview(true);
      return;
    }

    if (!url) {
      setError("Please enter a URL.");
      return;
    }
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL (must include http:// or https://).");
      return;
    }

    setIsExtracting(true);
    try {
      // For Medium articles, route through Freedium mirror to bypass paywall
      const extractUrl = url.match(/medium\.com/) 
        ? `https://freedium-mirror.cfd/${url}`
        : url;

      const { data: result } = await axios.post("/api/extract", { url: extractUrl });
      if (!result.success) {
        throw new Error(result.error || "Failed to extract blog text.");
      }

      setExtractedData(result.data);
      setShowExtractedPreview(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to connect to the scraping API.");
    } finally {
      setIsExtracting(false);
    }
  };

  // ==========================================
  // STAGE 2: Call AI to Plan Slides
  // ==========================================
  // ==========================================
  // STAGE 2: Call AI to Plan Slides
  // ==========================================
  const handleGenerateOutlines = async () => {
    if (!extractedData) return;
    setError(null);
    setIsGeneratingOutlines(true);

    try {
      const { data: result } = await axios.post("/api/generate-outlines", {
        text: extractedData.content,
        tone: preferences.tone,
        focus: preferences.focus,
        slideCount: preferences.slideCount,
        targetPlatform,
        audience,
        goal,
        ctaStyle
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to generate outlines.");
      }

      setOutlines(result.data.outlines);
      setSelectedOutlineId(result.data.outlines[0]?.id || "");
      setStep(1.5);
      saveDraftLocally();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to generate outlines.");
    } finally {
      setIsGeneratingOutlines(false);
    }
  };

  const handlePlanSlides = async (chosenOutline?: any) => {
    if (!extractedData) return;
    setError(null);
    setIsPlanning(true);

    try {
      const { data: result } = await axios.post("/api/plan-slides", {
        text: extractedData.content,
        tone: preferences.tone,
        focus: preferences.focus,
        slideCount: preferences.slideCount,
        targetPlatform,
        audience,
        goal,
        ctaStyle,
        selectedOutline: chosenOutline
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to plan slides.");
      }

      const formatted: Slide[] = result.data.slides.map((s: { type: string; title: string; body: string; visualType?: VisualType; visualData?: VisualData }, idx: number) => {
        const vType = s.type === "COVER" || s.type === "CLOSING" ? "text-only" : (s.visualType || "text-only");
        return {
          id: `slide_${Math.random().toString(36).substr(2, 9)}`,
          type: s.type,
          order: idx,
          approved: true,
          aiTitle: s.title,
          aiBody: s.body,
          userTitle: s.title,
          userBody: s.body,
          isEdited: false,
          shapes: [],
          visualType: vType,
          visualData: s.visualData || undefined
        };
      });

      setSlides(formatted);
      const nextStep = Math.max(maxUnlockedStep, 2);
      setMaxUnlockedStep(nextStep);
      saveDraftLocally(formatted, nextStep);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to plan slides with AI.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleGetAlternatives = async (index: number, slideType: "COVER" | "CLOSING") => {
    const slide = slides[index];
    if (!slide) return;
    
    setAlternativesSlideIdx(index);
    setAlternativesSlideType(slideType);
    setAlternativesList([]);
    setIsGeneratingAlternatives(true);
    setError(null);

    try {
      const { data: result } = await axios.post("/api/regenerate-alternatives", {
        slideType,
        originalText: extractedData?.content,
        currentTitle: slide.userTitle,
        currentBody: slide.userBody,
        tone: preferences.tone,
        audience,
        goal
      });
      
      if (!result.success) {
        throw new Error(result.error || "Failed to generate alternatives.");
      }

      setAlternativesList(result.data.alternatives);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to generate alternatives.");
      setAlternativesSlideIdx(null);
      setAlternativesSlideType(null);
    } finally {
      setIsGeneratingAlternatives(false);
    }
  };

  const applyAlternative = (title: string, body: string) => {
    if (alternativesSlideIdx === null) return;
    const updated = [...slides];
    updated[alternativesSlideIdx].userTitle = title;
    updated[alternativesSlideIdx].userBody = body;
    updated[alternativesSlideIdx].isEdited = true;
    setSlides(updated);
    saveDraftLocally(updated);
    
    setAlternativesSlideIdx(null);
    setAlternativesSlideType(null);
    setAlternativesList([]);
  };

  const autoFixQuality = async (slideIndex: number, fixType: string) => {
    if (slideIndex === -1 || slideIndex === undefined) return;
    const slide = slides[slideIndex];
    if (!slide) return;
    
    if (fixType === "shorten") {
      await handleRegenerateBlock(slideIndex, "Shorten this slide body content to under 45 words while retaining its core meaning and details");
    }
  };

  const handleVisualTypeChange = async (index: number, newVisualType: Slide["visualType"]) => {
    const updated = [...slides];
    updated[index].visualType = newVisualType;
    
    if (newVisualType === "text-only" || !newVisualType) {
      updated[index].visualData = undefined;
      setSlides(updated);
      saveDraftLocally(updated);
      return;
    }

    // Set loading indicator
    updated[index].visualData = { loading: true };
    setSlides([...updated]);

    try {
      const { data: result } = await axios.post("/api/fill-visual-data", {
        visualType: newVisualType,
        title: updated[index].userTitle,
        body: updated[index].userBody,
      });
      if (result.success) {
        updated[index].visualData = result.data.visualData;
      } else {
        updated[index].visualData = undefined;
      }
    } catch (err) {
      console.error("Failed to change visual type:", err);
      updated[index].visualData = undefined;
      setError("Failed to generate visual data for this slide. Try again.");
    }
    setSlides(updated);
    saveDraftLocally(updated);

    // Re-render if already on Stage 4
    if (step === 4) {
      setAllThemeImages({});
      await handleRender();
    }
  };

  // ==========================================
  // STAGE 2 Actions
  // ==========================================
  const toggleApprove = (index: number) => {
    const updated = [...slides];
    updated[index].approved = !updated[index].approved;
    setSlides(updated);
    saveDraftLocally(updated);
  };

  const handleTextChange = (index: number, field: "userTitle" | "userBody", value: string) => {
    const updated = [...slides];
    updated[index][field] = value;
    updated[index].isEdited = true;
    setSlides(updated);
    saveDraftLocally(updated);
  };

  const resetToAI = (index: number) => {
    const updated = [...slides];
    updated[index].userTitle = updated[index].aiTitle;
    updated[index].userBody = updated[index].aiBody;
    updated[index].isEdited = false;
    setSlides(updated);
    saveDraftLocally(updated);
  };

  const handleRegenerateBlock = async (index: number, instructionOverride?: string) => {
    const target = slides[index];
    const instruction = instructionOverride ?? (aiInstructions[target.id] || "");
    
    const targetId = target.id;
    setIsRegenerating(prev => ({ ...prev, [targetId]: true }));
    setError(null);

    try {
      const { data: result } = await axios.post("/api/regenerate-block", {
        block: {
          type: target.type,
          title: target.userTitle,
          body: target.userBody,
          order: target.order
        },
        instruction,
        originalText: extractedData?.content
      });
      if (!result.success) throw new Error(result.error);

      const updated = [...slides];
      updated[index].aiTitle = result.data.block.title;
      updated[index].aiBody = result.data.block.body;
      updated[index].userTitle = result.data.block.title;
      updated[index].userBody = result.data.block.body;
      updated[index].isEdited = false;

      // Clear instruction input
      setAiInstructions(prev => ({ ...prev, [targetId]: "" }));

      setSlides(updated);
      saveDraftLocally(updated);

      // If we're on Stage 4 (export preview), re-render just this slide's image
      if (step === 4) {
        try {
          const approvedSlides = updated.filter(s => s.approved);
          const approvedIdx = approvedSlides.findIndex(s => s.id === target.id);
          if (approvedIdx !== -1 && !updated[index].manuallyEdited) {
            const palette = paletteOverride || undefined;
            const singleSlidePayload = {
              type: updated[index].type,
              title: updated[index].userTitle,
              body: updated[index].userBody,
              imageUrl: updated[index].imageUrl || null,
              imageLayout: updated[index].imageLayout || "inline",
              shapes: updated[index].shapes || [],
              visualType: updated[index].visualType || "text-only",
              visualData: updated[index].visualData || undefined,
              paletteOverride: palette,
            };
            const { data: renderResult } = await axios.post("/api/render", {
              slides: [singleSlidePayload],
              themeName,
              username,
              websiteUrl,
              scribble,
              fontPairing: customFontPairing,
              layoutDensity: customLayoutDensity,
              logoUrl: customLogoUrl || undefined,
              noImages,
              accentColor: customAccentColor || undefined,
              scale: 1,
            });
            if (renderResult.success && renderResult.data.images?.[0]) {
              setRenderedImages(prev => {
                const next = [...prev];
                next[approvedIdx] = renderResult.data.images[0];
                return next;
              });
              setAllThemeImages(prev => {
                const themeArr = [...(prev[themeName] || [])];
                themeArr[approvedIdx] = renderResult.data.images[0];
                return { ...prev, [themeName]: themeArr };
              });
            }
          }
        } catch (renderErr: unknown) {
          console.error("[handleRegenerateBlock] Single-slide re-render failed:", renderErr);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to regenerate slide block.");
    } finally {
      setIsRegenerating(prev => ({ ...prev, [targetId]: false }));
    }
  };

  const addBlankSlide = () => {
    const newSlide: Slide = {
      id: `slide_${Math.random().toString(36).substr(2, 9)}`,
      type: "CONTENT",
      order: slides.length,
      approved: true,
      aiTitle: "",
      aiBody: "",
      userTitle: "New Slide Headline",
      userBody: "Slide content goes here.",
      isEdited: true,
      shapes: []
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    saveDraftLocally(updated);
  };

  const deleteSlide = (index: number) => {
    const updated = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }));
    setSlides(updated);
    saveDraftLocally(updated);
  };

  // Drag and drop sorting handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...slides];
    const temp = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, temp);
    
    updated.forEach((s, i) => {
      s.order = i;
    });
    
    setSlides(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    saveDraftLocally();
  };

  // Check state limits
  const approvedSlidesCount = slides.filter(s => s.approved).length;

  const handleProceedToTheme = () => {
    const nextStep = Math.max(maxUnlockedStep, 3);
    setMaxUnlockedStep(nextStep);
    saveDraftLocally(slides, nextStep);
    setStep(3);
  };

  const handleProceedToExport = () => {
    setShowWebsiteModal(true);
  };

  const handleWebsiteSubmit = () => {
    setShowWebsiteModal(false);
    saveDraftLocally();
    const nextStep = Math.max(maxUnlockedStep, 4);
    setMaxUnlockedStep(nextStep);
    setStep(4);
  };

  // ==========================================
  // STAGE 4: Satori Rendering & ZIP
  // ==========================================
  const buildRenderPayload = () => ({
    slides: slides.filter(s => s.approved).map(s => ({
      type: s.type,
      title: s.userTitle,
      body: s.userBody,
      imageUrl: s.imageUrl || null,
      imageLayout: s.imageLayout || "inline",
      shapes: s.shapes || [],
      visualType: s.visualType || "text-only",
      visualData: s.visualData || undefined
    })),
    username,
    websiteUrl,
    scribble,
  });

  const renderTheme = async (theme: ThemeName, scale: number = 1): Promise<string[] | null> => {
    const approved = slides.filter(s => s.approved);
    if (approved.length === 0) return null;

    if (scale === 1) {
      setThemeLoadingStates(prev => ({ ...prev, [theme]: true }));
    }

    try {
      const renderedList = new Array(approved.length).fill("");
      if (scale === 1 && theme === activeThemeRef.current) {
        setRenderedImages([...renderedList]);
      }

      // Split approved slides into AI-renderable and canvas-edited
      const nonCanvasSlides = approved.filter(s => !s.manuallyEdited);
      const canvasSlides = approved.filter(s => s.manuallyEdited && s.canvasPngUrl);

      // Single batched API call for non-canvas-edited slides only
      const palette = paletteOverride || undefined;
      const aiSlides = nonCanvasSlides.map(s => ({
        type: s.type,
        title: s.userTitle,
        body: s.userBody,
        imageUrl: s.imageUrl || null,
        imageLayout: s.imageLayout || "inline",
        shapes: s.shapes || [],
        visualType: s.visualType || "text-only",
        visualData: s.visualData || undefined,
        paletteOverride: palette,
      }));

      let apiResults: string[] = [];
      if (aiSlides.length > 0) {
        const { data: result } = await axios.post("/api/render", {
          slides: aiSlides,
          themeName: theme,
          username,
          websiteUrl,
          scribble,
          fontPairing: customFontPairing,
          layoutDensity: customLayoutDensity,
          logoUrl: customLogoUrl || undefined,
          noImages,
          accentColor: customAccentColor || undefined,
          scale,
        });
        if (!result.success) throw new Error(result.error);
        apiResults = result.data.images;

        // Warn about per-slide render failures without throwing
        if (result.data.errors?.length) {
          const failedSlides = result.data.errors.map((e: { index: number; error: string }) => `#${e.index + 1}`).join(", ");
          console.warn("[Render] Per-slide failures:", result.data.errors);
          setError(`Slides ${failedSlides} failed to render and will show a placeholder. Try regenerating those slides.`);
        }
      }

      // Merge: canvas-edited slides use their PNG, non-canvas use API results in order
      let apiIdx = 0;
      for (let i = 0; i < approved.length; i++) {
        if (approved[i].manuallyEdited && approved[i].canvasPngUrl) {
          renderedList[i] = approved[i].canvasPngUrl;
        } else {
          renderedList[i] = apiResults[apiIdx] || renderedList[i];
          apiIdx++;
        }
      }

      if (scale === 1) {
        setAllThemeImages(prev => ({ ...prev, [theme]: renderedList }));
        if (theme === activeThemeRef.current) {
          setRenderedImages([...renderedList]);
        }
      }

      return renderedList;
    } catch (err: unknown) {
      if (scale === 1) {
        setError(err instanceof Error ? err.message : String(err) || `Failed to render "${theme}" theme.`);
      }
      return null;
    } finally {
      if (scale === 1) {
        setThemeLoadingStates(prev => ({ ...prev, [theme]: false }));
      }
    }
  };

  const handleRender = async () => {
    const approved = slides.filter(s => s.approved);
    if (approved.length === 0) return;

    setError(null);
    setIsRendering(true);

    try {
      const images = await renderTheme(themeName);
      if (images) {
        setRenderedImages(images);
        const initialExport: Record<number, boolean> = {};
        images.forEach((_: unknown, idx: number) => {
          initialExport[idx] = true;
        });
        setSelectedForExport(initialExport);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to render carousel slide previews.");
    } finally {
      setIsRendering(false);
    }
  };

  const switchPalette = async (newTheme: ThemeName) => {
    setThemeName(newTheme);
    const cached = allThemeImages[newTheme];
    if (cached) {
      setRenderedImages(cached);
      const sel: Record<number, boolean> = {};
      cached.forEach((_, idx) => { sel[idx] = true; });
      setSelectedForExport(sel);
    } else {
      setError(null);
      setIsRendering(true);
      const images = await renderTheme(newTheme);
      if (images && newTheme === activeThemeRef.current) {
        setRenderedImages(images);
        const sel: Record<number, boolean> = {};
        images.forEach((_, idx) => { sel[idx] = true; });
        setSelectedForExport(sel);
      }
      setIsRendering(false);
    }
  };

  // Double-Click canvas adding slide helper
  const addBlankCanvasAtExport = () => {
    const newSlide: Slide = {
      id: `slide_${Math.random().toString(36).substr(2, 9)}`,
      type: "CONTENT",
      order: slides.length,
      approved: true,
      aiTitle: "",
      aiBody: "",
      userTitle: "Blank Slide Headline",
      userBody: "Add diagram elements, text or images.",
      isEdited: true,
      shapes: []
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    saveDraftLocally(updated);
    
    // Trigger render and auto-open edit modal on the new blank slide
    setIsRendering(true);
    setTimeout(async () => {
      // Find position of new slide in approved slides list
      const approved = updated.filter(s => s.approved);
      const newSlideIdxInApproved = approved.length - 1;
      
      await handleRender();
      
      openCanvasEditor(newSlideIdxInApproved);
    }, 150);
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slideIdxInApproved: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type. Please use PNG, JPEG, WebP, or GIF.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size exceeds 2MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const approvedSlides = slides.filter(s => s.approved);
      const targetSlide = approvedSlides[slideIdxInApproved];
      
      const updatedSlides = slides.map(s => {
        if (s.id === targetSlide.id) {
          return {
            ...s,
            imageUrl: base64,
            imageLayout: s.imageLayout || "inline"
          };
        }
        return s;
      });

      setSlides(updatedSlides);
      saveDraftLocally(updatedSlides);
      setTimeout(() => handleRender(), 100);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (slideIdxInApproved: number) => {
    const approvedSlides = slides.filter(s => s.approved);
    const targetSlide = approvedSlides[slideIdxInApproved];

    const updatedSlides = slides.map(s => {
      if (s.id === targetSlide.id) {
        return { ...s, imageUrl: null };
      }
      return s;
    });

    setSlides(updatedSlides);
    saveDraftLocally(updatedSlides);
    setTimeout(() => handleRender(), 100);
  };

  const toggleImageLayout = (slideIdxInApproved: number) => {
    const approvedSlides = slides.filter(s => s.approved);
    const targetSlide = approvedSlides[slideIdxInApproved];

    const updatedSlides = slides.map(s => {
      if (s.id === targetSlide.id) {
        return {
          ...s,
          imageLayout: (s.imageLayout === "background" ? "inline" : "background") as "background" | "inline"
        };
      }
      return s;
    });

    setSlides(updatedSlides);
    saveDraftLocally(updatedSlides);
    setTimeout(() => handleRender(), 100);
  };

  const handleQuickSlideEdit = (baseIndex: number, field: "userTitle" | "userBody", val: string) => {
    const updated = [...slides];
    updated[baseIndex][field] = val;
    updated[baseIndex].isEdited = true;
    setSlides(updated);
    saveDraftLocally(updated);
  };

  // ==========================================
  // CANVAS EDITOR: auto-generate elements from slide content
  // ==========================================
  const autoGenerateElements = (slide: Slide): CanvasElement[] => {
    const elements: CanvasElement[] = [];
    elements.push({
      id: `el_title_${slide.id}`,
      type: "text",
      x: 60,
      y: 60,
      width: 960,
      height: 120,
      rotation: 0,
      content: slide.userTitle || slide.aiTitle || "Title",
      fontFamily: "Outfit",
      fontSize: 72,
      fontWeight: "800",
      color: "#000000",
      textAlign: "center",
      fontStyle: "normal",
    });
    elements.push({
      id: `el_body_${slide.id}`,
      type: "text",
      x: 60,
      y: 220,
      width: 960,
      height: 300,
      rotation: 0,
      content: slide.userBody || slide.aiBody || "Body content",
      fontFamily: "Outfit",
      fontSize: 36,
      fontWeight: "400",
      color: "#333333",
      textAlign: "left",
      fontStyle: "normal",
    });
    if (slide.imageUrl) {
      elements.push({
        id: `el_image_${slide.id}`,
        type: "image",
        x: 200,
        y: 600,
        width: 680,
        height: 500,
        rotation: 0,
        src: slide.imageUrl,
        borderRadius: 16,
        strokeColor: "#000000",
        strokeWidth: 0,
      });
    }
    return elements;
  };

  const openCanvasEditor = async (approvedIdx: number) => {
    const approved = slides.filter(s => s.approved);
    const target = approved[approvedIdx];
    if (!target) return;
    const baseIdx = slides.findIndex(s => s.id === target.id);
    if (baseIdx === -1) return;

    // Auto-generate elements if not yet created
    if (!slides[baseIdx].elements || slides[baseIdx].elements!.length === 0) {
      const updated = [...slides];
      updated[baseIdx].elements = autoGenerateElements(slides[baseIdx]);
      setSlides(updated);
    }

    // Fetch background-only render
    setCanvasBgImage(null);
    try {
      const payload = {
        slides: [{
          type: target.type,
          title: target.userTitle || target.aiTitle || "",
          body: target.userBody || target.aiBody || "",
          themeName,
          username: "",
          imageUrl: target.imageUrl || null,
          imageLayout: target.imageLayout || "inline",
          shapes: target.shapes || [],
          visualType: target.visualType || "text-only",
          visualData: target.visualData || {},
          scribble: false,
        }],
        themeName,
        username: "",
        websiteUrl: "",
        scribble: false,
        backgroundOnly: true,
      };
      const { data: json } = await axios.post("/api/render", payload);
      if (json.success && json.data?.images?.[0]) {
        setCanvasBgImage(json.data.images[0]);
      }
    } catch (err) {
      console.error("Failed to fetch background image:", err);
    }

    setEditingSlideIdx(approvedIdx);
    setIsCanvasEditorOpen(true);
  };

  const handleCanvasEditorSave = (elements: CanvasElement[], pngDataUrl: string) => {
    const approved = slides.filter(s => s.approved);
    const target = approved[editingSlideIdx!];
    if (!target) return;
    const baseIdx = slides.findIndex(s => s.id === target.id);
    if (baseIdx === -1) return;

    const updated = [...slides];
    updated[baseIdx].elements = elements;
    updated[baseIdx].manuallyEdited = true;
    updated[baseIdx].canvasPngUrl = pngDataUrl;
    updated[baseIdx].isEdited = true;
    setSlides(updated);
    saveDraftLocally(updated);

    // Update rendered image in stage 4 immediately
    if (step === 4) {
      const approvedSlides = updated.filter(s => s.approved);
      const approvedIdx = approvedSlides.findIndex(s => s.id === target.id);
      if (approvedIdx !== -1) {
        const newRendered = [...renderedImages];
        newRendered[approvedIdx] = pngDataUrl;
        setRenderedImages(newRendered);
        const newThemeImages = { ...allThemeImages[themeName] || [] };
        if (Array.isArray(newThemeImages)) {
          newThemeImages[approvedIdx] = pngDataUrl;
          setAllThemeImages(prev => ({ ...prev, [themeName]: newThemeImages }));
        }
      }
    }

    setIsCanvasEditorOpen(false);
    setEditingSlideIdx(null);
  };

  // ==========================================
  // STAGE 2: Regenerate All
  // ==========================================
  const handleRegenerateAll = async () => {
    if (!extractedData) return;
    setShowRegenerateAllConfirm(false);
    setIsRegeneratingAll(true);
    setError(null);

    try {
      const { data: result } = await axios.post("/api/plan-slides", {
        text: extractedData.content,
        tone: preferences.tone,
        focus: preferences.focus,
        slideCount: preferences.slideCount,
        targetPlatform,
        audience,
        goal,
        ctaStyle,
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to regenerate slides.");
      }

      const formatted: Slide[] = result.data.slides.map((s: { type: string; title: string; body: string; visualType?: VisualType; visualData?: VisualData }, idx: number) => {
        const vType = s.type === "COVER" || s.type === "CLOSING" ? "text-only" : (s.visualType || "text-only");
        return {
          id: `slide_${Math.random().toString(36).substr(2, 9)}`,
          type: s.type,
          order: idx,
          approved: false,
          aiTitle: s.title,
          aiBody: s.body,
          userTitle: s.title,
          userBody: s.body,
          isEdited: false,
          shapes: [],
          visualType: vType,
          visualData: s.visualData || undefined
        };
      });

      setSlides(formatted);
      saveDraftLocally(formatted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to regenerate all slides.");
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  // ZIP / Single Image export
  const handleExportZip = async () => {
    const indicesToExport = Object.keys(selectedForExport)
      .map(Number)
      .filter(idx => selectedForExport[idx] && renderedImages[idx]);

    if (indicesToExport.length === 0) {
      setError("Please select at least one slide to export.");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Re-render at 3x for high quality export
      const hqImages = await renderTheme(themeName, 3) || renderedImages;
      const approvedExport = slides.filter(s => s.approved);
      const payloadImages = await Promise.all(
        indicesToExport.map(async (idx) => {
          let dataUri = hqImages[idx];
          let ext = "png";
          if (exportFormat === "jpeg") {
            try {
              dataUri = await convertBase64PngToJpg(dataUri);
              ext = "jpg";
            } catch (err) {
              console.error(`Failed to convert slide ${idx + 1} to JPG:`, err);
            }
          }
          const slide = approvedExport[idx];
          const slideName = slide?.userTitle ? sanitizeFilename(slide.userTitle) : `slide-${idx + 1}`;
          return {
            fileName: `${slideName}.${ext}`,
            dataUri
          };
        })
      );

      if (payloadImages.length === 1) {
        // Direct download for a single image
        const { fileName, dataUri } = payloadImages[0];
        const a = document.createElement("a");
        a.href = dataUri;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Zip download for multiple images
        const res = await axios.post("/api/export-zip", { images: payloadImages }, { responseType: "blob" });

        const baseName = extractedData?.title ? sanitizeFilename(extractedData.title) : "carousel-export";
        const blob = res.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to download export.");
    } finally {
      setIsExporting(false);
    }
  };

  // ==========================================
  // EXPORT FORMATS: ZIP (PNG/JPEG) + PDF
  // ==========================================
  const handleExportPdf = async () => {
    const indicesToExport = Object.keys(selectedForExport)
      .map(Number)
      .filter(idx => selectedForExport[idx] && renderedImages[idx]);

    if (indicesToExport.length === 0) {
      setError("Please select at least one slide to export.");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: 'pt', format: [1080, 1350], compress: true });

      // Re-render at 3x for crystal-clear PDF export
      const hqImages = await renderTheme(themeName, 3) || renderedImages;

      for (let i = 0; i < indicesToExport.length; i++) {
        const idx = indicesToExport[i];
        const pngDataUri = hqImages[idx];

        if (i > 0) {
          doc.addPage([1080, 1350]);
        }

        // Convert to high-quality JPEG for smaller PDF with equivalent visual quality
        let imageUri = pngDataUri;
        let imageFormat: "PNG" | "JPEG" = "PNG";
        try {
          imageUri = await convertBase64PngToJpg(pngDataUri);
          imageFormat = "JPEG";
        } catch {
          // Fall back to PNG if conversion fails
        }

        doc.addImage(imageUri, imageFormat, 0, 0, 1080, 1350);
      }

      const baseName = extractedData?.title ? sanitizeFilename(extractedData.title) : "carousel-export";
      doc.save(`${baseName}.pdf`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    if (exportFormat === "pdf") {
      await handleExportPdf();
    } else {
      await handleExportZip();
    }
  };

  // Selection Toggles
  const handleSelectAll = () => {
    const allExport: Record<number, boolean> = {};
    renderedImages.forEach((_, idx) => {
      allExport[idx] = true;
    });
    setSelectedForExport(allExport);
  };

  const handleDeselectAll = () => {
    setSelectedForExport({});
  };

  const toggleExportSelected = (idx: number) => {
    setSelectedForExport(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const activeExportCount = Object.values(selectedForExport).filter(Boolean).length;

  // ==========================================
  // DIAGRAM SHAPES EDITOR ACTIONS (Step 4 Modal)
  // ==========================================
  const addShapeToSlide = (baseIndex: number, type: "rect" | "circle" | "text") => {
    const newShape: Shape = {
      id: `shape_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 35, // default centered
      y: 40,
      width: type === "text" ? 200 : 150,
      height: type === "text" ? 50 : 150,
      color: type === "text" ? "#000000" : "#2563eb",
      text: type === "text" ? "Custom Annotation" : undefined,
      fontSize: type === "text" ? 32 : undefined
    };

    const updated = [...slides];
    const currentShapes = updated[baseIndex].shapes || [];
    updated[baseIndex].shapes = [...currentShapes, newShape];
    updated[baseIndex].isEdited = true;
    
    setSlides(updated);
    saveDraftLocally(updated);
  };

  const updateShapeProp = <K extends keyof Shape>(
    baseIndex: number,
    shapeId: string,
    key: K,
    value: Shape[K]
  ) => {
    const updated = [...slides];
    const shapesList = updated[baseIndex].shapes || [];
    updated[baseIndex].shapes = shapesList.map(s => {
      if (s.id === shapeId) {
        return { ...s, [key]: value };
      }
      return s;
    });
    updated[baseIndex].isEdited = true;

    setSlides(updated);
    saveDraftLocally(updated);
  };

  const removeShapeFromSlide = (baseIndex: number, shapeId: string) => {
    const updated = [...slides];
    const shapesList = updated[baseIndex].shapes || [];
    updated[baseIndex].shapes = shapesList.filter(s => s.id !== shapeId);
    updated[baseIndex].isEdited = true;

    setSlides(updated);
    saveDraftLocally(updated);
  };

  const qualityReport = useMemo(() => {
    if (slides.length === 0) return { score: 100, suggestions: [] };

    let score = 100;
    const suggestions: { id: string; type: "error" | "warning" | "success"; text: string; actionText?: string; fixType?: string; slideIndex?: number }[] = [];

    // 1. Hook check (Slide 1 title is Cover title)
    const coverSlide = slides.find(s => s.type === "COVER");
    if (coverSlide) {
      const title = coverSlide.userTitle || "";

      // Check for italics highlight
      if (!title.includes("*")) {
        score -= 15;
        suggestions.push({
          id: "hook_italics",
          type: "warning",
          text: "Hook style: Wrap 1-2 words in asterisks (*) to highlight them in editorial serif font.",
          slideIndex: slides.indexOf(coverSlide)
        });
      }
      
      // Check title length
      const words = title.split(/\s+/).filter(Boolean).length;
      if (words > 9) {
        score -= 10;
        suggestions.push({
          id: "hook_length_long",
          type: "warning",
          text: `Hook title is slightly long (${words} words). Keep it under 8 words for higher click-through.`,
          slideIndex: slides.indexOf(coverSlide)
        });
      } else if (words < 3 && words > 0) {
        score -= 5;
        suggestions.push({
          id: "hook_length_short",
          type: "warning",
          text: "Hook title is very short. Ensure it explains the payoff of the carousel.",
          slideIndex: slides.indexOf(coverSlide)
        });
      }
    } else {
      score -= 20;
      suggestions.push({
        id: "no_cover",
        type: "error",
        text: "Missing COVER slide. Carousels require an introductory slide to grab attention."
      });
    }

    // 2. Text density check (slides with body copy too long)
    slides.forEach((s, idx) => {
      if (s.approved) {
        const bodyText = s.userBody || "";
        const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
        if (wordCount > 60) {
          score -= Math.min(10, Math.ceil((wordCount - 60) / 2));
          suggestions.push({
            id: `density_${s.id}`,
            type: "warning",
            text: `Slide ${idx + 1} is text-heavy (${wordCount} words). Try to keep it under 60 words for visual readability.`,
            slideIndex: idx,
            actionText: "Shorten Text",
            fixType: "shorten"
          });
        }
      }
    });

    // 3. CTA check (closing slide)
    const closingSlide = slides.find(s => s.type === "CLOSING");
    if (closingSlide) {
      const bodyText = closingSlide.userBody || "";
      if (!bodyText || bodyText.trim().length === 0) {
        if (ctaStyle !== "no-cta") {
          score -= 15;
          suggestions.push({
            id: "cta_missing_body",
            type: "warning",
            text: "Closing slide has no call-to-action text. Add a button text or payoff.",
            slideIndex: slides.indexOf(closingSlide)
          });
        }
      }
    } else {
      score -= 15;
      suggestions.push({
        id: "no_closing",
        type: "warning",
        text: "Missing CLOSING slide. It is best practice to end with a clear Call-To-Action."
      });
    }

    // 4. Diagram balance check
    const contentSlides = slides.filter(s => s.approved && s.type === "CONTENT");
    const hasDiagram = contentSlides.some(s => s.visualType && s.visualType !== "text-only");
    if (!hasDiagram) {
      score -= 15;
      suggestions.push({
        id: "no_diagrams",
        type: "warning",
        text: "Zero diagrams: This carousel only has text-only slides. Consider changing at least one slide to a diagram layout (e.g. flowchart, timeline, step-chain) for visual variety."
      });
    }

    // 5. Consecutive text-only streak check
    let maxTextStreak = 0;
    let currentStreak = 0;
    for (const s of contentSlides) {
      if (!s.visualType || s.visualType === "text-only") {
        currentStreak++;
        maxTextStreak = Math.max(maxTextStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    if (maxTextStreak >= 3) {
      score -= 10;
      suggestions.push({
        id: "text_streak",
        type: "warning",
        text: `${maxTextStreak} consecutive text-only slides detected. Break up the narrative with a flowchart, timeline, stat, or before/after slide to show rather than tell.`
      });
    }

    const visualSlideCount = contentSlides.filter(s => s.visualType && s.visualType !== "text-only").length;
    const visualRatio = contentSlides.length > 0 ? visualSlideCount / contentSlides.length : 0;
    if (contentSlides.length >= 4 && visualRatio < 0.4) {
      score -= 8;
      suggestions.push({
        id: "low_visual_ratio",
        type: "warning",
        text: `Only ${Math.round(visualRatio * 100)}% of content slides are visual. Aim for at least 50% diagrams, code, or stats for stronger storytelling.`
      });
    }

    score = Math.max(0, score);
    return { score, suggestions };
  }, [slides, ctaStyle]);

  const steps = [
    { num: 1, label: "Extract" },
    { num: 2, label: "Review" },
    { num: 3, label: "Theme" },
    { num: 4, label: "Export" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header / Navbar */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-600 animate-pulse" />
            <span className="text-xl font-extrabold tracking-tight text-neutral-900">Caro</span>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">PRO</span>
          </div>
          <button
            type="button"
            onClick={() => setIsBrandKitOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 hover:border-neutral-300 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            Brand Kit
          </button>
        </div>
      </header>

      {/* Central Layout Body */}
      <StageErrorBoundary stageName="Carousel Wizard">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col justify-start">
        
        {/* Step Indicator Panel */}
        <div className="mb-12 max-w-2xl mx-auto w-full">
          <div className="relative flex items-start w-full">
            {/* Connector track — precisely aligns through circle centres */}
            <div className="absolute top-[18px] -translate-y-1/2 h-0.5 bg-neutral-200 z-0"
                 style={{ left: 'calc(12.5% - 18px)', right: 'calc(12.5% - 18px)' }} />

            {/* Blue fill overlay — water rising across the whole stepper */}
            <motion.div
              className="absolute top-[18px] -translate-y-1/2 h-0.5 bg-blue-500 z-0 origin-left"
              style={{ left: 'calc(12.5% - 18px)', right: 'calc(12.5% - 18px)' }}
              animate={{ scaleX: (step - 1) / (steps.length - 1) }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            {steps.map((s) => {
              const isStepButtonDisabled = s.num > maxUnlockedStep;

              const status = s.num < step ? 'completed' : s.num === step ? 'active' : 'upcoming';
              const fillPercent = status === 'completed' ? 100 : status === 'active' ? 50 : 0;

              return (
                <button
                  key={s.num}
                  disabled={isStepButtonDisabled}
                  onClick={() => setStep(s.num)}
                  className={`flex-1 relative z-10 flex flex-col items-center focus:outline-none transition-all ${
                    isStepButtonDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  title={isStepButtonDisabled ? "Please complete the previous step to unlock." : ""}
                >
                  <div className={`relative w-9 h-9 rounded-full border-2 overflow-hidden bg-white ${
                    status === 'upcoming' ? 'border-neutral-200' : 'border-blue-500'
                  }`}>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-blue-500"
                      initial={false}
                      animate={{ height: `${fillPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                    <span className={`relative z-10 flex items-center justify-center w-full h-full text-sm font-bold ${
                      step > s.num || step === s.num ? 'text-white' : 'text-neutral-400'
                    }`}>
                      {step > s.num ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : s.num}
                    </span>
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold tracking-wide transition-all ${
                      step === s.num || step > s.num ? "text-blue-600 font-bold" : "text-neutral-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Error</span>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Dismiss</button>
          </div>
        )}

        {/* STEP 1: Input & Extraction */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900">
                Import Article
              </h2>
              <p className="text-neutral-500 font-medium">
                Paste a URL or drop in the article text directly.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Tab Selector (Pill switcher) */}
              <div className="flex bg-neutral-100 p-1 rounded-full w-fit border border-neutral-200/60">
                <button
                  type="button"
                  onClick={() => { setUsePastedText(false); setError(null); }}
                  className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all ${
                    !usePastedText ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  From URL
                </button>
                <button
                  type="button"
                  onClick={() => { setUsePastedText(true); setError(null); }}
                  className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all ${
                    usePastedText ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Paste Text
                </button>
              </div>

              {!usePastedText ? (
                <div className="space-y-2">
                  <label htmlFor="url" className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">
                    Article URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="url"
                      type="url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={handleExtract}
                      className="px-6 py-3 bg-[rgb(130,161,246)] hover:bg-[rgb(114,152,246)] text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExtracting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Extract"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="pastedText" className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">
                    Article Copy
                  </label>
                  <textarea
                    id="pastedText"
                    placeholder="Copy and paste the core blog text here..."
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-sm"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleExtract}
                      className="px-5 py-2 bg-[rgb(130,161,246)] hover:bg-[rgb(114,152,246)] text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Process Text
                    </button>
                  </div>
                </div>
            )}

            {/* Preferences Configuration */}
            {/* Content Intelligence Controls */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <span className="text-xs font-black text-neutral-600 uppercase tracking-wider block">Content Intelligence</span>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Target Platform */}
                <div className="space-y-1.5">
                  <label htmlFor="target-platform" className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Target Platform</label>
                  <select
                    id="target-platform"
                    value={targetPlatform}
                    onChange={(e) => setTargetPlatform(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700 focus:outline-none"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="pitch-deck">Pitch Deck Style</option>
                  </select>
                </div>

                {/* Audience */}
                <div className="space-y-1.5">
                  <label htmlFor="audience-select" className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Audience</label>
                  <select
                    id="audience-select"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700 focus:outline-none"
                  >
                    <option value="founders">Founders</option>
                    <option value="engineers">Engineers</option>
                    <option value="marketers">Marketers</option>
                    <option value="beginners">Beginners</option>
                    <option value="executives">Executives</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tone */}
                <div className="space-y-1.5">
                  <label htmlFor="tone-select" className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Tone</label>
                  <select
                    id="tone-select"
                    value={preferences.tone}
                    onChange={(e) => setPreferences({ ...preferences, tone: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700 focus:outline-none"
                  >
                    <option value="educational">Educational</option>
                    <option value="punchy">Punchy</option>
                    <option value="contrarian">Contrarian</option>
                    <option value="story-driven">Story-Driven</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>

                {/* Goal */}
                <div className="space-y-1.5">
                  <label htmlFor="goal-select" className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Goal</label>
                  <select
                    id="goal-select"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700 focus:outline-none"
                  >
                    <option value="teach">Teach</option>
                    <option value="sell">Sell</option>
                    <option value="summarize">Summarize</option>
                    <option value="announce">Announce</option>
                    <option value="persuade">Persuade</option>
                  </select>
                </div>
              </div>

              {/* CTA Style */}
              <div className="space-y-1.5">
                <label htmlFor="cta-style-select" className="text-xs font-bold text-neutral-500 uppercase tracking-wider block font-sans">CTA Style</label>
                <select
                  id="cta-style-select"
                  value={ctaStyle}
                  onChange={(e) => setCtaStyle(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700 focus:outline-none"
                >
                  <option value="soft">Soft CTA</option>
                  <option value="direct">Direct CTA</option>
                  <option value="newsletter">Newsletter CTA</option>
                  <option value="product">Product/Sales CTA</option>
                  <option value="no-cta">No CTA</option>
                </select>
              </div>
            </div>

            {/* Custom Focus & Slide count */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="space-y-1.5">
                <label htmlFor="preferences-focus" className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">
                  Additional Details & Focus <span className="text-neutral-400 font-medium">(Optional)</span>
                </label>
                <textarea
                  id="preferences-focus"
                  placeholder="e.g. Focus on the 3 main takeaways, add custom references..."
                  rows={3}
                  value={preferences.focus}
                  onChange={(e) => setPreferences({ ...preferences, focus: e.target.value })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-sm"
                />
              </div>

              {/* Auto Slide Count Toggle */}
              <div className="flex justify-between items-center bg-white border border-neutral-200 rounded-xl p-4">
                <span className="text-sm font-bold text-neutral-700">Auto Slide Count</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-neutral-500">Auto</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        slideCount: preferences.slideCount === "auto" ? 6 : "auto"
                      })
                    }
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      preferences.slideCount === "auto" ? "bg-blue-500" : "bg-neutral-200"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                        preferences.slideCount === "auto" ? "left-6.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Manual budget input if not auto */}
              {typeof preferences.slideCount === "number" && (
                <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl animate-in slide-in-from-top-2 duration-150">
                  <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Requested Slide Count</span>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    value={preferences.slideCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setPreferences({ ...preferences, slideCount: isNaN(val) ? 6 : val });
                    }}
                    className="w-20 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-center text-sm text-neutral-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              )}
            </div>

            {/* Extracted Preview Panel inside Step 1 */}
            {extractedData && (
              <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50 space-y-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Extracted Text preview</span>
                  <button
                    type="button"
                    onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {showExtractedPreview ? "Collapse" : "Expand"}
                  </button>
                </div>
                {showExtractedPreview && (
                  <div className="bg-white border border-neutral-200 rounded-lg p-3 max-h-[160px] overflow-y-auto text-xs text-neutral-600 whitespace-pre-line font-medium leading-relaxed">
                    <strong>Title: {extractedData.title}</strong>
                    <hr className="my-2 border-neutral-100" />
                    {extractedData.content}
                  </div>
                )}
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="button"
              onClick={handleGenerateOutlines}
              disabled={isGeneratingOutlines || !extractedData}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingOutlines ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Outlines...
                </>
              ) : (
                "Plan Slides & Outlines"
              )}
            </button>
            </div>
          </div>
        )}

        {/* STEP 1.5: Outline Selection */}
        {step === 1.5 && (
          <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900">
                Choose Carousel Angle
              </h2>
              <p className="text-neutral-500 font-medium">
                We generated 3 angles for your content. Select the one that matches your narrative strategy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {outlines.map((outline, oIdx) => {
                const isSelected = selectedOutlineId === outline.id;
                const angleLabel = oIdx === 0 ? "Educational Blueprint" : oIdx === 1 ? "Contrarian Hot-Take" : "Story-Driven Journey";
                
                return (
                  <div
                    key={outline.id}
                    onClick={() => setSelectedOutlineId(outline.id)}
                    className={`border rounded-2xl p-5 bg-white cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[380px] relative ${
                      isSelected ? "border-blue-500 ring-2 ring-blue-500/10 shadow-sm" : "border-neutral-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          oIdx === 0 ? "bg-blue-50 text-blue-700 border border-blue-100" :
                          oIdx === 1 ? "bg-orange-50 text-orange-700 border border-orange-100" :
                          "bg-purple-50 text-purple-700 border border-purple-100"
                        }`}>
                          {angleLabel}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-blue-600 font-black" />}
                      </div>

                      <h3 className="font-extrabold text-neutral-950 text-sm mb-1">{outline.title}</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed font-medium mb-3">{outline.description}</p>
                      
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 border-t border-neutral-50 pt-2.5">
                        {outline.slides.map((s, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium truncate">
                            <span className="font-bold text-neutral-400">{sIdx + 1}.</span>
                            <span className="text-[10px] uppercase font-black tracking-wide text-blue-600 bg-blue-50/50 px-1 rounded shrink-0">{s.type === "COVER" ? "Cov" : s.type === "CLOSING" ? "Cta" : "C"}</span>
                            <span className="truncate flex-1">{s.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 text-[11px] text-neutral-400 font-bold border-t border-neutral-50 flex justify-between items-center">
                      <span>{outline.slides.length} slides</span>
                      <span className="text-blue-500 uppercase tracking-widest text-[9px] font-black">{isSelected ? "Selected" : "Click to select"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Action */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-neutral-600 hover:text-neutral-900 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Back to Article
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const outline = outlines.find(o => o.id === selectedOutlineId);
                  if (outline) handlePlanSlides(outline);
                }}
                disabled={isPlanning}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPlanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating slide details...
                  </>
                ) : (
                  <>
                    Flesh out Slide Contents
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Slide Block Approval & Editing */}
        {step === 2 && (
          <div className="w-full space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-neutral-900">Review & Edit</h2>
                <p className="text-sm text-neutral-500 font-medium mt-1">
                  {approvedSlidesCount} of {slides.length} slides approved.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegenerateAllConfirm(true)}
                  disabled={slides.length === 0 || isRegeneratingAll}
                  className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isRegeneratingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {isRegeneratingAll ? "Regenerating..." : "Regenerate All"}
                </button>
                <button
                  type="button"
                  onClick={addBlankSlide}
                  className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Slide
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Slide list (Left Column) */}
              <div className="flex-1 w-full space-y-4">
                {slides.map((s, idx) => {
                  const isItemRegenerating = isRegenerating[s.id] || false;
                  const instVal = aiInstructions[s.id] || "";
                  
                  return (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white border rounded-xl p-5 flex flex-col gap-4 relative transition-all ${
                        draggedIndex === idx ? "opacity-35 border-dashed border-blue-500" : ""
                      } ${s.approved ? "border-neutral-200 shadow-sm" : "border-neutral-100 opacity-60 bg-neutral-50/50"}`}
                    >
                      
                      {/* Top card bar (Type and AI rewrite options) */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                        <div className="flex items-center gap-3">
                          {/* Drag Handle */}
                          <div className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 transition-all p-1">
                            <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                              <circle cx="2" cy="2" r="1.5" />
                              <circle cx="2" cy="8" r="1.5" />
                              <circle cx="2" cy="14" r="1.5" />
                              <circle cx="8" cy="2" r="1.5" />
                              <circle cx="8" cy="8" r="1.5" />
                              <circle cx="8" cy="14" r="1.5" />
                            </svg>
                          </div>

                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleApprove(idx)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              s.approved 
                                ? "bg-blue-600 border-blue-500 text-white" 
                                : "bg-white border-neutral-300 text-transparent"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </button>

                          {/* Slide Type Badge */}
                          <span className="text-xs font-black tracking-widest text-blue-600 uppercase">
                            {s.type}
                          </span>
                        </div>

                        {/* Targeted AI editing */}
                        <div className="flex gap-2 items-center flex-1 max-w-md md:justify-end">
                          <input
                            type="text"
                            placeholder="Instruction for AI (optional)..."
                            value={instVal}
                            onChange={(e) => setAiInstructions(prev => ({ ...prev, [s.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRegenerateBlock(idx);
                            }}
                            className="bg-neutral-50 border border-neutral-200 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none flex-1 max-w-[200px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (instVal.trim().length >= 2) {
                                handleRegenerateBlock(idx);
                              } else {
                                handleRegenerateBlock(idx, "Regenerate this slide with fresh content");
                              }
                            }}
                            disabled={isItemRegenerating}
                            className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                            title="Regenerate this slide"
                          >
                            <RefreshCw className={`h-3 w-3 ${isItemRegenerating ? "animate-spin" : ""}`} />
                            Regenerate
                          </button>
                          {!instVal && (
                            <button
                              type="button"
                              onClick={() => handleRegenerateBlock(idx, "Regenerate this slide with fresh content")}
                              disabled={isItemRegenerating}
                              className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="Quick regenerate without instruction"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isItemRegenerating ? "animate-spin" : ""}`} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Headline and text content */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={s.userTitle}
                            onChange={(e) => handleTextChange(idx, "userTitle", e.target.value)}
                            placeholder="Slide Headline (Use *italics* for serif highlights)"
                            className="flex-1 bg-white border border-neutral-200 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-neutral-900 font-bold focus:outline-none"
                          />
                          {s.type === "COVER" && (
                            <button
                              type="button"
                              onClick={() => handleGetAlternatives(idx, "COVER")}
                              className="px-2.5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100/60 rounded-xl text-[10px] font-bold border border-blue-100 flex items-center gap-1 cursor-pointer transition-all shrink-0 animate-pulse"
                            >
                              <Sparkles className="h-3 w-3 text-blue-500" />
                              Hooks
                            </button>
                          )}
                          {s.type === "CLOSING" && (
                            <button
                              type="button"
                              onClick={() => handleGetAlternatives(idx, "CLOSING")}
                              className="px-2.5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100/60 rounded-xl text-[10px] font-bold border border-blue-100 flex items-center gap-1 cursor-pointer transition-all shrink-0 animate-pulse"
                            >
                              <Sparkles className="h-3 w-3 text-blue-500" />
                              CTAs
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={s.userBody}
                          onChange={(e) => handleTextChange(idx, "userBody", e.target.value)}
                          placeholder="Slide text content..."
                          className="w-full bg-white border border-neutral-200 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-neutral-600 font-medium focus:outline-none leading-relaxed"
                        />
                      </div>

                      {/* Actions and deletion panel */}
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          <select
                            value={s.type}
                            onChange={(e) => {
                              const updated = [...slides];
                              updated[idx].type = e.target.value as "COVER" | "CONTENT" | "CLOSING";
                              setSlides(updated);
                              saveDraftLocally(updated);
                            }}
                            className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs font-semibold text-neutral-600 focus:outline-none"
                          >
                            <option value="COVER">COVER</option>
                            <option value="CONTENT">CONTENT</option>
                            <option value="CLOSING">CLOSING</option>
                          </select>

                          {s.type === "CONTENT" && (
                            <div className="flex items-center gap-1.5 ml-2">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400">Visual:</span>
                              <select
                                value={s.visualType || "text-only"}
                                onChange={(e) => handleVisualTypeChange(idx, e.target.value as VisualType)}
                                className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs font-semibold text-neutral-600 focus:outline-none"
                              >
                                <optgroup label="Text & Code">
                                  <option value="text-only">Text Only</option>
                                  <option value="code-block">Code Block</option>
                                  <option value="quote">Quote Block</option>
                                </optgroup>
                                <optgroup label="Process & Flow">
                                  <option value="step-chain">Step Chain</option>
                                  <option value="flowchart">Flowchart</option>
                                  <option value="timeline">Timeline</option>
                                </optgroup>
                                <optgroup label="Structure & Compare">
                                  <option value="venn">Venn Diagram</option>
                                  <option value="wheel">Wheel Hub</option>
                                  <option value="concentric">Concentric Hierarchy</option>
                                  <option value="table">Comparison Table</option>
                                  <option value="before-after">Before / After</option>
                                  <option value="architecture">Architecture</option>
                                  <option value="sequence">Sequence Diagram</option>
                                </optgroup>
                                <optgroup label="Highlights & Visual">
                                  <option value="stat">Big Stat</option>
                                  <option value="mini-chart">Mini Chart</option>
                                  <option value="icon-grid">Icon Grid</option>
                                  <option value="image-grid">Image Grid</option>
                                </optgroup>
                              </select>
                              {Boolean((s.visualData as Record<string, unknown>)?.loading) && (
                                <span className="text-[10px] text-neutral-500 font-bold animate-pulse flex items-center gap-1">
                                  <RefreshCw className="h-2.5 w-2.5 animate-spin text-blue-500" />
                                  Extracting...
                                </span>
                              )}
                            </div>
                          )}

                          {s.isEdited && (
                            <button
                              type="button"
                              onClick={() => resetToAI(idx)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100/60 border border-blue-100 px-2 py-1 rounded"
                            >
                              Reset to AI
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteSlide(idx)}
                          className="text-neutral-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-all"
                          title="Delete Slide"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Quality Scorecard Widget (Right Column) */}
              <div className="w-full lg:w-[280px] shrink-0 space-y-4 sticky top-20">
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Quality Score</span>
                    <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                      qualityReport.score >= 80 ? "bg-green-50 text-green-700 border border-green-200" :
                      qualityReport.score >= 50 ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                      "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {qualityReport.score}/100
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {qualityReport.suggestions.length === 0 ? (
                      <div className="text-center py-4 space-y-1.5">
                        <Check className="h-8 w-8 text-green-500 mx-auto" />
                        <p className="text-xs text-neutral-500 font-bold">Excellent Copywriting!</p>
                      </div>
                    ) : (
                      qualityReport.suggestions.map((sug, sIdx) => (
                        <div key={sug.id || sIdx} className={`p-2.5 rounded-lg border text-[11px] font-medium leading-relaxed ${
                          sug.type === "error" ? "bg-red-50/50 border-red-100 text-red-700" :
                          sug.type === "warning" ? "bg-yellow-50/50 border-yellow-100 text-yellow-800" :
                          "bg-green-50/50 border-green-100 text-green-800"
                        }`}>
                          <p>{sug.text}</p>
                          {sug.actionText && sug.slideIndex !== undefined && (
                            <button
                              type="button"
                              onClick={() => autoFixQuality(sug.slideIndex!, sug.fixType!)}
                              className="mt-1.5 px-2 py-1 bg-white hover:bg-neutral-50 border border-neutral-200 rounded text-[9px] font-bold text-neutral-700 flex items-center gap-1 transition-all"
                            >
                              <Sparkles className="h-2.5 w-2.5 text-blue-500" />
                              {sug.actionText}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-neutral-600 hover:text-neutral-900 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleProceedToTheme}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                Choose Theme
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Theme Selection */}
        {step === 3 && (
          <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900">
                Select a Theme
              </h2>
              <p className="text-neutral-500 font-medium">
                Pick a visual style for your carousel.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Column: Theme List & Username */}
              <div className="flex-1 w-full space-y-6">
                
                {/* Theme Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: "Founder / Startup", mappedTheme: "neo-brutalism", desc: "Loud, bold typography, offset containers, and strong borders.", bg: "bg-[#F5F3EE] text-[#161616] border-b-[2px] border-[#161616]", labelFont: "font-black uppercase tracking-tight" },
                    { name: "Minimal Professional", mappedTheme: "monochrome", desc: "Monochrome, high negative space, sleek layout.", bg: "bg-[#0d0d0d] text-white", labelFont: "font-normal font-serif" },
                    { name: "Bold Creator", mappedTheme: "soft-gradient", desc: "Vibrant gradients, heavy headline, organic shapes.", bg: "bg-gradient-to-tr from-purple-400 to-pink-400 text-white", labelFont: "font-bold font-sans" },
                    { name: "Educational / Course", mappedTheme: "frosted-grid", desc: "Structured blueprints, clean grid layouts.", bg: "bg-neutral-50 text-neutral-900", labelFont: "font-bold font-sans border border-neutral-200 px-2 py-0.5 bg-white/70 shadow-sm rounded-lg" },
                    { name: "SaaS / Product", mappedTheme: "liquid-glass", desc: "Rounded containers, soft glossy styling.", bg: "bg-[#f8fafc] text-neutral-900 border border-white/90 shadow-inner", labelFont: "font-bold tracking-tight shadow-inner px-2 py-0.5 rounded-full" },
                    { name: "Newsletter / Editorial", mappedTheme: "warm-editorial", desc: "Classic type, editorial hooks, background warmth.", bg: "bg-[#f5f2eb] text-[#1e1b18]", labelFont: "font-bold font-serif" },
                    { name: "Agency / Marketing", mappedTheme: "sketch", desc: "Creative pencil strokes, artistic layouts.", bg: "bg-[#fdfaf6] text-[#2d2d2d] border border-neutral-300", labelFont: "font-bold px-2 py-0.5 border border-[#2d2d2d] bg-white text-[9px]" },
                    { name: "Dark Premium", mappedTheme: "cyber-horizon", desc: "Pitch-black base, glowing accents, wireframes.", bg: "bg-neutral-950 text-white border border-neutral-800", labelFont: "font-bold uppercase tracking-wide text-orange-500" }
                  ].map((family) => {
                    const isSelected = themeName === family.mappedTheme;
                    return (
                      <button
                        key={family.mappedTheme}
                        type="button"
                        onClick={() => {
                          setThemeName(family.mappedTheme as any);
                          saveDraftLocally();
                        }}
                        className={`border rounded-xl overflow-hidden text-left flex flex-col justify-between h-[130px] bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/10"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <div className={`h-12 w-full flex items-center justify-center p-2 relative overflow-hidden ${family.bg}`}>
                          <span className={`text-[9px] text-center leading-tight truncate ${family.labelFont}`}>{family.name.split(" / ")[0]}</span>
                        </div>
                        <div className="p-2 flex-1 flex flex-col justify-center">
                          <h3 className="font-extrabold text-neutral-900 text-[10px] leading-tight truncate">{family.name}</h3>
                          <p className="text-[9px] text-neutral-400 mt-0.5 font-medium leading-snug line-clamp-2">
                            {family.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Social Username Handle card */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                  <label htmlFor="username" className="text-xs font-bold text-neutral-600 uppercase tracking-wider block mb-2">
                    Your Social Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="@yourhandle"
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUsername(val.startsWith("@") || val === "" ? val : `@${val}`);
                      saveDraftLocally();
                    }}
                    className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 focus:outline-none focus:border-blue-500 font-semibold text-sm"
                  />
                </div>

                {/* Color Palette Customization */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      Color Palette
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const available = PALETTE_PRESETS.filter(p => p.name !== paletteOverride?.name);
                        if (available.length > 0) {
                          const pick = available[Math.floor(Math.random() * available.length)];
                          setPaletteOverride(pick);
                          saveDraftLocally();
                        }
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      Shuffle
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {(["background", "text", "primary", "secondary", "tertiary"] as const).map((role) => {
                      const label = { background: "Bg", text: "Text", primary: "Primary", secondary: "Secondary", tertiary: "Tertiary" }[role];
                      const defaults = THEME_DEFAULT_COLORS[themeName] || THEME_DEFAULT_COLORS["monochrome"];
                      const currentVal = paletteOverride?.[role] || defaults[role];
                      
                      return (
                        <div key={role} className="flex flex-col items-center gap-1.5">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-neutral-300 shadow-sm" style={{ backgroundColor: currentVal }}>
                            <input
                              type="color"
                              value={currentVal}
                              onChange={(e) => {
                                const next = {
                                  background: paletteOverride?.background || defaults.background,
                                  text: paletteOverride?.text || defaults.text,
                                  primary: paletteOverride?.primary || defaults.primary,
                                  secondary: paletteOverride?.secondary || defaults.secondary,
                                  tertiary: paletteOverride?.tertiary || defaults.tertiary,
                                  [role]: e.target.value,
                                  name: "Custom"
                                };
                                setPaletteOverride(next);
                                saveDraftLocally();
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-neutral-500">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {paletteOverride && (
                    <button
                      type="button"
                      onClick={() => { setPaletteOverride(null); saveDraftLocally(); }}
                      className="text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                    >
                      Reset to theme defaults
                    </button>
                  )}
                </div>

                {/* Controlled Variations Section */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wider block">Controlled Variation Overrides</h3>
                  
                  {/* Accent Color picker */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-neutral-600 block">Override Theme Accent Color</span>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full border border-neutral-300 relative overflow-hidden shadow-sm"
                        style={{ backgroundColor: customAccentColor || "#2563eb" }}
                      >
                        <input
                          type="color"
                          value={customAccentColor || "#2563eb"}
                          onChange={(e) => {
                            setCustomAccentColor(e.target.value);
                            saveDraftLocally();
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      <span className="text-xs text-neutral-500 font-bold">{customAccentColor || "Default theme accent"}</span>
                      {customAccentColor && (
                        <button
                          type="button"
                          onClick={() => { setCustomAccentColor(""); saveDraftLocally(); }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                        >
                          Reset Color
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Font pairing */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-neutral-600 block">Override Fonts</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Outfit + Outfit (Sensory/Clean)", val: "Outfit + Outfit" },
                        { label: "Jakarta + Jakarta (Sensory/Modern)", val: "Plus Jakarta Sans + Plus Jakarta Sans" },
                        { label: "Lora + Lora (Serif/Classic)", val: "Lora + Lora" },
                        { label: "Playfair + Outfit (Serif/Editorial)", val: "Playfair Display + Outfit" },
                        { label: "Cinzel + Jakarta (Decorative)", val: "Cinzel + Plus Jakarta Sans" },
                        { label: "Pacifico + Outfit (Script/Expressive)", val: "Pacifico + Outfit" },
                        { label: "Outfit + Mono (Tech)", val: "Outfit + JetBrains Mono" },
                        { label: "Mono + Mono (Developer)", val: "JetBrains Mono + JetBrains Mono" }
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => { setCustomFontPairing(item.val); saveDraftLocally(); }}
                          className={`px-3 py-2.5 border rounded-xl text-xs font-bold text-left transition-all ${
                            customFontPairing === item.val
                              ? "border-blue-500 bg-blue-50/50 text-blue-700"
                              : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Density */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-neutral-600 block">Override Layout Density</span>
                    <div className="flex gap-2">
                      {[
                        { label: "Compact", val: "compact" },
                        { label: "Comfortable", val: "comfortable" },
                        { label: "Minimal", val: "minimal" }
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => { setCustomLayoutDensity(item.val as any); saveDraftLocally(); }}
                          className={`flex-1 px-3 py-2 border rounded-xl text-center transition-all ${
                            customLayoutDensity === item.val
                              ? "border-blue-500 bg-blue-50/50 text-blue-700"
                              : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                          }`}
                        >
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Global Images Toggle */}
                  <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                    <span className="text-xs font-bold text-neutral-700">Display Slide Images</span>
                    <button
                      type="button"
                      onClick={() => { setNoImages(!noImages); saveDraftLocally(); }}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                        !noImages ? "bg-blue-500" : "bg-neutral-200"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                          !noImages ? "left-6.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>


              {/* Right Column: Live Sticky Preview Window */}
              <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-8 space-y-4">
                <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      Preview (Slide {previewSlideIdx + 1}/{slides.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewSlideIdx(prev => Math.max(0, prev - 1))}
                        disabled={previewSlideIdx === 0}
                        className="p-1 border border-neutral-200 hover:border-neutral-300 disabled:opacity-30 rounded-lg text-neutral-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                        title="Previous Slide"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSlideIdx(prev => Math.min(slides.length - 1, prev + 1))}
                        disabled={previewSlideIdx === slides.length - 1}
                        className="p-1 border border-neutral-200 hover:border-neutral-300 disabled:opacity-30 rounded-lg text-neutral-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                        title="Next Slide"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="relative aspect-[4/5] bg-neutral-50 border border-neutral-100 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                    {themePreviewUri ? (
                      <>
                        <img
                          src={themePreviewUri}
                          alt="Live Theme Preview"
                          className="w-full h-full object-cover transition-opacity duration-300"
                          style={{ opacity: isGeneratingPreview ? 0.8 : 1 }}
                        />
                        {isGeneratingPreview && (
                          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex flex-col justify-between p-4 z-20 pointer-events-none animate-in fade-in duration-200">
                            {/* Linear premium progress bar at top */}
                            <div className="w-full h-1 bg-neutral-200/50 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full w-[150px] animate-shimmer" />
                            </div>
                            
                            {/* Central floating loading indicator */}
                            <div className="flex-1 flex items-center justify-center">
                              <div className="bg-white/95 shadow-xl border border-neutral-100 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                <span className="text-[11px] font-extrabold text-neutral-700 uppercase tracking-wider font-sans">Updating live</span>
                              </div>
                            </div>
                            
                            {/* Base spacing balance */}
                            <div className="h-1" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <p className="text-xs text-neutral-400 font-medium">Select a theme above</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-neutral-400 text-center font-medium leading-relaxed">
                    Preview of the selected theme&apos;s visual style. Click &quot;Render Carousel&quot; below to generate your full carousel.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 text-neutral-600 hover:text-neutral-900 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleProceedToExport}
                className="px-10 py-3 bg-[rgb(130,161,246)] hover:bg-[rgb(114,152,246)] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Render Carousel
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Preview & Selective Export */}
        {step === 4 && (
          <div className="w-full space-y-6 animate-in fade-in duration-200">
            
            {/* Header Action Panel (Pictured style) */}
            {/* Header Action Panel (Responsive & Spacious layout) */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
              
              {/* Left group: Title info & View mode tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-start gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">Preview & Export</h2>
                  <p className="text-[11px] md:text-xs text-neutral-400 font-semibold mt-1">
                    Single-click to select · Double-click to edit a slide.
                  </p>
                </div>

                {/* View Mode Switcher */}
                <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/60 shrink-0 self-start sm:self-auto shadow-inner">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Grid View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("social")}
                    className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      viewMode === "social"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Social Feed
                  </button>
                </div>
              </div>

              {/* Right group: Canvas manipulation & Download options */}
              <div className="flex flex-wrap items-center gap-4 justify-start lg:justify-end">
                
                {/* Segment A: Canvas operations */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addBlankCanvasAtExport}
                    className="px-3 py-2 bg-white border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:border-neutral-300 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Canvas
                  </button>

                  <div className="h-5 w-px bg-neutral-200 mx-1" />

                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-all px-2 py-1 rounded hover:bg-blue-50 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs text-neutral-400 hover:text-neutral-600 font-bold transition-all px-2 py-1 rounded hover:bg-neutral-50 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="hidden sm:block h-6 w-px bg-neutral-200" />

                {/* Segment B: Export config & Main download action */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Format Select Toggle: PNG / JPEG / PDF */}
                  <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/60 shadow-inner">
                    {(["png", "jpeg", "pdf"] as const).map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt)}
                        className={`px-3 py-1.5 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                          exportFormat === fmt
                            ? "bg-white text-neutral-900 shadow-sm"
                            : "text-neutral-500 hover:text-neutral-800"
                        }`}
                      >
                        {fmt === "png" ? "PNG" : fmt === "jpeg" ? "JPEG" : "PDF"}
                      </button>
                    ))}
                  </div>

                  {/* Single Export Action */}
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting || isRendering || renderedImages.length === 0}
                    className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        Export ({activeExportCount})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Palette Switcher — instant preview of all color schemes */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {PALETTE_INFO.map(p => {
                  const isActive = themeName === p.name;
                  const isLoading = themeLoadingStates[p.name];
                  const isReady = !!allThemeImages[p.name];
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => switchPalette(p.name)}
                      disabled={isLoading && !isReady}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
                          : "bg-neutral-50 border border-neutral-200/60 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300"
                      } ${isLoading && !isReady ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                    >
                      <div className="flex -space-x-1">
                        {p.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span>{p.label}</span>
                      {isLoading && !isReady && (
                        <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      )}
                      {isActive && !isLoading && isReady && (
                        <Check className="h-3 w-3 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {isRendering ? (
              <div className="min-h-[400px] flex flex-col justify-center items-center space-y-3">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                <p className="font-bold text-neutral-700 text-sm">Rendering slide layouts...</p>
              </div>
            ) : renderedImages.length === 0 ? (
              <div className="min-h-[300px] border border-dashed border-neutral-200 bg-white rounded-3xl flex flex-col justify-center items-center text-center p-8 space-y-4">
                <ImageIcon className="h-10 w-10 text-neutral-300" />
                <p className="text-neutral-400 text-sm font-semibold">No slides rendered.</p>
                <button onClick={handleRender} className="px-5 py-2 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-lg transition-all">
                  Render Slide Previews
                </button>
              </div>
            ) : (
              /* Grid Layout (4-columns of 4:5 aspect ratio cards) */
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
                  {renderedImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleExportSelected(idx)}
                      onDoubleClick={() => {
                        openCanvasEditor(idx);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 aspect-[4/5] bg-white transition-all cursor-pointer group shadow-sm select-none ${
                        selectedForExport[idx]
                          ? "border-blue-500 shadow-md shadow-blue-500/10 scale-[1.01]"
                          : "border-neutral-200 hover:border-neutral-300 hover:scale-[1.005]"
                      }`}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={`Slide ${idx + 1} Preview`}
                          className="w-full h-full object-cover animate-in fade-in duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 text-neutral-400 p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-neutral-400 mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Rendering...</span>
                        </div>
                      )}

                      {/* Regenerating overlay */}
                      {isRegenerating[slides[idx]?.id] && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-md">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      )}

                      {/* Checkbox overlay top-left */}
                      <div className="absolute top-3 left-3 z-20">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          selectedForExport[idx] ? "bg-blue-600 border-blue-500 text-white" : "bg-black/40 border-white/60 text-transparent"
                        }`}>
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      </div>

                      {/* Slide index number badge bottom-right */}
                      <div className="absolute bottom-3 right-3 z-20 bg-neutral-900 text-white border border-neutral-800 text-[10px] font-black w-6 h-6 rounded-md flex items-center justify-center shadow-md">
                        {idx + 1}
                      </div>

                      {/* Hover overlay with edit and regenerate actions */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        <span className="bg-black/60 backdrop-blur-sm text-[10px] text-white font-bold py-1 px-2.5 rounded-full shadow">
                          Double-click to edit
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRegenerateBlock(idx, "Regenerate this slide with fresh content"); }}
                          className="bg-black/60 backdrop-blur-sm p-1.5 rounded-full shadow hover:bg-black/80 transition-all"
                          title="Regenerate this slide"
                        >
                          <RefreshCw className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Social Feed Mockup (Instagram/LinkedIn card view) */
                <div className="max-w-md mx-auto w-full bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                  
                  {/* Mockup Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[11px] font-black uppercase shadow-sm">
                        {username ? username.replace("@", "").substring(0, 2) : "CA"}
                      </div>
                      <div>
                        <span className="text-xs font-black text-neutral-800 tracking-tight block">
                          {username || "@carouser"}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-bold block -mt-0.5">
                          San Francisco, California
                        </span>
                      </div>
                    </div>
                    {/* More dots */}
                    <button type="button" className="text-neutral-400 hover:text-neutral-600 transition-all">
                      <svg width="18" height="4" viewBox="0 0 24 6" fill="currentColor">
                        <circle cx="3" cy="3" r="3" />
                        <circle cx="12" cy="3" r="3" />
                        <circle cx="21" cy="3" r="3" />
                      </svg>
                    </button>
                  </div>

                  {/* Mockup Body Carousel */}
                  <div className="relative aspect-[4/5] bg-[#0c0c0c] flex items-center justify-center group">
                    {renderedImages[activeSocialSlide] ? (
                      <img
                        src={renderedImages[activeSocialSlide]}
                        alt={`Slide ${activeSocialSlide + 1} Preview`}
                        className="w-full h-full object-contain animate-in fade-in duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-500 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Rendering Slide...</span>
                      </div>
                    )}

                    {/* Regenerating overlay for social mockup */}
                    {isRegenerating[slides[activeSocialSlide]?.id] && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                      </div>
                    )}

                    {/* Floating Left Arrow */}
                    {activeSocialSlide > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveSocialSlide(prev => prev - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center shadow-lg transition-all scale-95 hover:scale-100 z-10"
                      >
                        <ArrowLeft className="h-4.5 w-4.5 stroke-[2.5]" />
                      </button>
                    )}

                    {/* Floating Right Arrow */}
                    {activeSocialSlide < renderedImages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveSocialSlide(prev => prev + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center shadow-lg transition-all scale-95 hover:scale-100 z-10"
                      >
                        <ArrowRight className="h-4.5 w-4.5 stroke-[2.5]" />
                      </button>
                    )}

                    {/* Top right slide pagination and regenerate */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRegenerateBlock(activeSocialSlide, "Regenerate this slide with fresh content")}
                        className="bg-black/60 backdrop-blur-sm p-1.5 rounded-full hover:bg-black/80 transition-all z-10"
                        title="Regenerate this slide"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-white" />
                      </button>
                      <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-black text-white tracking-widest shadow-sm select-none">
                        {activeSocialSlide + 1} / {renderedImages.length}
                      </div>
                    </div>
                  </div>

                  {/* Mockup Action Bar */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        {/* Interactive Like Button */}
                        <button
                          type="button"
                          onClick={() => setSocialLiked(!socialLiked)}
                          className={`transition-all hover:scale-110 active:scale-95 ${
                            socialLiked ? "text-red-500 fill-red-500" : "text-neutral-700 hover:text-red-500"
                          }`}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill={socialLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                          </svg>
                        </button>
                        
                        {/* Comment Button Mock */}
                        <button type="button" className="text-neutral-700 hover:text-neutral-900 transition-all hover:scale-105">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                          </svg>
                        </button>

                        {/* Share Button Mock */}
                        <button type="button" className="text-neutral-700 hover:text-neutral-900 transition-all hover:scale-105">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                      </div>

                      {/* Save Button Mock */}
                      <button type="button" className="text-neutral-700 hover:text-neutral-900 transition-all hover:scale-105">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Likes & Caption */}
                    <div className="space-y-1">
                      <span className="text-xs font-black text-neutral-800">
                        {socialLiked ? "1,249 likes" : "1,248 likes"}
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        <span className="font-black text-neutral-800 mr-1.5">{username || "@carouser"}</span>
                        <span>
                          {slides[0]?.userTitle ? slides[0].userTitle.replace(/\*(.*?)\*/g, "$1") : "Check out my new article summary!"}
                        </span>
                      </p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider pt-1">
                        2 hours ago
                      </p>
                    </div>

                    {/* Carousel Progress indicator dots */}
                    <div className="flex justify-center gap-1.5 pt-2">
                      {renderedImages.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => setActiveSocialSlide(dotIdx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            activeSocialSlide === dotIdx ? "bg-blue-600 scale-125" : "bg-neutral-200"
                          }`}
                        />
                      ))}
                    </div>

                  </div>

                </div>
              )
            )}

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 text-neutral-600 hover:text-neutral-900 text-sm font-bold flex items-center gap-1.5 transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

      </main>
      </StageErrorBoundary>

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 bg-white px-6 py-6 text-center text-neutral-400">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs font-semibold">
            &copy; 2026 Caro. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs font-medium">
            <span>Built with Satori, Groq, and NextJS</span>
          </div>
        </div>
      </footer>

      {/* Website URL Modal */}
      {showWebsiteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md shadow-2xl p-8 relative">
            <button
              onClick={() => setShowWebsiteModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-all z-20"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-neutral-900">Website Link</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Enter a website URL to display in your carousel (optional).
                </p>
              </div>
              <input
                type="text"
                placeholder="e.g. reallygreatsite.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-blue-500 font-semibold text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleWebsiteSubmit();
                }}
              />
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowWebsiteModal(false)}
                  className="flex-1 px-5 py-2.5 text-neutral-600 hover:text-neutral-900 text-sm font-bold rounded-xl border border-neutral-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWebsiteSubmit}
                  className="flex-1 px-5 py-2.5 bg-[rgb(130,161,246)] hover:bg-[rgb(114,152,246)] text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          REGENERATE ALL CONFIRMATION MODAL
          ========================================== */}
      {showRegenerateAllConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md shadow-2xl p-8 relative">
            <button
              onClick={() => setShowRegenerateAllConfirm(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">Regenerate All Slides</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">This action will replace all slide content.</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-2">
                <p className="font-semibold">This will regenerate all slides and discard your manual edits.</p>
                <ul className="text-xs space-y-1 list-disc list-inside text-amber-700">
                  <li>All title and body text will be replaced</li>
                  <li>All approvals will be unchecked (re-review needed)</li>
                  <li>Slide count and preferences (tone/focus) will be preserved</li>
                  <li>Canvas-edited slides will be reset</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowRegenerateAllConfirm(false)}
                  className="flex-1 px-5 py-2.5 text-neutral-600 hover:text-neutral-900 text-sm font-bold rounded-xl border border-neutral-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateAll}
                  className="flex-1 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Regenerate All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          CANVAS EDITOR
          ========================================== */}
      {isCanvasEditorOpen && editingSlideIdx !== null && (() => {
        const approved = slides.filter(s => s.approved);
        const target = approved[editingSlideIdx];
        if (!target) return null;
        return (
          <CanvasEditor
            initialElements={target.elements || []}
            onSave={handleCanvasEditorSave}
            onClose={() => {
              setIsCanvasEditorOpen(false);
              setEditingSlideIdx(null);
              setCanvasBgImage(null);
            }}
            bgImageUrl={canvasBgImage || undefined}
          />
        );
      })()}

      {/* Brand Kit Modal */}
      {isBrandKitOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-black text-neutral-900">My Brand Kit</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandKitOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <p className="text-xs text-neutral-500 font-medium">
                Save your branding assets here to automatically pre-populate and style all generated carousels.
              </p>

              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">Brand Logo</label>
                <div className="flex items-center gap-4">
                  {customLogoUrl ? (
                    <div className="relative w-16 h-16 border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50 flex items-center justify-center p-2">
                      <img src={customLogoUrl} className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => { setCustomLogoUrl(""); setBrandKit(prev => ({ ...prev, logoUrl: undefined })); }}
                        className="absolute top-0.5 right-0.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="brand-logo-file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            setCustomLogoUrl(base64);
                            setBrandKit(prev => ({ ...prev, logoUrl: base64 }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="brand-logo-file"
                      className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer inline-block"
                    >
                      Upload Image
                    </label>
                    <span className="text-[10px] text-neutral-400 block mt-1">PNG, JPG, SVG or WebP. Max 1MB.</span>
                  </div>
                </div>
              </div>

              {/* Handle & Website */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="brand-handle" className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">Handle</label>
                  <input
                    id="brand-handle"
                    type="text"
                    placeholder="@handle"
                    value={brandKit.handle || ""}
                    onChange={(e) => setBrandKit({ ...brandKit, handle: e.target.value })}
                    className="w-full bg-white border border-neutral-200 focus:border-blue-400 rounded-xl px-3 py-2 text-sm text-neutral-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="brand-website" className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">Website</label>
                  <input
                    id="brand-website"
                    type="text"
                    placeholder="mywebsite.com"
                    value={brandKit.website || ""}
                    onChange={(e) => setBrandKit({ ...brandKit, website: e.target.value })}
                    className="w-full bg-white border border-neutral-200 focus:border-blue-400 rounded-xl px-3 py-2 text-sm text-neutral-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Default CTA & Font Pairing */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="brand-cta" className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">Default CTA Text</label>
                  <input
                    id="brand-cta"
                    type="text"
                    placeholder="Subscribe to my newsletter"
                    value={brandKit.defaultCTA || ""}
                    onChange={(e) => setBrandKit({ ...brandKit, defaultCTA: e.target.value })}
                    className="w-full bg-white border border-neutral-200 focus:border-blue-400 rounded-xl px-3 py-2 text-sm text-neutral-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider block font-sans">Default Font Pairing</label>
                  <select
                    value={brandKit.fontPairing || "Outfit + Outfit"}
                    onChange={(e) => {
                      setBrandKit({ ...brandKit, fontPairing: e.target.value });
                      setCustomFontPairing(e.target.value);
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700 focus:outline-none"
                  >
                    <option value="Outfit + Outfit">Outfit + Outfit (Sensory / Clean)</option>
                    <option value="Plus Jakarta Sans + Plus Jakarta Sans">Plus Jakarta Sans + Plus Jakarta Sans (Sensory / Modern)</option>
                    <option value="Lora + Lora">Lora + Lora (Serif / Classic)</option>
                    <option value="Playfair Display + Outfit">Playfair Display + Outfit (Serif / Editorial)</option>
                    <option value="Cinzel + Plus Jakarta Sans">Cinzel + Plus Jakarta Sans (Decorative)</option>
                    <option value="Pacifico + Outfit">Pacifico + Outfit (Script / Expressive)</option>
                    <option value="Outfit + JetBrains Mono">Outfit + JetBrains Mono (Tech / Developer)</option>
                    <option value="JetBrains Mono + JetBrains Mono">JetBrains Mono + JetBrains Mono (Brutalist / Minimal)</option>
                  </select>
                </div>
              </div>

              {/* Brand Colors */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">Brand Colors</label>
                <div className="grid grid-cols-4 gap-3 bg-neutral-50 p-3 border border-neutral-200 rounded-2xl">
                  {([
                    { role: "primary", label: "Primary / Accent" },
                    { role: "secondary", label: "Secondary" },
                    { role: "background", label: "Background" },
                    { role: "text", label: "Text" }
                  ] as const).map(item => {
                    const colorsObj = brandKit.colors || { primary: "#2563eb", secondary: "#475569", background: "#ffffff", text: "#0f172a" };
                    const currentVal = colorsObj[item.role];
                    return (
                      <div key={item.role} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 h-10 rounded-full border border-neutral-300 relative overflow-hidden shadow-sm"
                          style={{ backgroundColor: currentVal }}
                        >
                          <input
                            type="color"
                            value={currentVal}
                            onChange={(e) => {
                              const newColors = { ...colorsObj, [item.role]: e.target.value };
                              setBrandKit({ ...brandKit, colors: newColors });
                              if (item.role === "primary") {
                                setCustomAccentColor(e.target.value);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 text-center">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Defaults: Tone & Theme */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">Default Tone</label>
                  <select
                    value={brandKit.defaultTone || "professional"}
                    onChange={(e) => setBrandKit({ ...brandKit, defaultTone: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700 focus:outline-none"
                  >
                    <option value="professional">Professional</option>
                    <option value="educational">Educational</option>
                    <option value="punchy">Punchy</option>
                    <option value="contrarian">Contrarian</option>
                    <option value="story-driven">Story-driven</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">Default Theme</label>
                  <select
                    value={brandKit.defaultTheme || "monochrome"}
                    onChange={(e) => setBrandKit({ ...brandKit, defaultTheme: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700 focus:outline-none"
                  >
                    <option value="monochrome">Monochrome</option>
                    <option value="soft-gradient">Soft Gradient</option>
                    <option value="warm-editorial">Warm Editorial</option>
                    <option value="mesh-glow">Mesh Glow</option>
                    <option value="cyber-horizon">Cyber Horizon</option>
                    <option value="linen-rust">Linen & Rust</option>
                    <option value="neo-brutalism">Neo-Brutalism</option>
                    <option value="neomorphism">Neomorphism</option>
                    <option value="frosted-grid">Frosted Grid</option>
                    <option value="glassmorphism">Glassmorphism</option>
                    <option value="liquid-glass">Liquid Glass</option>
                    <option value="sketch">Sketch</option>
                    <option value="wireframe-3d">Wireframe 3D</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-100 flex items-center justify-end gap-3 bg-neutral-50/50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("caro_brand_kit");
                  setBrandKit({});
                  setCustomLogoUrl("");
                  setCustomFontPairing("Outfit + Outfit");
                  setCustomAccentColor("");
                  setIsBrandKitOpen(false);
                }}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset Kit
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("caro_brand_kit", JSON.stringify(brandKit));
                  if (brandKit.handle) setUsername(brandKit.handle);
                  if (brandKit.website) setWebsiteUrl(brandKit.website);
                  if (brandKit.defaultTheme) setThemeName(brandKit.defaultTheme as ThemeName);
                  if (brandKit.fontPairing) setCustomFontPairing(brandKit.fontPairing);
                  if (brandKit.logoUrl) setCustomLogoUrl(brandKit.logoUrl);
                  if (brandKit.colors?.primary) setCustomAccentColor(brandKit.colors.primary);
                  setIsBrandKitOpen(false);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alternatives Swapper Modal */}
      {alternativesSlideIdx !== null && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-black text-neutral-900">
                  {alternativesSlideType === "COVER" ? "Alternative Hooks" : "Alternative CTAs"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAlternativesSlideIdx(null);
                  setAlternativesSlideType(null);
                  setAlternativesList([]);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              {isGeneratingAlternatives ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-xs text-neutral-500 font-bold">Generating options...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alternativesList.map((alt, idx) => (
                    <div
                      key={idx}
                      onClick={() => applyAlternative(alt.title, alt.body)}
                      className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50 hover:bg-white hover:border-blue-500 transition-all cursor-pointer shadow-sm group"
                    >
                      <h4 className="font-extrabold text-neutral-900 text-sm mb-1 group-hover:text-blue-600 transition-all">
                        {alt.title}
                      </h4>
                      <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                        {alt.body}
                      </p>
                      <span className="text-[10px] text-blue-500 font-bold block mt-2 opacity-0 group-hover:opacity-100 transition-all">
                        Apply Option
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-100 flex justify-end bg-neutral-50/50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  setAlternativesSlideIdx(null);
                  setAlternativesSlideType(null);
                  setAlternativesList([]);
                }}
                className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
