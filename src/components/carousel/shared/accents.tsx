import React from "react";

export const StarAccent = ({ color, size = 24 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const BurstAccent = ({ color, size = 40 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <path d="M20 2L23 12L33 15L23 18L20 28L17 18L7 15L17 12Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const MouseCursorIcon = ({ color = "currentColor" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={color} style={{ marginRight: 6, transform: "rotate(-15deg)" }}>
    <path d="M4.5 3v15.2l3.8-3.8 2.7 6.4 2.6-1.1-2.7-6.4 5.3-.2z" />
  </svg>
);

export const PinkScribbleLine = ({ offsetX = 0 }: { offsetX?: number }) => (
  <svg width="180" height="15" viewBox="0 0 180 15" fill="none" style={{ display: "flex", marginTop: "4px", marginLeft: `${offsetX}px` }}>
    <path d="M5,8 C45,2 135,2 175,7 C115,12 55,12 5,8" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" fill="none" />
  </svg>
);

export const PinkScribbleOval = () => (
  <svg width="280" height="72" viewBox="0 0 280 72" fill="none" style={{ position: "absolute", left: "-24px", top: "-16px"}}>
    <path d="M20,36 C20,18 130,10 250,20 C265,24 265,48 250,52 C130,62 20,54 20,36 Z" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" fill="none" />
  </svg>
);
