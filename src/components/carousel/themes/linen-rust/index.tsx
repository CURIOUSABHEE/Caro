import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText, lightCodeStyle } from "../../shared/formatted-text";
import PanoramicBackground from "../../shared/panoramic-background";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { renderSlideShapes } from "../../render-slide";
import { getSeededRandom } from "../../lib/seeded-random";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { linenRustTokens } from "./tokens";

const THEME_NAME = "linen-rust";

export default function LinenRust(props: ThemeSlideProps): React.ReactElement {
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
  const lrText = po?.text || linenRustTokens.colors.text;
  const lrAccent = po?.primary || linenRustTokens.colors.accent;
  const lrMuted = po?.secondary || linenRustTokens.colors.mutedText;
  const lrBg = po?.background || linenRustTokens.colors.background;

  const themeColors = {
    ...tokensToThemeColors(linenRustTokens, { glassBorder: "rgba(197, 86, 60, 0.06)" }),
    text: lrText,
    accent: lrAccent,
    muted: lrMuted,
    background: lrBg,
  };

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        display: "flex",
        flexDirection: "column",
        padding: "100px 90px",
        boxSizing: "border-box",
        backgroundColor: lrBg,
        color: lrText,
        fontFamily: "Outfit",
        position: "relative",
        justifyContent: "space-between",
        overflow: "hidden",
        ...bgImageStyle,
      }}
    >
      {!hasBgImage && <PanoramicBackground theme="linen-rust" order={order} totalSlides={totalSlides} />}

      <svg width="1080" height="1350" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
        <defs>
          <pattern id="linen-pattern" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="none" />
            <path d="M 0 0 L 2 2 M 4 0 L 6 2 M 0 4 L 2 6" stroke={lrAccent} strokeWidth="0.5" opacity="0.08" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#linen-pattern)" />
      </svg>

      {!hasBgImage && (() => {
        const rng = getSeededRandom(`linen-stars-${order}`);
        const numDiamonds = Math.floor(rng() * 3) + 2;
        const diamonds = [];
        for (let sIdx = 0; sIdx < numDiamonds; sIdx++) {
          const sx = Math.floor(80 + rng() * 920);
          const sy = Math.floor(80 + rng() * 1190);
          const size = Math.floor(14 + rng() * 18);
          const opacity = (0.15 + rng() * 0.25).toFixed(2);
          const half = size / 2;
          const d = `M${half} 0 L${size} ${half} L${half} ${size} L0 ${half} Z`;
          diamonds.push(
            <svg key={sIdx} style={{ position: "absolute", left: `${sx}px`, top: `${sy}px`, width: `${size}px`, height: `${size}px` }}>
              <path d={d} fill={lrAccent} opacity={opacity} />
            </svg>
          );
        }
        return <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>{diamonds}</div>;
      })()}

      {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={THEME_NAME} /> : null}
      <ProgressBar order={order} totalSlides={totalSlides} accentColor={lrAccent} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: lrMuted }}>
          {type === "COVER" ? "* Overview" : type === "CLOSING" ? "* Wrap-up" : `* Insight ${order}`}
        </span>
        <span style={{ fontSize: "13px", color: lrMuted, fontWeight: 700 }}>{pageLabel}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "40px 0" }}>
        {type === "COVER" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", position: "relative" }}>
            <h1 style={{ fontSize: "74px", fontWeight: 700, lineHeight: 1.15, marginBottom: "30px", letterSpacing: "-1px", color: lrText }}>
              {renderFormattedText(title, { fontFamily: "Caveat", fontSize: "86px", color: lrAccent, fontWeight: 400, fontStyle: "normal" })}
            </h1>
            <div style={{ width: "80px", height: "4px", backgroundColor: lrAccent, marginBottom: "40px" }} />
            <p style={{ fontSize: "28px", color: lrMuted, lineHeight: 1.5, maxWidth: "750px" }}>
              {renderFormattedText(body, { fontFamily: "Caveat", fontSize: "36px", color: lrAccent, fontWeight: 400, fontStyle: "normal" }, {}, "flex-start", lightCodeStyle)}
            </p>
          </div>
        ) : type === "CLOSING" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%", position: "relative" }}>
            <span style={{ fontSize: "14px", color: lrMuted, marginBottom: "20px", textTransform: "uppercase", letterSpacing: "5px", fontWeight: 700 }}>One Last Thing</span>
            <h1 style={{ fontSize: "58px", fontWeight: 700, lineHeight: 1.2, marginBottom: "36px", letterSpacing: "-0.5px", color: lrText, fontFamily: "Playfair Display, serif" }}>
              {renderFormattedText(title, { color: lrAccent }, {}, "center")}
            </h1>
            <div style={{ width: "100px", height: "2px", background: `linear-gradient(to right, transparent, ${lrAccent}, transparent)`, marginBottom: "32px" }} />
            <div style={{ padding: "18px 50px", border: `2.5px solid ${lrAccent}`, borderRadius: "9999px", backgroundColor: `${lrAccent}10`, display: "flex", alignItems: "center", boxShadow: `4px 6px 0px ${lrAccent}30` }}>
              <span style={{ fontSize: "28px", fontWeight: 700, color: lrAccent, fontFamily: "Caveat, cursive" }}>{body || "Share with someone this helps"}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", position: "relative" }}>
            <h2 style={{ fontSize: "52px", fontWeight: 700, lineHeight: 1.2, marginBottom: "30px", color: lrText, letterSpacing: "-0.5px" }}>
              {renderFormattedText(title, { fontFamily: "Caveat", fontSize: "62px", color: lrAccent, fontWeight: 400, fontStyle: "normal" })}
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
                codeStyle={lightCodeStyle}
                serifStyle={{ fontFamily: "Caveat", fontSize: "24px", color: lrAccent, fontWeight: 400, fontStyle: "normal" }}
                imageContainerStyle={{ marginTop: "35px" }}
                imageStyle={{ borderRadius: "6px", maxHeight: "350px", border: `1px solid ${lrText}25` }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: lrMuted }}>
          {displayUsername || "linen-rust"}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: lrMuted }}>
          * swipe
        </span>
      </div>
    </div>
  );
}
