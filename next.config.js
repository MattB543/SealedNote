/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Headers are now handled in middleware.ts for better CSP nonce support
};

module.exports = nextConfig;
