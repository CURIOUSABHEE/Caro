import Groq from "groq-sdk";

export interface SlideBlock {
  type: "COVER" | "CONTENT" | "CLOSING";
  title: string;
  body: string;
  order: number;
  visualType?: "step-chain" | "venn" | "wheel" | "concentric" | "icon-grid" | "code-block" | "text-only" | "quote" | "stat";
  visualData?: any;
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY is not configured. Please add your Groq API Key to the .env file.");
  }
  return new Groq({ apiKey });
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

// Parse LLM JSON output with multiple recovery strategies
function tryParseJson(raw: string): any {
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

export async function planSlides(
  articleText: string,
  tone: string,
  focus?: string,
  slideCount: number | "auto" = "auto"
): Promise<SlideBlock[]> {
  const groq = getGroqClient();

  const countInstruction =
    slideCount === "auto"
      ? "Determine an appropriate number of slides (typically 6 to 9 slides including 1 COVER and 1 CLOSING) based on the length, depth, and key arguments of the text."
      : `Generate exactly ${slideCount} slides in total, including 1 COVER slide at the beginning, followed by content slides, and ending with exactly 1 CLOSING slide.`;

  const systemPrompt = `You transform articles into educational slide carousels (6-10 slides).

${countInstruction}

RULES:
- Extract key points, practical lessons, and high-value details. Every slide must deliver rich, descriptive context.
- COVER: first slide, text-only, short striking title.
- CLOSING: final slide, text-only, call-to-action.
- CONTENT: choose the best visualType for the idea:

  "text-only" — purely narrative. Body: exactly 3-4 bullet points (•) ordered by importance.
  "code-block" — code/config display. visualData: {code, language}.
  "step-chain" — sequences/workflows. visualData: {"steps": [{"number":1,"label":"","description":""}]} (3-4 steps).
  "venn" — comparisons/overlap. visualData: {"leftLabel":"","rightLabel":"","overlapLabel":"","leftPoints":[""],"rightPoints":[""]}.
  "wheel" — categories around a core. visualData: {"centerLabel":"","spokes":[{"label":"","description":""}]} (3-4 spokes).
  "concentric" — hierarchy/layers. visualData: {"rings":[{"ringLabel":"","depth":1},{"ringLabel":"","depth":2},{"ringLabel":"","depth":3}]}.
  "icon-grid" — highlights/takeaways. visualData: {"items":[{"icon":"briefcase|lightbulb|star|settings|shield|alert|code|chart|user","label":"","description":""}]} (4-6 items).
  "quote" — testimonial/key insight. visualData: {"quote":"","attribution":"","role":""}.
  "stat" — striking statistic. visualData: {"number":"80%","label":"","context":""}.
  "table" — side-by-side comparison. visualData: {"headers":["","A","B"],"rows":[{"label":"C1","values":["",""]}]} (3-5 rows, 2-4 cols).

- Diagram slides (non-text-only): body MUST have exactly 2-3 bullet points (max 60 words), explaining context. Do NOT repeat diagram labels.
- Wrap 1-2 high-impact words in title with asterisks for italic emphasis (e.g. "Optimize your *code* structure").

OUTPUT JSON:
{"slides":[{"type":"COVER"|"CONTENT"|"CLOSING","title":"headline (*word*)","body":"• bullet points","order":0,"visualType":"text-only"|"step-chain"|"venn"|"wheel"|"concentric"|"icon-grid"|"code-block"|"quote"|"stat"|"table","visualData":{}}]}

Tone: "${tone}".
${focus ? `Focus: ${focus}.` : ""}
Use only standard ASCII characters in JSON values.`;

  // --- Preprocessing: detect code markers in article to reinforce code-block hints ---
  const codePatterns = [
    /```[\s\S]*?```/g,               // triple backtick fenced blocks
    /(?:\r?\n)(?: {4}|\t)/,          // indented code lines
    /\b(npm|yarn|pnpm|docker|kubectl|git|pip|conda|brew|apt|yum|choco|scoop|curl|wget|ssh|sudo|npx|node|python|go run|cargo|dotnet|composer)\s+/i,  // common CLI commands
    /`[^`\n]{3,}`/g,                 // longer inline code
    /(?:function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|def\s+\w+|import\s+|export\s+|class\s+\w+|FROM\s+\w+|RUN\s+|CMD\s+|SELECT\s+|INSERT\s+|UPDATE\s+|CREATE\s+TABLE)/g,  // code keywords
  ];
  const hasCode = codePatterns.some(p => p.test(articleText));
  const codeHint = hasCode
    ? "\n\n⚠️ IMPORTANT: The article above contains code snippets. You MUST use visualType \"code-block\" for the slides that display these code snippets. Put code in visualData.code, NEVER in the body."
    : "";
  // --- End preprocessing ---

  // Compress article text to fit within model token limit (~8000 TPM)
  const MAX_TOTAL_TOKENS = 8000;
  const MAX_OUTPUT_TOKENS = 4096;
  const systemTokens = estimateTokens(systemPrompt) + 50; // prompt framing overhead
  const maxArticleTokens = MAX_TOTAL_TOKENS - MAX_OUTPUT_TOKENS - systemTokens - 200; // 200 safety buffer
  const compressedArticle = compressText(articleText, Math.max(maxArticleTokens, 500));

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the blog article content:\n\n${compressedArticle}${codeHint}` },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 4096,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API.");
    }

    let parsed: any;
    parsed = tryParseJson(content);

    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      throw new Error("Invalid response format: 'slides' array not found in JSON response.");
    }

    return parsed.slides.map((s: any, idx: number) => {
      const vType = s.type === "COVER" || s.type === "CLOSING" ? "text-only" : (s.visualType || "text-only");
      let vData = s.visualData || {};
      if (vType === "code-block") {
        if (vData && Array.isArray(vData.highlightLines) && vData.highlightLines.length > 3) {
          vData = { ...vData, highlightLines: vData.highlightLines.slice(0, 3) };
        }
      }
      return {
        type: s.type === "COVER" || s.type === "CLOSING" ? s.type : "CONTENT",
        title: s.title || "Untitled Slide",
        body: s.body || "",
        order: typeof s.order === "number" ? s.order : idx,
        visualType: vType,
        visualData: vData,
      };
    });
  } catch (error: any) {
    console.error("[GroqService] Failed to plan slides:", error);
    throw new Error(error.message || "Failed to generate slide plan using Groq.");
  }
}

