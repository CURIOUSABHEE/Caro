import React from "react";
import type { ThemeColors } from "@/lib/types";

import StepChain from "./step-chain";
import Venn from "./venn";
import Wheel from "./wheel";
import Concentric from "./concentric";
import IconGrid from "./icon-grid";
import QuoteBlock from "./quote-block";
import StatDisplay from "./stat-display";
import TableBlock from "./table-block";
import Flowchart from "./flowchart";
import Timeline from "./timeline";
import BeforeAfter from "./before-after";
import ImageGrid from "./image-grid";
import Architecture from "./architecture";
import Sequence from "./sequence";
import MiniChart from "./mini-chart";

type DiagramComponent = React.ComponentType<{ data: unknown; colors: ThemeColors }>;

const diagramRegistry: Record<string, DiagramComponent> = {
  "step-chain": StepChain as DiagramComponent,
  "venn": Venn as DiagramComponent,
  "wheel": Wheel as DiagramComponent,
  "concentric": Concentric as DiagramComponent,
  "icon-grid": IconGrid as DiagramComponent,
  "quote": QuoteBlock as DiagramComponent,
  "stat": StatDisplay as DiagramComponent,
  "table": TableBlock as DiagramComponent,
  "flowchart": Flowchart as DiagramComponent,
  "timeline": Timeline as DiagramComponent,
  "before-after": BeforeAfter as DiagramComponent,
  "image-grid": ImageGrid as DiagramComponent,
  "architecture": Architecture as DiagramComponent,
  "sequence": Sequence as DiagramComponent,
  "mini-chart": MiniChart as DiagramComponent,
};

function unwrapVisualData(
  visualType: string,
  visualData: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!visualData) return undefined;

  const nestedData = visualData.visualData;
  const nestedType = visualData.visualType;

  if (
    nestedData &&
    typeof nestedData === "object" &&
    !Array.isArray(nestedData) &&
    (typeof nestedType !== "string" || nestedType === visualType)
  ) {
    return nestedData as Record<string, unknown>;
  }

  return visualData;
}

export function renderDiagram(
  visualType: string,
  visualData: Record<string, unknown> | undefined,
  colors: ThemeColors
): React.ReactElement | null {
  const Component = diagramRegistry[visualType];
  if (!Component) return null;
  return <Component data={unwrapVisualData(visualType, visualData)} colors={colors} />;
}
