import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText } from "../../shared/formatted-text";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { sketchTokens } from "./tokens";
import { SketchBackground } from "./Background";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { renderSlideShapes } from "../../render-slide";

export default function Sketch(props: ThemeSlideProps): React.ReactElement {
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
    pageLabel,
    visualData,
    visualType,
    imageUrl,
    imageLayout,
  } = props;

  const po = slide.paletteOverride;
  const text = po?.text || sketchTokens.colors.text;
  const mutedText = sketchTokens.colors.mutedText;
  const accent = po?.primary || sketchTokens.colors.accent;
  const bgFill = sketchTokens.colors.background;
  const badgeShadow = sketchTokens.shadows.badge;
  const cardShadow = sketchTokens.shadows.card;
  const gridLineStrong = sketchTokens.colors.border;
  const tokens = { ...sketchTokens, colors: { ...sketchTokens.colors, text, accent } };

  const sketchCodeStyle: React.CSSProperties = {
    fontFamily: "JetBrains Mono",
    fontSize: "inherit",
    backgroundColor: "#e2e8f0",
    color: "#1f2937",
    padding: "4px 12px",
    borderRadius: "8px",
    margin: "0 4px",
    border: "1px solid rgba(0,0,0,0.1)",
    letterSpacing: "0px",
  };

  const themeColors = tokensToThemeColors(tokens, { glassBg: "transparent" });

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
      {!hasBgImage && <SketchBackground order={order} tokens={tokens} />}

      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "80px", justifyContent: "space-between" }}>
        {renderSlideShapes(shapes)}

        <div style={{ display: "flex", justifyContent: "center", position: "absolute", top: "50px", left: "0", right: "0" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} style={{ display: "flex", width: "8px", height: "8px", borderRadius: "4px", backgroundColor: i === order ? accent : gridLineStrong, marginRight: i < totalSlides - 1 ? "12px" : "0" }} />
            ))}
          </div>
        </div>

        {type === "COVER" ? null : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "24px", borderBottom: `1px solid ${gridLineStrong}` }}>
            <div style={{ display: "flex", padding: "8px 24px", borderRadius: "100px", background: `linear-gradient(135deg, ${accent}, ${text})`, color: "#fff", boxShadow: badgeShadow, fontFamily: "Outfit", fontSize: "22px" }}>
              {type === "CLOSING" ? "conclusion" : "insight"}
            </div>
            <span style={{ fontSize: "20px", fontWeight: 400, fontFamily: "JetBrains Mono", color: mutedText }}>{pageLabel}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: type === "COVER" ? "0" : "60px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flexGrow: 1, justifyContent: "center", position: "relative" }}>
              <div style={{ display: "flex", padding: "12px 32px", borderRadius: "100px", background: `linear-gradient(135deg, ${accent}, ${text})`, color: "#fff", boxShadow: badgeShadow, fontFamily: "Outfit", fontSize: "28px", fontWeight: 500, marginBottom: "40px" }}>
                {displayUsername}
              </div>
              <h1 style={{ fontSize: "110px", fontWeight: 700, lineHeight: 1.05, marginBottom: "30px", letterSpacing: "-0.03em" }}>
                {renderFormattedText(title, { color: text }, {}, "center", sketchCodeStyle)}
              </h1>
              {body && (
                <p style={{ fontSize: "36px", color: mutedText, lineHeight: 1.4, maxWidth: "800px", fontWeight: 400 }}>
                  {renderFormattedText(body, {}, {}, "center", sketchCodeStyle)}
                </p>
              )}
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", backgroundColor: "#fff", padding: "80px 60px", borderRadius: "24px", border: `1px solid ${gridLineStrong}`, boxShadow: cardShadow }}>
              <h1 style={{ fontSize: "80px", fontWeight: 700, lineHeight: 1.1, marginBottom: "40px", letterSpacing: "-0.02em" }}>
                {renderFormattedText(title, { color: text }, {}, "center", sketchCodeStyle)}
              </h1>
              <p style={{ fontSize: "34px", color: mutedText, lineHeight: 1.4, marginBottom: "60px", maxWidth: "700px", fontWeight: 400 }}>
                {renderFormattedText(body, {}, {}, "center", sketchCodeStyle)}
              </p>
              <div style={{ display: "flex", padding: "20px 48px", borderRadius: "100px", background: `linear-gradient(135deg, ${accent}, ${text})`, color: "#fff", boxShadow: badgeShadow }}>
                <span style={{ fontSize: "32px", fontWeight: 600 }}>{displayUsername || "Join Now"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: "72px", fontWeight: 700, lineHeight: 1.1, marginBottom: "40px", letterSpacing: "-0.02em" }}>
                {renderFormattedText(title, { color: text }, {}, "flex-start", sketchCodeStyle)}
              </h2>
              <ContentRenderer
                visualType={visualType}
                visualData={visualData}
                body={body}
                imageUrl={imageUrl}
                imageLayout={imageLayout}
                themeColors={themeColors}
                codeTheme="dark"
                codeVariant="macos"
                isDark
                codeStyle={sketchCodeStyle}
                diagramWrapper={(diagram: React.ReactElement) => (
                  <div style={{ display: "flex", width: "100%", justifyContent: "center", minHeight: "340px", marginBottom: "32px", backgroundColor: "#fff", borderRadius: "20px", border: `1px solid ${gridLineStrong}`, boxShadow: cardShadow, padding: "24px" }}>
                    {diagram}
                  </div>
                )}
                imageContainerStyle={{ borderRadius: "20px", border: `1px solid ${gridLineStrong}`, backgroundColor: "#fff", boxShadow: cardShadow, overflow: "hidden", padding: "12px" }}
                imageStyle={{ borderRadius: "12px" }}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "24px", borderTop: `1px solid ${gridLineStrong}` }}>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "JetBrains Mono", fontSize: "18px", color: mutedText }}>
            <span style={{ border: `1px solid ${gridLineStrong}`, padding: "6px 16px", borderRadius: "100px", backgroundColor: "#fff" }}>
              {displayUsername}
            </span>
          </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: accent, fontSize: "18px", fontFamily: "JetBrains Mono", fontWeight: 600 }}>
              <span>SWIPE</span>
              <div style={{ marginLeft: "12px", display: "flex" }}>
                <SwipeArrow color={accent} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
