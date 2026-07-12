/** @type {import('next').NextConfig} */
const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig = {
  reactStrictMode: true,
  // 'standalone' output is only for self-hosting (see Dockerfile, which
  // copies .next/standalone into the runner image). Vercel provides its own
  // optimized serverless bundling and the two conflict — Vercel's cloud
  // build (unlike a local `next build`) can fail with "Module not found"
  // errors when 'standalone' is also set. Vercel sets VERCEL=1 during its
  // build, so skip 'standalone' there and let it use its own output.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(supabaseHostname ? [{ protocol: 'https', hostname: supabaseHostname }] : []),
    ],
  },
};

export default nextConfig;
