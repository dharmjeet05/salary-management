import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The app lives at dharmjeet.com/salary-management, next to the portfolio.
  // Locally too, so links behave the same in dev and on the server.
  basePath: '/salary-management',
  // A server with only the files it needs, for the docker image
  output: 'standalone',
  // @salary/shared ships TypeScript source, so Next compiles it with the app
  transpilePackages: ['@salary/shared'],
}

export default nextConfig
