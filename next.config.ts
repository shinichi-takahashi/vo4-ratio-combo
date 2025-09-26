import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/vo4-ratio-combo",
  assetPrefix: "/vo4-ratio-combo",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
