/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    const commit = process.env.VERCEL_GIT_COMMIT_SHA || "local";
    const buildId = process.env.VERCEL_DEPLOYMENT_ID || "dev";
    const repo = process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : "unknown";
    const branch = process.env.VERCEL_GIT_COMMIT_REF || "unknown";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Commit-SHA", value: commit },
          { key: "X-Build-ID", value: buildId },
          { key: "X-Repo", value: repo },
          { key: "X-Branch", value: branch },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
