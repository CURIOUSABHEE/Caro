import React from "react";
import type { ThemeColors, FlowchartData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";
import { isWireframeDiagram, diagramFont } from "@/lib/constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { padding: "10px 0", maxWidth: 260, maxWidthCapsule: 220 } as const;

const NODE = {
  capsuleHeight: 48,
  rectHeight: 56,
  rectWidth: 260,
  capsuleWidth: 220,
  decisionWidth: 180,
  decisionHeight: 90,
  decisionPadding: 28,
} as const;

const CONNECTOR = {
  width: 16,
  height: 12,
  lineHeight: 18,
} as const;

const FONT = {
  label: { size: "13px", weight: "bold" as const, lineHeight: "1.3" },
  decision: { size: "12px", weight: "bold" as const, lineHeight: "1.3" },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCardShadow(colors: ThemeColors) {
  if (colors.cardShadow) return colors.cardShadow;
  const border = colors.glassBorder;
  if (border) {
    const match = border.match(/[\d.]+\)$/);
    if (match) return `0 4px 16px ${border.replace(match[0], "0.12)")}`;
  }
  return "0 4px 16px rgba(0,0,0,0.06)";
}

function computeTheme(colors: ThemeColors) {
  const wf = isWireframeDiagram(colors);
  return {
    wf,
    fontFamily: diagramFont(colors),
    cardBg: wf ? "#ffffff" : (colors.glassBg || "rgba(255,255,255,0.45)"),
    border: `${wf ? "2" : "2"}px solid ${colors.accent}`,
    shadow: wf ? "none" : getCardShadow(colors),
    cardBorderRadius: wf ? "0px" : (colors.cardBorderRadius || "12px"),
    accent: colors.accent,
    text: colors.text,
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const FlowchartConnector: React.FC<{ color: string }> = React.memo(({ color }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0" }}>
    <div style={{ width: "2px", height: `${CONNECTOR.lineHeight}px`, backgroundColor: color, opacity: 0.6 }} />
    <svg width={CONNECTOR.width} height={CONNECTOR.height} viewBox={`0 0 ${CONNECTOR.width} ${CONNECTOR.height}`}>
      <path
        d={`M2 2 L${CONNECTOR.width / 2} ${CONNECTOR.height - 2} L${CONNECTOR.width - 2} 2`}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
));
FlowchartConnector.displayName = "FlowchartConnector";

const DecisionNode: React.FC<{
  label: string;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ label, theme }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: `${NODE.decisionWidth}px`, height: `${NODE.decisionHeight}px`, position: "relative" }}>
    <svg width={NODE.decisionWidth} height={NODE.decisionHeight} viewBox={`0 0 ${NODE.decisionWidth} ${NODE.decisionHeight}`} style={{ position: "absolute", top: 0, left: 0 }}>
      <polygon
        points={`${NODE.decisionWidth / 2},4 ${NODE.decisionWidth - 4},${NODE.decisionHeight / 2} ${NODE.decisionWidth / 2},${NODE.decisionHeight - 2} 4,${NODE.decisionHeight / 2}`}
        fill={theme.wf ? "#ffffff" : theme.cardBg}
        stroke={theme.accent}
        strokeWidth={theme.wf ? "2" : "2.5"}
      />
    </svg>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: `${NODE.decisionWidth}px`, height: `${NODE.decisionHeight}px`, padding: `0 ${NODE.decisionPadding}px`, boxSizing: "border-box", overflow: "hidden" }}>
      <span style={{ fontSize: FONT.decision.size, fontWeight: FONT.decision.weight, fontFamily: theme.fontFamily, color: theme.text, textAlign: "center", lineHeight: FONT.decision.lineHeight, ...stableText, ...multilineClamp(3) }}>
        {clampText(label, 42)}
      </span>
    </div>
  </div>
));
DecisionNode.displayName = "DecisionNode";

const ProcessNode: React.FC<{
  label: string;
  isEndpoint: boolean;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ label, isEndpoint, theme }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: isEndpoint ? `${NODE.capsuleWidth}px` : `${NODE.rectWidth}px`,
      minHeight: isEndpoint ? `${NODE.capsuleHeight}px` : `${NODE.rectHeight}px`,
      padding: "12px 20px",
      borderRadius: theme.wf ? "0px" : (isEndpoint ? "999px" : theme.cardBorderRadius),
      backgroundColor: theme.cardBg,
      border: theme.border,
      boxShadow: theme.shadow,
      boxSizing: "border-box",
      maxWidth: "100%",
      overflow: "hidden",
    }}
  >
    <span style={{ fontSize: FONT.label.size, fontWeight: FONT.label.weight, fontFamily: theme.fontFamily, color: theme.text, textAlign: "center", lineHeight: FONT.label.lineHeight, ...stableText, ...multilineClamp(2) }}>
      {clampText(label, 48)}
    </span>
  </div>
));
ProcessNode.displayName = "ProcessNode";

// ─── Main Component ──────────────────────────────────────────────────────────

const Flowchart = ({ data, colors }: { data: FlowchartData; colors: ThemeColors }) => {
  const nodes = (data?.nodes ?? []).slice(0, 5);
  if (nodes.length === 0) return null;

  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: CANVAS.padding }}>
      {nodes.map((node, nodeIndex) => {
        const label = node.label || `Step ${nodeIndex + 1}`;
        return (
          <div key={node.label || `node-${nodeIndex}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            {node.shape === "decision" ? (
              <DecisionNode label={label} theme={theme} />
            ) : (
              <ProcessNode
                label={label}
                isEndpoint={node.shape === "start" || node.shape === "end"}
                theme={theme}
              />
            )}
            {nodeIndex < nodes.length - 1 && (
              <FlowchartConnector color={theme.accent} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(Flowchart);
