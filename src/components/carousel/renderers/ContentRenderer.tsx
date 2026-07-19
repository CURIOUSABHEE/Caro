import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";
import type { ThemeColors } from "@/lib/types";
import { renderDiagram } from "../diagrams/diagram-registry";
import { renderCodeBlock } from "../render-slide";
import { renderFormattedText } from "../shared/formatted-text";
import { renderBulletList, renderBulletIcon } from "../shared/bullets";

export interface ContentRendererProps {
  visualType: string | undefined;
  visualData: Record<string, unknown> | undefined;
  body: string;
  imageUrl: string | null | undefined;
  imageLayout: "background" | "inline" | undefined;
  tokens?: ThemeTokens;
  themeColors: ThemeColors;
  codeTheme?: "dark" | "light";
  codeVariant?: "default" | "macos";
  isDark?: boolean;
  bulletChar?: string;
  bulletIcon?: string;
  codeStyle?: React.CSSProperties;
  serifStyle?: React.CSSProperties;
  diagramWrapper?: (diagram: React.ReactElement) => React.ReactNode;
  codeBlockWrapper?: (codeBlock: React.ReactElement) => React.ReactNode;
  imageContainerStyle?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  renderInlineImage?: boolean;
}

export function ContentRenderer({
  visualType,
  visualData,
  body,
  imageUrl,
  imageLayout,
  tokens,
  themeColors,
  codeTheme = "dark",
  codeVariant = "default",
  isDark = false,
  bulletChar = "\u2022",
  bulletIcon,
  codeStyle,
  serifStyle,
  diagramWrapper,
  codeBlockWrapper,
  imageContainerStyle,
  imageStyle,
  renderInlineImage = true,
}: ContentRendererProps) {
  const text = themeColors.text;
  const accent = themeColors.accent;
  const muted = themeColors.muted;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {(() => {
        if (visualType === "code-block") {
          const codeBlock = renderCodeBlock(visualData, codeTheme, codeVariant);
          if (codeBlock) {
            const wrapped = codeBlockWrapper ? codeBlockWrapper(codeBlock) : codeBlock;
            return (
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", marginBottom: body ? "20px" : "0" }}>{wrapped}</div>
                {body && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                      const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                      if (!cleanBullet) return null;
                      return (
                        <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                          <span style={{ color: accent, fontSize: "16px", fontWeight: "bold", flexShrink: 0 }}>
                            {bulletIcon ? renderBulletIcon(bulletIcon, accent, 16) : "\u2022"}
                          </span>
                          <p style={{ fontSize: "18px", color: text, lineHeight: 1.5, margin: 0 }}>
                            {renderFormattedText(cleanBullet, {}, {}, "flex-start", codeStyle)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
        }

        if (visualType && visualType !== "text-only") {
          const diagram = renderDiagram(visualType, visualData, themeColors);
          if (diagram) {
            const wrapped = diagramWrapper ? diagramWrapper(diagram) : diagram;
            return (
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "20px" }}>
                  {wrapped}
                </div>
                {body && (
                  <div style={{ display: "flex", flexDirection: "column", padding: "0 10px" }}>
                    {body.split("\n").filter(Boolean).map((bullet, bIdx) => {
                      const cleanBullet = bullet.replace(/^[•\-\*\s]+/, "").trim();
                      if (!cleanBullet) return null;
                      return (
                        <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                          <span style={{ marginRight: "10px", flexShrink: 0, color: accent, fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center" }}>
                            {bulletIcon ? renderBulletIcon(bulletIcon, accent, 18) : "\u2022"}
                          </span>
                          <p style={{ fontSize: "20px", color: muted, lineHeight: 1.45, margin: 0 }}>
                            {renderFormattedText(cleanBullet, serifStyle || {}, {}, "flex-start", codeStyle)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
        }

        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {renderBulletList(body, accent, text, muted, bulletChar, isDark, serifStyle, codeStyle)}
          </div>
        );
      })()}
      {renderInlineImage && imageUrl && imageLayout === "inline" && (
        <div style={{ display: "flex", marginTop: "40px", ...imageContainerStyle }}>
          <img
            src={imageUrl}
            style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block", borderRadius: "12px", ...imageStyle }}
          />
        </div>
      )}
    </div>
  );
}
