import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @salary/shared ships TypeScript source, so Next compiles it with the app
  transpilePackages: ['@salary/shared'],
}

export default nextConfig
