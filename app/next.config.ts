import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para Cloudflare Pages com next-on-pages
  experimental: {
    // compatível com edge runtime
  },
};

export default nextConfig;
