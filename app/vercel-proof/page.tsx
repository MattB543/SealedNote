import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VercelProofPage() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER || "MattB543";
  const slug = process.env.VERCEL_GIT_REPO_SLUG || "SealedNote";
  const repoFull = `${owner}/${slug}`;
  const repoUrl = `https://github.com/${repoFull}`;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || "local";

  return (
    <div className="min-h-full px-3 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto">
        <article className="bg-off-white border border-[#d7c9af] shadow-lg rounded-3xl px-6 py-8 sm:px-10 sm:py-12">
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold leading-snug text-[#3b3a2c]">
              Verify this deployment
            </h1>
            <p className="mt-4 text-gray-700 leading-relaxed">
              This app exposes build metadata and a Vercel API proxy so you can
              confirm the running code maps to a public Git commit.
            </p>
          </header>

          <div className="space-y-8">
            <section className="rounded-2xl border border-[#d7c9af] bg-white/80 p-6 sm:p-7 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#3b3a2c]">
                Option A: Public build fingerprint
              </h2>
              <p className="mt-3 text-gray-700 leading-relaxed">
                Check <code className="font-mono">/.well-known/build.json</code>{" "}
                or the response headers to see the current repo, commit SHA, and
                build id.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/.well-known/build.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#d7c9af] px-4 py-2 text-sm font-semibold text-[#3b3a2c] transition-colors hover:bg-[#f7f0e0]"
                >
                  View /.well-known/build.json
                </Link>
                <Link
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#d7c9af] px-4 py-2 text-sm font-semibold text-[#3b3a2c] transition-colors hover:bg-[#f7f0e0]"
                >
                  Open repo: {repoFull}
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                Current commit: <span className="font-mono">{commit}</span>
              </p>
            </section>

            <section className="rounded-2xl border border-[#d7c9af] bg-white/80 p-6 sm:p-7 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#3b3a2c]">
                Option B: Ask Vercel directly (via our proxy)
              </h2>
              <p className="mt-3 text-gray-700 leading-relaxed">
                Call our read-only endpoint that proxies the Vercel Deployments
                API for this deployment id.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/api/vercel/proof"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#d7c9af] px-4 py-2 text-sm font-semibold text-[#3b3a2c] transition-colors hover:bg-[#f7f0e0]"
                >
                  Call /api/vercel/proof
                </Link>
              </div>
              <p className="mt-3 text-gray-700 leading-relaxed">
                The response includes the deployment id, URL, and git source SHA
                reported by Vercel.
              </p>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Trust Note:</strong> This endpoint is controlled by us. 
                  For true independent verification, see Option C below.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-[#d7c9af] bg-white/80 p-6 sm:p-7 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#3b3a2c]">
                Option C: Independent verification (Zero Trust)
              </h2>
              <p className="mt-3 text-gray-700 leading-relaxed">
                If you have a Vercel account, you can verify this deployment 
                independently without trusting any code from this website.
              </p>
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-mono text-sm text-gray-700">
                    Deployment ID: {process.env.VERCEL_DEPLOYMENT_ID || "local-dev"}
                  </p>
                </div>
                <div className="prose prose-sm text-gray-700 max-w-none">
                  <ol className="space-y-2">
                    <li>Copy the deployment ID above</li>
                    <li>Get your Vercel token from <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="underline">vercel.com/account/tokens</a></li>
                    <li>Run this command:
                      <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs">
{`curl https://api.vercel.com/v13/deployments/${process.env.VERCEL_DEPLOYMENT_ID || "DEPLOYMENT_ID"}?withGitRepoInfo=true \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                      </pre>
                    </li>
                    <li>Verify the response shows the correct GitHub repository and commit</li>
                    <li>Check that commit on GitHub directly</li>
                  </ol>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/VERIFY_DEPLOYMENT.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-[#d7c9af] px-4 py-2 text-sm font-semibold text-[#3b3a2c] transition-colors hover:bg-[#f7f0e0]"
                  >
                    Full Verification Guide
                  </Link>
                </div>
              </div>
              <p className="mt-4 text-sm text-green-700">
                ✅ This method requires zero trust in our code - you verify directly with Vercel.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
