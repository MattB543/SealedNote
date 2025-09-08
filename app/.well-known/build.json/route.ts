import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const body = {
    vercel: process.env.VERCEL === "1",
    repo_owner: process.env.VERCEL_GIT_REPO_OWNER || null,
    repo_slug: process.env.VERCEL_GIT_REPO_SLUG || null,
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    commit_ref: process.env.VERCEL_GIT_COMMIT_REF || null,
    deployment_id: process.env.VERCEL_DEPLOYMENT_ID || null,
    build_time: process.env.VERCEL ? new Date().toISOString() : null,
  } as const;
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

