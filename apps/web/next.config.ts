import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kinddoor/domain', '@kinddoor/validation'],
};

export default nextConfig;
