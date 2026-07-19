import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText, lightCodeStyle } from "../../shared/formatted-text";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { warmEditorialTokens } from "./tokens";
import { SwipeArrow } from "../../shared/swipe-arrow";
import PanoramicBackground from "../../shared/panoramic-background";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";
import { renderSlideShapes } from "../../render-slide";

const THEME_NAME = "warm-editorial";

export default function WarmEditorialTheme({
  slide,
  type,
  title,
  body,
  displayUsername,
  pageLabel,
  order,
  totalSlides,
  isLast,
  hasBgImage,
  bgImageStyle,
  shapes,
  scribble,
  visualType,
  visualData,
  imageUrl,
  imageLayout,
}: ThemeSlideProps): React.ReactElement {
  const po = slide.paletteOverride;
  const text = po?.text || warmEditorialTokens.colors.text;
  const accent = po?.primary || warmEditorialTokens.colors.accent;
  const muted = po?.secondary || warmEditorialTokens.colors.mutedText;
  const bg = po?.background || warmEditorialTokens.colors.background;

  const themeColors = {
    ...tokensToThemeColors({ ...warmEditorialTokens, colors: { ...warmEditorialTokens.colors, text, accent } }, { glassBorder: "rgba(224, 90, 71, 0.08)" }),
  };

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        color: text,
        fontFamily: "Outfit",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "90px 90px",
        boxSizing: "border-box",
        position: "relative",
        backgroundColor: bg,
        ...bgImageStyle,
      }}
    >
      {!hasBgImage && <PanoramicBackground theme="warm-editorial" order={order} totalSlides={totalSlides} />}

      {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={THEME_NAME} /> : null}
      <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: accent, letterSpacing: "2px", textTransform: "uppercase" }}>
            {displayUsername ? displayUsername.replace("@", "") : "CARO"}
          </span>
        </div>
        <span style={{ fontSize: "13px", color: accent, fontWeight: 800, letterSpacing: "1px" }}>{pageLabel}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "30px 0" }}>
        {type === "COVER" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "3px", marginBottom: "20px" }}>
              Step-by-Step Guide
            </span>
            <h1 style={{ fontSize: "74px", fontWeight: 700, fontFamily: "Playfair Display", lineHeight: 1.15, marginBottom: "40px", color: text }}>
              {renderFormattedText(title, { color: accent })}
            </h1>
            <p style={{ fontSize: "28px", color: muted, lineHeight: 1.5, maxWidth: "780px" }}>
              {renderFormattedText(body, {}, {}, "flex-start", lightCodeStyle)}
            </p>
          </div>
        ) : type === "CLOSING" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
            <span style={{ fontSize: "13px", color: `${accent}99`, marginBottom: "20px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>Wrap Up</span>
            <h1 style={{ fontSize: "58px", fontWeight: 800, lineHeight: 1.2, marginBottom: "40px", letterSpacing: "-1px", color: text }}>
              {renderFormattedText(title, { color: accent }, {}, "center")}
            </h1>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: "-8px", borderRadius: "9999px", background: `${accent}40`, filter: "blur(12px)" }} />
              <div style={{ padding: "18px 48px", border: `2px solid ${accent}`, borderRadius: "9999px", backgroundColor: `${accent}14`, display: "flex", alignItems: "center", position: "relative"}}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: accent, letterSpacing: "0.5px" }}>{body || "Follow for more"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <span style={{ fontSize: "40px", fontWeight: 800, color: accent, marginBottom: "15px" }}>
              {order}
            </span>
            <h2 style={{ fontSize: "52px", fontWeight: 700, fontFamily: "Playfair Display", lineHeight: 1.25, marginBottom: "30px", color: text }}>
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
                codeTheme="light"
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{ fontSize: "16px", fontWeight: 700, color: muted, letterSpacing: "1px" }}>
          {displayUsername}
        </span>
        {!isLast && (
          <div style={{ display: "flex", alignItems: "center", color: text, fontSize: "13px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
            <span>Swipe next</span>
            <div style={{ marginLeft: "8px", display: "flex" }}>
              <SwipeArrow color={text} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
