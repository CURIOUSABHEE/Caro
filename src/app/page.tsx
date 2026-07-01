"use client";

import React, { useState, useEffect } from "react";
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
  visualType?: "step-chain" | "venn" | "wheel" | "concentric" | "icon-grid" | "text-only";
  visualData?: any;
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

type ThemeName = "monochrome" | "soft-gradient" | "warm-editorial" | "mesh-glow" | "cyber-horizon" | "linen-rust";

const PALETTE_INFO: { name: ThemeName; label: string; colors: string[] }[] = [
  { name: "monochrome", label: "Monochrome", colors: ["#050505", "#ffffff", "#6e6e6e"] },
  { name: "soft-gradient", label: "Soft Gradient", colors: ["#fbfbfc", "#c084fc", "#f472b6"] },
  { name: "warm-editorial", label: "Warm Editorial", colors: ["#f5f2eb", "#e05a47", "#1e1b18"] },
  { name: "mesh-glow", label: "Mesh Glow", colors: ["#ffffff", "#3b82f6", "#ec4899"] },
  { name: "cyber-horizon", label: "Cyber Horizon", colors: ["#050505", "#ea580c", "#ffffff"] },
  { name: "linen-rust", label: "Linen & Rust", colors: ["#d8d7cf", "#c5563c", "#2e2b2a"] },
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

  const [themeName, setThemeName] = useState<"monochrome" | "soft-gradient" | "warm-editorial" | "mesh-glow" | "cyber-horizon" | "linen-rust">("monochrome");
  const activeThemeRef = React.useRef(themeName);
  activeThemeRef.current = themeName;
  const [username, setUsername] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpg">("png");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [showWebsiteModal, setShowWebsiteModal] = useState<boolean>(false);
  const [scribble, setScribble] = useState<boolean>(false);

  // Live Theme Preview State
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

  // Social Preview State
  const [viewMode, setViewMode] = useState<"grid" | "social">("grid");
  const [activeSocialSlide, setActiveSocialSlide] = useState<number>(0);
  const [socialLiked, setSocialLiked] = useState<boolean>(false);

  // Hardcoded theme previews — instant, no API call needed
  const THEME_PREVIEWS: Record<string, string> = {
    "monochrome": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#050505"/><rect x="35" y="35" width="330" height="430" fill="none" stroke="#1c1c1c" stroke-width="1"/><text x="200" y="55" font-family="system-ui,sans-serif" font-size="11" fill="#6e6e6e" font-weight="700" text-anchor="middle">INTRODUCTION</text><text x="320" y="55" font-family="system-ui,sans-serif" font-size="11" fill="#6e6e6e" font-weight="700" text-anchor="end">1/5</text><text x="200" y="240" text-anchor="middle" font-family="Georgia,serif" font-size="36" fill="white" font-weight="400">Monochrome</text><line x1="150" y1="260" x2="250" y2="260" stroke="#333" stroke-width="1"/><text x="200" y="295" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#a3a3a3" font-weight="400">Minimal. Bold. Timeless.</text><text x="40" y="455" font-family="system-ui,sans-serif" font-size="13" fill="white" font-weight="800">@username</text><text x="330" y="455" font-family="system-ui,sans-serif" font-size="12" fill="#7a7a7a" font-weight="700" text-anchor="end">SWIPE &gt;</text></svg>`),
    "soft-gradient": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c084fc"/><stop offset="100%" stop-color="#f472b6"/></linearGradient></defs><rect width="400" height="500" fill="#fbfbfc"/><circle cx="200" cy="460" r="260" fill="url(#sg)" opacity="0.12"/><circle cx="80" cy="80" r="180" fill="#c084fc" opacity="0.06"/><circle cx="340" cy="120" r="140" fill="#f472b6" opacity="0.08"/><rect x="25" y="30" width="350" height="440" rx="24" fill="white" opacity="0.55" stroke="rgba(255,255,255,0.6)" stroke-width="1"/><rect x="35" y="42" width="80" height="22" rx="9999" fill="white" opacity="0.5" stroke="rgba(255,255,255,0.3)" stroke-width="1"/><text x="75" y="57" font-family="system-ui,sans-serif" font-size="9" fill="#475569" font-weight="800" text-anchor="middle" text-transform="uppercase" letter-spacing="1">Cover Story</text><text x="310" y="57" font-family="system-ui,sans-serif" font-size="10" fill="#475569" font-weight="800">1/5</text><text x="200" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" fill="#0f172a" font-weight="800" letter-spacing="-1">Soft Gradient</text><text x="200" y="260" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#475569">Lush. Flowing. Vibrant.</text><rect x="35" y="420" width="100" height="26" rx="9999" fill="rgba(15,23,42,0.04)" stroke="rgba(15,23,42,0.05)" stroke-width="1"/><text x="85" y="438" font-family="system-ui,sans-serif" font-size="11" fill="#0f172a" font-weight="800" text-anchor="middle">@username</text></svg>`),
    "warm-editorial": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#f5f2eb"/><rect x="0" y="0" width="400" height="4" fill="#e05a47"/><text x="40" y="55" font-family="system-ui,sans-serif" font-size="11" fill="#e05a47" font-weight="800" letter-spacing="2">CARO</text><text x="340" y="55" font-family="system-ui,sans-serif" font-size="10" fill="#e05a47" font-weight="800">1/5</text><text x="40" y="105" font-family="system-ui,sans-serif" font-size="12" fill="#e05a47" font-weight="800" letter-spacing="3" text-transform="uppercase">Step-by-Step Guide</text><text x="40" y="175" font-family="Georgia,serif" font-size="36" fill="#1e1b18" font-weight="700">Warm</text><text x="40" y="220" font-family="Georgia,serif" font-size="36" fill="#e05a47" font-weight="700">Editorial</text><line x1="40" y1="245" x2="140" y2="245" stroke="#e05a47" stroke-width="2" opacity="0.4"/><text x="40" y="285" font-family="system-ui,sans-serif" font-size="15" fill="#6b6259">Elegant serif titles,</text><text x="40" y="310" font-family="system-ui,sans-serif" font-size="15" fill="#6b6259">terracotta red highlights.</text><text x="40" y="455" font-family="system-ui,sans-serif" font-size="11" fill="#e05a47" font-weight="800" letter-spacing="2">REALLYGREATSITE.COM</text><text x="330" y="455" font-family="system-ui,sans-serif" font-size="10" fill="#1e1b18" font-weight="800" text-anchor="end" text-transform="uppercase">Swipe next</text></svg>`),
    "mesh-glow": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><radialGradient id="mg1" cx="0%" cy="0%" r="60%"><stop offset="0%" stop-color="#93c5fd" stop-opacity="0.25"/><stop offset="100%" stop-color="#93c5fd" stop-opacity="0"/></radialGradient><radialGradient id="mg2" cx="100%" cy="100%" r="60%"><stop offset="0%" stop-color="#f9a8d4" stop-opacity="0.2"/><stop offset="100%" stop-color="#f9a8d4" stop-opacity="0"/></radialGradient></defs><rect width="400" height="500" fill="url(#mg1)"/><rect width="400" height="500" fill="url(#mg2)"/><text x="30" y="50" font-family="Georgia,serif" font-size="28" fill="#3b82f6" font-weight="800">*</text><text x="40" y="220" font-family="system-ui,sans-serif" font-size="36" fill="#0a0a0a" font-weight="900">Mesh Glow</text><path d="M 42 235 S 130 228 220 235 S 290 242 330 238" stroke="#ec4899" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="40" y="265" width="140" height="28" rx="9999" fill="none" stroke="#0a0a0a" stroke-width="1.5"/><text x="110" y="284" font-family="system-ui,sans-serif" font-size="10" fill="#0a0a0a" font-weight="850" text-anchor="middle" letter-spacing="1" text-transform="uppercase">Swipe to learn</text><path d="M 280 400 Q 320 390 305 420 Q 290 450 320 455" stroke="#f472b6" stroke-width="2.5" fill="none" opacity="0.6"/><circle cx="340" cy="50" r="50" fill="#93c5fd" opacity="0.12"/><text x="40" y="455" font-family="system-ui,sans-serif" font-size="9" fill="#9ca3af" font-weight="800" letter-spacing="1" text-transform="uppercase">reallygreatsite.com</text><text x="340" y="455" font-family="system-ui,sans-serif" font-size="9" fill="#9ca3af" font-weight="800">2026</text></svg>`),
    "cyber-horizon": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><radialGradient id="ch" cx="50%" cy="85%" r="50%"><stop offset="0%" stop-color="#ea580c" stop-opacity="0.3"/><stop offset="100%" stop-color="#ea580c" stop-opacity="0"/></radialGradient><radialGradient id="sphere1" cx="35%" cy="30%" r="60%"><stop offset="0%" stop-color="rgba(255,255,255,0.45)"/><stop offset="40%" stop-color="rgba(234,88,12,0.3)"/><stop offset="80%" stop-color="rgba(244,63,94,0.1)"/><stop offset="100%" stop-color="rgba(5,5,5,0.8)"/></radialGradient><radialGradient id="sphere2" cx="35%" cy="30%" r="60%"><stop offset="0%" stop-color="rgba(255,255,255,0.3)"/><stop offset="40%" stop-color="rgba(234,88,12,0.2)"/><stop offset="100%" stop-color="rgba(5,5,5,0.9)"/></radialGradient></defs><rect width="400" height="500" fill="#050505"/><rect width="400" height="500" fill="url(#ch)"/><line x1="0" y1="80" x2="400" y2="80" stroke="#1c1917" stroke-width="1"/><line x1="0" y1="180" x2="400" y2="180" stroke="#1c1917" stroke-width="1"/><line x1="0" y1="280" x2="400" y2="280" stroke="#1c1917" stroke-width="1"/><line x1="0" y1="380" x2="400" y2="380" stroke="#1c1917" stroke-width="1"/><line x1="100" y1="0" x2="100" y2="500" stroke="#1c1917" stroke-width="1"/><line x1="200" y1="0" x2="200" y2="500" stroke="#1c1917" stroke-width="1"/><line x1="300" y1="0" x2="300" y2="500" stroke="#1c1917" stroke-width="1"/><circle cx="310" cy="380" r="45" fill="none" stroke="#ea580c" stroke-width="1.5" opacity="0.35"/><circle cx="310" cy="380" r="22" fill="#ea580c" opacity="0.12"/><circle cx="90" cy="130" r="35" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><circle cx="90" cy="130" r="35" fill="url(#sphere1)"/><circle cx="320" cy="180" r="25" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><circle cx="320" cy="180" r="25" fill="url(#sphere2)"/><rect x="30" y="25" width="110" height="22" rx="9999" fill="rgba(20,20,20,0.8)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/><text x="85" y="40" font-family="system-ui,sans-serif" font-size="9" fill="#a3a3a3" font-weight="700" text-anchor="middle">Introduction</text><text x="340" y="40" font-family="system-ui,sans-serif" font-size="10" fill="rgba(255,255,255,0.4)" font-weight="700">1/5</text><text x="200" y="260" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" fill="white" font-weight="700">CYBER</text><text x="200" y="295" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" fill="#ea580c" font-weight="700">HORIZON</text></svg>`),
    "linen-rust": "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#d8d7cf"/><text x="200" y="45" text-anchor="middle" font-family="system-ui,sans-serif" font-size="8" fill="#a8a79a" font-weight="700" letter-spacing="3">* EDITORIAL *</text><text x="40" y="130" font-family="Georgia,serif" font-size="36" fill="#c5563c" font-style="italic" font-weight="400">Linen &amp; Rust</text><path d="M 40 165 Q 100 148 160 170 Q 220 192 280 168 Q 330 148 360 168" stroke="#c5563c" stroke-width="1.5" fill="none" opacity="0.35"/><rect x="40" y="190" width="60" height="3" fill="#c5563c"/><text x="40" y="235" font-family="system-ui,sans-serif" font-size="15" fill="#5c5553">Warm oatmeal, terracotta</text><text x="40" y="260" font-family="system-ui,sans-serif" font-size="15" fill="#5c5553">accents, handwritten scripts.</text><text x="58" y="340" font-family="system-ui,sans-serif" font-size="18" fill="#c5563c" opacity="0.45">*</text><text x="125" y="420" font-family="system-ui,sans-serif" font-size="14" fill="#c5563c" opacity="0.35">*</text><text x="290" y="300" font-family="system-ui,sans-serif" font-size="22" fill="#c5563c" opacity="0.3">*</text><text x="340" y="460" font-family="system-ui,sans-serif" font-size="12" fill="#c5563c" opacity="0.25">*</text><text x="40" y="455" font-family="system-ui,sans-serif" font-size="9" fill="rgba(46,43,42,0.45)" font-weight="700" letter-spacing="1">linen-rust</text><text x="340" y="455" font-family="system-ui,sans-serif" font-size="9" fill="rgba(46,43,42,0.45)" font-weight="700">* swipe</text></svg>`),
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
          const res = await fetch("/api/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slides: [slides[0]],
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
  }, [step, themeName, username, websiteUrl, slides]);

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
        maxUnlockedStep: maxStep
      })
    );
  };

  // Re-trigger rendering on step 4 transition — renders active palette first, then others sequentially
  useEffect(() => {
    if (step === 4) {
      setAllThemeImages({});
      setThemeLoadingStates({});
      
      const renderSequence = async () => {
        // 1. Render current active theme first (focus resources here)
        await handleRender();
        
        // 2. Render other themes in the background sequentially (no concurrency overload)
        const currentTheme = activeThemeRef.current;
        const otherThemes = PALETTE_INFO.filter(p => p.name !== currentTheme);
        for (const p of otherThemes) {
          // Verify user hasn't switched steps or changed the theme mid-loop
          if (step === 4 && currentTheme === activeThemeRef.current) {
            await renderTheme(p.name);
          }
        }
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

    if (!url || !url.startsWith("http")) {
      setError("Please enter a valid HTTP/HTTPS URL.");
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
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
    }
    setSlides(updated);
    saveDraftLocally(updated);
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

  const handleRegenerateBlock = async (index: number) => {
    const target = slides[index];
    const instruction = aiInstructions[target.id] || "";
    if (!instruction || instruction.trim().length < 2) return;
    
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

    if (allThemeImages[theme]) return allThemeImages[theme];

    setThemeLoadingStates(prev => ({ ...prev, [theme]: true }));

    try {
      const renderedList = new Array(approved.length).fill("");
      if (theme === activeThemeRef.current) {
        setRenderedImages([...renderedList]);
      }

      for (let i = 0; i < approved.length; i++) {
        const res = await fetch("/api/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...buildRenderPayload(),
            themeName: theme,
            slideIndex: i,
          })
        });

        const result = await res.json();
        if (!result.success) throw new Error(result.error);

        renderedList[i] = result.data.image;
        if (theme === activeThemeRef.current) {
          setRenderedImages([...renderedList]);
        }
      }

      setAllThemeImages(prev => ({ ...prev, [theme]: renderedList }));
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
      
      setEditingSlideIdx(newSlideIdxInApproved);
      setIsEditModalOpen(true);
    }, 150);
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slideIdxInApproved: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // ZIP export
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
      const payloadImages = await Promise.all(
        indicesToExport.map(async (idx) => {
          let dataUri = renderedImages[idx];
          let ext = "png";
          if (exportFormat === "jpg") {
            try {
              dataUri = await convertBase64PngToJpg(dataUri);
              ext = "jpg";
            } catch (err) {
              console.error(`Failed to convert slide ${idx + 1} to JPG:`, err);
            }
          }
          return {
            fileName: `slide_${idx + 1}.${ext}`,
            dataUri
          };
        })
      );

      const res = await fetch("/api/export-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: payloadImages })
      });

      if (!res.ok) throw new Error("Failed to compile ZIP archive.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carousel-export.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to download ZIP file.");
    } finally {
      setIsExporting(false);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      
      {/* Central Layout Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col justify-start">
        
        {/* Step Indicator Panel (Pictured style) */}
        <div className="mb-12 max-w-2xl mx-auto w-full">
          <div className="relative flex justify-between items-center w-full">
            {/* Horizontal Line connecting steps */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 z-0" />

            {[
              { num: 1, label: "Extract" },
              { num: 2, label: "Review" },
              { num: 3, label: "Theme" },
              { num: 4, label: "Export" }
            ].map((s) => {
              // Gating rules: disable if s.num is greater than maxUnlockedStep
              const isStepButtonDisabled = s.num > maxUnlockedStep;

              return (
                <button
                  key={s.num}
                  disabled={isStepButtonDisabled}
                  onClick={() => setStep(s.num)}
                  className={`relative z-10 flex flex-col items-center focus:outline-none transition-all ${
                    isStepButtonDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  title={isStepButtonDisabled ? "Please complete the previous step to unlock." : ""}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-semibold text-sm ${
                      step === s.num
                        ? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-105"
                        : step > s.num
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
                    }`}
                  >
                    {step > s.num ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : s.num}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold tracking-wide transition-all ${
                      step === s.num ? "text-blue-600 font-bold" : "text-neutral-500"
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
              <button
                type="button"
                onClick={addBlankSlide}
                className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add Slide
              </button>
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
                          placeholder="Instruction for AI..."
                          value={instVal}
                          onChange={(e) => setAiInstructions(prev => ({ ...prev, [s.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRegenerateBlock(idx);
                          }}
                          className="bg-neutral-50 border border-neutral-200 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none flex-1 max-w-[200px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRegenerateBlock(idx)}
                          disabled={isItemRegenerating || !instVal}
                          className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3 w-3 ${isItemRegenerating ? "animate-spin" : ""}`} />
                          Regenerate
                        </button>
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
                              <option value="step-chain">Step Chain</option>
                              <option value="venn">Venn Diagram</option>
                              <option value="wheel">Wheel Hub</option>
                              <option value="concentric">Concentric Hierarchy</option>
                              <option value="icon-grid">Icon Grid</option>
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
                    <div className="h-28 w-full bg-gradient-to-tr from-blue-100 to-pink-100 flex items-center justify-center p-4 relative">
                      <span className="text-xl font-bold text-blue-500 absolute top-2 left-4">*</span>
                      <span className="text-lg font-black text-neutral-950 tracking-tighter font-sans">Mesh Glow</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-extrabold text-neutral-900 text-xs">Mesh Glow</h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium leading-relaxed">
                        White base, neon mesh corner aura, pink scribble accents.
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
                  {/* Scribble Overlay Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setScribble(prev => !prev);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      scribble
                        ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm"
                        : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="M15 5l4 4" />
                    </svg>
                    Scribble
                  </button>

                  {/* PNG / JPG Format Select Toggle */}
                  <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/60 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setExportFormat("png")}
                      className={`px-3 py-1.5 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                        exportFormat === "png"
                          ? "bg-white text-neutral-900 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat("jpg")}
                      className={`px-3 py-1.5 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                        exportFormat === "jpg"
                          ? "bg-white text-neutral-900 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      JPG
                    </button>
                  </div>

                  {/* Download Action */}
                  <button
                    type="button"
                    onClick={handleExportZip}
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
                        Download ZIP ({activeExportCount})
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
                        setEditingSlideIdx(idx);
                        setIsEditModalOpen(true);
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

                      {/* Double-click edit helper tooltip on hover */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <span className="bg-black/60 backdrop-blur-sm text-[10px] text-white font-bold py-1 px-2.5 rounded-full shadow">
                          Double-click to edit
                        </span>
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

                    {/* Top right slide pagination tag */}
                    <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-black text-white tracking-widest shadow-sm select-none">
                      {activeSocialSlide + 1} / {renderedImages.length}
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
          DOUBLE-CLICK CANVAS / DIAGRAM EDITOR MODAL
          ========================================== */}
      {isEditModalOpen && editingSlideIdx !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-4xl shadow-2xl p-6 relative flex flex-col md:flex-row gap-6 max-h-[92vh] overflow-y-auto">
            
            {/* Close button overlay */}
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingSlideIdx(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-all z-20"
            >
              <X className="h-5 w-5" />
            </button>

            {(() => {
              const approved = slides.filter(s => s.approved);
              const activeSlide = approved[editingSlideIdx];
              if (!activeSlide) return null;

              const baseIdx = slides.findIndex(s => s.id === activeSlide.id);
              const activeSlideShapes = activeSlide.shapes || [];

              return (
                <>
                  {/* Left Column: Visual Slide Preview Overlay */}
                  <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 border border-neutral-100 rounded-2xl p-4 relative min-h-[400px]">
                    <span className="absolute top-4 left-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Slide Preview
                    </span>

                    {/* Preview wrapper preserving Aspect Ratio */}
                    <div className="w-full max-w-[340px] aspect-[4/5] bg-white rounded-xl shadow-lg border border-neutral-200/60 overflow-hidden relative select-none">
                      {renderedImages[editingSlideIdx] ? (
                        <img
                          src={renderedImages[editingSlideIdx]}
                          alt="Live Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                          Loading Preview...
                        </div>
                      )}

                      {/* Interactive Shape Placement Preview Mock Overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {activeSlideShapes.map((shape) => {
                          const isText = shape.type === "text";
                          return (
                            <div
                              key={shape.id}
                              style={{
                                position: "absolute",
                                left: `${shape.x}%`,
                                top: `${shape.y}%`,
                                width: isText ? "auto" : `${shape.width * 0.31}px`, // scaled preview factor
                                height: isText ? "auto" : `${shape.height * 0.31}px`,
                                backgroundColor: isText ? "transparent" : shape.color,
                                border: isText ? "none" : "1px solid rgba(255,255,255,0.4)",
                                borderRadius: shape.type === "circle" ? "50%" : "0px",
                                color: isText ? shape.color : "transparent",
                                fontSize: isText ? `${(shape.fontSize || 24) * 0.31}px` : "0px",
                                fontWeight: 800,
                                opacity: 0.8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              {isText ? shape.text : ""}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-4">
                      Aspect Ratio: 1080 × 1350 (4:5)
                    </p>
                  </div>

                  {/* Right Column: Editing Tools */}
                  <div className="w-full md:w-[440px] flex flex-col justify-between gap-6 shrink-0">
                    
                    <div className="space-y-5">
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-0.5">
                          Slide Editor & Diagram Canvas
                        </span>
                        <h3 className="text-lg font-bold text-neutral-900">
                          Customize Slide {editingSlideIdx + 1}
                        </h3>
                      </div>

                      {/* Title & Body Inputs */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Headline</label>
                          <input
                            type="text"
                            value={activeSlide.userTitle}
                            onChange={(e) => handleQuickSlideEdit(baseIdx, "userTitle", e.target.value)}
                            className="w-full bg-white border border-neutral-200 focus:border-blue-400 rounded-xl px-4 py-2 text-sm text-neutral-900 focus:outline-none font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Body copy</label>
                          <textarea
                            rows={3}
                            value={activeSlide.userBody}
                            onChange={(e) => handleQuickSlideEdit(baseIdx, "userBody", e.target.value)}
                            className="w-full bg-white border border-neutral-200 focus:border-blue-400 rounded-xl px-4 py-2 text-sm text-neutral-700 focus:outline-none font-medium leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Visual Assets (Image upload) */}
                      <div className="space-y-2 pt-3 border-t border-neutral-100">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block flex items-center gap-1.5">
                          <ImageIcon className="h-4 w-4 text-blue-500" /> Graphic Image Asset
                        </label>

                        {activeSlide.imageUrl ? (
                          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-8 rounded border border-neutral-200 overflow-hidden shrink-0 bg-white">
                                <img src={activeSlide.imageUrl} alt="preview" className="h-full w-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-neutral-800 truncate">Asset Attached</p>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                                  Layout: {activeSlide.imageLayout || "inline"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(editingSlideIdx)}
                                className="p-1.5 text-neutral-500 hover:text-red-500 bg-white border border-neutral-200 hover:border-red-200 rounded-lg transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleImageLayout(editingSlideIdx)}
                              className="px-2 py-1 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-[10px] font-bold rounded-md transition-all text-center"
                            >
                              Set to {activeSlide.imageLayout === "background" ? "Inline" : "Full Background"}
                            </button>
                          </div>
                        ) : (
                          <div className="relative border-2 border-dashed border-neutral-200 bg-neutral-50 hover:bg-neutral-100/50 hover:border-neutral-300 transition-all rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, editingSlideIdx)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <ImageIcon className="h-5 w-5 text-neutral-400 mb-1" />
                            <span className="text-xs font-bold text-neutral-500">Upload background/inline asset</span>
                          </div>
                        )}
                      </div>

                      {/* DIAGRAM BUILDER TOOLS */}
                      <div className="space-y-3 pt-3 border-t border-neutral-100">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-blue-500" /> Diagram Overlay Shapes
                        </label>
                        
                        {/* Shape creator buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => addShapeToSlide(baseIdx, "rect")}
                            className="px-3 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                          >
                            <SquareIcon className="h-3.5 w-3.5" /> + Rect
                          </button>
                          <button
                            type="button"
                            onClick={() => addShapeToSlide(baseIdx, "circle")}
                            className="px-3 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                          >
                            <CircleIcon className="h-3.5 w-3.5" /> + Circle
                          </button>
                          <button
                            type="button"
                            onClick={() => addShapeToSlide(baseIdx, "text")}
                            className="px-3 py-2 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                          >
                            <TypeIcon className="h-3.5 w-3.5" /> + Text Annotation
                          </button>
                        </div>

                        {/* List of shapes & layout sliders */}
                        {activeSlideShapes.length > 0 && (
                          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 max-h-[220px] overflow-y-auto space-y-4">
                            {activeSlideShapes.map((shape) => (
                              <div key={shape.id} className="border-b border-neutral-200/80 pb-3 last:border-b-0 last:pb-0 space-y-2.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                    {shape.type === "rect" ? "Rectangle" : shape.type === "circle" ? "Circle" : "Text"} Element
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeShapeFromSlide(baseIdx, shape.id)}
                                    className="text-neutral-400 hover:text-red-500 p-0.5 transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                {/* Slider controls for X and Y */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Position X: {shape.x}%</span>
                                    <input
                                      type="range"
                                      min={0}
                                      max={90}
                                      value={shape.x}
                                      onChange={(e) => updateShapeProp(baseIdx, shape.id, "x", parseInt(e.target.value))}
                                      className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Position Y: {shape.y}%</span>
                                    <input
                                      type="range"
                                      min={0}
                                      max={90}
                                      value={shape.y}
                                      onChange={(e) => updateShapeProp(baseIdx, shape.id, "y", parseInt(e.target.value))}
                                      className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                  </div>
                                </div>

                                {/* Sliders for width and height (only for shape blocks) */}
                                {shape.type !== "text" && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Width: {shape.width}px</span>
                                      <input
                                        type="range"
                                        min={30}
                                        max={500}
                                        value={shape.width}
                                        onChange={(e) => updateShapeProp(baseIdx, shape.id, "width", parseInt(e.target.value))}
                                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Height: {shape.height}px</span>
                                      <input
                                        type="range"
                                        min={30}
                                        max={500}
                                        value={shape.height}
                                        onChange={(e) => updateShapeProp(baseIdx, shape.id, "height", parseInt(e.target.value))}
                                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Color pill selection */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Color</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {PRESET_COLORS.map((c) => (
                                      <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => updateShapeProp(baseIdx, shape.id, "color", c.value)}
                                        style={{ backgroundColor: c.value === "#ffffff" ? "#f3f4f6" : c.value }}
                                        className={`w-4.5 h-4.5 rounded-full border transition-all ${
                                          shape.color === c.value
                                            ? "border-neutral-900 ring-1 ring-neutral-400 scale-105"
                                            : "border-neutral-200"
                                        }`}
                                        title={c.label}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {/* Text input and font size (for text type only) */}
                                {shape.type === "text" && (
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2 space-y-1">
                                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Annotation Text</span>
                                      <input
                                        type="text"
                                        value={shape.text || ""}
                                        onChange={(e) => updateShapeProp(baseIdx, shape.id, "text", e.target.value)}
                                        className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1 text-xs text-neutral-900 focus:outline-none"
                                      />
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Size</span>
                                      <input
                                        type="number"
                                        min={12}
                                        max={80}
                                        value={shape.fontSize || 24}
                                        onChange={(e) => updateShapeProp(baseIdx, shape.id, "fontSize", parseInt(e.target.value) || 24)}
                                        className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1 text-xs text-neutral-900 focus:outline-none text-center"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Apply Actions */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => deleteSlide(baseIdx)}
                        className="px-3.5 py-3 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-xl transition-all font-bold text-xs"
                      >
                        Delete Canvas
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setError(null);
                          setIsRendering(true);
                          await handleRender();
                        }}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex-1 text-center cursor-pointer text-sm"
                      >
                        Apply changes & Render Slide
                      </button>
                    </div>

                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}
