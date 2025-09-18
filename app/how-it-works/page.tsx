import Link from "next/link";

const features = [
  {
    title: "Open source and end-to-end encrypted",
    description:
      "Every message stays between you and your private key. For strict end-to-end coverage, turn off AI coaching and filtering; with them on, plaintext lives only in memory before it is sealed again.",
    points: [
      "Your key pair is generated in the browser; we store only the public key.",
      "Private keys can be re-encrypted locally with a passphrase you control.",
      "The codebase lives on GitHub, making it easy to verify the cryptography and infrastructure choices.",
      "Keep AI helpers off for full client-to-client encryption; otherwise we re-encrypt immediately after in-memory analysis.",
    ],
  },
  {
    title: "Use your own AI with an OpenRouter API key",
    description:
      "Bring the language models that fit your security and budget requirements. SealedNote orchestrates the prompts through your OpenRouter key so you stay in control of cost and retention.",
    points: [
      "Swap between models or providers without waiting on platform updates.",
      "Set rate limits and budgets in OpenRouter so feedback collection never surprises finance.",
      "When coaching or filtering is enabled, prompts sent to your model exclude identifiers and nothing is written to disk unencrypted.",
    ],
  },
  {
    title: "Receive higher quality feedback with AI coaching",
    description:
      "Enable the optional coach to guide senders toward specific, actionable notes. It keeps praise genuine, criticism thoughtful, and requests achievable.",
    points: [
      "Inline suggestions remind senders to ground comments in observable behavior.",
      "Tone nudges encourage respectful phrasing without removing the author's voice.",
      "Drafts decrypt in memory for the coaching pass, then are immediately re-encrypted before they leave the queue.",
    ],
  },
  {
    title: "Prevent counterproductive feedback with AI filters",
    description:
      "Mean or off-topic remarks get triaged before they ever hit your inbox. You decide how strict the filters should be, and anything that slips through still lands in your private, encrypted queue.",
    points: [
      "Multiple passes flag toxic language, low-effort replies, and policy violations.",
      'Review tougher feedback later in a dedicated "Maybe Mean" folder when you are ready.',
      "Flagged entries stay encrypted at rest; only the filter verdict and encrypted payload are kept.",
    ],
  },
] as const;

export default function HowItWorks() {
  return (
    <div className="min-h-full px-3 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="button-link">
            ← Back to Home
          </Link>
        </div>

        <article className="bg-off-white border border-[#d7c9af] shadow-lg rounded-3xl px-6 py-8 sm:px-10 sm:py-12">
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold leading-snug text-[#3b3a2c]">
              How SealedNote is different
            </h1>
            <p className="mt-4 text-gray-700 leading-relaxed">
              You already saw the highlights on the home page. Here's what each
              promise means in practice and how it protects both the recipient
              and feedback authors.
            </p>
          </header>

          <div className="space-y-10">
            {features.map((feature) => (
              <section
                key={feature.title}
                className="rounded-2xl border border-[#d7c9af] bg-white/80 p-6 sm:p-7 shadow-sm"
              >
                <h2 className="text-xl sm:text-2xl font-semibold text-[#3b3a2c]">
                  {feature.title}
                </h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="mt-4 space-y-2 text-gray-700 leading-relaxed list-disc list-inside sm:list-outside sm:pl-6">
                  {feature.points.map((point) => (
                    <li key={point} className="text-sm sm:text-base">
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <aside className="mt-10 rounded-2xl border border-dashed border-[#d7c9af] bg-white/70 p-6 text-gray-700 leading-relaxed">
            <h2 className="text-lg font-semibold text-[#3b3a2c]">
              How encryption and AI features work together
            </h2>
            <p className="mt-3">
              Leave AI coaching and filtering off if you need absolute
              end-to-end delivery: messages will stay encrypted from the
              sender's browser to your private key with no server-side
              inspection.
            </p>
          </aside>

          <footer className="mt-12 border-t border-[#d7c9af] pt-8 text-center">
            <p className="text-gray-700">
              Ready to collect feedback that is honest, kind, and secure?
            </p>
            <Link
              href="/auth/signin"
              className="mt-4 inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition-colors bg-[var(--ff-surface-dark)] text-[var(--ff-surface-dark-text)] hover:bg-[var(--ff-surface-dark-hover)]"
            >
              Create your secure inbox
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
