import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText, lightCodeStyle } from "../../shared/formatted-text";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { meshGlowTokens } from "./tokens";
import PanoramicBackground from "../../shared/panoramic-background";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";
import { renderSlideShapes } from "../../render-slide";

const THEME_NAME = "mesh-glow";
const SCRIBBLE_COLOR = "#ec4899";

export default function MeshGlowTheme({
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
  websiteUrl,
}: ThemeSlideProps): React.ReactElement {
  const po = slide.paletteOverride;
  const mgText = po?.text || meshGlowTokens.colors.text;
  const mgAccent = po?.primary || meshGlowTokens.colors.accent;
  const mgMuted = po?.secondary || meshGlowTokens.colors.mutedText;
  const mgBg = po?.background || "#fdf2f8";

  const tokens = { ...meshGlowTokens, colors: { ...meshGlowTokens.colors, text: mgText, accent: mgAccent } };
  const themeColors = tokensToThemeColors(tokens);

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        color: mgText,
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
      {!hasBgImage && <PanoramicBackground theme="mesh-glow" order={order} totalSlides={totalSlides} />}

      {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={THEME_NAME} /> : null}
      <ProgressBar order={order} totalSlides={totalSlides} accentColor={mgAccent} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "42px", fontWeight: 800, color: mgAccent, transform: "translateY(-6px)" }}>
            *
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "40px 0" }}>
        {type === "COVER" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <h1 style={{ fontSize: "78px", fontWeight: 900, lineHeight: 1.05, marginBottom: "40px", letterSpacing: "-2px", color: mgText }}>
              {renderFormattedText(title, { color: mgAccent })}
            </h1>
            <div style={{ display: "flex", marginTop: "45px" }}>
              <div style={{ border: `1.5px solid ${mgText}`, borderRadius: "9999px", padding: "10px 24px", display: "flex" }}>
                <span style={{ fontSize: "14px", fontWeight: 850, letterSpacing: "1px", textTransform: "uppercase" }}>
                  {body || "Swipe to learn"}
                </span>
              </div>
            </div>
          </div>
        ) : type === "CLOSING" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", width: "100%", paddingLeft: "10px" }}>
            <div style={{ width: "60px", height: "2px", backgroundColor: mgAccent, marginBottom: "32px" }} />
            <span style={{ fontSize: "13px", color: mgMuted, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>Final Take</span>
            <h1 style={{ fontSize: "54px", fontWeight: 900, lineHeight: 1.15, marginBottom: "36px", letterSpacing: "-1px", color: mgText, fontFamily: "Playfair Display, serif" }}>
              {renderFormattedText(title, { color: mgAccent }, {}, "flex-start")}
            </h1>
            <div style={{ width: "100%", height: "1px", backgroundColor: `${mgAccent}40`, marginBottom: "28px" }} />
            <div style={{ padding: "14px 32px", border: `1.5px solid ${mgAccent}`, borderRadius: "6px", display: "flex", alignItems: "center", backgroundColor: `${mgAccent}10` }}>
              <span style={{ fontSize: "18px", fontWeight: 700, color: mgAccent, fontStyle: "italic" }}>{body || "Share this insight →"}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <div style={{ display: "flex", marginBottom: "25px" }}>
              <div style={{ display: "flex", border: `1.5px solid ${mgText}`, borderRadius: "9999px", padding: "6px 18px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Step {order}
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: "30px", color: mgText }}>
              {renderFormattedText(title, { color: mgAccent }, {}, "flex-start", undefined, { scribble, color: SCRIBBLE_COLOR, fontSize: 56 })}
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
                bulletChar="•"
                codeStyle={lightCodeStyle}
                imageContainerStyle={{ marginTop: "30px", borderRadius: "12px", border: "1.5px solid #e5e7eb", maxHeight: "350px", overflow: "hidden" }}
                imageStyle={{ maxHeight: "350px", objectFit: "cover" }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "1.5px", color: mgMuted, textTransform: "uppercase" }}>
          {websiteUrl || "reallygreatsite.com"}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "1px", color: mgMuted }}>
          2026
        </span>
      </div>
    </div>
  );
}
