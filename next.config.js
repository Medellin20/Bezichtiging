/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production checks separate from a running development server.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
