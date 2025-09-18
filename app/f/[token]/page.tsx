"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { browserCrypto } from "@/lib/crypto-browser";
import { DEFAULT_FEEDBACK_NOTE } from "@/lib/constants";

export default function SubmitFeedback() {
  const { token } = (useParams() as { token: string }) || { token: "" };
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [reviewerEnabled, setReviewerEnabled] = useState<boolean>(true);
  const [feedbackNote, setFeedbackNote] = useState<string>(
    DEFAULT_FEEDBACK_NOTE
  );
  // Coach + scheduling state
  const [coach, setCoach] = useState<any | null>(null);
  const [showCoach, setShowCoach] = useState(false);
  const [originalCoachContent, setOriginalCoachContent] = useState<string>("");
  const [savedUserContent, setSavedUserContent] = useState<string>("");
  const [isRewriteApplied, setIsRewriteApplied] = useState(false);
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  // Delay range selection when scheduling
  const [delayRange, setDelayRange] = useState<
    "h6_24" | "h25_72" | "d3_5" | "d6_10"
  >("h6_24");
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

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
        setReviewerEnabled(Boolean(data.ai_reviewer_enabled));
        setFeedbackNote(
          (data.feedback_note as string) || DEFAULT_FEEDBACK_NOTE
        );
      } catch (e) {
        setError("Failed to resolve link");
      }
    };
    load();
  }, [token]);

  useEffect(() => {
    if (sendMode !== "schedule") {
      setScheduledAt(null);
    }
  }, [sendMode]);

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

      // Preflight AI coach only if reviewer is enabled and not already coaching
      if (reviewerEnabled && !showCoach) {
        {
          try {
            const res = await fetch("/api/feedback/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: content.trim(),
                shareToken: token,
              }),
            });
            const data = await res.json();
            if (res.ok) {
              const risk = data?.anonymity?.risk_level;
              const needs = !!data?.needs_improvement;
              if (data?.disabled !== true && (risk !== "low" || needs)) {
                setCoach(data);
                setShowCoach(true);
                setOriginalCoachContent(content.trim());
                setSubmitting(false);
                return;
              }
            }
          } catch {}
        }
      }

      await finalizeSend(content.trim());
    } catch (error: any) {
      setError(error.message);
    } finally {
      // controlled by finalize paths
    }
  };

  async function finalizeSend(finalText: string) {
    try {
      setSubmitting(true);
      const body: any = { shareToken: token };
      if (sendMode === "schedule") {
        body.delayRange = delayRange;
      }
      if (aiEnabled) {
        body.content = finalText;
      } else {
        if (!publicKey) throw new Error("Missing recipient key");
        const encrypted_content = await browserCrypto.encryptWithPublicKey(
          finalText,
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
      if (!response.ok)
        throw new Error(data.error || "Failed to submit feedback");
      setSubmitted(true);
      setContent("");
      if (data.scheduledAt) {
        setScheduledAt(new Date(data.scheduledAt));
      }
    } catch (e: any) {
      setError(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  function CoachPanel() {
    if (!showCoach || !coach) return null;
    const risk = coach?.anonymity?.risk_level;
    const risky = risk === "medium" || risk === "high";

    // Determine suggested rewrite to show
    const suggestedRewrite =
      risky && coach.anon_rewrite ? coach.anon_rewrite : coach.quality_rewrite;

    return (
      <div className="mb-4 p-4 border rounded bg-off-white">
        <h3 className="text-lg font-semibold mb-2">
          Make your feedback stronger
        </h3>
        {risky && (
          <div className="mb-3 p-3 rounded bg-yellow-50 text-yellow-800">
            <strong>Potentially identifying</strong>: {coach.anonymity?.reason}
          </div>
        )}
        {coach?.suggestions?.length > 0 && (
          <ul className="list-disc ml-5 mb-3 text-sm text-gray-700">
            {coach.suggestions.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
        {coach?.questions_to_help?.length > 0 && (
          <>
            <div className="text-sm font-semibold mb-1">
              Questions to help you refine:
            </div>
            <ul className="list-disc ml-5 mb-3 text-sm text-gray-700">
              {coach.questions_to_help.map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </>
        )}
        {suggestedRewrite && (
          <div className="mt-3">
            <div className="text-sm font-semibold mb-2">Suggested rewrite:</div>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
              {suggestedRewrite}
            </div>
            <button
              onClick={() => {
                if (isRewriteApplied) {
                  // Undo: restore the user's original content
                  setContent(savedUserContent);
                  setIsRewriteApplied(false);
                } else {
                  // Apply: save current content and use rewrite
                  setSavedUserContent(content);
                  setContent(suggestedRewrite);
                  setIsRewriteApplied(true);
                }
              }}
              className="w-full mt-2 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {isRewriteApplied ? "Undo rewrite" : "Use this rewrite"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-off-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-[#42413315] rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-[#424133]"
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
            {scheduledAt ? (
              <span>
                Your feedback is scheduled for delivery around{" "}
                <strong>
                  {scheduledAt.toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </strong>
                .
              </span>
            ) : (
              <span>
                Your anonymous feedback has been encrypted and submitted
                successfully.
              </span>
            )}
          </p>
          <Link
            href="/"
            className="text-[#424133] text-sm underline max-w-[230px] mx-auto block"
          >
            Get your own free encrypted, anonymous, filtered inbox
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-off-white rounded-lg shadow-lg p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">
          {username
            ? `Send anonymous feedback to ${username}`
            : "Send anonymous feedback"}
        </h2>
        <div className="mb-4 space-y-2">
          <div className="text-gray-700 text-md bg-gray-50 border border-gray-200 rounded p-3">
            {feedbackNote}
            <p className="text-md text-gray-500 mt-2 text-right">
              - {username}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              // If user manually edits, clear the rewrite applied state
              if (isRewriteApplied) {
                setIsRewriteApplied(false);
              }
            }}
            placeholder="Write your message here..."
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg resize-none"
            maxLength={1000}
          />
          {content.length >= 800 && (
            <p className="text-sm text-gray-500 mt-1">
              {content.length}/1000 characters
            </p>
          )}
        </div>

        <CoachPanel />

        {/* Scheduling panel */}
        <div className="mb-3">
          <div className="flex items-center gap-3 mb-2">
            <label className="text-md flex items-center gap-1">
              <input
                type="radio"
                name="sendMode"
                value="now"
                checked={sendMode === "now"}
                onChange={() => setSendMode("now")}
              />
              Send now
            </label>
            <label className="text-md flex items-center gap-1">
              <input
                type="radio"
                name="sendMode"
                value="schedule"
                checked={sendMode === "schedule"}
                onChange={() => setSendMode("schedule")}
              />
              Delay Send
            </label>
          </div>
          {sendMode === "schedule" && (
            <div className="p-3 border rounded bg-gray-50 text-sm">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 pt-1">
                  We'll pick a random day/time in the selected range
                </p>{" "}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delayRange"
                    value="h6_24"
                    checked={delayRange === "h6_24"}
                    onChange={() => setDelayRange("h6_24")}
                  />
                  6 to 24 hours
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delayRange"
                    value="h25_72"
                    checked={delayRange === "h25_72"}
                    onChange={() => setDelayRange("h25_72")}
                  />
                  1 - 3 days
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delayRange"
                    value="d3_5"
                    checked={delayRange === "d3_5"}
                    onChange={() => setDelayRange("d3_5")}
                  />
                  3 - 5 days
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delayRange"
                    value="d6_10"
                    checked={delayRange === "d6_10"}
                    onChange={() => setDelayRange("d6_10")}
                  />
                  6 - 10 days
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="mb-6 text-sm text-gray-600 flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-baseline">
          <p className="flex items-center gap-2">
            <span>✓</span>
            Anonymous
          </p>
          <p className="flex items-center gap-2">
            <span>✓</span>
            Encrypted
          </p>
          <p className="flex items-center gap-2">
            <span>✓</span>
            Only readable by recipient
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="w-full py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "Encrypting and verifying..."
            : showCoach &&
              Math.abs(content.length - originalCoachContent.length) <= 1
            ? "Send as-is"
            : "Send Feedback"}
        </button>
      </div>
    </div>
  );
}
