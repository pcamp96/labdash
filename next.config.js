/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Packages that should not be bundled into the Edge/serverless runtime.
  // This prevents "Dynamic Code Evaluation" and native module warnings during build.
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'bcryptjs',
    'dockerode',
    'ws',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
