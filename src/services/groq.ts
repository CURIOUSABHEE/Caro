import Groq from "groq-sdk";

export interface SlideBlock {
  type: "COVER" | "CONTENT" | "CLOSING";
  title: string;
  body: string;
  order: number;
  visualType?: "step-chain" | "venn" | "wheel" | "concentric" | "icon-grid" | "code-block" | "text-only";
  visualData?: any;
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY is not configured. Please add your Groq API Key to the .env file.");
  }
  return new Groq({ apiKey });
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

  const systemPrompt = `You are a master social media content designer and copywriter. Your goal is to transform a long article into a highly educational, visually engaging slide-by-slide carousel (typically 6-10 slides) designed to explain complex topics clearly.

${countInstruction}

====== CONTENT EXTRACTION & COPYWRITING ======
- Extract the absolute best lines, key points, practical lessons, and high-value details from the source text.
- Do NOT summarize at a superficial level. Every slide must deliver rich, actionable, and descriptive context so the reader doesn't lose the core technical lessons of the article.
- Combine visual structure with rich theoretical context. Ensure that critical concepts and details that are essential to understanding the topic are never skipped or left out.

====== DESIGN RULES & VISUAL COGNITION ======
Social media carousels must hook the reader, deliver high educational value, and be easy to scan. Diagrams and shapes are NOT decorative fillers; they must drive explanation and visual hierarchy.

For each slide, you must choose the most effective layout and visual representation:
1. "COVER": First slide. Visually striking, short title, sub-headline. Must be "text-only".
2. "CLOSING": Final slide. Call-to-action (CTA). Must be "text-only".
3. "CONTENT": Explains specific ideas. You must choose a "visualType" that fits the logical structure of the content:
   - "code-block": Use if the slide explains code, commands, or configs. Place code in visualData.code, language in visualData.language.
   - "step-chain": Use for sequences, processes, workflows, timelines, or step-by-step guides.
     visualData: {"steps": [{"number": 1, "label": "Short Step Title", "description": "Short explanation"}]} (Exactly 3-4 steps)
   - "venn": Use for comparisons, showing overlap, or intersections between two concepts.
     visualData: {"leftLabel": "Concept A", "rightLabel": "Concept B", "overlapLabel": "Shared Intersect"}
   - "wheel": Use for illustrating categories, attributes, or pillars centered around a core topic.
     visualData: {"centerLabel": "Core Topic", "spokes": [{"label": "Pillar 1"}, {"label": "Pillar 2"}, {"label": "Pillar 3"}, {"label": "Pillar 4"}]} (Exactly 3-4 spokes)
   - "concentric": Use for showing hierarchy, nested relationships, layers of a system, or nesting scopes.
     visualData: {"rings": [{"ringLabel": "Core (Inner)", "depth": 1}, {"ringLabel": "Middle Layer", "depth": 2}, {"ringLabel": "Outer Layer", "depth": 3}]} (Exactly 3 rings, depth 1 to 3)
   - "icon-grid": Use for lists of highlights, key takeaways, feature sets, or pros/cons.
     visualData: {"items": [{"icon": "briefcase" | "lightbulb" | "star" | "settings" | "shield" | "alert" | "code" | "chart" | "user", "label": "Key Idea Title"}]} (Exactly 4 items)
   - "text-only": Use only if the content is purely narrative, a direct quote, or does not fit any of the structures above.

====== BODY RULES & CONTENT DENSITY ======
- "text-only" slides: The body MUST contain exactly 3-4 clean bullet points (•) highlighting concrete, descriptive, and actionable details.
- Diagram slides ("step-chain", "venn", "wheel", "concentric", "icon-grid", "code-block"): The body MUST contain exactly 2-3 bullet points (•) (max 60 words total) delivering practical theoretical context and explaining "why" or "how" the diagram works. Do NOT repeat diagram labels.

====== HIGHLIGHTS ======
Wrap exactly 1 or 2 high-impact focus words in the slide title with asterisks for italicized serif highlight emphasis (e.g. "Optimize your *code* structure").

====== OUTPUT JSON SCHEMA ======
Return your output as a single JSON object matching this schema:
{
  "slides": [
    {
      "type": "COVER" | "CONTENT" | "CLOSING",
      "title": "headline text (*word* for italic accent)",
      "body": "bullet points starting with •",
      "order": 0,
      "visualType": "text-only" | "step-chain" | "venn" | "wheel" | "concentric" | "icon-grid" | "code-block",
      "visualData": { ... } // Match schema for visualType above. Use empty object for text-only.
    }
  ]
}

Tone: "${tone}".
${focus ? `Focus: ${focus}.` : ""}

Use only standard ASCII characters in JSON values (no non-breaking hyphens, no fancy quote marks).`;

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

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the blog article content:\n\n${articleText}${codeHint}` },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API.");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response.");
      }
    }

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
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API during block regeneration.");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in regenerate response.");
      }
    }

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
  visualType: "step-chain" | "venn" | "wheel" | "concentric" | "icon-grid" | "code-block" | "text-only",
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
    schemaDescription = `JSON Object matching: {"leftLabel": "Concept A (1-3 words)", "rightLabel": "Concept B (1-3 words)", "overlapLabel": "Shared overlap (1-3 words)"}`;
  } else if (visualType === "wheel") {
    schemaDescription = `JSON Object matching: {"centerLabel": "Core Topic Label", "spokes": [{"label": "Spoke 1 Label"}, {"label": "Spoke 2 Label"}, {"label": "Spoke 3 Label"}, {"label": "Spoke 4 Label"}]}`;
  } else if (visualType === "concentric") {
    schemaDescription = `JSON Object matching: {"rings": [{"ringLabel": "Core Layer Label", "depth": 1}, {"ringLabel": "Middle Layer Label", "depth": 2}, {"ringLabel": "Outer Layer Label", "depth": 3}]} ordered from inner (depth 1) to outer (depth 3)`;
  } else if (visualType === "icon-grid") {
    schemaDescription = `JSON Object matching: {"items": [{"icon": "Single letter or number (e.g. A, 1, $, #)", "label": "Short label (2-5 words)"}]} (generate exactly 4 items)`;
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
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received empty response from Groq API during visual data fill.");
    }

    try {
      return JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    }
  } catch (error: any) {
    console.error("[GroqService] Failed to fill visual data:", error);
    return {};
  }
}
