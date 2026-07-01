import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: [
        "javascript", "typescript", "python", "bash", "shell",
        "html", "css", "json", "yaml", "markdown", "sql",
        "rust", "go", "java", "c", "cpp", "ruby", "php",
        "swift", "kotlin", "scala", "r", "perl", "lua",
        "dart", "elixir", "haskell", "clojure", "graphql",
        "dockerfile", "makefile", "plaintext",
      ],
      themes: ["github-dark", "github-light"],
    });
  }
  return highlighterPromise;
}

export interface TokenizedLine {
  lineNumber: number;
  tokens: { content: string; color: string }[];
}

export async function tokenizeCode(
  code: string,
  language: string,
  themeType: "dark" | "light" = "dark"
): Promise<TokenizedLine[]> {
  const hl = await getHighlighter();
  const shikiTheme = themeType === "light" ? "github-light" : "github-dark";
  const defaultColor = themeType === "light" ? "#24292e" : "#e6edf3";

  const normalizedLang = language.toLowerCase().trim();
  try {
    const result = hl.codeToTokens(code, {
      lang: normalizedLang as any,
      theme: shikiTheme,
    });

    return result.tokens.map((line, idx) => ({
      lineNumber: idx + 1,
      tokens: line.map((t) => ({
        content: t.content,
        color: t.color || defaultColor,
      })),
    }));
  } catch {
    const result = hl.codeToTokens(code, {
      lang: "plaintext",
      theme: shikiTheme,
    });
    return result.tokens.map((line, idx) => ({
      lineNumber: idx + 1,
      tokens: line.map((t) => ({
        content: t.content,
        color: t.color || defaultColor,
      })),
    }));
  }
}
