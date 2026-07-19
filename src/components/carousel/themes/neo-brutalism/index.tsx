import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { neoBrutalismTokens } from "./tokens";
import { renderFormattedText } from "../../shared/formatted-text";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { StarAccent } from "../../shared/accents";
import { renderSlideShapes } from "../../render-slide";

const THEME_NAME = "neo-brutalism";

export default function NeoBrutalism(props: ThemeSlideProps): React.ReactElement {
  const {
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
    visualData,
    visualType,
    imageUrl,
    imageLayout,
  } = props;

  const po = slide.paletteOverride;
  const cream = po?.background || "#F7F3EC";
  const text = po?.text || "#141414";
  const orange = po?.primary || "#F4623A";
  const yellow = po?.secondary || "#FFD400";
  const teal = po?.tertiary || "#2EC4B6";
  const pop = po?.tertiary || "#FF3EA5";
  const slideVariant = order % 2 === 0 ? "orange" : "teal";
  const headerColor = slideVariant === "orange" ? orange : teal;
  const pct = totalSlides > 1 ? Math.round(((order + 1) / totalSlides) * 100) : 100;
  const shadowCream = `10px 10px 0px ${slideVariant === "orange" ? teal : yellow}`;
  const shadowSolid = `10px 10px 0px ${text}`;

  const tokens = { ...neoBrutalismTokens, colors: { ...neoBrutalismTokens.colors, text, accent: orange } };
  const themeColors = tokensToThemeColors(tokens);

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: type === "CLOSING" ? orange : cream,
        color: text,
        fontFamily: "Outfit",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ...bgImageStyle,
      }}
    >
      {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={THEME_NAME} /> : null}

      <svg width="1080" height="1350" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill={text} opacity="0.1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {type === "COVER" ? (
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <div style={{ backgroundColor: headerColor, padding: "18px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: cream, letterSpacing: "3px", textTransform: "uppercase" }}>Introduction</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: cream }}>{pageLabel}</span>
          </div>
          <div style={{ display: "flex", height: "6px", backgroundColor: "rgba(0,0,0,0.1)" }}>
            <div style={{ width: `${pct}%`, height: "6px", backgroundColor: yellow }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "60px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flexGrow: 1, justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: "-10px", right: "40px", display: "flex" }}>
                <StarAccent color={pop} size={36} />
              </div>
              <h1 style={{ fontSize: "86px", fontWeight: 900, lineHeight: 1.05, marginBottom: "40px", letterSpacing: "-3.5px", textTransform: "uppercase", position: "relative" }}>
                {renderFormattedText(title, { color: orange, fontFamily: "Playfair Display", fontStyle: "italic" }, { color: text }, "flex-start")}
              </h1>
              {body && (
                <div style={{ display: "flex", padding: "24px 32px", border: `3.5px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, backgroundColor: cream, maxWidth: "85%", position: "relative" }}>
                  <p style={{ fontSize: "22px", color: text, lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
                    {renderFormattedText(body, {}, {}, "flex-start")}
                  </p>
                </div>
              )}
              <div style={{ marginTop: "50px", display: "flex", alignItems: "center" }}>
                <span style={{ padding: "6px 18px", border: `3px solid ${text}`, borderRadius: "9999px", fontSize: "13px", fontWeight: 800, color: text, textTransform: "uppercase" }}>
                  {displayUsername || "Featured"}
                </span>
                <div style={{ width: "80px", height: "3px", backgroundColor: orange, marginLeft: "16px" }} />
              </div>
            </div>
          </div>
        </div>
      ) : type === "CLOSING" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, padding: "60px", position: "relative" }}>
          <div style={{ position: "absolute", top: "-10px", right: "40px", display: "flex" }}>
            <StarAccent color={pop} size={36} />
          </div>
          <h1 style={{ fontSize: "76px", fontWeight: 900, lineHeight: 1.1, marginBottom: "40px", letterSpacing: "-3px", textTransform: "uppercase", textAlign: "center", maxWidth: "850px", position: "relative" }}>
            {renderFormattedText(title, { color: yellow, fontFamily: "Playfair Display", fontStyle: "italic" }, { color: cream }, "center")}
          </h1>
          {body && (
            <p style={{ fontSize: "24px", color: cream, lineHeight: 1.5, fontWeight: 500, textAlign: "center", maxWidth: "650px", marginBottom: "50px" }}>
              {renderFormattedText(body, {}, {}, "center")}
            </p>
          )}
          <div style={{ display: "flex", padding: "22px 60px", backgroundColor: yellow, border: `3.5px solid ${text}`, borderRadius: "9999px", boxShadow: shadowSolid, position: "relative" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: text, letterSpacing: "1px" }}>{displayUsername || "Get Started"}</span>
          </div>
          <div style={{ position: "absolute", bottom: "60px", right: "60px", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: cream, textTransform: "uppercase", letterSpacing: "2px" }}>{pageLabel}</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <div style={{ backgroundColor: headerColor, padding: "18px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: cream, letterSpacing: "3px", textTransform: "uppercase" }}>
              Insight
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: cream }}>{pageLabel}</span>
          </div>
          <div style={{ display: "flex", height: "6px", backgroundColor: "rgba(0,0,0,0.1)" }}>
            <div style={{ width: `${pct}%`, height: "6px", backgroundColor: yellow }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "30px 60px 20px 60px", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <div style={{ display: "flex", marginBottom: "8px" }}>
              <StarAccent color={pop} size={20} />
            </div>

            <h2 style={{ fontSize: "46px", fontWeight: 900, lineHeight: 1.15, marginBottom: "20px", letterSpacing: "-2px", textTransform: "uppercase", position: "relative" }}>
              {renderFormattedText(title, { color: orange, fontFamily: "Playfair Display", fontStyle: "italic" }, {}, "center")}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
              <ContentRenderer
                visualType={visualType}
                visualData={visualData}
                body={body}
                imageUrl={imageUrl}
                imageLayout={imageLayout}
                themeColors={themeColors}
                codeTheme="dark"
                bulletIcon="▸"
                codeBlockWrapper={(codeBlock: React.ReactElement) => (
                  <div style={{ border: `3px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, display: "flex", overflow: "hidden", backgroundColor: cream, maxWidth: "800px", marginBottom: body ? "16px" : "0" }}>
                    {codeBlock}
                  </div>
                )}
                diagramWrapper={(diagram: React.ReactElement) => (
                  <div style={{ display: "flex", width: "100%", maxWidth: "800px", justifyContent: "center", alignItems: "center", border: `3px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, padding: "24px", boxSizing: "border-box", backgroundColor: cream }}>
                    {diagram}
                  </div>
                )}
                imageContainerStyle={{ border: `3px solid ${text}`, borderRadius: "20px", boxShadow: shadowCream, marginTop: "24px", overflow: "hidden", backgroundColor: cream, width: "100%", maxWidth: "800px" }}
                imageStyle={{ maxHeight: "300px" }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: teal, padding: "14px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: cream }}>{displayUsername}</span>
            </div>
            {!isLast && (
              <div style={{ display: "flex", alignItems: "center", color: cream, fontSize: "13px", fontWeight: 700 }}>
                <span style={{ textTransform: "uppercase", letterSpacing: "2px" }}>Swipe</span>
                <SwipeArrow color={cream} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