export async function regenerateBlock(
  block: { type: "COVER" | "CONTENT" | "CLOSING"; title: string; body: string; order: number },
  instruction: string,
  originalText?: string
): Promise<Omit<SlideBlock, "order">> {
  const groq = getGroqClient();

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
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please regenerate this block based on the instructions." },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 2048,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API during block regeneration.");
    }

    let parsed: any;
    parsed = tryParseJson(content);

    return {
      type: parsed.type === "COVER" || parsed.type === "CLOSING" ? parsed.type : "CONTENT",
      title: parsed.title || block.title,
      body: parsed.body || block.body,
    };
  } catch (error: any) {
    console.error("[GroqService] Failed to regenerate block:", error);
    throw new Error(error.message || "Failed to regenerate block using Groq.");
  }
}

export async function fillVisualData(
  visualType: "step-chain" | "venn" | "wheel" | "concentric" | "icon-grid" | "code-block" | "text-only" | "quote" | "stat" | "table",
  title: string,
  body: string
): Promise<any> {
  if (visualType === "text-only" || visualType === "code-block") {
    return {};
  }

  const groq = getGroqClient();

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
  }

  const systemPrompt = `You are a structured data extraction specialist.
Your job is to read a slide title and body text and restructure it EXACTLY into the following JSON format for the visualType "${visualType}":

${schemaDescription}

CRITICAL RULES:
1. Keep every label and description short and compact so it fits inside graphical shapes on an image. (Aim for 1-4 words per label, and under 15 words per description).
2. Do not invent new facts. Only restructure the input slide title and body content.
3. You MUST return your response as a valid JSON object matching the requested structure. Do not wrap it in markdown code blocks or write explanatory text. Just output pure JSON.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Slide Title: ${title}\nSlide Body Content: ${body}` },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API during visual data fill.");
    }

    try {
      return tryParseJson(content);
    } catch {
      return {};
    }
  } catch (error: any) {
    console.error("[GroqService] Failed to fill visual data:", error);
    return {};
  }
}
