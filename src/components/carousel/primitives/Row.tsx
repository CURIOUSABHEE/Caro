import React from "react";

interface RowProps {
  children: React.ReactNode;
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  align?: "stretch" | "center" | "flex-start" | "flex-end";
  gap?: string;
  extraStyle?: React.CSSProperties;
}

export function Row({
  children,
  justify = "space-between",
  align = "center",
  gap,
  extraStyle,
}: RowProps) {
  const childCount = React.Children.count(children);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: justify,
        alignItems: align,
        ...extraStyle,
      }}
    >
      {gap
        ? React.Children.map(children, (child, i) => {
            if (!React.isValidElement(child)) return child;
            const isLast = i === childCount - 1;
            const existingStyle = (child.props as any).style || {};
            return React.cloneElement(child as React.ReactElement<any>, {
              style: { ...existingStyle, marginRight: isLast ? undefined : gap },
            });
          })
        : children}
    </div>
  );
}
