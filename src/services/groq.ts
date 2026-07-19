import Groq from "groq-sdk";

import type { Slide, VisualData, VisualType } from "@/lib/types";

export type SlideBlock = Slide;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY is not configured. Please add your Groq API Key to the .env file.");
  }
  return new Groq({ apiKey });
}

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

type GroqCreateParams = Omit<Parameters<Groq["chat"]["completions"]["create"]>[0], "model"> & { model?: string };

async function groqCompletionWithRetry(
  params: GroqCreateParams,
  maxAttempts = 3,
): Promise<{ choices: { message: { content: string | null } }[] }> {
  const groq = getGroqClient();
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await groq.chat.completions.create({ ...params, model: GROQ_MODEL } as Parameters<Groq["chat"]["completions"]["create"]>[0]);
      if ("choices" in result) return result as { choices: { message: { content: string | null } }[] };
      throw new Error("Unexpected streaming response");
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[GroqService] Attempt ${attempt + 1}/${maxAttempts} failed: ${msg}`);
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

// --- JSON recovery helpers for LLM output ---

// Strip unescaped control chars (newlines, tabs) inside JSON string values
function sanitizeJsonString(raw: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\") { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString) {
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
    }
    result += ch;
  }
  return result;
}

// Remove trailing commas before ] or } (common LLM artifact)
function removeTrailingCommas(s: string): string {
  return s.replace(/,(\s*[\]}])/g, "$1");
}

// Type guard for objects
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Parse LLM JSON output with multiple recovery strategies
function tryParseJson(raw: string): unknown {
  const s = sanitizeJsonString(raw);
  // Attempt 0: extract JSON from markdown code block fences first
  const codeBlockMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = codeBlockMatch ? codeBlockMatch[1].trim() : s;
  // Attempt 1: direct parse
  try { return JSON.parse(candidate); } catch {}
  // Attempt 2: strip trailing commas
  try { return JSON.parse(removeTrailingCommas(candidate)); } catch {}
  // Attempt 3: extract outermost balanced braces
  let depth = 0;
  let start = -1;
  for (let i = 0; i < candidate.length; i++) {
    if (candidate[i] === "{") {
      if (start === -1) start = i;
      depth++;
    } else if (candidate[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        const braceCandidate = candidate.slice(start, i + 1);
        try { return JSON.parse(braceCandidate); } catch {}
        break;
      }
    }
  }

  // Attempt 4: Truncated JSON recovery (if token limit was hit)
  let str = candidate;
  while (str.length > 0) {
    const lastBrace = str.lastIndexOf('}');
    if (lastBrace === -1) break;
    const testCandidate = str.substring(0, lastBrace + 1) + "]}";
    try { 
      const parsed = JSON.parse(testCandidate);
      if (parsed && (Array.isArray(parsed.slides) || Array.isArray(parsed.outlines))) return parsed;
    } catch {}
    str = str.substring(0, lastBrace);
  }

  throw new Error(`No valid JSON found in response. Raw response (first 500 chars): ${raw.slice(0, 500)}`);
}

// Rough token counter (English: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Truncate text to stay within a token budget, preserving the start
function compressText(text: string, maxTokens: number): string {
  if (maxTokens <= 0) return text.slice(0, 2000) + "\n\n[...content truncated...]";
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return text;

  const maxChars = maxTokens * 4;
  return text.slice(0, maxChars) + "\n\n[...content truncated...]";
}

function logGroqBudget(
  label: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
) {
  const systemTokens = estimateTokens(systemPrompt);
  const userTokens = estimateTokens(userPrompt);
  console.info(
    `[GroqBudget] ${label}: system~${systemTokens}, user~${userTokens}, max_output=${maxTokens}, requested~${systemTokens + userTokens + maxTokens}`
  );
}

export async function planSlides(
  articleText: string,
  tone: string = "professional",
  focus?: string,
  slideCount: number | "auto" = "auto",
  targetPlatform: string = "linkedin",
  audience: string = "founders",
  goal: string = "teach",
  ctaStyle: string = "soft",
  selectedOutline?: {
    title: string;
    description: string;
    slides: { title: string; type: "COVER" | "CONTENT" | "CLOSING"; visualType: VisualType }[];
  }
): Promise<SlideBlock[]> {
  const countInstruction = selectedOutline
    ? `Flesh out the slides in the selected outline:
Title: ${selectedOutline.title}
Description: ${selectedOutline.description}
Slides: ${JSON.stringify(selectedOutline.slides)}

Generate EXACTLY the same number of slides (${selectedOutline.slides.length}), in the same order. Use the exact titles and types, and for each slide, generate its detailed body copy (exactly 2-3 bullet points for CONTENT slides) and visualData (if diagram or code block) matching the outline. Do NOT change visualType. Keep order corresponding directly to the outline indices.`
    : (slideCount === "auto"
      ? "Determine the appropriate number of slides based on the length, depth, and key arguments of the text. Use as many slides as necessary to properly explain the information in digestible chunks, up to a MAXIMUM of 15 slides."
      : `Generate exactly ${slideCount} slides in total, including 1 COVER slide at the beginning, followed by content slides, and ending with exactly 1 CLOSING slide.`);

  const systemPrompt = `You transform articles into highly modular educational slide carousels.

${countInstruction}

RULES:
- MODULARIZE CONTENT: Break down complex ideas into multiple slides rather than cramming too much information onto a single slide. Ensure proper utilization of slide real estate so users can learn and understand in manageable chunks.
- Extract key points, practical lessons, and high-value details. Every slide must deliver rich, descriptive context but remain focused on a single core idea.
- COVER: first slide, text-only, short striking title.
- CLOSING: final slide, text-only, call-to-action.
- CONTENT: choose the best visualType for the idea:

  "text-only" — purely narrative. Body: exactly 3-4 bullet points (•) ordered by importance.
  "code-block" — code display WITH optional explanation. visualData: {code, language}. Body: 1-2 bullet points explaining the code, when to use it, or key takeaways. The body text renders below the code block.
  "step-chain" — sequences/workflows. visualData: {"steps": [{"number":1,"label":"","description":""}]} (3-4 steps).
  "venn" — comparisons/overlap. visualData: {"leftLabel":"","rightLabel":"","overlapLabel":"","leftPoints":[""],"rightPoints":[""]}.
  "wheel" — categories around a core. visualData: {"centerLabel":"","spokes":[{"label":"","description":""}]} (3-4 spokes).
  "concentric" — hierarchy/layers. visualData: {"rings":[{"ringLabel":"","depth":1},{"ringLabel":"","depth":2},{"ringLabel":"","depth":3}]}.
  "icon-grid" — highlights/takeaways. visualData: {"items":[{"icon":"briefcase|lightbulb|star|settings|shield|alert|code|chart|user","label":"","description":""}]} (4-6 items).
  "quote" — testimonial/key insight. visualData: {"quote":"","attribution":"","role":""}.
  "stat" — striking statistic. visualData: {"number":"80%","label":"","context":""}.
  "table" — side-by-side comparison. visualData: {"headers":["","A","B"],"rows":[{"label":"C1","values":["",""]}]} (3-5 rows, 2-4 cols).
  "flowchart" — branching logic, if/else paths, algorithm steps. visualData: {"nodes":[{"label":"","shape":"start|process|decision|end"}]} (3-5 nodes in flow order).
  "timeline" — chronological events, roadmaps, history. visualData: {"events":[{"date":"2020","title":"","description":""}]} (3-5 events).
  "before-after" — transformation, refactor, improvement. visualData: {"beforeTitle":"Before","afterTitle":"After","beforeItems":[""],"afterItems":[""]} (3-4 items each side).
  "image-grid" — visual concepts, UI panels, screenshot descriptions. visualData: {"items":[{"label":"","description":""}]} (2-4 items).
  "architecture" — system design, component layers. visualData: {"layers":[{"label":"Frontend","items":["React","CDN"]}]} (2-4 layers, 2-3 items each).
  "sequence" — API/interaction flows. visualData: {"participants":["Client","API","DB"],"steps":[{"from":0,"to":1,"label":"POST /login"}]} (2-4 participants, 3-6 steps).
  "mini-chart" — data trends, benchmarks. visualData: {"title":"Performance","bars":[{"label":"Before","value":40,"displayValue":"40ms"}]} (3-5 bars, value 0-100 scale).

- VISUAL RHYTHM: Never use more than 2 consecutive "text-only" CONTENT slides. At least 50% of CONTENT slides MUST use a visual type (diagram, code-block, stat, quote, timeline, flowchart, before-after, image-grid, etc.).
- SHOW, DON'T TELL: Match content to visuals — processes/algorithms → flowchart or step-chain; history/roadmap → timeline; transformation/refactor → before-after; UI/screens/concepts → image-grid; code → code-block; metrics → stat or mini-chart; system design → architecture; API flows → sequence; comparisons → table or venn.
- Diagram slides (non-text-only): body MUST have exactly 2-3 bullet points (max 60 words), explaining context. Do NOT repeat diagram labels.
- Wrap 1-2 high-impact words in title with asterisks for italic emphasis (e.g. "Optimize your *code* structure").

- Platform optimization: The target platform is "${targetPlatform}".
  * linkedin: Write highly professional, educational, thought-leadership style copy.
  * instagram: Write short, visually scannable copy, focus on key takeaways and punchy summaries.
  * twitter: casual/conversational, short sentences, high punchiness, maximum clarity in very few words.
  * pitch-deck: strategic and clean, focusing on outcomes, value, metrics, and structured layouts.

- Target Audience: "${audience}".
  * founders: focus on leverage, scale, growth, business value, speed, cost efficiency.
  * engineers: technical details, mechanics, logic, architecture, no fluff, accurate terminology.
  * marketers: copywriting, psychological triggers, metrics, hooks, conversion, audience engagement.
  * beginners: clean explanations, analogies, absolute simplicity, zero advanced jargon.
  * executives: strategic alignment, macro trends, ROI, risk mitigation, high-level impact.

- Content Goal: "${goal}".
  * teach: educational explanations, tutorials, definitions, teaching concepts.
  * sell: highlight problem, show value of solution, address friction, soft close.
  * summarize: condense main takeaways into quick reference points.
  * announce: hype-driven, launch feel, exciting updates, bold styling.
  * persuade: logic-driven arguments, contrarian debate, proving a viewpoint.

- CTA Style: "${ctaStyle}".
  * soft: Warm question or open conversation starter (e.g. "What are your thoughts on this?").
  * direct: Direct action prompt (e.g. "Save this for later" or "Follow for more").
  * newsletter: Lead generation prompt (e.g. "Join our newsletter at our website").
  * product: Product trial prompt (e.g. "Try the tool to build this yourself").
  * no-cta: Do NOT include any CTA text or prompt in the closing slide body.

OUTPUT JSON:
{"slides":[{"type":"COVER"|"CONTENT"|"CLOSING","title":"headline (*word*)","body":"• bullet points","order":0,"visualType":"text-only"|"step-chain"|"venn"|"wheel"|"concentric"|"icon-grid"|"code-block"|"quote"|"stat"|"table"|"flowchart"|"timeline"|"before-after"|"image-grid"|"architecture"|"sequence"|"mini-chart","visualData":{}}]}

Tone: "${tone}".
${focus ? `\n⚠️ USER INSTRUCTION (highest priority — you MUST follow this):\n${focus}\n` : ""}
Use only standard ASCII characters in JSON values.`;

  // --- Preprocessing: detect code markers and extract code snippets from article ---
  const codePatterns = [
    /```[\s\S]*?```/g,               // triple backtick fenced blocks
    /(?:\r?\n)(?: {4}|\t)/,          // indented code lines
    /\b(npm|yarn|pnpm|docker|kubectl|git|pip|conda|brew|apt|yum|choco|scoop|curl|wget|ssh|sudo|npx|node|python|go run|cargo|dotnet|composer)\s+/i,  // common CLI commands
    /`[^`\n]{3,}`/g,                 // longer inline code
    /(?:function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|def\s+\w+|import\s+|export\s+|class\s+\w+|FROM\s+\w+|RUN\s+|CMD\s+|SELECT\s+|INSERT\s+|UPDATE\s+|CREATE\s+TABLE)/g,  // code keywords
  ];
  const hasCode = codePatterns.some(p => p.test(articleText));

  // Extract actual fenced code blocks so the LLM can use them directly
  const fencedCodeBlocks = [...articleText.matchAll(/```(\w*)\n([\s\S]*?)```/g)]
    .map((m) => ({ lang: m[1] || "plaintext", code: m[2].trim() }))
    .filter((b) => b.code.length > 5);

  let codeHint = "";
  if (hasCode) {
    if (fencedCodeBlocks.length > 0) {
      const codeListing = fencedCodeBlocks
        .map((b, i) => `  Snippet ${i + 1} (${b.lang}):\n${b.code}`)
        .join("\n\n");
      codeHint = `\n\n⚠️ CRITICAL RULE — CODE SLIDES:\nThe article contains ${fencedCodeBlocks.length} code snippet(s). You MUST create a SEPARATE "code-block" slide for EACH code snippet above. Rules:\n1. Each code-block slide: title = short name of the snippet, body = 1-2 bullet explaining what it does or when to use it.\n2. Put the EXACT code (from the snippets listed below) into visualData.code. Put the language into visualData.language.\n3. Do NOT merge multiple snippets into one slide. Do NOT put code in the body text.\n4. Code-block slides should be interleaved with text-only explanation slides for pacing.\n\nHere are the code snippets to use (copy them exactly into visualData.code):\n${codeListing}`;
    } else {
      codeHint = `\n\n⚠️ IMPORTANT: The article contains code examples. For every distinct code example, create a separate "code-block" slide. Put code in visualData.code and language in visualData.language. NEVER put code in the body text. Create one code-block slide per code example — do not merge them.`;
    }
  }
  // --- End preprocessing ---

  // Compress article text to fit within model token limit (~8000 TPM)
  const MAX_TOTAL_TOKENS = 8000;
  const MAX_OUTPUT_TOKENS = 4096;
  const systemTokens = estimateTokens(systemPrompt) + 50; // prompt framing overhead
  const maxArticleTokens = MAX_TOTAL_TOKENS - MAX_OUTPUT_TOKENS - systemTokens - 200; // 200 safety buffer
  const compressedArticle = compressText(articleText, Math.max(maxArticleTokens, 500));

  try {
    const chatCompletion = await groqCompletionWithRetry({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the blog article content:\n\n${compressedArticle}${codeHint}` },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API.");
    }

    const parsed = tryParseJson(content);

    if (!isRecord(parsed) || !Array.isArray(parsed.slides)) {
      throw new Error("Invalid response format: 'slides' array not found in JSON response.");
    }

    return parsed.slides.map((sRaw: unknown, idx: number) => {
      if (!isRecord(sRaw)) throw new Error(`Invalid slide format at index ${idx}`);
      const s = sRaw as Record<string, unknown>;
      const vType = s.type === "COVER" || s.type === "CLOSING" ? "text-only" : (s.visualType || "text-only");
      let vData = s.visualData || {};
      if (vType === "code-block") {
        if (isRecord(vData) && Array.isArray(vData.highlightLines) && vData.highlightLines.length > 3) {
          vData = { ...vData, highlightLines: vData.highlightLines.slice(0, 3) };
        }
      }
      return {
        type: s.type === "COVER" || s.type === "CLOSING" ? s.type : "CONTENT",
        title: typeof s.title === "string" ? s.title : "Untitled Slide",
        body: typeof s.body === "string" ? s.body : "",
        order: typeof s.order === "number" ? s.order : idx,
        visualType: vType as VisualType,
        visualData: vData as VisualData,
      } as SlideBlock;
    });
  } catch (error: unknown) {
    console.error("[GroqService] Failed to plan slides:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate slide plan using Groq.");
  }
}

export async function generateOutlines(
  articleText: string,
  tone: string = "professional",
  focus?: string,
  slideCount: number | "auto" = "auto",
  targetPlatform: string = "linkedin",
  audience: string = "founders",
  goal: string = "teach",
  ctaStyle: string = "soft"
): Promise<{
  outlines: {
    id: string;
    title: string;
    description: string;
    slides: { title: string; type: "COVER" | "CONTENT" | "CLOSING"; visualType: VisualType }[];
  }[];
}> {
  const countInstruction =
    slideCount === "auto"
      ? "Create outlines containing a suitable number of slides (between 5 and 12 slides) depending on the article's depth."
      : `Create outlines with EXACTLY ${slideCount} slides (including 1 COVER slide at the start, followed by content slides, and ending with exactly 1 CLOSING slide).`;

  const systemPrompt = `You are a social media content strategist and copywriter.
Analyze the article text and create exactly 3 alternate carousel outline angles.
Each outline must be custom-tailored to the target platform, target audience, tone, and goals.

Platform: ${targetPlatform}
Audience: ${audience}
Tone: ${tone}
Goal: ${goal}
CTA Style: ${ctaStyle}
${countInstruction}

Angles to generate:
1. "Educational Blueprint": Structured, logical breakdown, step-by-step or educational guide.
2. "Contrarian Hot-Take": Focused on the counter-intuitive arguments, bold metrics, or strong opinions.
3. "Story-Driven Journey": Focused on narrative structure, problem-to-solution, or case study.

For each outline, generate:
- "title": A punchy name for this angle.
- "description": A short explanation of why this angle works for the audience.
- "slides": An array of slides. Each slide contains:
  - "title": Short headline (5-8 words).
  - "type": "COVER" | "CONTENT" | "CLOSING".
  - "visualType": The layout or diagram type. Choose from:
    "text-only" (narrative bullet points)
    "code-block" (programming or terminal command snippets)
    "step-chain" (ordered processes)
    "venn" (overlaps or comparisons)
    "wheel" (surrounding core categories)
    "concentric" (hierarchical layers)
    "icon-grid" (takeaways or grid highlights)
    "quote" (testimonial or key quote)
    "stat" (big metrics or stats)
    "table" (matrix/comparisons)
    "flowchart" (branching logic, if/else, algorithms)
    "timeline" (chronological events, roadmaps)
    "before-after" (transformation, refactor results)
    "image-grid" (visual concepts, UI panels)
    "architecture" (system layers, component design)
    "sequence" (API calls, request/response flows)
    "mini-chart" (bar charts, metrics, benchmarks)

  Use visual variety — never more than 2 consecutive text-only CONTENT slides. Prefer showing over telling.

OUTPUT JSON FORMAT:
{
  "outlines": [
    {
      "id": "1",
      "title": "...",
      "description": "...",
      "slides": [
        { "title": "...", "type": "COVER" | "CONTENT" | "CLOSING", "visualType": "text-only" }
      ]
    }
  ]
}
Use only standard ASCII characters in JSON values. Do not write any other explanation or wrapper code. Just output valid JSON.`;

  const MAX_TOTAL_TOKENS = 8000;
  const MAX_OUTPUT_TOKENS = 4096;
  const systemTokens = estimateTokens(systemPrompt) + 50;
  const maxArticleTokens = MAX_TOTAL_TOKENS - MAX_OUTPUT_TOKENS - systemTokens - 200;
  const compressedArticle = compressText(articleText, Math.max(maxArticleTokens, 500));

  try {
    const chatCompletion = await groqCompletionWithRetry({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the blog article content:\n\n${compressedArticle}` },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API during outline generation.");
    }

    const parsed = tryParseJson(content);
    if (!isRecord(parsed) || !Array.isArray(parsed.outlines)) {
      throw new Error("Invalid outlines format returned by LLM.");
    }

    return parsed as any;
  } catch (error: any) {
    console.error("[GroqService] Failed to generate outlines:", error);
    throw new Error(error.message || "Failed to generate outlines.");
  }
}

