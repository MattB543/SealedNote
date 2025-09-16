/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    const commit = process.env.VERCEL_GIT_COMMIT_SHA || "local";
    const buildId = process.env.VERCEL_DEPLOYMENT_ID || "dev";
    const repo =
      process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
        ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
        : "unknown";
    const branch = process.env.VERCEL_GIT_COMMIT_REF || "unknown";
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
      : ["'self'"];
    const styleSrc = ["'self'", "'unsafe-inline'"]; // allow inline styles

    const connectSrc = [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://openrouter.ai",
      "https://api.openrouter.ai",
    ];
    if (isDev) connectSrc.push("ws:", "wss:"); // allow local dev websocket connections

    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc.join(' ')}`,
      `style-src ${styleSrc.join(' ')}`,
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src ${connectSrc.join(' ')}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Commit-SHA", value: commit },
          { key: "X-Build-ID", value: buildId },
          { key: "X-Repo", value: repo },
          { key: "X-Branch", value: branch },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), payment=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
