import Link from "next/link";

export default function HowItWorks() {
  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">
            How FilteredFeedback Works
          </h1>

          {/* Overview */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              FilteredFeedback is an anonymous feedback platform that protects
              recipients from hurtful comments while maintaining complete
              privacy through end-to-end encryption. Here's how we achieve both
              goals simultaneously.
            </p>
          </section>

          {/* The Process */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">The Process</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    You Create Your Account
                  </h3>
                  <p className="text-gray-700">
                    Sign in with your email (magic link). We generate a key pair
                    in your browser and store <strong>only</strong> your public
                    key. Your private key is shown once; you can optionally
                    encrypt and save it locally with a password for convenience.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Share Your Feedback Link
                  </h3>
                  <p className="text-gray-700">
                    You get a unique link like{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      app.com/f/yourname
                    </code>
                    that anyone can use to send you anonymous feedback.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Someone Submits Feedback
                  </h3>
                  <p className="text-gray-700">
                    If AI filtering is enabled, the text is processed in memory
                    by the AI to separate potentially hurtful content. If AI
                    filtering is disabled, the feedback is encrypted immediately
                    in the sender's browser with your public key before it
                    reaches our servers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">4</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Immediate Encryption</h3>
                  <p className="text-gray-700">
                    The feedback and any AI reasoning are encrypted using your{" "}
                    <strong>public key</strong>. Once encrypted, only you can
                    decrypt it with your private key. Your password (if you set
                    one) only protects the private key saved in your browser.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">5</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">You Read When Ready</h3>
                  <p className="text-gray-700">
                    Log into your dashboard and enter your encryption password
                    to decrypt and read your feedback. Mean comments are
                    separated into a "Maybe Mean" folder you can check when
                    you're emotionally prepared.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">
              Key Privacy Features
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-green-800">
                  End-to-End Encryption
                </h3>
                <p className="text-sm text-gray-700">
                  Your feedback is encrypted with your{" "}
                  <strong>public key</strong>. We never have access to your
                  private key. A password you choose can encrypt your private
                  key locally for convenience.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-800">
                  No Raw Storage
                </h3>
                <p className="text-sm text-gray-700">
                  Feedback text exists unencrypted only in memory during
                  processing. It's never logged, never saved to disk
                  unencrypted.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-purple-800">
                  Complete Anonymity
                </h3>
                <p className="text-sm text-gray-700">
                  We don't store who sends feedback. Note that infrastructure
                  providers (host/LLM/email) may log network metadata (e.g., IP)
                  per their policies. We do not use it to identify senders.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-yellow-800">
                  Open Source
                </h3>
                <p className="text-sm text-gray-700">
                  Our code is public. You can verify exactly how we handle your
                  data and even run your own instance if you prefer.
                </p>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <details className="border rounded-lg p-4">
                <summary className="font-semibold cursor-pointer">
                  What happens if I forget my encryption password?
                </summary>
                <p className="mt-3 text-gray-700">
                  Unfortunately, your feedback cannot be recovered. This is by
                  design - it ensures that even we cannot access your feedback.
                  Make sure to store your password securely.
                </p>
              </details>

              <details className="border rounded-lg p-4">
                <summary className="font-semibold cursor-pointer">
                  Can you read my feedback?
                </summary>
                <p className="mt-3 text-gray-700">
                  No. Your feedback is encrypted with your public key
                  immediately after AI processing. We don't have your private
                  key (derived from your password), so we cannot decrypt it.
                </p>
              </details>

              <details className="border rounded-lg p-4">
                <summary className="font-semibold cursor-pointer">
                  How does the AI filter work?
                </summary>
                <p className="mt-3 text-gray-700">
                  The AI analyzes feedback in memory to determine if it's
                  constructive or potentially hurtful. You can customize the
                  filtering criteria in your settings. The AI's decision and
                  reasoning are encrypted along with the feedback.
                </p>
              </details>

              <details className="border rounded-lg p-4">
                <summary className="font-semibold cursor-pointer">
                  Is the feedback truly anonymous?
                </summary>
                <p className="mt-3 text-gray-700">
                  Yes. We don't store any information about who submits
                  feedback. No IP addresses, browser information, or any other
                  identifying data is stored.
                </p>
              </details>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-8 border-t">
            <h2 className="text-xl font-semibold mb-4">
              Ready to get started?
            </h2>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your Secure Inbox
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
