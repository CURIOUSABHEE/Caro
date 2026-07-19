import React from "react";

export const ProgressBar = ({ order, totalSlides, accentColor }: { order: number; totalSlides: number; accentColor: string }) => {
  const pct = totalSlides > 1 ? Math.round(((order + 1) / totalSlides) * 100) : 100;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", display: "flex"}}>
      <div style={{ width: `${pct}%`, height: "3px", backgroundColor: accentColor, opacity: 0.85 }} />
    </div>
  );
};
