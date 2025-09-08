"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { browserCrypto } from "@/lib/crypto-browser";

export default function SubmitFeedback() {
  const params = useParams();
  const token = params.token as string;
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/feedback/resolve-token?token=${encodeURIComponent(token)}`
        );
        if (!res.ok) {
          setError("Invalid or expired link");
          return;
        }
        const data = await res.json();
        setUsername(data.username);
        setPublicKey(data.public_key);
        setAiEnabled(Boolean(data.ai_filter_enabled));
      } catch (e) {
        setError("Failed to resolve link");
      }
    };
    load();
  }, [token]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!content.trim()) {
        throw new Error("Please enter some feedback");
      }

      if (content.length > 1000) {
        throw new Error("Feedback must be 1000 characters or less");
      }

      const body: any = { shareToken: token };
      if (aiEnabled) {
        body.content = content.trim();
      } else {
        if (!publicKey) throw new Error("Missing recipient key");
        const encrypted_content = await browserCrypto.encryptWithPublicKey(
          content.trim(),
          publicKey
        );
        const encrypted_reasoning = await browserCrypto.encryptWithPublicKey(
          "AI filtering disabled by recipient",
          publicKey
        );
        body.isEncrypted = true;
        body.encrypted_content = encrypted_content;
        body.encrypted_reasoning = encrypted_reasoning;
      }

      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      setContent("");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Feedback Sent!</h2>
          <p className="text-gray-600 mb-6">
            Your anonymous feedback has been submitted and encrypted
            successfully.
          </p>
          <Link
            href="/"
            className="text-blue-600 text-sm underline max-w-[230px] mx-auto block"
          >
            Get your own free encrypted, anonymous, filtered inbox
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2">
          {username
            ? `Send anonymous feedback to ${username}`
            : "Send anonymous feedback"}
        </h2>
        <p className="text-gray-600 mb-6">
          Your identity will remain completely anonymous
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, feedback, or compliments..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-1">
            {content.length}/1000 characters
          </p>
        </div>

        <div className="mb-6 space-y-2 text-sm text-gray-600">
          <p className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            Completely anonymous
          </p>
          <p className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            Filtered for harmful content
          </p>
          <p className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            Encrypted immediately
          </p>
          <p className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            Only readable by recipient
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending..." : "Send Feedback"}
        </button>
      </div>
    </div>
  );
}
