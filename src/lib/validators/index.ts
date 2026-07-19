import { z } from "zod";
import { VISUAL_TYPES } from "@/lib/types";

const VisualTypeEnum = z.enum(VISUAL_TYPES);

// Step 1: Extract URL validator
export const ExtractSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

// Step 2: Slide Plan validator (now with Content Intelligence parameters and Outline steering)
export const PlanSlidesSchema = z.object({
  url: z.string().url().optional(),
  text: z.string().min(50, "Content is too short to generate a slide deck"),
  tone: z.enum(["educational", "punchy", "contrarian", "story-driven", "professional"]).default("professional"),
  focus: z.string().optional(),
  slideCount: z.union([z.number().min(3).max(15), z.literal("auto")]).default("auto"),
  targetPlatform: z.enum(["linkedin", "instagram", "twitter", "pitch-deck"]).default("linkedin"),
  audience: z.enum(["founders", "engineers", "marketers", "beginners", "executives"]).default("founders"),
  goal: z.enum(["teach", "sell", "summarize", "announce", "persuade"]).default("teach"),
  ctaStyle: z.enum(["soft", "direct", "newsletter", "product", "no-cta"]).default("soft"),
  selectedOutline: z.object({
    title: z.string(),
    description: z.string(),
    slides: z.array(z.object({
      title: z.string(),
      type: z.enum(["COVER", "CONTENT", "CLOSING"]),
      visualType: VisualTypeEnum,
    })),
  }).optional(),
});

// Step 2.1: Outline generation validator
export const GenerateOutlinesSchema = z.object({
  url: z.string().url().optional(),
  text: z.string().min(50, "Content is too short to generate a slide deck"),
  tone: z.enum(["educational", "punchy", "contrarian", "story-driven", "professional"]).default("professional"),
  focus: z.string().optional(),
  slideCount: z.union([z.number().min(3).max(15), z.literal("auto")]).default("auto"),
  targetPlatform: z.enum(["linkedin", "instagram", "twitter", "pitch-deck"]).default("linkedin"),
  audience: z.enum(["founders", "engineers", "marketers", "beginners", "executives"]).default("founders"),
  goal: z.enum(["teach", "sell", "summarize", "announce", "persuade"]).default("teach"),
  ctaStyle: z.enum(["soft", "direct", "newsletter", "product", "no-cta"]).default("soft"),
});

// Step 2.2: Alternate Hooks / CTAs validator
export const RegenerateAlternativesSchema = z.object({
  slideType: z.enum(["COVER", "CLOSING"]),
  originalText: z.string().optional(),
  currentTitle: z.string().optional(),
  currentBody: z.string().optional(),
  tone: z.enum(["educational", "punchy", "contrarian", "story-driven", "professional"]).default("professional"),
  audience: z.enum(["founders", "engineers", "marketers", "beginners", "executives"]).default("founders"),
  goal: z.enum(["teach", "sell", "summarize", "announce", "persuade"]).default("teach"),
});

// Step 2.5: Regenerate Block validator
export const RegenerateBlockSchema = z.object({
  block: z.object({
    id: z.string().optional(),
    type: z.enum(["COVER", "CONTENT", "CLOSING"]),
    title: z.string(),
    body: z.string(),
    order: z.number(),
    visualType: VisualTypeEnum.optional(),
    visualData: z.any().optional(),
  }),
  instruction: z.string().optional().default(""),
  originalText: z.string().optional(), // optionally provide context
});

export const ShapeSchema = z.object({
  id: z.string(),
  type: z.enum(["rect", "circle", "text"]),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string(),
  text: z.string().optional(),
  fontSize: z.number().optional(),
});

// Step 3.5: Fill Visual Data validator
export const FillVisualDataSchema = z.object({
  visualType: VisualTypeEnum,
  title: z.string(),
  body: z.string(),
});

// Step 4: Render Slide validator
export const PaletteOverrideSchema = z.object({
  background: z.string().optional(),
  text: z.string().optional(),
  primary: z.string().optional(),
  secondary: z.string().optional(),
  tertiary: z.string().optional(),
}).optional();

export const RenderSlideSchema = z.object({
  type: z.enum(["COVER", "CONTENT", "CLOSING"]),
  title: z.string(),
  body: z.string(),
  order: z.number().optional(),
  themeName: z.string().default("monochrome"),
  username: z.string().default(""),
  imageUrl: z.string().nullable().optional(),
  imageLayout: z.enum(["background", "inline"]).default("inline").optional(),
  shapes: z.array(ShapeSchema).optional(),
  visualType: VisualTypeEnum.default("text-only").optional(),
  visualData: z.any().optional(),
  scribble: z.boolean().optional().default(false),
  paletteOverride: PaletteOverrideSchema.nullable().optional(),
});

export const RenderProjectSchema = z.object({
  slides: z.array(RenderSlideSchema),
  themeName: z.string().default("monochrome"),
  username: z.string().default(""),
  websiteUrl: z.string().default(""),
  scribble: z.boolean().optional().default(false),
  backgroundOnly: z.boolean().optional().default(false),
  // Theme Variations & Brand Kit settings
  fontPairing: z.string().optional(),
  layoutDensity: z.enum(["compact", "comfortable", "minimal"]).default("comfortable").optional(),
  logoUrl: z.string().optional(),
  noImages: z.boolean().optional(),
  accentColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  scale: z.number().min(1).max(4).default(1),
});

// Step 4.5: Export Zip validator
export const ExportZipSchema = z.object({
  images: z.array(z.object({
    fileName: z.string(),
    dataUri: z.string(), // Base64 Data URI from rendering
  })).min(1, "At least one slide image is required to export"),
});
