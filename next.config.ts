import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure we don't try to optimize fonts at build time if it causes issues, but usually fine
};

export default nextConfig;
