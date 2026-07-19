import React from "react";

export const SwipeArrow = ({ color = "currentColor" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
    <path d="M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5L19 12L12 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HandDrawnArrowRight = () => (
  <svg width="100" height="24" viewBox="0 0 100 24" fill="none" style={{ position: "absolute", bottom: "180px", right: "90px"}}>
    <path d="M10,12 C35,4 65,18 90,10" stroke="#1e1b18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M80,4 L90,10 L83,18" stroke="#1e1b18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const HandDrawnArrowLeft = () => (
  <svg width="100" height="24" viewBox="0 0 100 24" fill="none" style={{ position: "absolute", bottom: "180px", left: "90px"}}>
    <path d="M90,12 C65,4 35,18 10,10" stroke="#1e1b18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M20,4 L10,10 L17,18" stroke="#1e1b18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);
