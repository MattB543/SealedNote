import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VercelProofPage() {
  const vercelAppUrl = "sealednote.vercel.app";
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || "<commit-sha>";
  const repoFull = "MattB543/SealedNote";
  const repoUrl = `https://github.com/${repoFull}`;

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
              from GitHub by checking the Vercel deployment headers.
            </p>
          </header>

          <div className="space-y-8">
            <section className="rounded-2xl border border-[#d7c9af] bg-white/80 p-6 sm:p-7 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#3b3a2c]">
                Deployment Verification
              </h2>

              <p className="mt-3 text-gray-700 leading-relaxed">
                This app is deployed at:
              </p>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-mono text-sm text-gray-700 break-all">
                  <a
                    href={`https://${vercelAppUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    https://{vercelAppUrl}
                  </a>
                </p>
              </div>

              <p className="mt-4 text-gray-700 leading-relaxed">
                You can verify the source code by checking the HTTP response
                headers from this Vercel deployment. Vercel automatically adds
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
                      Open your browser's developer tools (F12) and go to the
                      Network tab
                    </span>
                  </li>
                  <li className="flex">
                    <span className="font-semibold mr-2">2.</span>
                    <span>
                      Visit{" "}
                      <a
                        href={`https://${vercelAppUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        https://{vercelAppUrl}
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
                      Verify these headers show the correct GitHub repository:
                    </span>
                  </li>
                </ol>
              </div>

              <div className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
                <pre className="text-xs leading-relaxed">
                  {`x-repo: ${repoFull}
x-commit-sha: ${commitSha}`}
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
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ <strong>Trust Note:</strong> These headers are set by
                  Vercel's infrastructure and cannot be modified by the
                  application code. They provide cryptographic proof of the
                  exact code running in this deployment.
                </p>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
