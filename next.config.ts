import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "jsdom", "@mozilla/readability"],
};

export default nextConfig;
