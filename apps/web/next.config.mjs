/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // typedRoutes intentionally OFF in Sprint 0 — placeholder nav links target routes
  // (e.g., /revenue, /banking) whose pages don't exist until their sprints.
  // Re-enable in Sprint 10+ once all placeholder pages exist.
  // Allow imports from sibling workspace packages
  transpilePackages: ['@tcharts/ui', '@tcharts/contracts', '@tcharts/domain', '@tcharts/utils'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
