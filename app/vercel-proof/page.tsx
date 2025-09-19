import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VercelProofPage() {
  const deploymentUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
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
              Verify This Deployment
            </h1>
            <p className="mt-4 text-gray-700 leading-relaxed">
              You can verify this deployment is running the exact public code
              from GitHub by checking the Vercel deployment headers on the
              Vercel-hosted deployment URL shared below.
            </p>
          </header>

          <div className="space-y-8">
            <section className="rounded-2xl border border-[#d7c9af] bg-white/80 p-6 sm:p-7 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#3b3a2c]">
                Deployment Verification
              </h2>

              {deploymentUrl ? (
                <>
                  <p className="mt-3 text-gray-700 leading-relaxed">
                    This app's currently deployed version is hosted at the
                    following Vercel URL:
                  </p>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-mono text-sm text-gray-700 break-all">
                      https://{deploymentUrl}
                    </p>
                  </div>

                  <p className="mt-4 text-gray-700 leading-relaxed">
                    You can verify the source code by checking the HTTP response
                    headers from this deployment. Vercel automatically adds
                    headers that prove which GitHub repository and commit this
                    deployment was built from.
                  </p>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-[#3b3a2c] mb-3">
                      How to verify:
                    </h3>
                    <ol className="space-y-3 text-gray-700">
                      <li className="flex">
                        <span className="font-semibold mr-2">1.</span>
                        <span>
                          Open your browser's developer tools (F12) and go to
                          the Network tab
                        </span>
                      </li>
                      <li className="flex">
                        <span className="font-semibold mr-2">2.</span>
                        <span>
                          Visit{" "}
                          <a
                            href={`https://${deploymentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            https://{deploymentUrl}
                          </a>
                        </span>
                      </li>
                      <li className="flex">
                        <span className="font-semibold mr-2">3.</span>
                        <span>
                          Look at the response headers for the main document
                        </span>
                      </li>
                      <li className="flex">
                        <span className="font-semibold mr-2">4.</span>
                        <span>
                          Verify these headers match the expected GitHub
                          repository:
                        </span>
                      </li>
                    </ol>
                  </div>

                  <div className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
                    <pre className="text-xs leading-relaxed">
                      {`x-vercel-deployment-url: ${deploymentUrl}
x-vercel-git-commit-sha: ${commit}
x-vercel-git-repo-owner: ${owner}
x-vercel-git-repo-slug: ${slug}`}
                    </pre>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[#d7c9af] px-4 py-2 text-sm font-semibold text-[#3b3a2c] transition-colors hover:bg-[#f7f0e0]"
                    >
                      View GitHub Repository: {repoFull}
                    </Link>
                    {commit !== "local" && (
                      <Link
                        href={`${repoUrl}/commit/${commit}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-[#d7c9af] px-4 py-2 text-sm font-semibold text-[#3b3a2c] transition-colors hover:bg-[#f7f0e0]"
                      >
                        View Commit: {commit.substring(0, 7)}
                      </Link>
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Trust Note:</strong> These headers are set by
                      Vercel's infrastructure and cannot be modified by the
                      application code. They provide proof the code shown on
                      GitHub is the code running in this deployment.
                    </p>
                  </div>
                </>
              ) : (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ Running in local development mode. Deploy to Vercel to
                    enable verification.
                  </p>
                </div>
              )}
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
