import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText } from "../../shared/formatted-text";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { wireframe3dTokens } from "./tokens";
import { renderSlideShapes } from "../../render-slide";

export default function Wireframe3D(props: ThemeSlideProps): React.ReactElement {
  const {
    slide,
    type,
    title,
    body,
    displayUsername,
    hasBgImage,
    bgImageStyle,
    shapes,
    order,
    totalSlides,
    isLast,
    visualData,
    visualType,
    imageUrl,
    imageLayout,
  } = props;

  const po = slide.paletteOverride;
  const text = po?.text || wireframe3dTokens.colors.text;
  const mutedText = po?.text ? "rgba(0,0,0,0.7)" : wireframe3dTokens.colors.mutedText;
  const accent = po?.primary || wireframe3dTokens.colors.accent;
  const bgFill = wireframe3dTokens.colors.background;
  const gridLine = "rgba(0,0,0,0.06)";
  const borderThick = wireframe3dTokens.borders.card;
  const borderThin = wireframe3dTokens.borders.divider;

  const tokens = { ...wireframe3dTokens, colors: { ...wireframe3dTokens.colors, text, accent } };
  const themeColors = tokensToThemeColors(tokens, { diagramStyle: "wireframe-3d" });

  const fgV = Array.from({ length: 55 }, (_, i) => `M${i * 20} 0 L${i * 20} 1350`).join(" ");
  const fgH = Array.from({ length: 68 }, (_, i) => `M0 ${i * 20} L1080 ${i * 20}`).join(" ");
  const fineGridPath = `${fgV} ${fgH}`;
  const mgV = Array.from({ length: 11 }, (_, i) => `M${i * 100} 0 L${i * 100} 1350`).join(" ");
  const mgH = Array.from({ length: 14 }, (_, i) => `M0 ${i * 100} L1080 ${i * 100}`).join(" ");
  const majorGridPath = `${mgV} ${mgH}`;

  const wireCodeStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono",
    fontWeight: 600,
    backgroundColor: "rgba(0,0,0,0.05)",
    color: accent,
    padding: "4px 12px",
    borderRadius: "0px",
    margin: "0 4px",
    border: borderThin,
  };

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: bgFill,
        color: text,
        fontFamily: "Outfit",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        ...bgImageStyle,
      }}
    >
      {!hasBgImage && (
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none">
            <rect width="1080" height="1350" fill={bgFill} />
            <path d={fineGridPath} stroke={gridLine} strokeWidth="1" fill="none" />
            <path d={majorGridPath} stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
          </svg>
        </div>
      )}

      <div style={{ position: "absolute", top: "120px", left: "100px", width: "920px", height: "1130px", backgroundColor: "#ffffff", border: borderThick, borderRadius: "30px", display: "flex", flexDirection: "column", padding: "60px", boxSizing: "border-box" }}>
        {renderSlideShapes(shapes)}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="1" y="1" width="11" height="11" stroke={text} strokeWidth="1.5" />
              <rect x="16" y="1" width="11" height="11" stroke={text} strokeWidth="1.5" />
              <rect x="1" y="16" width="11" height="11" stroke={text} strokeWidth="1.5" />
              <rect x="16" y="16" width="5" height="5" fill={text} />
            </svg>
          </div>
          {type !== "COVER" && (
            <span style={{ fontSize: "14px", fontFamily: "JetBrains Mono", fontWeight: 700, color: text, letterSpacing: "2px", textTransform: "uppercase" }}>
              {type === "CLOSING" ? "Conclusion" : "Insight"}
            </span>
          )}
          <span style={{ fontFamily: "JetBrains Mono", fontSize: "14px", fontWeight: 700, color: text }}>
            {order} / {totalSlides}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flexGrow: 1, margin: type === "COVER" ? "0" : "40px 0 0 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", flexGrow: 1, justifyContent: "center" }}>
              <h1 style={{ fontSize: "76px", fontFamily: "JetBrains Mono", fontWeight: 700, lineHeight: 1.1, marginBottom: "30px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: text }, { color: text }, "flex-start", wireCodeStyle)}
              </h1>
              {body && (
                <p style={{ fontSize: "28px", color: mutedText, lineHeight: 1.4, maxWidth: "800px", fontWeight: 500, fontFamily: "JetBrains Mono" }}>
                  {renderFormattedText(body, {}, { color: mutedText }, "flex-start", wireCodeStyle)}
                </p>
              )}
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
              <div style={{ padding: "6px 20px", border: borderThick, fontFamily: "JetBrains Mono", fontSize: "16px", fontWeight: 700, letterSpacing: "1px", marginBottom: "40px", backgroundColor: "#ffffff", color: text, textTransform: "uppercase" }}>
                {"> NEXT STEPS _"}
              </div>
              <h1 style={{ fontSize: "64px", fontFamily: "JetBrains Mono", fontWeight: 700, lineHeight: 1.1, marginBottom: "30px", letterSpacing: "-1.5px" }}>
                {renderFormattedText(title, { color: text }, { color: text }, "flex-start", wireCodeStyle)}
              </h1>
              <p style={{ fontSize: "28px", color: mutedText, lineHeight: 1.4, marginBottom: "50px", maxWidth: "700px", fontWeight: 500, fontFamily: "JetBrains Mono" }}>
                {renderFormattedText(body, {}, { color: mutedText }, "flex-start", wireCodeStyle)}
              </p>
              <div style={{ display: "flex", padding: "20px 50px", border: borderThick, backgroundColor: text }}>
                <span style={{ fontSize: "24px", fontFamily: "JetBrains Mono", fontWeight: 700, letterSpacing: "1px", color: "#ffffff" }}>{displayUsername || "GET STARTED"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "52px", fontFamily: "JetBrains Mono", fontWeight: 700, lineHeight: 1.2, marginBottom: "30px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: text }, { color: text }, "flex-start", wireCodeStyle)}
              </h2>
              <ContentRenderer
                visualType={visualType}
                visualData={visualData}
                body={body}
                imageUrl={imageUrl}
                imageLayout={imageLayout}
                themeColors={themeColors}
                codeTheme="light"
                codeStyle={wireCodeStyle}
                diagramWrapper={(diagram: React.ReactElement) => (
                  <div style={{ display: "flex", width: "100%", justifyContent: "center", marginBottom: body ? "20px" : "0", border: borderThick, padding: "20px", backgroundColor: "#ffffff" }}>
                    {diagram}
                  </div>
                )}
                codeBlockWrapper={(codeBlock: React.ReactElement) => (
                  <div style={{ display: "flex", flexDirection: "column", border: borderThick, padding: "16px", backgroundColor: "#ffffff", marginBottom: body ? "16px" : "0" }}>
                    {codeBlock}
                  </div>
                )}
                imageContainerStyle={{ flexDirection: "column", marginTop: "30px", border: borderThin, overflow: "hidden" }}
                imageStyle={{ borderRadius: "0px" }}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "36px", left: "100px", right: "60px", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: borderThin }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: "8px" }}>
            <circle cx="7" cy="7" r="6" stroke={text} strokeWidth="1" />
            <circle cx="7" cy="7" r="2" fill={text} />
          </svg>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: mutedText, border: borderThin, padding: "4px 10px", backgroundColor: "#ffffff" }}>
            {displayUsername}
          </span>
        </div>
        {!isLast && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2 L14 8 L8 14" stroke={text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="14" y1="8" x2="2" y2="8" stroke={text} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: mutedText, fontWeight: 700, marginLeft: "6px" }}>NEXT</span>
          </div>
        )}
      </div>
    </div>
  );
}
