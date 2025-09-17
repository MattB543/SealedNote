import Link from "next/link";

function GitHubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.867 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.7-2.782.604-3.369-1.342-3.369-1.342-.455-1.158-1.11-1.468-1.11-1.468-.908-.62.069-.607.069-.607 1.004.071 1.533 1.031 1.533 1.031.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.222-.253-4.555-1.111-4.555-4.945 0-1.092.39-1.986 1.029-2.685-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.851.004 1.707.115 2.506.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.378.203 2.397.1 2.65.64.699 1.028 1.593 1.028 2.685 0 3.842-2.337 4.69-4.565 4.939.359.309.679.919.679 1.852 0 1.336-.012 2.413-.012 2.74 0 .267.18.579.688.48C19.137 20.162 22 16.415 22 12c0-5.523-4.477-10-10-10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Header() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER || "MattB543";
  const slug = process.env.VERCEL_GIT_REPO_SLUG || "SealedNote";
  const repoFull = `${owner}/${slug}`;
  const repoUrl = `https://github.com/${repoFull}`;

  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || "local";
  const shortSha = commitSha.slice(0, 7);
  const commitUrl =
    commitSha && commitSha !== "local"
      ? `${repoUrl}/commit/${commitSha}`
      : undefined;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 h-14 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          className="text-xl crimson-text-semibold text-[#3b3a2c] hover:opacity-80"
        >
          SealedNote
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-gray-800 hover:bg-gray-50"
            aria-label={`Open source on GitHub: ${repoFull}`}
          >
            <GitHubIcon className="h-4 w-4" />
            <span className="font-medium">Open Source</span>
          </a>

          <Link
            href="/vercel-proof"
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 font-medium text-gray-800 hover:bg-gray-50"
          >
            ▲ Build Proof
          </Link>
          {commitUrl ? (
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-gray-800"
              aria-label={`Live commit ${shortSha}`}
              title={commitSha}
            >
              <span className="font-medium">Live Commit:</span>{" "}
              <span className="font-mono underline decoration-dotted underline-offset-4">
                {shortSha}
              </span>
            </a>
          ) : (
            <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-gray-800">
              <span className="font-medium">Live Commit:</span>{" "}
              <span className="font-mono" title={commitSha}>
                {shortSha}
              </span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
