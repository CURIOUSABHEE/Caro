import React from "react";
import { renderFormattedText } from "./formatted-text";

const BulletDot = ({ color, size }: { color: string; size?: number }) => {
  const s = size || 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill={color} />
    </svg>
  );
};

const BulletArrow = ({ color, size }: { color: string; size?: number }) => {
  const s = size || 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <polygon points="8,4 20,12 8,20" fill={color} />
    </svg>
  );
};

const BulletStar = ({ color, size }: { color: string; size?: number }) => {
  const s = size || 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill={color} />
    </svg>
  );
};

export const renderBulletIcon = (char: string, color: string, size?: number) => {
  if (char === "\u25b8") return <BulletArrow color={color} size={size} />;
  if (char === "\u2726") return <BulletStar color={color} size={size} />;
  return <BulletDot color={color} size={size} />;
};

export const renderBulletList = (
  body: string,
  accentColor: string,
  textColor: string,
  mutedColor: string,
  bulletChar: string = "\u2022",
  isDark: boolean = false,
  serifStyle?: React.CSSProperties,
  codeStyle?: React.CSSProperties,
  bulletColors?: string[]
) => {
  if (!body) return null;
  const lines = body.split("\n").filter(Boolean).map(l => l.replace(/^[•\-\*\s]+/, "").trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const isLead = idx === 0;
    const colorIdx = bulletColors ? idx % bulletColors.length : 0;
    const bulletColor = bulletColors ? bulletColors[colorIdx] : (isLead ? accentColor : mutedColor);
    const lineTextColor = bulletColors ? textColor : (isLead ? textColor : mutedColor);
    const lineWeight = bulletColors ? 500 : (isLead ? 700 : 400);
    return (
      <div key={idx} style={{ display: "flex", alignItems: "flex-start", marginBottom: isLead ? "18px" : "12px" }}>
        <span style={{ marginRight: "12px", flexShrink: 0, color: bulletColor, fontSize: isLead ? "22px" : "18px", fontWeight: "bold", lineHeight: 1.4 }}>
          {renderBulletIcon(bulletChar, bulletColor, isLead ? 22 : 18)}
        </span>
        <p style={{ fontSize: isLead ? "26px" : "21px", color: lineTextColor, lineHeight: 1.5, margin: 0, fontWeight: lineWeight }}>
          {renderFormattedText(line, serifStyle || {}, { color: lineTextColor }, "flex-start", codeStyle)}
        </p>
      </div>
    );
  });
};
