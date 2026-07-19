import { Resvg } from "@resvg/resvg-js";

const crashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="700 0 300 200">
  <defs>
    <clipPath id="brd">
      <rect x="0" y="0" width="300" height="200"/>
      <rect x="700" y="0" width="300" height="200"/>
    </clipPath>
    <clipPath id="cL"><rect x="50" y="50" width="150" height="60"/></clipPath>
    <clipPath id="cR"><rect x="750" y="50" width="150" height="60"/></clipPath>
  </defs>
  <g clip-path="url(#brd)">
    <g clip-path="url(#cL)"><text x="55" y="95" font-size="40">Left</text></g>
    <g clip-path="url(#cR)"><text x="755" y="95" font-size="40">Right</text></g>
  </g>
</svg>`;

try {
  const resvg = new Resvg(crashSvg, { fitTo: { mode: "width", value: 1080 } });
  resvg.render();
  console.log("SUCCESS - no panic");
} catch (e) {
  console.log("CAUGHT:", e.message);
}
