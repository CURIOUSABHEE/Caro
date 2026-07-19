import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText } from "../../shared/formatted-text";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { neomorphismTokens } from "./tokens";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { renderSlideShapes } from "../../render-slide";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";

const THEME_NAME = "neomorphism";

export default function Neomorphism(props: ThemeSlideProps): React.ReactElement {
  const {
    slide,
    type,
    title,
    body,
    displayUsername,
    username,
    pageLabel,
    order,
    totalSlides,
    isLast,
    hasBgImage,
    bgImageStyle,
    shapes,
    scribble,
    visualData,
    visualType,
    imageUrl,
    imageLayout,
  } = props;

  const po = slide.paletteOverride;
  const bg = po?.background || neomorphismTokens.colors.background;
  const text = po?.text || neomorphismTokens.colors.text;
  const mutedText = neomorphismTokens.colors.mutedText;
  const accent = po?.primary || neomorphismTokens.colors.accent;
  const accentBg = `radial-gradient(circle at 35% 30%, ${accent}99 0%, ${accent} 60%, ${accent}CC 100%)`;
  const insetShadow = neomorphismTokens.shadows.inset;

  const tokens = { ...neomorphismTokens, colors: { ...neomorphismTokens.colors, text, accent, background: bg } };
  const themeColors = tokensToThemeColors(tokens, { accentBg });

  const cardShadow = neomorphismTokens.shadows.card;
  const raisedShadow = neomorphismTokens.shadows.raised;

  const extrudedCard = (content: React.ReactNode, extraStyle: React.CSSProperties = {}) => (
    <div style={{ display: "flex", flex: 1, backgroundColor: bg, borderRadius: "20px", padding: "24px", boxShadow: cardShadow, boxSizing: "border-box", ...extraStyle }}>
      {content}
    </div>
  );

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: bg,
        background: `radial-gradient(circle at top left, rgba(255,255,255,0.4) 0%, ${bg} 60%, rgba(0,0,0,0.05) 100%)`,
        color: text,
        fontFamily: "Outfit",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "85px",
        boxSizing: "border-box",
        position: "relative",
        ...bgImageStyle,
      }}
    >
      {renderSlideShapes(shapes)}
      {type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={THEME_NAME} /> : null}
      <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{ display: "flex", padding: "6px 18px", backgroundColor: bg, borderRadius: "9999px", boxShadow: cardShadow }}>
          <span style={{ fontSize: "12px", fontWeight: 800, color: text, letterSpacing: "3px", textTransform: "uppercase" }}>
            {type === "COVER" ? "Introduction" : type === "CLOSING" ? "Conclusion" : "Insight"}
          </span>
        </div>
        <div style={{ display: "flex", padding: "4px 14px", backgroundColor: bg, borderRadius: "9999px", boxShadow: cardShadow }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: mutedText }}>{pageLabel}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "35px 0" }}>
        {type === "COVER" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontSize: "64px", fontWeight: 600, lineHeight: 1.15, marginBottom: "40px", letterSpacing: "-1px" }}>
              {renderFormattedText(title, { color: accent }, { color: text }, "center")}
            </h1>
            {body && extrudedCard(
              <p style={{ fontSize: "22px", color: mutedText, lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
            )}
            <div style={{ marginTop: "50px", width: "180px", height: "180px", borderRadius: "50%", background: accentBg, boxShadow: raisedShadow }} />
          </div>
        ) : type === "CLOSING" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "12px", color: mutedText, marginBottom: "20px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>Next Steps</span>
            <h1 style={{ fontSize: "52px", fontWeight: 600, lineHeight: 1.2, marginBottom: "35px", letterSpacing: "-1px" }}>
              {renderFormattedText(title, { color: accent }, { color: text }, "center")}
            </h1>
            <div style={{ display: "flex", padding: "18px 48px", backgroundColor: accent, borderRadius: "9999px", boxShadow: raisedShadow }}>
              <span style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", letterSpacing: "1px" }}>{body || displayUsername || "Get Started"}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "44px", fontWeight: 600, lineHeight: 1.25, marginBottom: "25px", letterSpacing: "-0.5px", color: text }}>
              {renderFormattedText(title, { color: accent })}
            </h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {extrudedCard(
                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <ContentRenderer
                    visualType={visualType}
                    visualData={visualData}
                    body={body}
                    imageUrl={imageUrl}
                    imageLayout={imageLayout}
                    themeColors={themeColors}
                    codeTheme="light"
                    renderInlineImage={false}
                  />
                </div>
              )}
              {imageUrl && imageLayout === "inline" && (
                <div style={{ display: "flex", marginTop: "20px", borderRadius: "20px", overflow: "hidden", boxShadow: insetShadow }}>
                  <img src={imageUrl} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: bg, boxShadow: cardShadow, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: accent }}>{username ? username.replace("@", "").substring(0, 2).toUpperCase() : "CA"}</span>
        </div>
        {!isLast && (
          <div style={{ display: "flex", alignItems: "center", color: mutedText, fontSize: "14px", fontWeight: 600 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
            <SwipeArrow color={mutedText} />
          </div>
        )}
      </div>
    </div>
  );
}
