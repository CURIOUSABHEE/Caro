import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText } from "../../shared/formatted-text";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { monochromeTokens } from "./tokens";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { renderSlideShapes } from "../../render-slide";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";
import { getSeededRandom } from "../../lib/seeded-random";

const THEME_NAME = "monochrome";

export default function MonochromeTheme({
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
  const accent = po?.primary || "#ffffff";
  const bg = po?.background || "#050505";
  const textColor = po?.text || "#ffffff";
  const themeColors = tokensToThemeColors(monochromeTokens, { glassBorder: "rgba(255, 255, 255, 0.1)" });

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: bg,
        color: textColor,
        fontFamily: "Outfit",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "90px 90px",
        boxSizing: "border-box",
        position: "relative",
        ...bgImageStyle,
      }}
    >
      {!hasBgImage && (() => {
        const rng = getSeededRandom(`mono-border-${order}`);
        const t = Math.floor(20 + rng() * 60);
        const l = Math.floor(20 + rng() * 60);
        const b = Math.floor(20 + rng() * 60);
        const rOff = Math.floor(20 + rng() * 60);
        return (
          <div
            style={{
              position: "absolute",
              top: `${t}px`,
              left: `${l}px`,
              right: `${rOff}px`,
              bottom: `${b}px`,
              border: "1px solid #1c1c1c",
              pointerEvents: "none",
            }}
          />
        );
      })()}

      {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={THEME_NAME} /> : null}
      <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "4px", color: "#6e6e6e", textTransform: "uppercase" }}>
          {type === "COVER" ? "Introduction" : type === "CLOSING" ? "Action Item" : "Insight"}
        </span>
        <span style={{ fontSize: "14px", color: "#6e6e6e", fontWeight: 700, letterSpacing: "1px" }}>{pageLabel}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "40px 0" }}>
        {type === "COVER" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontSize: "74px", fontWeight: 700, lineHeight: 1.15, marginBottom: "40px", letterSpacing: "-1.5px" }}>
              {renderFormattedText(title, { color: textColor }, {}, "center")}
            </h1>
            <p style={{ fontSize: "28px", color: "#a3a3a3", lineHeight: 1.5, maxWidth: "800px" }}>
              {renderFormattedText(body, {}, {}, "center")}
            </p>
          </div>
        ) : type === "CLOSING" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
            <div style={{ width: "80px", height: "3px", backgroundColor: accent, marginBottom: "40px" }} />
            <span style={{ fontSize: "13px", color: "#5a5a5a", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "6px", fontWeight: 700 }}>Conclusion</span>
            <h1 style={{ fontSize: "60px", fontWeight: 900, lineHeight: 1.15, marginBottom: "50px", letterSpacing: "-1.5px", color: textColor }}>
              {renderFormattedText(title, {}, {}, "center")}
            </h1>
            <div style={{ padding: "20px 50px", backgroundColor: accent, borderRadius: "4px", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", letterSpacing: "1px" }}>{body || "Let's discuss"}</span>
            </div>
            <div style={{ width: "80px", height: "3px", backgroundColor: accent, marginTop: "40px" }} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <h2 style={{ fontSize: "56px", fontWeight: 700, lineHeight: 1.2, marginBottom: "35px", color: textColor, letterSpacing: "-1px" }}>
              {renderFormattedText(title)}
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
                isDark
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{ fontSize: "18px", fontWeight: 800, color: textColor, letterSpacing: "1px" }}>
          {displayUsername}
        </span>
        {!isLast && (
          <div style={{ display: "flex", alignItems: "center", color: "#6e6e6e", fontSize: "16px", fontWeight: 700 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
            <SwipeArrow color="#6e6e6e" />
          </div>
        )}
      </div>
    </div>
  );
}
