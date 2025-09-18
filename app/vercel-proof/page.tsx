import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VercelProofPage() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER || "MattB543";
  const slug = process.env.VERCEL_GIT_REPO_SLUG || "SealedNote";
  const repoFull = `${owner}/${slug}`;
  const repoUrl = `https://github.com/${repoFull}`;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || "local";

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        Verify this deployment
      </h1>
      <p className="mt-2 text-gray-600">
        This app exposes build metadata and a Vercel API proxy so you can
        independently confirm the running code maps to a public Git commit.
      </p>

      <section className="mt-6 rounded-lg border border-gray-200 bg-off-white p-4">
        <h2 className="text-lg font-medium text-gray-900">
          Option A: Public build fingerprint
        </h2>
        <p className="mt-2 text-gray-600">
          Check <code className="font-mono">/.well-known/build.json</code> or
          response headers to see the current repo, commit SHA, and build id.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/.well-known/build.json"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            View /.well-known/build.json
          </Link>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Open repo: {repoFull}
          </a>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Current commit: <span className="font-mono">{commit}</span>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-off-white p-4">
        <h2 className="text-lg font-medium text-gray-900">
          Option B: Ask Vercel directly
        </h2>
        <p className="mt-2 text-gray-600">
          Call our read-only endpoint that proxies the Vercel Deployments API
          for this deployment id.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/api/vercel/proof"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Call /api/vercel/proof
          </Link>
        </div>
        <p className="mt-2 text-gray-600">
          The response includes the deployment id, URL, and git source SHA
          reported by Vercel.
        </p>
      </section>
    </main>
  );
}
