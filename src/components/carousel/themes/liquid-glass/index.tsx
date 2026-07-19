import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText } from "../../shared/formatted-text";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { renderSlideShapes } from "../../render-slide";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { liquidGlassTokens } from "./tokens";
import { tokensToThemeColors } from "../tokens/types";

export default function LiquidGlass(props: ThemeSlideProps): React.ReactElement {
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
  const glassFill = liquidGlassTokens.colors.surface;
  const glassBorder = liquidGlassTokens.borders.card.replace("3px solid ", "");
  const insetShadow = liquidGlassTokens.shadows.inset;
  const text = po?.text || liquidGlassTokens.colors.text;
  const mutedText = liquidGlassTokens.colors.mutedText;
  const accent = po?.primary || liquidGlassTokens.colors.accent;
  const accentBg = po?.primary ? po.primary : "linear-gradient(135deg, #7dd3fc, #1e40af)";

  const themeColors = tokensToThemeColors({
    ...liquidGlassTokens,
    colors: { ...liquidGlassTokens.colors, text, accent },
  });

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: liquidGlassTokens.colors.background,
        color: text,
        fontFamily: liquidGlassTokens.typography.headingFont,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        ...bgImageStyle,
      }}
    >
      {!bgImageStyle.backgroundImage && (
        <svg style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", pointerEvents: "none" }}>
          <defs>
            <radialGradient id="lg-blob-1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={type === "COVER" ? "0.7" : "0.4"} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lg-blob-2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={type === "COVER" ? "0.6" : "0.3"} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lg-blob-3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity={type === "COVER" ? "0.5" : "0.2"} />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="400" fill="url(#lg-blob-1)" />
          <circle cx="800" cy="1100" r="450" fill="url(#lg-blob-2)" />
          <circle cx="800" cy="500" r="350" fill="url(#lg-blob-3)" />
        </svg>
      )}

      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "80px 80px 120px 80px", justifyContent: "space-between" }}>
        {renderSlideShapes(shapes)}
        {type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme="liquid-glass" /> : null}

        {type === "COVER" ? null : (
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 24px", backgroundColor: glassFill, border: `2px solid ${glassBorder}`, borderRadius: "9999px", boxShadow: insetShadow, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${((order + 1) / totalSlides) * 100}%`, background: accentBg, opacity: 0.4 }} />
            <span style={{ position: "relative", fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: mutedText, textTransform: "uppercase" }}>
              {type === "CLOSING" ? "Conclusion" : "Insight"}
            </span>
            <span style={{ position: "relative", fontSize: "13px", color: mutedText, fontWeight: 800 }}>{pageLabel}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: type === "COVER" ? "0" : "30px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flexGrow: 1, justifyContent: "center" }}>
              <div style={{ padding: "40px 60px", backgroundColor: glassFill, border: `3px solid ${glassBorder}`, borderRadius: "40px", boxShadow: insetShadow, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h1 style={{ fontSize: "72px", fontWeight: 900, lineHeight: 1.1, marginBottom: "30px", letterSpacing: "-2px" }}>
                  {renderFormattedText(title, { color: accent }, { color: text }, "center")}
                </h1>
                {body && (
                  <p style={{ fontSize: "24px", color: mutedText, lineHeight: 1.5, maxWidth: "800px", fontWeight: 600 }}>
                    {renderFormattedText(body, {}, {}, "center")}
                  </p>
                )}
              </div>
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "60px", fontWeight: 900, lineHeight: 1.2, marginBottom: "35px", letterSpacing: "-1.5px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              <p style={{ fontSize: "24px", color: mutedText, lineHeight: 1.5, marginBottom: "40px", maxWidth: "700px", fontWeight: 600 }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
              <div style={{ display: "flex", padding: "20px 60px", background: accentBg, border: `2px solid rgba(255,255,255,0.3)`, borderRadius: "9999px", boxShadow: "inset 0px 4px 10px rgba(255,255,255,0.5), 0 15px 30px rgba(14, 165, 233, 0.3)" }}>
                <span style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", letterSpacing: "1px" }}>{displayUsername || "Join Now"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", padding: "40px", backgroundColor: glassFill, border: `3px solid ${glassBorder}`, borderRadius: "40px", boxShadow: insetShadow }}>
              <h2 style={{ fontSize: "46px", fontWeight: 900, lineHeight: 1.2, marginBottom: "25px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: accent })}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <ContentRenderer
                  visualType={visualType}
                  visualData={visualData}
                  body={body}
                  imageUrl={imageUrl}
                  imageLayout={imageLayout}
                  themeColors={{ ...themeColors, diagramStyle: "liquid-glass" }}
                  codeTheme="light"
                  codeBlockWrapper={(codeBlock) => (
                    <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#ffffff", borderRadius: "24px", overflow: "hidden", border: `2px solid ${glassBorder}` }}>
                      {codeBlock}
                    </div>
                  )}
                  imageContainerStyle={{ marginTop: "20px", borderRadius: "24px", overflow: "hidden", border: `3px solid ${glassBorder}` }}
                  imageStyle={{ borderRadius: "0" }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", padding: "10px 24px", backgroundColor: glassFill, border: `2px solid ${glassBorder}`, borderRadius: "9999px", boxShadow: insetShadow }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: text }}>{displayUsername}</span>
          </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: mutedText, fontSize: "14px", fontWeight: 800 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1.5px" }}>Swipe</span>
              <SwipeArrow color={mutedText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
