/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignora erros de TypeScript no build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignora erros de ESLint no build
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

module.exports = nextConfig;