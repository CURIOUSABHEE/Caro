import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText } from "../../shared/formatted-text";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { cyberHorizonTokens } from "./tokens";
import { SwipeArrow } from "../../shared/swipe-arrow";
import PanoramicBackground from "../../shared/panoramic-background";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";
import { renderSlideShapes } from "../../render-slide";
import { getSeededRandom } from "../../lib/seeded-random";

const THEME_NAME = "cyber-horizon";

export default function CyberHorizon(props: ThemeSlideProps): React.ReactElement {
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
  const chText = po?.text || cyberHorizonTokens.colors.text;
  const chAccent = po?.primary || cyberHorizonTokens.colors.accent;
  const chMuted = po?.secondary || cyberHorizonTokens.colors.mutedText;
  const chBg = po?.background || cyberHorizonTokens.colors.background;

  const tokens = { ...cyberHorizonTokens, colors: { ...cyberHorizonTokens.colors, text: chText, accent: chAccent, mutedText: chMuted, background: chBg } };
  const themeColors = tokensToThemeColors(tokens, { glassBorder: "rgba(255,255,255,0.1)" });

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        display: "flex",
        flexDirection: "column",
        padding: cyberHorizonTokens.spacing.padding,
        boxSizing: "border-box",
        backgroundColor: chBg,
        color: chText,
        fontFamily: cyberHorizonTokens.typography.headingFont,
        position: "relative",
        justifyContent: "space-between",
        overflow: "hidden",
        ...bgImageStyle,
      }}
    >
      {!hasBgImage && <PanoramicBackground theme="cyber-horizon" order={order} totalSlides={totalSlides} />}

      {renderSlideShapes(shapes)}{type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme={THEME_NAME} /> : null}
      <ProgressBar order={order} totalSlides={totalSlides} accentColor={chAccent} />

      {!hasBgImage && (() => {
        const rng = getSeededRandom(`cyber-brackets-${order}`);
        const showTop = rng() > 0.5;
        const showBottom = rng() > 0.5;
        return (
          <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
            {showTop && (
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ position: "absolute", top: "30px", right: "30px" }}>
                <path d="M60 0 L60 60 M0 0 L60 0" stroke={chAccent} strokeWidth="2" opacity="0.3" />
              </svg>
            )}
            {showBottom && (
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ position: "absolute", bottom: "30px", left: "30px" }}>
                <path d="M0 60 L0 0 M0 60 L60 60" stroke={chAccent} strokeWidth="2" opacity="0.3" />
              </svg>
            )}
          </div>
        );
      })()}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{ display: "flex", backgroundColor: cyberHorizonTokens.colors.badgeBg, border: cyberHorizonTokens.borders.badge, borderRadius: cyberHorizonTokens.radius.badge, padding: "6px 16px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: cyberHorizonTokens.colors.badgeText }}>
            {type === "COVER" ? "Introduction" : type === "CLOSING" ? "Roadmap" : `Step ${order}`}
          </span>
        </div>
          <span style={{ fontSize: "14px", color: chMuted, fontWeight: 700, letterSpacing: "1px" }}>{pageLabel}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, margin: "40px 0" }}>
        {type === "COVER" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontSize: "74px", fontWeight: 700, lineHeight: 1.15, marginBottom: "40px", letterSpacing: "-1.5px", textTransform: "uppercase" }}>
              {renderFormattedText(title, { color: chAccent }, {}, "center")}
            </h1>
            <div style={{ display: "flex", backgroundColor: cyberHorizonTokens.colors.badgeBg, border: cyberHorizonTokens.borders.badge, borderRadius: cyberHorizonTokens.radius.card, padding: "16px 28px" }}>
              <p style={{ fontSize: "24px", color: "#cccccc", lineHeight: 1.5, margin: 0, textAlign: "center" }}>
                {renderFormattedText(body, { color: chAccent }, {}, "center")}
              </p>
            </div>
          </div>
        ) : type === "CLOSING" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%", position: "relative" }}>
            <span style={{ fontSize: "12px", color: chMuted, marginBottom: "22px", textTransform: "uppercase", letterSpacing: "6px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{"// END TRANSMISSION"}</span>
            <h1 style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1.15, marginBottom: "40px", letterSpacing: "-1px", color: chText, fontFamily: "JetBrains Mono, monospace" }}>
              {renderFormattedText(title, { color: chAccent }, {}, "center")}
            </h1>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.2 }} viewBox="0 0 200 56" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke={chAccent} strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="200" height="56" fill="url(#grid)" rx="6" />
              </svg>
              <div style={{ padding: "16px 44px", border: `1.5px solid ${chAccent}`, borderRadius: "6px", backgroundColor: "rgba(234,88,12,0.1)", display: "flex", alignItems: "center", position: "relative"}}>
                <span style={{ fontSize: "18px", fontWeight: 700, color: chAccent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "1px" }}>{body || "$ follow --now"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <h2 style={{ fontSize: "56px", fontWeight: 700, lineHeight: 1.2, marginBottom: "35px", color: chText, letterSpacing: "-1px", textTransform: "uppercase" }}>
              {renderFormattedText(title, { color: chAccent })}
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
        <div style={{ display: "flex", backgroundColor: cyberHorizonTokens.colors.badgeBg, border: cyberHorizonTokens.borders.badge, borderRadius: cyberHorizonTokens.radius.badge, padding: "6px 16px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: chText }}>
            {displayUsername || "cyber-horizon"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: chMuted }}>
            SWIPE
          </span>
          <SwipeArrow color={chMuted} />
        </div>
      </div>
    </div>
  );
}
