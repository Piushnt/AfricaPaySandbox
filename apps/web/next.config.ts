import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const apiOrigin = process.env.API_INTERNAL_ORIGIN ?? 'http://127.0.0.1:3001';
    return [
      { source: '/v1/:path*', destination: `${apiOrigin}/v1/:path*` },
      { source: '/health', destination: `${apiOrigin}/health` },
      { source: '/api-docs-json', destination: `${apiOrigin}/api-docs-json` },
      { source: '/api-docs/:path*', destination: `${apiOrigin}/api-docs/:path*` },
    ];
  },
};

export default nextConfig;
