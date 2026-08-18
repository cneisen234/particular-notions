import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern, smaller formats — big win for a photo-heavy site
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
