const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next-live",
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname
};

export default nextConfig;
