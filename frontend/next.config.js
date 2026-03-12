/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove output: 'standalone' for now (can cause issues)
  images: {
    domains: [],
  },
  // Ensure trailing slashes for better routing
  trailingSlash: false,
};

module.exports = nextConfig;
