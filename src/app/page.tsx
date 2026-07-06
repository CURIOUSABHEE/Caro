"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { CanvasElement } from "@/components/CanvasEditor";
import { StageErrorBoundary } from "@/components/StageErrorBoundary";

const CanvasEditor = dynamic(() => import("@/components/CanvasEditor"), { ssr: false });

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
  ChevronDown,
  ChevronUp,
  X,
  Square as SquareIcon,
  Circle as CircleIcon,
  Type as TypeIcon,
  Layers
} from "lucide-react";

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
  visualType?: "step-chain" | "venn" | "wheel" | "concentric" | "icon-grid" | "code-block" | "text-only" | "quote" | "stat" | "table";
  visualData?: any;
  elements?: CanvasElement[];
  manuallyEdited?: boolean;
  canvasPngUrl?: string;
}

const TONES = [
  { value: "professional", label: "👔 Professional & Corporate" },
  { value: "educational", label: "💡 Educational & Informative" },
  { value: "playful", label: "🎉 Playful & Energetic" },
  { value: "punchy", label: "🔥 Punchy & Minimalist" },
  { value: "authoritative", label: "🎓 Authoritative & Academic" }
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
      resolve(canvas.toDataURL("image/jpeg", 0.9));
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
    tone: "educational",
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

  // Show hardcoded preview instantly, then upgrade with live render in background
  useEffect(() => {
    if (step === 3 && slides.length > 0) {
      // 1. Show hardcoded SVG immediately
      setThemePreviewUri(THEME_PREVIEWS[themeName] || null);

      // 2. Fire real render in background and swap when ready
      let active = true;
      const upgradePreview = async () => {
        try {
          const s = slides[0];
          const res = await fetch("/api/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slides: [{
                type: s.type,
                title: s.userTitle,
                body: s.userBody,
                imageUrl: s.imageUrl || null,
                imageLayout: s.imageLayout || "inline",
                visualType: s.visualType || "text-only",
                visualData: s.visualData || null,
                paletteOverride,
              }],
              themeName,
              username,
              websiteUrl,
            })
          });
          if (res.ok && active) {
            const data = await res.json();
            if (data.success && data.images.length > 0) {
              setThemePreviewUri(data.images[0]);
            }
          }
        } catch { /* keep hardcoded fallback */ }
      };
      upgradePreview();
      return () => { active = false; };
    }
  }, [step, themeName, username, websiteUrl, slides, paletteOverride]);

  // Load draft from localStorage on mount
  useEffect(() => {
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
        paletteOverride
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

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: extractUrl })
      });
      
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to extract blog text.");
      }

      setExtractedData(result.data);
      setShowExtractedPreview(true);
    } catch (err: any) {
      setError(err.message || "Failed to connect to the scraping API.");
    } finally {
      setIsExtracting(false);
    }
  };

  // ==========================================
  // STAGE 2: Call AI to Plan Slides
  // ==========================================
  const handlePlanSlides = async () => {
    if (!extractedData) return;
    setError(null);
    setIsPlanning(true);

    try {
      const res = await fetch("/api/plan-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractedData.content,
          tone: preferences.tone,
          focus: preferences.focus,
          slideCount: preferences.slideCount
        })
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to plan slides.");
      }

      const formatted: Slide[] = result.data.slides.map((s: any, idx: number) => {
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
          visualData: s.visualData || null
        };
      });

      setSlides(formatted);
      const nextStep = Math.max(maxUnlockedStep, 2);
      setMaxUnlockedStep(nextStep);
      saveDraftLocally(formatted, nextStep);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to plan slides with AI.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleVisualTypeChange = async (index: number, newVisualType: Slide["visualType"]) => {
    const updated = [...slides];
    updated[index].visualType = newVisualType;
    
    if (newVisualType === "text-only" || !newVisualType) {
      updated[index].visualData = null;
      setSlides(updated);
      saveDraftLocally(updated);
      return;
    }

    // Set loading indicator
    updated[index].visualData = { loading: true };
    setSlides([...updated]);

    try {
      const res = await fetch("/api/fill-visual-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visualType: newVisualType,
          title: updated[index].userTitle,
          body: updated[index].userBody,
        }),
      });
      const result = await res.json();
      if (result.success) {
        updated[index].visualData = result.data.visualData;
      } else {
        updated[index].visualData = null;
      }
    } catch (err) {
      console.error("Failed to change visual type:", err);
      updated[index].visualData = null;
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
      const res = await fetch("/api/regenerate-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block: {
            type: target.type,
            title: target.userTitle,
            body: target.userBody,
            order: target.order
          },
          instruction,
          originalText: extractedData?.content
        })
      });

      const result = await res.json();
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
    } catch (err: any) {
      setError(err.message || "Failed to regenerate slide block.");
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
      visualData: s.visualData || null
    })),
    username,
    websiteUrl,
    scribble,
  });

  const renderTheme = async (theme: ThemeName): Promise<string[] | null> => {
    const approved = slides.filter(s => s.approved);
    if (approved.length === 0) return null;

    setThemeLoadingStates(prev => ({ ...prev, [theme]: true }));

    try {
      const renderedList = new Array(approved.length).fill("");
      if (theme === activeThemeRef.current) {
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
        visualData: s.visualData || null,
        paletteOverride: palette,
      }));

      let apiResults: string[] = [];
      if (aiSlides.length > 0) {
        const res = await fetch("/api/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slides: aiSlides,
            themeName: theme,
            username,
            websiteUrl,
            scribble,
          })
        });

        const result = await res.json();
        if (!result.success) throw new Error(result.error);
        apiResults = result.data.images;

        // Warn about per-slide render failures without throwing
        if (result.data.errors?.length) {
          const failedSlides = result.data.errors.map((e: any) => `#${e.index + 1}`).join(", ");
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

      setAllThemeImages(prev => ({ ...prev, [theme]: renderedList }));
      if (theme === activeThemeRef.current) {
        setRenderedImages([...renderedList]);
      }

      return renderedList;
    } catch (err: any) {
      setError(err.message || `Failed to render "${theme}" theme.`);
      return null;
    } finally {
      setThemeLoadingStates(prev => ({ ...prev, [theme]: false }));
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
        images.forEach((_: any, idx: number) => {
          initialExport[idx] = true;
        });
        setSelectedForExport(initialExport);
      }
    } catch (err: any) {
      setError(err.message || "Failed to render carousel slide previews.");
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
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
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
      const res = await fetch("/api/plan-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractedData.content,
          tone: preferences.tone,
          focus: preferences.focus,
          slideCount: preferences.slideCount
        })
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to regenerate slides.");
      }

      const formatted: Slide[] = result.data.slides.map((s: any, idx: number) => {
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
          visualData: s.visualData || null
        };
      });

      setSlides(formatted);
      saveDraftLocally(formatted);
    } catch (err: any) {
      setError(err.message || "Failed to regenerate all slides.");
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
      const approvedExport = slides.filter(s => s.approved);
      const payloadImages = await Promise.all(
        indicesToExport.map(async (idx) => {
          let dataUri = renderedImages[idx];
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
        const res = await fetch("/api/export-zip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: payloadImages })
        });

        if (!res.ok) throw new Error("Failed to compile ZIP archive.");

        const baseName = extractedData?.title ? sanitizeFilename(extractedData.title) : "carousel-export";
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      setError(err.message || "Failed to download export.");
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

      for (let i = 0; i < indicesToExport.length; i++) {
        const idx = indicesToExport[i];
        const dataUri = renderedImages[idx];

        if (i > 0) {
          doc.addPage([1080, 1350]);
        }

        doc.addImage(dataUri, "PNG", 0, 0, 1080, 1350);
      }

      const baseName = extractedData?.title ? sanitizeFilename(extractedData.title) : "carousel-export";
      doc.save(`${baseName}.pdf`);
    } catch (err: any) {
      setError(err.message || "Failed to export PDF.");
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

  const updateShapeProp = (
    baseIndex: number,
    shapeId: string,
    key: keyof Shape,
    value: any
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

  const steps = [
    { num: 1, label: "Extract" },
    { num: 2, label: "Review" },
    { num: 3, label: "Theme" },
    { num: 4, label: "Export" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">
                  Tone & Preferences <span className="text-neutral-400 font-medium">(Optional)</span>
                </label>
                <textarea
                  placeholder="e.g. Keep it punchy, focus on the 3 main takeaways, use a friendly tone..."
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
                onClick={handlePlanSlides}
                disabled={isPlanning || !extractedData}
                className="w-full py-3.5 bg-[rgb(130,161,246)] hover:bg-[rgb(114,152,246)] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Slides Plan...
                  </>
                ) : (
                  "Generate Slides Plan"
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Slide Block Approval & Editing */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-end">
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

            {/* Slide list */}
            <div className="space-y-4">
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
                      <input
                        type="text"
                        value={s.userTitle}
                        onChange={(e) => handleTextChange(idx, "userTitle", e.target.value)}
                        placeholder="Slide Headline (Use *italics* for serif highlights)"
                        className="w-full bg-white border border-neutral-200 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-neutral-900 font-bold focus:outline-none"
                      />
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
                            updated[idx].type = e.target.value as any;
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
                              onChange={(e) => handleVisualTypeChange(idx, e.target.value as any)}
                              className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs font-semibold text-neutral-600 focus:outline-none"
                            >
                              <option value="text-only">Text Only</option>
                              <option value="quote">Quote Block</option>
                              <option value="stat">Big Stat</option>
                              <option value="step-chain">Step Chain</option>
                              <option value="venn">Venn Diagram</option>
                              <option value="wheel">Wheel Hub</option>
                              <option value="concentric">Concentric Hierarchy</option>
                              <option value="icon-grid">Icon Grid</option>
                              <option value="table">Comparison Table</option>
                            </select>
                            {s.visualData?.loading && (
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

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-neutral-600 hover:text-neutral-900 text-sm font-bold flex items-center gap-1.5 transition-all"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleProceedToTheme}
                className="px-8 py-3 bg-[rgb(130,161,246)] hover:bg-[rgb(114,152,246)] text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Monochrome theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("monochrome");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "monochrome"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-[#0d0d0d] flex items-center justify-center p-4">
                      <span className="text-lg font-normal text-white tracking-wide font-serif">Monochrome</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Monochrome</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Black background, white centered text, minimal.
                      </p>
                    </div>
                  </button>

                  {/* Soft Gradient theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("soft-gradient");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "soft-gradient"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center p-4">
                      <span className="text-lg font-bold text-white tracking-wide font-sans">Soft Gradient</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Soft Gradient</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Organic gradient, heavy headline type.
                      </p>
                    </div>
                  </button>

                  {/* Warm Editorial theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("warm-editorial");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "warm-editorial"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-[#f5f2eb] flex items-center justify-center p-4">
                      <span className="text-lg font-bold text-[#1e1b18] tracking-tight font-serif">Warm Editorial</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Warm Editorial</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Cream background, elegant serif titles, terracotta red highlights.
                      </p>
                    </div>
                  </button>

                  {/* Mesh Glow theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("mesh-glow");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "mesh-glow"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-white flex items-center justify-center p-4 relative overflow-hidden">
                      <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>
                      <span className="text-xl font-bold text-pink-500 absolute top-2 left-4">*</span>
                      <span className="text-lg font-black text-neutral-950 tracking-tighter font-sans z-10">Mesh Glow</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Mesh Glow</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        White base, 10% corner aura in pink/purple, clean.
                      </p>
                    </div>
                  </button>

                  {/* Cyber Horizon theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("cyber-horizon");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "cyber-horizon"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-gradient-to-br from-[#0c0a09] to-[#1c1917] flex items-center justify-center p-4 relative border-b border-neutral-800">
                      <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-[#ea580c] shadow-[0_0_8px_#ea580c]" />
                      <span className="text-lg font-bold text-white tracking-wide font-sans text-center uppercase">Cyber Horizon</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Cyber Horizon</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Pitch-black grid, orange-red radial glows, ultra-bold headers, 3D spheres.
                      </p>
                    </div>
                  </button>

                  {/* Linen & Rust theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("linen-rust");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "linen-rust"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-[#d8d7cf] flex flex-col items-center justify-center p-4">
                      <span className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase mb-0.5">* Editorial *</span>
                      <span className="text-xl font-normal text-[#c5563c] tracking-normal font-serif italic">Linen & Rust</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Linen & Rust</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Warm oatmeal, terracotta accents, handwritten scripts, wavy path sequence.
                      </p>
                    </div>
                  </button>

                  {/* Neo-Brutalism theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("neo-brutalism");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "neo-brutalism"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-[#F5F3EE] flex items-center justify-center p-4 border-b-[3px] border-[#161616]">
                      <span className="text-lg font-black text-[#161616] uppercase tracking-tight" style={{ transform: "rotate(-1deg)" }}>Neo-Brutalism</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Neo-Brutalism</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Off-white canvas, hard shadows, thick borders, bold accent color.
                      </p>
                    </div>
                  </button>

                  {/* Neomorphism theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("neomorphism");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "neomorphism"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-[#E4E0DA] flex items-center justify-center p-4">
                      <div style={{ boxShadow: "-6px -6px 12px rgba(255,255,255,0.6), 6px 6px 12px rgba(0,0,0,0.1)", borderRadius: "16px", padding: "12px 24px", background: "#E4E0DA" }}>
                        <span className="text-lg font-bold text-[#2B2B2B] tracking-tight">Neomorphism</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Neomorphism</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Soft extruded surfaces, dual shadows, monochromatic tactility.
                      </p>
                    </div>
                  </button>

                  {/* Frosted Grid theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("frosted-grid");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "frosted-grid"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-neutral-50 flex items-center justify-center p-4 relative overflow-hidden">
                      {/* background grid lines */}
                      <div className="absolute inset-0 opacity-10 flex space-x-[20px]">
                         {[...Array(10)].map((_,i) => <div key={i} className="w-px h-full bg-black"></div>)}
                      </div>
                      <div className="absolute -bottom-10 right-0 left-0 h-24 bg-purple-500 rounded-t-full filter blur-xl opacity-60"></div>
                      <div className="backdrop-blur-sm bg-white/70 border-t border-l border-white shadow-sm rounded-xl px-4 py-2 z-10">
                        <span className="text-sm font-bold text-neutral-900 tracking-tight">Frosted Grid</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center border-t border-neutral-100">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Frosted Grid</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        White line grid top, frosted glass waves over purple bottom.
                      </p>
                    </div>
                  </button>

                  {/* New Glassmorphism theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("glassmorphism");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "glassmorphism"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-gradient-to-br from-[#e2e8f0] to-[#f8fafc] flex items-center justify-center p-4">
                      <div className="backdrop-blur-md bg-white/50 border-t border-l border-white/90 rounded-2xl px-5 py-2.5 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
                        <span className="text-lg font-bold text-slate-800 tracking-tight">Glassmorphism</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Glassmorphism</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Soft misty-blue background, frosted panels, clean aesthetic.
                      </p>
                    </div>
                  </button>

                  {/* Liquid Glass theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("liquid-glass");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "liquid-glass"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-[#f8fafc] flex items-center justify-center p-4">
                      <div className="bg-white/40 border border-white/90 rounded-full px-6 py-2 shadow-inner">
                        <span className="text-lg font-bold text-neutral-900 tracking-tight drop-shadow-sm">Liquid Glass</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Liquid Glass</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Thick refractive glass, pill-shaped UI, vibrant gradient accents.
                      </p>
                    </div>
                  </button>

                  {/* Sketch theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("sketch");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-[#fdfaf6] shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "sketch"
                        ? "border-[#2d2d2d] ring-2 ring-[#2d2d2d]/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(45,45,45,0.05) 5px, rgba(45,45,45,0.05) 6px)" }}>
                      <div className="bg-[#fdfaf6] border-2 border-[#2d2d2d] px-5 py-2.5 transform -rotate-2 relative">
                         <div className="absolute inset-0 border border-[#2d2d2d] transform rotate-1"></div>
                        <span className="text-xl font-bold text-[#2d2d2d] tracking-tight" style={{ fontFamily: "cursive, system-ui" }}>Sketch</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center bg-white border-t border-neutral-100">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Sketch</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Hand-drawn hatching, rough borders, and irregular alignments.
                      </p>
                    </div>
                  </button>

                  {/* Wireframe 3D theme card */}
                  <button
                    type="button"
                    onClick={() => {
                      setThemeName("wireframe-3d");
                      saveDraftLocally();
                    }}
                    className={`border rounded-2xl overflow-hidden text-left flex flex-col justify-between h-[220px] bg-white shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer ${
                      themeName === "wireframe-3d"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="h-28 w-full bg-white flex items-center justify-center p-4 relative overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 160" fill="none">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <line key={`h-${i}`} x1={0} y1={i * 30} x2={400} y2={i * 30} stroke="#000" strokeWidth="0.5" />
                        ))}
                        {Array.from({ length: 14 }).map((_, i) => (
                          <line key={`v-${i}`} x1={i * 30} y1={0} x2={i * 30} y2={160} stroke="#000" strokeWidth="0.5" />
                        ))}
                      </svg>
                      <div className="border-2 border-black px-5 py-2.5 bg-white relative z-10">
                        <span className="text-sm font-bold text-black tracking-tight font-mono">Wireframe 3D</span>
                      </div>
                      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-black"></div>
                      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-black"></div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Wireframe 3D</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        Isometric grid, thin black lines, monospace labels, technical blueprint style.
                      </p>
                    </div>
                  </button>

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
                      const currentVal = paletteOverride?.[role] || "";
                      return (
                        <div key={role} className="flex flex-col items-center gap-1.5">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-neutral-300" style={{ backgroundColor: currentVal || "#e5e7eb" }}>
                            <input
                              type="color"
                              value={currentVal || "#cccccc"}
                              onChange={(e) => {
                                const next = { ...(paletteOverride || PALETTE_PRESETS[0]), [role]: e.target.value, name: paletteOverride?.name || "Custom" };
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
              </div>

              {/* Right Column: Live Sticky Preview Window */}
              <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-8 space-y-4">
                <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      Live Preview (Cover Slide)
                    </span>
                    <span className="text-xs text-neutral-400 font-semibold">● Instant</span>
                  </div>

                  <div className="relative aspect-[4/5] bg-neutral-50 border border-neutral-100 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                    {themePreviewUri ? (
                      <img
                        src={themePreviewUri}
                        alt="Live Theme Preview"
                        className="w-full h-full object-cover transition-opacity duration-300"
                        style={{ opacity: isGeneratingPreview ? 0.6 : 1 }}
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <p className="text-xs text-neutral-400 font-medium">Select a theme above</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-neutral-400 text-center font-medium leading-relaxed">
                    Preview of the selected theme's visual style. Click "Render Carousel" below to generate your full carousel.
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

    </div>
  );
}
