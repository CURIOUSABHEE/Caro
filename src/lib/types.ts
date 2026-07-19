import type { TokenizedLine } from "@/lib/tokenize-code";
import type { PaletteOverride } from "@/components/carousel/types";

export const VISUAL_TYPES = [
  "step-chain",
  "venn",
  "wheel",
  "concentric",
  "icon-grid",
  "code-block",
  "text-only",
  "quote",
  "stat",
  "table",
  "flowchart",
  "timeline",
  "before-after",
  "image-grid",
  "architecture",
  "sequence",
  "mini-chart",
] as const;

export type VisualType = (typeof VISUAL_TYPES)[number];

export interface StepChainData {
  steps?: { number: number; label: string; description: string }[];
}

export interface VennData {
  leftLabel?: string;
  rightLabel?: string;
  overlapLabel?: string;
  leftPoints?: string[];
  rightPoints?: string[];
}

export interface WheelData {
  centerLabel?: string;
  spokes?: { label: string; description: string }[];
}

export interface ConcentricData {
  rings?: { ringLabel: string; depth: number }[];
}

export interface IconGridData {
  items?: { icon: string; label: string; description: string }[];
}

export interface QuoteData {
  quote?: string;
  attribution?: string;
  role?: string;
}

export interface StatData {
  number?: string;
  label?: string;
  context?: string;
}

export interface TableData {
  headers?: string[];
  rows?: { label: string; values: string[] }[];
}

export interface CodeBlockData {
  code?: string;
  language?: string;
  highlightLines?: number[];
  tokens?: TokenizedLine[];
}

export interface FlowchartData {
  nodes?: { label: string; shape: "start" | "process" | "decision" | "end" }[];
}

export interface TimelineData {
  events?: { date: string; title: string; description?: string }[];
}

export interface BeforeAfterData {
  beforeTitle?: string;
  afterTitle?: string;
  beforeItems?: string[];
  afterItems?: string[];
}

export interface ImageGridData {
  items?: { label: string; description?: string }[];
}

export interface ArchitectureData {
  layers?: { label: string; items: string[] }[];
}

export interface SequenceData {
  participants?: string[];
  steps?: { from: number; to: number; label: string }[];
}

export interface MiniChartData {
  title?: string;
  bars?: { label: string; value: number; displayValue?: string }[];
}

// Discriminant union for VisualData
export type VisualData =
  | { visualType: "step-chain"; visualData: StepChainData }
  | { visualType: "venn"; visualData: VennData }
  | { visualType: "wheel"; visualData: WheelData }
  | { visualType: "concentric"; visualData: ConcentricData }
  | { visualType: "icon-grid"; visualData: IconGridData }
  | { visualType: "quote"; visualData: QuoteData }
  | { visualType: "stat"; visualData: StatData }
  | { visualType: "table"; visualData: TableData }
  | { visualType: "code-block"; visualData: CodeBlockData }
  | { visualType: "flowchart"; visualData: FlowchartData }
  | { visualType: "timeline"; visualData: TimelineData }
  | { visualType: "before-after"; visualData: BeforeAfterData }
  | { visualType: "image-grid"; visualData: ImageGridData }
  | { visualType: "architecture"; visualData: ArchitectureData }
  | { visualType: "sequence"; visualData: SequenceData }
  | { visualType: "mini-chart"; visualData: MiniChartData }
  | { visualType: "text-only" | "cover" | "closing"; visualData?: Record<string, unknown> };

export type Slide = {
  type: "COVER" | "CONTENT" | "CLOSING";
  title: string;
  body: string;
  order: number;
  themeName?: string;
  username?: string;
  scribble?: boolean;
  imageUrl?: string | null;
  imageLayout?: "background" | "inline";
  shapes?: any[];
  paletteOverride?: PaletteOverride;
} & (
  | { visualType: "step-chain"; visualData: StepChainData }
  | { visualType: "venn"; visualData: VennData }
  | { visualType: "wheel"; visualData: WheelData }
  | { visualType: "concentric"; visualData: ConcentricData }
  | { visualType: "icon-grid"; visualData: IconGridData }
  | { visualType: "quote"; visualData: QuoteData }
  | { visualType: "stat"; visualData: StatData }
  | { visualType: "table"; visualData: TableData }
  | { visualType: "code-block"; visualData: CodeBlockData }
  | { visualType: "flowchart"; visualData: FlowchartData }
  | { visualType: "timeline"; visualData: TimelineData }
  | { visualType: "before-after"; visualData: BeforeAfterData }
  | { visualType: "image-grid"; visualData: ImageGridData }
  | { visualType: "architecture"; visualData: ArchitectureData }
  | { visualType: "sequence"; visualData: SequenceData }
  | { visualType: "mini-chart"; visualData: MiniChartData }
  | { visualType: "text-only" | "cover" | "closing"; visualData?: Record<string, unknown> }
);

export interface ThemeColors {
  text: string;
  accent: string;
  muted: string;
  glassBg?: string;
  glassBorder?: string;
  background?: string;
  iconBorderRadius?: string;
  cardBorderRadius?: string;
  accentBg?: string;
  diagramStyle?: string;
  cardShadow?: string;
}
