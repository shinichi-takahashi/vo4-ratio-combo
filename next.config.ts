import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isDev ? "" : "/vo4-ratio-combo",
  assetPrefix: isDev ? "" : "/vo4-ratio-combo",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
