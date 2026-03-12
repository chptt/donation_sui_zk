/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable strict ES modules for Vercel compatibility
  experimental: {
    esmExternals: false,
  },
  // Configure images
  images: {
    domains: [],
    unoptimized: true, // Disable image optimization for now
  },
  // Enable trailing slashes for better routing
  trailingSlash: true,
  // Disable TypeScript checking during build (temporary fix)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
