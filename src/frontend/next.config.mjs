const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next"
};

if (!process.env.VERCEL) {
  nextConfig.outputFileTracingRoot = new URL("../../", import.meta.url).pathname;
}

export default nextConfig;
