#!/usr/bin/env node
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";

const svgPath = process.argv[2];
if (!svgPath) {
  console.error("Usage: render-svg.mjs <svg-file-path>");
  process.exit(1);
}

const svg = fs.readFileSync(svgPath, "utf8");

try {
  const resvg = new Resvg(svg, {
    background: "rgba(0, 0, 0, 0)",
    fitTo: { mode: "width", value: 1080 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const base64 = pngBuffer.toString("base64");
  process.stdout.write(JSON.stringify({ success: true, base64 }));
} catch (err) {
  process.stdout.write(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
}
