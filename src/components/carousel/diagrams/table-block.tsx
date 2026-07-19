import React from "react";
import type { ThemeColors, TableData } from "@/lib/types";
import { clampText } from "../lib/truncate";
import { multilineClamp, stableText } from "./diagram-utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS = { maxWidth: 900, padding: "10px 0" } as const;

const TABLE = {
  borderWidth: 3,
  rowBorderWidth: 1,
  headerPadding: "14px 12px",
  cellPadding: "14px 12px",
} as const;

const FONT = {
  header: { size: "18px", weight: 800, letterSpacing: "0.5px" },
  cell: { size: "15px", weight: "bold" as const },
  value: { size: "15px" },
} as const;

const BORDER_FADE = "1a";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTheme(colors: ThemeColors) {
  return {
    accent: colors.accent,
    text: colors.text,
    headerBorder: `${TABLE.borderWidth}px solid ${colors.accent}`,
    headerColBorder: `1px solid ${colors.accent}${BORDER_FADE}`,
    rowBorder: `${TABLE.rowBorderWidth}px solid ${colors.text}${BORDER_FADE}`,
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

const TableHeader: React.FC<{
  headers: string[];
  numCols: number;
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ headers, numCols, theme }) => (
  <thead>
    <tr>
      {headers.map((header, headerIndex) => (
        <th
          key={header || `th-${headerIndex}`}
          style={{
            textAlign: headerIndex === 0 ? "left" : "center",
            padding: TABLE.headerPadding,
            fontWeight: FONT.header.weight,
            fontSize: FONT.header.size,
            color: theme.accent,
            borderBottom: theme.headerBorder,
            borderRight: headerIndex < numCols - 1 ? theme.headerColBorder : "none",
            letterSpacing: FONT.header.letterSpacing,
            lineHeight: 1.15,
            ...stableText,
            ...multilineClamp(2),
          }}
        >
          {clampText(header, 24)}
        </th>
      ))}
    </tr>
  </thead>
));
TableHeader.displayName = "TableHeader";

const TableRow: React.FC<{
  row: { label: string; values: string[] };
  theme: ReturnType<typeof computeTheme>;
}> = React.memo(({ row, theme }) => (
  <tr>
    <td
      style={{
        padding: TABLE.cellPadding,
        fontWeight: FONT.cell.weight,
        color: theme.text,
        borderBottom: theme.rowBorder,
        borderRight: theme.rowBorder,
        fontSize: FONT.cell.size,
        lineHeight: 1.2,
        ...stableText,
        ...multilineClamp(2),
      }}
    >
      {clampText(row.label, 30)}
    </td>
    {(row.values ?? []).map((value, valueIndex) => (
      <td
        key={valueIndex}
        style={{
          padding: TABLE.cellPadding,
          textAlign: "center",
          color: theme.text,
          borderBottom: theme.rowBorder,
          borderRight: valueIndex < row.values.length - 1 ? theme.rowBorder : "none",
          fontSize: FONT.value.size,
          lineHeight: 1.2,
          ...stableText,
          ...multilineClamp(2),
        }}
      >
        {clampText(value, 26)}
      </td>
    ))}
  </tr>
));
TableRow.displayName = "TableRow";

// ─── Main Component ──────────────────────────────────────────────────────────

const TableBlock = ({ data, colors }: { data: TableData; colors: ThemeColors }) => {
  if (!data?.headers || !data?.rows) return null;

  const numCols = data.headers.length;
  const theme = computeTheme(colors);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: `${CANVAS.maxWidth}px`, padding: CANVAS.padding, flexGrow: 1, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px", lineHeight: 1.3, tableLayout: "fixed" }}>
        <TableHeader headers={data.headers} numCols={numCols} theme={theme} />
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <TableRow key={row.label || `row-${rowIndex}`} row={row} theme={theme} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(TableBlock);
