import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "@mozilla/readability", "linkedom"],
};

export default nextConfig;
