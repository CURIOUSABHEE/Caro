import React from "react";
import { getSeededRandom } from "../lib/seeded-random";

const ScribbleOverlay = ({ order, totalSlides, theme }: { order: number; totalSlides: number; theme: string }) => {
  const rng = getSeededRandom(`scribble-${order}`);
  const color = theme === "cyber-horizon" ? "#ea580c" : theme === "linen-rust" ? "#c5563c" : theme === "warm-editorial" ? "#e05a47" : theme === "soft-gradient" ? "#7c3aed" : theme === "mesh-glow" ? "#ec4899" : theme === "neo-brutalism" ? "#161616" : theme === "neomorphism" ? "#E8503A" : theme === "frosted-grid" ? "#FDE68A" : theme === "glassmorphism" ? "#38bdf8" : theme === "liquid-glass" ? "#0ea5e9" : "#ffffff";

  const elements: React.ReactElement[] = [];

  const scribbleCount = Math.floor(rng() * 3) + 2;

  for (let i = 0; i < scribbleCount; i++) {
    const scribbleType = Math.floor(rng() * 5);
    const x = Math.floor(80 + rng() * 820);
    const y = Math.floor(180 + rng() * 870);

    if (scribbleType === 0) {
      const endX = Math.floor(x + 60 + rng() * 100);
      elements.push(
        <svg key={`su-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width={endX - x + 20} height="24" viewBox={`0 0 ${endX - x + 20} 24`} fill="none">
          <path d={`M0,12 Q${(endX - x) / 4},${18 + (rng() > 0.5 ? 6 : -6)} ${(endX - x) / 2},12 T${endX - x},12`} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
        </svg>
      );
    } else if (scribbleType === 1) {
      elements.push(
        <svg key={`star-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d={`M12,2 L14,9 L21,9 L15,14 L17,21 L12,17 L7,21 L9,14 L3,9 L10,9 Z`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
        </svg>
      );
    } else if (scribbleType === 2) {
      const w = Math.floor(60 + rng() * 120);
      const h = Math.floor(40 + rng() * 80);
      elements.push(
        <svg key={`bracket-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width={w + 10} height={h + 10} viewBox={`0 0 ${w + 10} ${h + 10}`} fill="none">
          <path d={`M6,0 Q0,0 0,${h / 2} Q0,${h} 6,${h}`} stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d={`M${w + 4},0 Q${w + 10},0 ${w + 10},${h / 2} Q${w + 10},${h} ${w + 4},${h}`} stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        </svg>
      );
    } else if (scribbleType === 3) {
      const endX = Math.floor(x + 60 + rng() * 80);
      const endY = Math.floor(y + 30 + rng() * 40);
      elements.push(
        <svg key={`arrow-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width={endX - x + 30} height={endY - y + 20} viewBox={`0 0 ${endX - x + 30} ${endY - y + 20}`} fill="none">
          <path d={`M0,0 C${(endX - x) / 3},${(endY - y) / 3} ${(endX - x) * 2 / 3},${(endY - y) * 2 / 3} ${endX - x},${endY - y}`} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
          <path d={`M${endX - x - 8},${endY - y - 6} L${endX - x},${endY - y} L${endX - x - 6},${endY - y - 10}`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
        </svg>
      );
    } else {
      elements.push(
        <svg key={`dots-${i}`} style={{ position: "absolute", top: `${y}px`, left: `${x}px`, pointerEvents: "none" }} width="40" height="12" viewBox="0 0 40 12" fill="none">
          <path d={`M4,6 Q10,${6 + (rng() > 0.5 ? 4 : -4)} 16,6 Q22,${6 + (rng() > 0.5 ? 4 : -4)} 28,6 Q34,${6 + (rng() > 0.5 ? 4 : -4)} 40,6`} stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" />
        </svg>
      );
    }
  }

  return <div style={{ position: "absolute", top: 0, left: 0, width: "1080px", height: "1350px", pointerEvents: "none", display: "flex" }}>{elements}</div>;
};

export default ScribbleOverlay;
