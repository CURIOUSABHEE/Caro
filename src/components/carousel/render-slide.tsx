import React from "react";
import type { RenderSlideInput, Shape } from "./types";
export type { RenderSlideInput };
import { sanitizeTextForSatori, sanitizeObjectStrings } from "./lib/sanitize";
import { applyOverridesToTree } from "./lib/apply-overrides";
import { setCurrentScribbleState } from "./shared/formatted-text";
import { getThemeRenderer } from "./themes/theme-registry";
import type { ThemeSlideProps } from "./themes/theme-types";
import { CodeBlock } from "@/lib/CodeBlock";
import type { CodeBlockData } from "@/lib/types";
import { displayUsername as fmtUsername, scribbleColor, THEME_DEFAULT_FONTS } from "@/lib/constants";

export function renderSlideShapes(shapes?: Shape[]) {
  if (!shapes || shapes.length === 0) return null;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", pointerEvents: "none"}}>
      {shapes.map((shape) => {
        const isText = shape.type === "text";
        return (
          <div
            key={shape.id}
            style={{
              position: "absolute",
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: isText ? "auto" : `${shape.width}px`,
              height: isText ? "auto" : `${shape.height}px`,
              backgroundColor: isText ? "transparent" : shape.color,
              borderRadius: shape.type === "circle" ? "50%" : "0px",
              color: isText ? shape.color : "transparent",
              fontSize: isText ? `${shape.fontSize || 24}px` : "0px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isText ? shape.text : ""}
          </div>
        );
      })}
    </div>
  );
}

export const renderCodeBlock = (visualData: Record<string, unknown> | undefined, theme: "dark" | "light", variant: "default" | "macos" = "default") => {
  const data = visualData as unknown as CodeBlockData | undefined;
  if (!data?.code) return null;
  if (data.tokens && data.tokens.length > 0) {
    return <CodeBlock language={data.language || "plaintext"} code={data.code} highlightLines={data.highlightLines || []} tokens={data.tokens} theme={theme} variant={variant} />;
  }
  // Fallback: render plain code block without syntax highlighting when tokens are missing
  const bg = theme === "dark" ? "#0d1117" : "#f6f8fa";
  const fg = theme === "dark" ? "#e6edf3" : "#24292f";
  const lines = data.code.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", backgroundColor: bg, borderRadius: "12px", overflow: "hidden", width: "100%", maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${theme === "dark" ? "#30363d" : "#d0d7de"}`, fontSize: "12px", color: theme === "dark" ? "#8b949e" : "#57606a", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>
        {data.language || "code"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", margin: 0, padding: "16px", fontSize: "13px", lineHeight: "1.5", fontFamily: "JetBrains Mono, monospace", color: fg }}>
        {lines.map((line, idx) => (
          <div key={idx} style={{ display: "flex" }}>
            <span style={{ display: "flex", width: "32px", textAlign: "right", marginRight: "16px", color: theme === "dark" ? "#484f58" : "#8c959f", userSelect: "none", flexShrink: 0 }}>{idx + 1}</span>
            <span style={{ whiteSpace: "pre" }}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function renderThemeSlide(slide: RenderSlideInput): React.ReactElement {
  const { themeName, fontPairing, layoutDensity, logoUrl, username } = slide;

  const currentDefaults = THEME_DEFAULT_FONTS[themeName] || { heading: "Outfit", body: "Outfit" };

  let headingFont = currentDefaults.heading;
  let bodyFont = currentDefaults.body;

  if (fontPairing) {
    const parts = fontPairing.split("+").map(p => p.trim());
    if (parts[0]) headingFont = parts[0];
    if (parts[1]) bodyFont = parts[1];
    else if (parts[0]) bodyFont = parts[0];
  }

  const resultElement = renderThemeSlideBase(slide);
  const displayUsernameStr = fmtUsername(username);

  return applyOverridesToTree(
    resultElement,
    headingFont,
    bodyFont,
    layoutDensity || "comfortable",
    logoUrl || undefined,
    displayUsernameStr,
    true,
    themeName
  ) as React.ReactElement;
}

export function renderThemeSlideBase(slide: RenderSlideInput): React.ReactElement {
  const sanitizedTitle = sanitizeTextForSatori(slide.title);
  const sanitizedBody = sanitizeTextForSatori(slide.body);
  const sanitizedUsername = sanitizeTextForSatori(slide.username || "");
  const sanitizedWebsiteUrl = sanitizeTextForSatori(slide.websiteUrl || "");
  const sanitizedVisualData = sanitizeObjectStrings(slide.visualData);
  const { type, themeName, order, totalSlides, imageUrl, imageLayout, shapes, visualType, scribble } = slide;

  const title = sanitizedTitle;
  const body = sanitizedBody;
  const username = sanitizedUsername;
  const websiteUrl = sanitizedWebsiteUrl;
  const visualData = sanitizedVisualData;

  const isLast = order === totalSlides - 1;
  const pageLabel = `${order + 1}/${totalSlides}`;
  const displayUsernameStr = fmtUsername(username);

  const hasBgImage = Boolean(imageUrl && imageLayout === "background");
  const bgImageStyle: React.CSSProperties = hasBgImage ? {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  } : {};

  setCurrentScribbleState(scribble && type !== "COVER" && type !== "CLOSING" ? { scribble: true, color: scribbleColor(themeName) } : null);

  try {
    const themeProps: ThemeSlideProps = {
      slide,
      type,
      title,
      body,
      username,
      websiteUrl,
      visualData,
      visualType,
      order,
      totalSlides,
      isLast,
      pageLabel,
      displayUsername: displayUsernameStr,
      hasBgImage,
      bgImageStyle,
      shapes,
      scribble,
      imageUrl,
      imageLayout,
    };

    const themeRenderer = getThemeRenderer(themeName);
    if (themeRenderer) {
      return themeRenderer(themeProps);
    }

    return <div />;
  } finally {
    setCurrentScribbleState(null);
  }
}
