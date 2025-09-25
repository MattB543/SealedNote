"use client";

import Link from "next/link";

export default function Pricing() {
  return (
    <div className="p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6 paper-bg">
          <h1 className="text-3xl font-bold text-[#424133] mb-2">Pricing</h1>
          <p className="text-gray-600 mb-8">
            Simple, transparent pricing for everyone
          </p>

          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-[#646148] to-[#424133] rounded-xl p-6 text-white shadow-lg">
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                  CURRENT OFFER
                </span>
                <h2 className="text-2xl font-bold mb-2 text-white">Free</h2>
                <div className="text-4xl font-bold mb-2">$0</div>
                <p className="text-white/80">No credit card required</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>anonymous feedback inbox</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>AI-powered feedback filtering</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>End-to-end encryption</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Custom filtering preferences</span>
                </div>
              </div>

              <Link
                href="/"
                className="block w-full bg-white text-[#424133] text-center font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Started for Free
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-[#424133] mb-4">
              Why is it free?
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4">
              We believe everyone deserves access to safe, anonymous feedback
              tools. SealedNote is currently in its early stages, and we&apos;re
              focused on building the best possible experience for our users.
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              While we may introduce premium features in the future, the core
              functionality will always remain free.
            </p>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              Questions about pricing? Let us know at hello@sealednote.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
