import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText } from "../../shared/formatted-text";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { renderSlideShapes } from "../../render-slide";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { glassmorphismTokens } from "./tokens";
import { tokensToThemeColors } from "../tokens/types";

export default function Glassmorphism(props: ThemeSlideProps): React.ReactElement {
  const {
    slide,
    type,
    title,
    body,
    displayUsername,
    hasBgImage,
    bgImageStyle,
    shapes,
    scribble,
    order,
    totalSlides,
    isLast,
    pageLabel,
    visualData,
    visualType,
    imageUrl,
    imageLayout,
  } = props;

  const po = slide.paletteOverride;
  const tokens = {
    ...glassmorphismTokens,
    colors: {
      ...glassmorphismTokens.colors,
      text: po?.text || glassmorphismTokens.colors.text,
      accent: po?.primary || glassmorphismTokens.colors.accent,
    },
  };
  const themeColors = tokensToThemeColors(tokens, { glassBorder: "rgba(255,255,255,0.9)" });

  const glassFill = tokens.colors.surface;
  const glassBorder = themeColors.glassBorder;
  const glassBorderTop = "rgba(255,255,255,0.9)";
  const lightShadow = tokens.shadows.card;
  const text = themeColors.text;
  const mutedText = themeColors.muted;
  const accent = themeColors.accent;

  const bgGradients = (
    <div style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", display: "flex", background: "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%)" }}>
      <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "80%", height: "80%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "80%", height: "80%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
    </div>
  );

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: "#e2e8f0",
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
      {!hasBgImage && bgGradients}

      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "90px", justifyContent: "space-between" }}>
        {renderSlideShapes(shapes)}
        {type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme="glassmorphism" /> : null}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

        {type === "COVER" ? null : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", backgroundColor: glassFill, border: `1px solid ${glassBorder}`, borderTop: `1.5px solid ${glassBorderTop}`, borderLeft: `1.5px solid ${glassBorderTop}`, borderRadius: "16px", boxShadow: lightShadow }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mutedText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "12px" }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={{ fontSize: "14px", fontWeight: 700, color: mutedText }}>
                {type === "CLOSING" ? "Conclusion" : "Insight"}
              </span>
            </div>
            <span style={{ fontSize: "14px", color: text, fontWeight: 700 }}>{pageLabel}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: type === "COVER" ? "0" : "30px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flexGrow: 1, justifyContent: "center" }}>
              <h1 style={{ fontSize: "72px", fontWeight: 800, lineHeight: 1.1, marginBottom: "30px", letterSpacing: "-1.5px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              {body && (
                <p style={{ fontSize: "24px", color: mutedText, lineHeight: 1.5, maxWidth: "800px", fontWeight: 500 }}>
                  {renderFormattedText(body, {}, {}, "center")}
                </p>
              )}
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", backgroundColor: glassFill, padding: "80px", borderRadius: "32px", border: `1px solid ${glassBorder}`, borderTop: `1.5px solid ${glassBorderTop}`, borderLeft: `1.5px solid ${glassBorderTop}`, boxShadow: lightShadow }}>
              <h1 style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1.2, marginBottom: "35px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              <p style={{ fontSize: "24px", color: mutedText, lineHeight: 1.5, marginBottom: "50px", maxWidth: "700px", fontWeight: 500 }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
              <div style={{ display: "flex", padding: "18px 48px", backgroundColor: accent, borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", letterSpacing: "1px" }}>{displayUsername || "Join Now"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", padding: "48px", backgroundColor: glassFill, border: `1px solid ${glassBorder}`, borderTop: `1.5px solid ${glassBorderTop}`, borderLeft: `1.5px solid ${glassBorderTop}`, borderRadius: "32px", boxShadow: lightShadow }}>
              <h2 style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.25, marginBottom: "20px", letterSpacing: "-0.5px" }}>
                {renderFormattedText(title, { color: accent })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <ContentRenderer
                  visualType={visualType}
                  visualData={visualData}
                  body={body}
                  imageUrl={imageUrl}
                  imageLayout={imageLayout}
                  themeColors={themeColors}
                  codeTheme="dark"
                  bulletIcon="✦"
                  bulletChar="✦"
                  codeBlockWrapper={(codeBlock) => (
                    <div style={{ display: "flex", flexDirection: "column", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "16px", overflow: "hidden", border: `1px solid ${glassBorder}` }}>
                      {codeBlock}
                    </div>
                  )}
                  imageContainerStyle={{ marginTop: "16px", borderRadius: "20px", overflow: "hidden", border: `1px solid ${glassBorderTop}` }}
                  imageStyle={{ borderRadius: "0" }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", padding: "8px 20px", backgroundColor: glassFill, border: `1px solid ${glassBorder}`, borderTop: `1px solid ${glassBorderTop}`, borderLeft: `1px solid ${glassBorderTop}`, borderRadius: "9999px", boxShadow: lightShadow }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: mutedText }}>{displayUsername}</span>
          </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: mutedText, fontSize: "13px", fontWeight: 700 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
              <SwipeArrow color={mutedText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
