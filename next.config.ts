import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern, smaller formats — big win for a photo-heavy site
    formats: ["image/avif", "image/webp"],
    // Photos live on UploadThing (managed in Pilot Light).
    remotePatterns: [
      { protocol: "https", hostname: "*.ufs.sh", pathname: "/f/**" },
      { protocol: "https", hostname: "utfs.io", pathname: "/f/**" },
    ],
  },
};

export default nextConfig;
