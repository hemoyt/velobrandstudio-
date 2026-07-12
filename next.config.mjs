/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 'standalone' output is for the self-hosted Docker image (the Dockerfile
  // copies .next/standalone into the runner). Vercel's own build conflicts
  // with it, so skip it there — though note this app is local-first and needs
  // a persistent filesystem, so a plain server/Docker is the intended home.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
};

export default nextConfig;
