import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
  const token = process.env.VERCEL_TOKEN || process.env.VERCEL_TEAM_TOKEN;

  if (!deploymentId) {
    return NextResponse.json(
      { error: "Missing VERCEL_DEPLOYMENT_ID (only available on Vercel)." },
      { status: 400 }
    );
  }
  if (!token) {
    return NextResponse.json(
      { error: "Missing VERCEL_TOKEN (team-scoped) env var." },
      { status: 500 }
    );
  }

  try {
    const url = `https://api.vercel.com/v13/deployments/${deploymentId}?withGitRepoInfo=true`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: "Vercel API request failed", status: resp.status, body: text },
        { status: 502 }
      );
    }
    const data = await resp.json();
    // Return a concise proof view
    return NextResponse.json({
      deployment_id: data.uid || deploymentId,
      url: data.url || null,
      state: data.state || null,
      created: data.created || null,
      git: data.gitSource || data.meta?.githubCommitSha || null,
      repo: data.gitRepo || data.meta?.gitlabRepo || null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch from Vercel" }, { status: 500 });
  }
}

