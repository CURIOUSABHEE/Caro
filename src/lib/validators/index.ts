import { z } from "zod";

// Step 1: Extract URL validator
export const ExtractSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

// Step 2: Slide Plan validator
export const PlanSlidesSchema = z.object({
  text: z.string().min(50, "Content is too short to generate a slide deck"),
  tone: z.string().default("professional"),
  focus: z.string().optional(),
  slideCount: z.union([z.number().min(3).max(15), z.literal("auto")]).default("auto"),
});

// Step 2.5: Regenerate Block validator
export const RegenerateBlockSchema = z.object({
  block: z.object({
    id: z.string().optional(),
    type: z.enum(["COVER", "CONTENT", "CLOSING"]),
    title: z.string(),
    body: z.string(),
    order: z.number(),
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
  visualType: z.enum(["step-chain", "venn", "wheel", "concentric", "icon-grid", "code-block", "text-only", "quote", "stat", "table"]),
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
  visualType: z.enum(["step-chain", "venn", "wheel", "concentric", "icon-grid", "code-block", "text-only", "quote", "stat", "table"]).default("text-only").optional(),
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
});

// Step 4.5: Export Zip validator
export const ExportZipSchema = z.object({
  images: z.array(z.object({
    fileName: z.string(),
    dataUri: z.string(), // Base64 Data URI from rendering
  })).min(1, "At least one slide image is required to export"),
});
