import React from "react";

const ABSOLUTE_LAYOUT_THEMES = new Set(["wireframe-3d", "sketch"]);

export function applyOverridesToTree(
  node: React.ReactNode,
  headingFont: string,
  bodyFont: string,
  density: "compact" | "comfortable" | "minimal",
  logoUrl: string | undefined,
  displayUsername: string,
  isRoot: boolean = true,
  themeName?: string,
): React.ReactNode {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(child => applyOverridesToTree(child, headingFont, bodyFont, density, logoUrl, displayUsername, false, themeName)) as React.ReactNode;
  }

  const obj = node as unknown as { type?: any; props?: Record<string, unknown> } & Record<string, unknown>;
  if (obj.props) {
    const nextProps = { ...obj.props };
    let nextStyle = nextProps.style ? { ...(nextProps.style as Record<string, unknown>) } : undefined;

    if (isRoot || obj.type === "h1" || obj.type === "h2" || obj.type === "h3") {
      if (!nextStyle) nextStyle = {};
    }

    if (nextStyle) {
      // Strip z-index to prevent Satori console warnings
      delete nextStyle.zIndex;
      delete nextStyle["z-index"];

      if (nextStyle.fontFamily) {
        const ff = String(nextStyle.fontFamily).toLowerCase();
        const isCodeFont = ff.includes("jetbrains") || ff.includes("mono") || ff.includes("courier") || ff.includes("consolas") || ff.includes("fira") || ff.includes("source code");
        const isHeadingFont =
          obj.type === "h1" ||
          obj.type === "h2" ||
          obj.type === "h3" ||
          ff.includes("playfair") ||
          ff.includes("editorial") ||
          ff.includes("cinzel") ||
          ff.includes("pacifico") ||
          ff.includes("lora") ||
          ff.includes("jakarta");
        if (isCodeFont) {
          // Preserve monospace fonts for code blocks — do not override
        } else if (isHeadingFont) {
          nextStyle.fontFamily = headingFont;
        } else if (ff.includes("caveat")) {
          nextStyle.fontFamily = headingFont === "Playfair Display" ? "Caveat" : headingFont;
        } else {
          nextStyle.fontFamily = bodyFont;
        }
      } else {
        if (obj.type === "h1" || obj.type === "h2" || obj.type === "h3") {
          nextStyle.fontFamily = headingFont;
        } else if (isRoot) {
          nextStyle.fontFamily = bodyFont;
        }
      }
    }

    if (isRoot && nextStyle && themeName && !ABSOLUTE_LAYOUT_THEMES.has(themeName)) {
      if (density === "compact") {
        nextStyle.padding = "50px 60px";
      } else if (density === "minimal") {
        nextStyle.padding = "100px 90px";
      } else {
        nextStyle.padding = "80px 80px";
      }
    }

    if (nextStyle && nextStyle.fontSize && typeof nextStyle.fontSize === "string" && nextStyle.fontSize.endsWith("px")) {
      const sizeNum = parseInt(nextStyle.fontSize);
      if (!isNaN(sizeNum)) {
        let sizeOffset = 0;
        if (density === "compact") sizeOffset = -6;
        else if (density === "minimal") sizeOffset = 4;

        if (sizeOffset !== 0) {
          nextStyle.fontSize = `${Math.max(12, sizeNum + sizeOffset)}px`;
        }
      }
    }

    if (nextStyle && typeof nextStyle.margin === "string" && nextStyle.margin.endsWith("px")) {
      const parts = nextStyle.margin.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        const n = parseInt(parts[0]);
        if (!isNaN(n)) {
          const adj = density === "compact" ? Math.max(10, Math.floor(n * 0.6)) : density === "minimal" ? Math.floor(n * 1.3) : n;
          nextStyle.margin = `${adj}px`;
        }
      } else if (parts.length === 2) {
        const nV = parseInt(parts[0]);
        const nH = parseInt(parts[1]);
        if (!isNaN(nV) && !isNaN(nH)) {
          const adjV = density === "compact" ? Math.max(10, Math.floor(nV * 0.6)) : density === "minimal" ? Math.floor(nV * 1.3) : nV;
          nextStyle.margin = `${adjV}px ${nH}px`;
        }
      } else if (parts.length >= 3) {
        const nT = parseInt(parts[0]), nH = parseInt(parts[1]), nB = parseInt(parts[2]);
        if (!isNaN(nT) && !isNaN(nH) && !isNaN(nB)) {
          const adjT = density === "compact" ? Math.max(10, Math.floor(nT * 0.6)) : density === "minimal" ? Math.floor(nT * 1.3) : nT;
          const adjB = density === "compact" ? Math.max(10, Math.floor(nB * 0.6)) : density === "minimal" ? Math.floor(nB * 1.3) : nB;
          nextStyle.margin = `${adjT}px ${nH}px ${adjB}px${parts[3] ? ` ${parts[3]}` : ""}`;
        }
      }
    }

    if (nextStyle && nextStyle.marginBottom && typeof nextStyle.marginBottom === "string" && nextStyle.marginBottom.endsWith("px")) {
      const sizeNum = parseInt(nextStyle.marginBottom);
      if (!isNaN(sizeNum)) {
        if (density === "compact") {
          nextStyle.marginBottom = `${Math.max(10, Math.floor(sizeNum * 0.6))}px`;
        } else if (density === "minimal") {
          nextStyle.marginBottom = `${Math.floor(sizeNum * 1.3)}px`;
        }
      }
    }
    if (nextStyle && nextStyle.marginTop && typeof nextStyle.marginTop === "string" && nextStyle.marginTop.endsWith("px")) {
      const sizeNum = parseInt(nextStyle.marginTop);
      if (!isNaN(sizeNum)) {
        if (density === "compact") {
          nextStyle.marginTop = `${Math.max(10, Math.floor(sizeNum * 0.6))}px`;
        } else if (density === "minimal") {
          nextStyle.marginTop = `${Math.floor(sizeNum * 1.3)}px`;
        }
      }
    }

    if (nextProps.children) {
      let hasUsernameChild = false;
      const childrenArray = Array.isArray(nextProps.children) ? nextProps.children : [nextProps.children];

      for (const child of childrenArray) {
        if (child && typeof child === "object" && child.props && typeof child.props.children === "string") {
          const text = child.props.children.trim();
          if (text.startsWith("@") || (text.length > 0 && text === displayUsername)) {
            hasUsernameChild = true;
          }
        }
      }

      if (hasUsernameChild && logoUrl) {
        const logoElement = (
          <img
            key="brand-kit-logo"
            src={logoUrl}
            style={{
              height: density === "compact" ? "24px" : "32px",
              marginRight: "10px",
              objectFit: "contain",
            }}
          />
        );

        const newChildren = childrenArray.map((child: any) => {
          if (child && typeof child === "object" && child.props && typeof child.props.children === "string") {
            const text = child.props.children.trim();
            if (text.startsWith("@") || (text.length > 0 && text === displayUsername)) {
              return (
                <div key="username-row" style={{ display: "flex", alignItems: "center" }}>
                  {logoElement}
                  {child}
                </div>
              );
            }
          }
          if (child && typeof child === "object" && child.props) {
            return applyOverridesToTree(child, headingFont, bodyFont, density, logoUrl, displayUsername, false, themeName);
          }
          return child;
        });

        nextProps.children = newChildren;
      } else {
        nextProps.children = applyOverridesToTree(
          nextProps.children as React.ReactNode,
          headingFont,
          bodyFont,
          density,
          logoUrl,
          displayUsername,
          false,
          themeName
        );
      }
    }

    if (nextStyle) {
      nextProps.style = nextStyle;
    }

    return {
      ...obj,
      props: nextProps
    } as React.ReactNode;
  }

  return node;
}
