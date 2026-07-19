import React from "react";
import type { ThemeTokens } from "../themes/tokens/types";

interface StackProps {
  children: React.ReactNode;
  gap?: string;
  align?: "stretch" | "center" | "flex-start" | "flex-end";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  grow?: boolean;
  extraStyle?: React.CSSProperties;
}

export function Stack({
  children,
  gap,
  align = "stretch",
  justify = "flex-start",
  grow = false,
  extraStyle,
}: StackProps) {
  const resolvedGap = gap || "16px";
  const childCount = React.Children.count(children);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        justifyContent: justify,
        flexGrow: grow ? 1 : undefined,
        ...extraStyle,
      }}
    >
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        const isLast = i === childCount - 1;
        const existingStyle = (child.props as any).style || {};
        return React.cloneElement(child as React.ReactElement<any>, {
          style: { ...existingStyle, marginBottom: isLast ? undefined : resolvedGap },
        });
      })}
    </div>
  );
}
