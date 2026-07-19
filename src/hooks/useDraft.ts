"use client";

import { useState, useEffect, useCallback } from "react";
import type { Slide, ThemeName } from "@/app/page-data";

const DRAFT_KEY = "caro_draft_project";

export interface DraftState {
  url: string;
  preferences: { tone: string; focus: string; slideCount: number | "auto" };
  slides: Slide[];
  themeName: ThemeName;
  username: string;
  websiteUrl: string;
  scribble: boolean;
  extractedData: { title: string; content: string } | null;
  maxUnlockedStep: number;
  paletteOverride: Record<string, string> | null;
  targetPlatform: "linkedin" | "instagram" | "twitter" | "pitch-deck";
  audience: "founders" | "engineers" | "marketers" | "beginners" | "executives";
  goal: "teach" | "sell" | "summarize" | "announce" | "persuade";
  ctaStyle: "soft" | "direct" | "newsletter" | "product" | "no-cta";
  outlines: { id: string; title: string; description: string; slides: { title: string; type: "COVER" | "CONTENT" | "CLOSING"; visualType: string }[] }[];
  selectedOutlineId: string;
  customFontPairing: string;
  customLayoutDensity: "compact" | "comfortable" | "minimal";
  customLogoUrl: string;
  noImages: boolean;
  customAccentColor: string;
  customSecondaryColor: string;
  customBgColor: string;
  customTextColor: string;
}

export function useDraft() {
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft from localStorage on mount
  const loadDraft = useCallback((): Partial<DraftState> => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      setDraftLoaded(true);
      return parsed;
    } catch (e) {
      console.warn("Failed to restore draft from localStorage", e);
      return {};
    }
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback((state: DraftState) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[Draft] Failed to save draft to localStorage:", msg);
    }
  }, []);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { loadDraft, saveDraft, clearDraft, draftLoaded };
}
