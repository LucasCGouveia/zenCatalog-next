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
  // ... suas outras configurações (como output: 'standalone')
};

module.exports = nextConfig; // ou export default nextConfig se for .mjs