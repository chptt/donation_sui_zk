/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static exports for better Vercel performance
  output: 'standalone',
  // Configure images if needed
  images: {
    domains: [],
  },
  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_APTOS_NETWORK: process.env.NEXT_PUBLIC_APTOS_NETWORK,
  },
};

module.exports = nextConfig;
