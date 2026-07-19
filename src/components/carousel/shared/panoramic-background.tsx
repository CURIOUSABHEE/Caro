import React from "react";
import { getSeededRandom } from "../lib/seeded-random";

const PanoramicBackground = ({ theme, order = 0, totalSlides = 1 }: { order?: number; totalSlides?: number; theme: string }) => {
  const width = 1080;
  const height = 1350;

  const meshBlobs: { cx: number; cy: number; r: number; color1: string; color2: string; opacity: number }[] = [];
  if (theme === "mesh-glow") {
    const startSlide = Math.max(0, order - 1);
    const endSlide = order + 1;

    for (let s = startSlide; s <= endSlide; s++) {
      const baseOffset = s * width - order * width;
      if (s === 0) {
        meshBlobs.push(
          { cx: 950 - order * width, cy: 150, r: 250, color1: "#ec4899", color2: "#db2777", opacity: 0.7 },
          { cx: 200 - order * width, cy: 1150, r: 280, color1: "#a855f7", color2: "#9333ea", opacity: 0.75 }
        );
      } else {
        const layoutType = s % 2;
        if (layoutType === 1) {
          meshBlobs.push(
            { cx: baseOffset + 850, cy: 200, r: 250, color1: "#a855f7", color2: "#9333ea", opacity: 0.7 },
            { cx: baseOffset + 300, cy: 1150, r: 280, color1: "#ec4899", color2: "#db2777", opacity: 0.75 }
          );
        } else {
          meshBlobs.push(
            { cx: baseOffset + 950, cy: 150, r: 260, color1: "#ec4899", color2: "#db2777", opacity: 0.75 },
            { cx: baseOffset + 200, cy: 1150, r: 240, color1: "#a855f7", color2: "#9333ea", opacity: 0.7 }
          );
        }
      }
    }
  }

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme === "warm-editorial" ? "#f5f2eb" : theme === "linen-rust" ? "#d8d7cf" : theme === "cyber-horizon" ? "#050505" : "#fbfbfc"
        }}
      />

      {theme === "soft-gradient" && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <rect x="0" y="0" width={width} height={height} fill="url(#sgBg)" opacity="0.15" />
          <defs>
            <linearGradient id="sgBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {theme === "mesh-glow" && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <defs>
            <filter id="mesh-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="80" />
            </filter>
            {meshBlobs.map((blob, idx) => (
              <radialGradient key={`rg-${idx}`} id={`rg-blob-${idx}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={blob.color1} stopOpacity={blob.opacity} />
                <stop offset="60%" stopColor={blob.color2} stopOpacity={blob.opacity * 0.4} />
                <stop offset="100%" stopColor={blob.color2} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          <g filter="url(#mesh-glow-blur)">
            {meshBlobs.map((blob, idx) => (
              <circle key={`c-${idx}`} cx={blob.cx} cy={blob.cy} r={blob.r} fill={`url(#rg-blob-${idx})`} />
            ))}
          </g>
        </svg>
      )}

      {theme === "warm-editorial" && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 0", opacity: 0.06 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`wl-${i}`} style={{ height: "1px", backgroundColor: "#e05a47", marginLeft: i % 2 === 0 ? "0" : "200px", width: i % 2 === 0 ? "1080px" : "880px" }} />
          ))}
        </div>
      )}

      {theme === "cyber-horizon" && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08 }}>
          {Array.from({ length: Math.ceil(width / 120) }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 120} y1={0} x2={i * 120} y2={height} stroke="#ffffff" strokeWidth="1" />
          ))}
          {Array.from({ length: Math.ceil(height / 120) }).map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={i * 120} x2={width} y2={i * 120} stroke="#ffffff" strokeWidth="1" />
          ))}
        </svg>
      )}
    </div>
  );
};

export default PanoramicBackground;
