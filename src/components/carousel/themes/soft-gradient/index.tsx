import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText, lightCodeStyle } from "../../shared/formatted-text";
import PanoramicBackground from "../../shared/panoramic-background";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { renderSlideShapes } from "../../render-slide";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { softGradientTokens } from "./tokens";
import { tokensToThemeColors } from "../tokens/types";

const THEME_NAME = "soft-gradient";

export default function SoftGradientTheme({
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
  const accent = po?.primary || "#7c3aed";
  const bg = po?.background;
  const textColor = po?.text;
  const secondary = po?.secondary;
  const themeColors = tokensToThemeColors(softGradientTokens, { glassBg: "rgba(124, 58, 237, 0.04)", glassBorder: "rgba(124, 58, 237, 0.08)" });

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        color: textColor || "#1e293b",
        fontFamily: "Outfit",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px",
        boxSizing: "border-box",
        position: "relative",
        backgroundColor: bg || "#ffffff",
        ...bgImageStyle,
      }}
    >
      {!hasBgImage && <PanoramicBackground theme="soft-gradient" order={order} totalSlides={totalSlides} />}

      {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={THEME_NAME} /> : null}
      <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "rgba(255, 255, 255, 0.45)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          borderRadius: "32px",
          padding: "70px",
          width: "920px",
          height: "1190px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ padding: "6px 16px", backgroundColor: "rgba(255, 255, 255, 0.5)", borderRadius: "9999px", display: "flex", border: "1px solid rgba(255, 255, 255, 0.6)" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: secondary || "#475569" }}>
              {type === "COVER" ? "Cover Story" : type === "CLOSING" ? "CTA" : "Takeaway"}
            </span>
          </div>
          <span style={{ fontSize: "14px", color: secondary || "#475569", fontWeight: 800 }}>{pageLabel}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "35px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "66px", fontWeight: 800, lineHeight: 1.15, color: textColor || "#0f172a", marginBottom: "35px", letterSpacing: "-1.5px" }}>
                {renderFormattedText(title, { color: accent }, {}, "center")}
              </h1>
              <p style={{ fontSize: "26px", color: secondary || "#475569", lineHeight: 1.5, maxWidth: "780px" }}>
                {renderFormattedText(body, {}, {}, "center", lightCodeStyle)}
              </p>
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <h1 style={{ fontSize: "60px", fontWeight: 800, lineHeight: 1.2, color: textColor || "#0f172a", marginBottom: "35px", letterSpacing: "-1px" }}>
                {renderFormattedText(title, { color: accent }, {}, "center")}
              </h1>
              <p style={{ fontSize: "26px", color: secondary || "#475569", lineHeight: 1.5, marginBottom: "40px", maxWidth: "700px" }}>
                {renderFormattedText(body, {}, {}, "center", lightCodeStyle)}
              </p>
              <div style={{ display: "flex", alignItems: "center", padding: "16px 36px", backgroundColor: accent, borderRadius: "9999px", color: "#ffffff", fontWeight: 800, fontSize: "18px", letterSpacing: "0.5px" }}>
                {displayUsername || "Join The Conversation"}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <h2 style={{ fontSize: "50px", fontWeight: 800, lineHeight: 1.25, color: textColor || "#0f172a", marginBottom: "25px", letterSpacing: "-1px" }}>
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
          <span style={{ fontSize: "14px", fontWeight: 700, color: secondary || "#475569", letterSpacing: "1px" }}>
            {displayUsername}
          </span>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: textColor || "#0f172a", fontSize: "14px", fontWeight: 800 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
              <SwipeArrow color={textColor || "#0f172a"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
