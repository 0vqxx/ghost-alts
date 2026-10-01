/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  // Prisma must NOT be bundled into the edge/worker bundle — it uses native binaries
  serverExternalPackages: ['@prisma/client', '.prisma/client', 'prisma'],
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