export async function generateAlternatives(
  slideType: "COVER" | "CLOSING",
  originalText?: string,
  tone: string = "professional",
  audience: string = "founders",
  goal: string = "teach",
  currentTitle?: string,
  currentBody?: string
): Promise<{
  alternatives: { title: string; body: string }[];
}> {
  const typeDesc = slideType === "COVER"
    ? "Generate 3 alternative HOOK titles and subtitles for the COVER slide. Cover titles must be extremely catchy, scroll-stopping, and short (5-8 words). The body/subtitle should be a one-sentence payoff."
    : "Generate 3 alternative CALL-TO-ACTION (CTA) titles and button texts for the CLOSING slide. Closing titles should drive outcomes. The body should be the CTA button text.";

  const systemPrompt = `You are a social media copywriter.
Analyze the target preferences and suggest 3 alternative options for the ${slideType} slide.

Slide Type: ${slideType}
Audience: ${audience}
Tone: ${tone}
Goal: ${goal}
Current Title: ${currentTitle || ""}
Current Body/CTA: ${currentBody || ""}

${typeDesc}
For COVER slide: wrap 1 or 2 high-impact words in title with asterisks for italic emphasis (e.g. "Optimize your *code*").

OUTPUT JSON FORMAT:
{
  "alternatives": [
    { "title": "Headline", "body": "Subtitle or button text" }
  ]
}
Do not write any explanation. Return only valid JSON.`;

  try {
    const chatCompletion = await groqCompletionWithRetry({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Context from article:\n${originalText?.substring(0, 2000) || ""}` },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq API during alternatives generation.");

    const parsed = tryParseJson(content);
    if (!isRecord(parsed) || !Array.isArray(parsed.alternatives)) {
      throw new Error("Invalid alternatives format.");
    }

    return parsed as any;
  } catch (error: any) {
    console.error("[GroqService] Failed to generate alternatives:", error);
    throw new Error(error.message || "Failed to generate alternatives.");
  }
}

export async function regenerateBlock(
  block: { type: "COVER" | "CONTENT" | "CLOSING"; title: string; body: string; order: number; visualType?: string; visualData?: Record<string, unknown> },
  instruction: string,
  originalText?: string
): Promise<Omit<SlideBlock, "order">> {
  const systemPrompt = `You are a social media copywriter and editor. A user wants to edit a single slide block in a social media carousel.
Modify the slide's title and body according to their instruction, making it descriptive and high-value.

Original block content:
Type: ${block.type}
Title: ${block.title}
Body: ${block.body}

User instruction: "${instruction}"
${originalText ? `Context from the source article:\n${originalText.substring(0, 1000)}...` : ""}

CRITICAL RULES:
1. Keep the title short and punchy (max 5-8 words).
2. Keep the body text descriptive and informative (max 45-60 words), explaining the "how" or "why".
3. Do not change the slide type.
4. Wrap exactly 1 or 2 high-impact focus words with asterisks (e.g. "*Docker* rules") for visual serif emphasis.
5. You MUST return your response as a valid JSON object matching the schema:
{
  "type": "COVER" | "CONTENT" | "CLOSING",
  "title": "...",
  "body": "..."
}`;

  try {
    const chatCompletion = await groqCompletionWithRetry({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please regenerate this block based on the instructions." },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API during block regeneration.");
    }

    const parsed = tryParseJson(content);
    
    if (!isRecord(parsed)) throw new Error("Invalid response format.");

    return {
      type: parsed.type === "COVER" || parsed.type === "CLOSING" ? parsed.type : "CONTENT",
      title: typeof parsed.title === "string" ? parsed.title : block.title,
      body: typeof parsed.body === "string" ? parsed.body : block.body,
      visualType: block.visualType,
      visualData: block.visualData,
    } as Omit<SlideBlock, "order">;
  } catch (error: unknown) {
    console.error("[GroqService] Failed to regenerate block:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to regenerate block using Groq.");
  }
}

export async function fillVisualData(
  visualType: VisualType,
  title: string,
  body: string
): Promise<VisualData | Record<string, unknown>> {
  if (visualType === "text-only" || visualType === "code-block") {
    return {};
  }

  let schemaDescription = "";
  if (visualType === "step-chain") {
    schemaDescription = `JSON object matching: {"steps": [{"number": 1, "label": "Short Step Label (2-4 words)", "description": "Short explanation (8-15 words)"}]} (generate exactly 3-4 steps)`;
  } else if (visualType === "venn") {
    schemaDescription = `JSON Object matching: {"leftLabel": "Concept A (1-3 words)", "rightLabel": "Concept B (1-3 words)", "overlapLabel": "Shared overlap (1-3 words)", "leftPoints": ["unique trait 1 (≤8 words)", "unique trait 2 (≤8 words)"], "rightPoints": ["unique trait 1 (≤8 words)", "unique trait 2 (≤8 words)"]}`;
  } else if (visualType === "wheel") {
    schemaDescription = `JSON Object matching: {"centerLabel": "Core Topic Label", "spokes": [{"label": "Spoke 1 Label", "description": "one-line explanation (≤10 words)"}, {"label": "Spoke 2 Label", "description": "one-line explanation"}, {"label": "Spoke 3 Label", "description": "one-line explanation"}, {"label": "Spoke 4 Label", "description": "one-line explanation"}]}`;
  } else if (visualType === "concentric") {
    schemaDescription = `JSON Object matching: {"rings": [{"ringLabel": "Core Layer Label", "depth": 1}, {"ringLabel": "Middle Layer Label", "depth": 2}, {"ringLabel": "Outer Layer Label", "depth": 3}]} ordered from inner (depth 1) to outer (depth 3)`;
  } else if (visualType === "icon-grid") {
    schemaDescription = `JSON Object matching: {"items": [{"icon": "Single letter or number (e.g. A, 1, $, #)", "label": "Short label (2-5 words)", "description": "One sentence ≤12 words explaining why it matters"}]} (generate 4-6 items)`;
  } else if (visualType === "quote") {
    schemaDescription = `JSON Object matching: {"quote": "The quoted text (1-2 sentences)", "attribution": "Name of the person being quoted", "role": "Their title or context (optional)"}`;
  } else if (visualType === "stat") {
    schemaDescription = `JSON Object matching: {"number": "The big statistic number (e.g. 80%, 2.5M, #1)", "label": "Short label describing what the number refers to (2-5 words)", "context": "Optional one-line context or source"}`;
  } else if (visualType === "table") {
    schemaDescription = `JSON Object matching: {"headers": ["", "Option A", "Option B"], "rows": [{"label": "Criteria 1", "values": ["Value A1", "Value B1"]}, {"label": "Criteria 2", "values": ["Value A2", "Value B2"]}]} (3-5 rows, 2-4 total columns including the label column). First header cell is always empty string.`;
  } else if (visualType === "flowchart") {
    schemaDescription = `JSON Object matching: {"nodes": [{"label": "Start label (2-5 words)", "shape": "start"}, {"label": "Process step (2-5 words)", "shape": "process"}, {"label": "Decision question (2-5 words)", "shape": "decision"}, {"label": "End label (2-5 words)", "shape": "end"}]} (generate exactly 3-5 nodes in logical flow order; use shape "start" for first, "end" for last, "decision" for branching points, "process" for everything else)`;
  } else if (visualType === "timeline") {
    schemaDescription = `JSON Object matching: {"events": [{"date": "Year or date (e.g. 2020, Q1)", "title": "Event title (2-5 words)", "description": "One line context (≤12 words)"}]} (generate exactly 3-5 events in chronological order)`;
  } else if (visualType === "before-after") {
    schemaDescription = `JSON Object matching: {"beforeTitle": "Before", "afterTitle": "After", "beforeItems": ["pain point 1 (≤8 words)", "pain point 2", "pain point 3"], "afterItems": ["improvement 1 (≤8 words)", "improvement 2", "improvement 3"]} (generate 3-4 items per side)`;
  } else if (visualType === "image-grid") {
    schemaDescription = `JSON Object matching: {"items": [{"label": "Panel title (2-4 words)", "description": "What this visual shows (≤12 words)"}]} (generate 2-4 items representing distinct visual concepts or UI panels)`;
  } else if (visualType === "architecture") {
    schemaDescription = `JSON Object matching: {"layers": [{"label": "Layer name (1-2 words, e.g. Frontend)", "items": ["Component 1 (≤3 words)", "Component 2"]}]} (generate 2-4 layers with 2-3 items each, ordered top-to-bottom)`;
  } else if (visualType === "sequence") {
    schemaDescription = `JSON Object matching: {"participants": ["Client", "API", "Database"], "steps": [{"from": 0, "to": 1, "label": "Action label (≤8 words)"}]} (2-4 participants as array indices 0-based, 3-6 steps showing message flow)`;
  } else if (visualType === "mini-chart") {
    schemaDescription = `JSON Object matching: {"title": "Chart title (2-4 words)", "bars": [{"label": "Bar label", "value": 75, "displayValue": "75ms"}]} (3-5 bars, value is 0-100 scale representing relative magnitude, displayValue is human-readable)`;
  }

  const systemPrompt = `You are a structured data extraction specialist.
Your job is to read a slide title and body text and restructure it EXACTLY into the following JSON format for the visualType "${visualType}":

${schemaDescription}

CRITICAL RULES:
1. Keep every label and description short and compact so it fits inside graphical shapes on an image. (Aim for 1-4 words per label, and under 15 words per description).
2. Do not invent new facts. Only restructure the input slide title and body content.
3. You MUST return your response as a valid JSON object matching the requested structure. Do not wrap it in markdown code blocks or write explanatory text. Just output pure JSON.`;

  try {
    const chatCompletion = await groqCompletionWithRetry({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Slide Title: ${title}\nSlide Body Content: ${body}` },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API during visual data fill.");
    }

    try {
      const parsed = tryParseJson(content);
      if (isRecord(parsed)) {
        return parsed as VisualData | Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  } catch (error: unknown) {
    console.error("[GroqService] Failed to fill visual data:", error);
    throw error;
  }
}
