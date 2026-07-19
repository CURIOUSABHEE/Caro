import React from "react";
import type { ThemeSlideProps } from "../theme-types";
import { renderFormattedText } from "../../shared/formatted-text";
import { ContentRenderer } from "../../renderers/ContentRenderer";
import { tokensToThemeColors } from "../tokens/types";
import { frostedGridTokens } from "./tokens";
import ScribbleOverlay from "../../shared/scribble-overlay";
import { ProgressBar } from "../../shared/progress-bar";
import { SwipeArrow } from "../../shared/swipe-arrow";
import { renderSlideShapes } from "../../render-slide";

export default function FrostedGrid(props: ThemeSlideProps): React.ReactElement {
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
  const text = po?.text || frostedGridTokens.colors.text;
  const mutedText = po?.text ? "rgba(26,26,26,0.6)" : frostedGridTokens.colors.mutedText;
  const accent = po?.primary || frostedGridTokens.colors.accent;

  const glassFill = "rgba(255,255,255,0.6)";
  const glassBorder = "rgba(0,0,0,0.03)";
  const glassBorderTop = "rgba(255,255,255,0.9)";

  const tokens = { ...frostedGridTokens, colors: { ...frostedGridTokens.colors, text, accent } };
  const themeColors = tokensToThemeColors(tokens);

  return (
    <div
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: "#F8F9FA",
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
      <svg width="1080" height="1350" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={i} x1={i * 108} y1={0} x2={i * 108} y2={1350} stroke="rgba(0,0,0,0.03)" strokeWidth="1.5" />
        ))}
        <defs>
          <radialGradient id="purple-blob" cx="50%" cy="80%" r="65%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1080" height="1350" fill="url(#purple-blob)" />
      </svg>

      <div style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", display: "flex" }}>
        {[
          { r: 0, c: 9, o: 0.6 },
          { r: 1, c: 9, o: 0.5 },
          { r: 0, c: 8, o: 0.4 },
          { r: 1, c: 8, o: 0.35 },
          { r: 2, c: 9, o: 0.25 },
          { r: 12, c: 0, o: 0.5 },
          { r: 11, c: 0, o: 0.4 },
          { r: 12, c: 1, o: 0.3 },
          { r: 11, c: 1, o: 0.25 },
          { r: 10, c: 0, o: 0.15 },
        ].map((block, i) => (
          <div key={i} style={{
            width: "108px",
            height: "108px",
            backgroundColor: `rgba(255, 255, 255, ${block.o})`,
            borderTop: "1.5px solid rgba(255, 255, 255, 0.9)",
            borderLeft: "1.5px solid rgba(255, 255, 255, 0.9)",
            borderRight: "1px solid rgba(0, 0, 0, 0.03)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
            boxShadow: "inset 4px 4px 12px rgba(255, 255, 255, 0.6), 6px 6px 15px rgba(0, 0, 0, 0.05)",
            borderRadius: "20px",
            position: "absolute",
            left: `${block.c * 108}px`,
            top: `${block.r * 108}px`,
            boxSizing: "border-box",
          }} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "80px", justifyContent: "space-between" }}>
        {renderSlideShapes(shapes)}
        {type !== "COVER" && type !== "CLOSING" && scribble ? <ScribbleOverlay order={order} totalSlides={totalSlides} theme="frosted-grid" /> : null}
        <ProgressBar order={order} totalSlides={totalSlides} accentColor={accent} />

        {type === "COVER" ? null : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px", backgroundColor: glassFill, border: `1px solid ${glassBorder}`, borderTop: `1px solid ${glassBorderTop}`, borderLeft: `1px solid ${glassBorderTop}`, borderRadius: "9999px", width: "auto", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: accent, textTransform: "uppercase" }}>
              {type === "CLOSING" ? "Conclusion" : "Insight"}
            </span>
            <span style={{ fontSize: "13px", color: text, fontWeight: 700, marginLeft: "10px" }}>{pageLabel}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, margin: type === "COVER" ? "0" : "30px 0" }}>
          {type === "COVER" ? (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", maxWidth: "900px", marginTop: "20px" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "rgba(0,0,0,0.3)", textTransform: "uppercase", marginBottom: "20px", letterSpacing: "1px" }}>{pageLabel || "Design Resources"}</span>
                <div style={{ display: "flex", position: "relative" }}>
                  <h1 style={{ fontSize: "120px", fontWeight: 900, lineHeight: 1.05, color: text, letterSpacing: "-4px", margin: 0, position: "relative" }}>
                    {renderFormattedText(title, { color: accent }, { color: text }, "flex-start")}
                  </h1>
                  <svg width="50" height="50" viewBox="0 0 60 60" style={{ position: "absolute", right: "-50px", top: "-10px" }}>
                    <path d="M30 0 C30 20 40 30 60 30 C40 30 30 40 30 60 C30 40 20 30 0 30 C20 30 30 20 30 0" fill={text} opacity="0.6" />
                  </svg>
                  <svg width="30" height="30" viewBox="0 0 60 60" style={{ position: "absolute", right: "-80px", top: "10px" }}>
                    <path d="M30 0 C30 20 40 30 60 30 C40 30 30 40 30 60 C30 40 20 30 0 30 C20 30 30 20 30 0" fill={text} opacity="0.4" />
                  </svg>
                </div>
              </div>

              {body && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginTop: "auto", marginBottom: "40px" }}>
                  <p style={{ fontSize: "32px", color: "#ffffff", lineHeight: 1.3, maxWidth: "700px", fontWeight: 600, textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                    {renderFormattedText(body, {}, {}, "flex-start")}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", padding: "10px 24px", backgroundColor: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: "9999px", marginTop: "24px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>{displayUsername || "By Author"}</span>
                  </div>
                </div>
              )}
            </div>
          ) : type === "CLOSING" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center", flexGrow: 1 }}>
              <svg width="60" height="60" viewBox="0 0 60 60" style={{ marginBottom: "30px" }}>
                <path d="M30 0 C30 20 40 30 60 30 C40 30 30 40 30 60 C30 40 20 30 0 30 C20 30 30 20 30 0" fill={text} opacity="0.6" />
              </svg>
              <h1 style={{ fontSize: "80px", fontWeight: 900, lineHeight: 1.1, marginBottom: "35px", letterSpacing: "-2px" }}>
                {renderFormattedText(title, { color: accent }, { color: text }, "center")}
              </h1>
              <p style={{ fontSize: "28px", color: mutedText, lineHeight: 1.5, marginBottom: "50px", maxWidth: "700px", fontWeight: 500 }}>
                {renderFormattedText(body, {}, {}, "center")}
              </p>
              <div style={{ display: "flex", padding: "20px 54px", backgroundColor: text, borderRadius: "9999px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
                <span style={{ fontSize: "24px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "1px" }}>{displayUsername || "Join Now"}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", padding: "40px", backgroundColor: glassFill, border: `1.5px solid ${glassBorder}`, borderTop: `1.5px solid ${glassBorderTop}`, borderLeft: `1.5px solid ${glassBorderTop}`, borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", marginTop: "20px" }}>
              <h2 style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.25, marginBottom: "24px", letterSpacing: "-1px", color: text }}>
                {renderFormattedText(title, { color: accent })}
              </h2>
              <ContentRenderer
                visualType={visualType}
                visualData={visualData}
                body={body}
                imageUrl={imageUrl}
                imageLayout={imageLayout}
                themeColors={themeColors}
                codeTheme="dark"
                bulletChar="▪"
                bulletIcon="▪"
                codeBlockWrapper={(codeBlock) => (
                  <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#0F172A", borderRadius: "16px", overflow: "hidden" }}>
                    {codeBlock}
                  </div>
                )}
                imageContainerStyle={{ marginTop: "16px", borderRadius: "16px", overflow: "hidden", border: `1px solid ${glassBorder}` }}
                imageStyle={{ borderRadius: 0 }}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", padding: "8px 20px", backgroundColor: "#F8FAFC", border: `1px solid #E2E8F0`, borderRadius: "9999px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: text }}>{displayUsername}</span>
          </div>
          {!isLast && (
            <div style={{ display: "flex", alignItems: "center", color: accent, fontSize: "14px", fontWeight: 700 }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Swipe</span>
              <SwipeArrow color={accent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
