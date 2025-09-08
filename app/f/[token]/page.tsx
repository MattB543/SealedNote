"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { browserCrypto } from "@/lib/crypto-browser";

export default function SubmitFeedback() {
  const { token } = (useParams() as { token: string }) || { token: "" };
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  // Coach + scheduling state
  const [coach, setCoach] = useState<any | null>(null);
  const [showCoach, setShowCoach] = useState(false);
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [weekOffset, setWeekOffset] = useState<number>(1); // 0=this week, 1=next, 2=two weeks out
  const [windowStartDow, setWindowStartDow] = useState<number>(1); // 1=Mon..7=Sun
  const [windowLen, setWindowLen] = useState<number>(3); // 1..3
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [scheduledAtIso, setScheduledAtIso] = useState<string | null>(null);

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

  // Compute random scheduled time when scheduling
  useEffect(() => {
    if (sendMode !== "schedule") {
      setScheduledAt(null);
      setScheduledAtIso(null);
      return;
    }
    const now = new Date();
    const monday = startOfWeek(now);
    const base = new Date(monday);
    base.setDate(base.getDate() + 7 * weekOffset);
    const start = new Date(base);
    start.setDate(base.getDate() + (windowStartDow - 1));
    start.setHours(0, 0, 0, 0);
    let end = new Date(start);
    end.setDate(start.getDate() + windowLen);
    // Clamp to future and within 14 days
    const nowMs = Date.now();
    const maxMs = nowMs + 14 * 24 * 60 * 60 * 1000;
    const startClampedMs = Math.max(start.getTime(), nowMs);
    const endClampedMs = Math.min(end.getTime(), maxMs);
    if (startClampedMs >= endClampedMs) {
      setScheduledAt(null);
      setScheduledAtIso(null);
      return;
    }
    const rand = new Date(startClampedMs + Math.random() * (endClampedMs - startClampedMs));
    setScheduledAt(rand);
    setScheduledAtIso(rand.toISOString());
  }, [sendMode, weekOffset, windowStartDow, windowLen]);

  function startOfWeek(d: Date) {
    const date = new Date(d);
    const day = date.getDay(); // Sun=0..Sat=6
    const diffToMon = (day + 6) % 7;
    date.setDate(date.getDate() - diffToMon);
    date.setHours(0, 0, 0, 0);
    return date;
  }

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

      // Preflight AI coach if allowed
      if (aiEnabled) {
        try {
          const res = await fetch("/api/feedback/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim(), shareToken: token }),
          });
          const data = await res.json();
          if (res.ok) {
            setCoach(data);
            const risk = data?.anonymity?.risk_level;
            const needs = !!data?.needs_improvement;
            if (risk !== "low" || needs) {
              setShowCoach(true);
              setSubmitting(false);
              return;
            }
          }
        } catch {}
      } else {
        // Recipient disabled AI: use deterministic, client-only heuristics
        const hints = heuristicCoach(content.trim());
        const needs = hints.needs_improvement;
        const risk = hints.anonymity.risk_level;
        if (risk !== "low" || needs) {
          setCoach({
            used_llm: false,
            ...hints,
            quality_rewrite: null,
          });
          setShowCoach(true);
          setSubmitting(false);
          return;
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
      if (sendMode === "schedule" && scheduledAtIso) {
        body.deliverAt = scheduledAtIso;
      }
      if (aiEnabled) {
        body.content = finalText;
      } else {
        if (!publicKey) throw new Error("Missing recipient key");
        const encrypted_content = await browserCrypto.encryptWithPublicKey(finalText, publicKey);
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
      if (!response.ok) throw new Error(data.error || "Failed to submit feedback");
      setSubmitted(true);
      setContent("");
      if (data.scheduledAt) {
        setScheduledAtIso(data.scheduledAt);
        setScheduledAt(new Date(data.scheduledAt));
      }
    } catch (e: any) {
      setError(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  // Simple deterministic hints (no LLM, browser-only)
  function heuristicCoach(text: string) {
    const missingBase = {
      constructive: !/(because|so that|impact|effect|help|improve|so you can)/i.test(text),
      actionable: !/(try|consider|could you|please|next time|suggest)/i.test(text),
      example_missing: !/(for example|e\.g\.|such as|like when)/i.test(text),
    };
    const missing: any = { ...missingBase, example_present: !missingBase.example_missing };
    const deanonymizers = [
      /\b(yesterday|last night|this morning|at \d{1,2}(:\d{2})?\s?(am|pm)?)\b/i,
      /\b\d{1,2}(am|pm)\b/i,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b(at|outside|near)\s+(the\s+)?(bathroom|party|kitchen|elevator|boardroom|standup)\b/i,
      /\b(slack|email|dm|zoom)\b/i,
      /@[a-z0-9_.-]+/i,
      /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/,
      /\b(sept|sep|jan|feb|mar|apr|jun|jul|aug|oct|nov|dec)[a-z]*\s+\d{1,2}\b/i,
      /\bday before yesterday\b/i,
    ];
    const hits = deanonymizers.filter((re) => re.test(text)).length;
    const anonymity = {
      risk_level: hits >= 2 ? "high" : hits === 1 ? "medium" : "low",
      reason:
        hits > 0
          ? "Detected potentially identifying specifics (time/venue/names/platforms)."
          : "No obvious identifying details detected.",
      redact_suggestions: [
        "Remove exact days/times (e.g., 'Tuesday 3:38 PM')",
        "Remove locations (e.g., 'outside the bathroom')",
        "Avoid platform specifics ('in Slack DM')",
        "Describe patterns instead of single incidents",
      ],
    } as const;
    const needs_improvement =
      missing.constructive || missing.actionable || missing.example_present;
    const suggestions = [
      missing.constructive &&
        "Briefly state impact: how did this help/hurt outcomes?",
      missing.actionable &&
        "Offer one concrete next step starting with 'Consider…' or 'Next time…'.",
      missing.example_present &&
        "Add one neutral example ('For example, during…').",
    ].filter(Boolean) as string[];
    const questions_to_help = [
      "What outcome do you want to see change?",
      "What is one specific behavior to continue/adjust?",
      "Can you add one neutral example without dates/locations?",
    ];
    const anon_rewrite =
      anonymity.risk_level !== "low"
        ? "I'd like to share that a recent comment felt discouraging. Rather than single out a moment, the pattern I’ve noticed is quick remarks that land as dismissive. It would help if feedback came with a brief reason and one suggestion for what to adjust."
        : null;

    return {
      needs_improvement,
      missing,
      anonymity,
      suggestions,
      questions_to_help,
      anon_rewrite,
    };
  }

  function CoachModal() {
    if (!showCoach || !coach) return null;
    const risk = coach?.anonymity?.risk_level;
    const risky = risk === "medium" || risk === "high";
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-xl w-full p-6">
          <h3 className="text-xl font-bold mb-2">Make your feedback stronger</h3>
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
              <div className="text-sm font-semibold mb-1">Questions to help refine:</div>
              <ul className="list-disc ml-5 mb-3 text-sm text-gray-700">
                {coach.questions_to_help.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}
          <div className="space-y-2">
            {coach.anon_rewrite && (
              <button
                onClick={() => {
                  setContent(coach.anon_rewrite);
                  setShowCoach(false);
                }}
                className="w-full py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Apply anonymized rewrite
              </button>
            )}
            {coach.quality_rewrite && (
              <button
                onClick={() => {
                  setContent(coach.quality_rewrite);
                  setShowCoach(false);
                }}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply quality rewrite
              </button>
            )}
            <button
              onClick={() => setShowCoach(false)}
              className="w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Edit manually
            </button>
            <button
              onClick={() => {
                setShowCoach(false);
                finalizeSend(content.trim());
              }}
              className="w-full py-2 bg-gray-800 text-white rounded hover:bg-black"
            >
              Send as‑is
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {scheduledAt
              ? (
                <span>
                  Your feedback is scheduled for delivery around
                  {" "}
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
                  Your anonymous feedback has been submitted and encrypted successfully.
                </span>
              )}
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

        {/* Scheduling panel */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm font-medium">Delivery:</label>
            <label className="text-sm flex items-center gap-1">
              <input
                type="radio"
                name="sendMode"
                value="now"
                checked={sendMode === "now"}
                onChange={() => setSendMode("now")}
              />
              Send now
            </label>
            <label className="text-sm flex items-center gap-1">
              <input
                type="radio"
                name="sendMode"
                value="schedule"
                checked={sendMode === "schedule"}
                onChange={() => setSendMode("schedule")}
              />
              Schedule
            </label>
          </div>
          {sendMode === "schedule" && (
            <div className="p-3 border rounded bg-gray-50">
              <div className="flex items-center gap-3 mb-2 text-sm">
                <span>Deliver in</span>
                <select
                  value={weekOffset}
                  onChange={(e) => setWeekOffset(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={0}>this week</option>
                  <option value={1}>next week</option>
                  <option value={2}>two weeks out</option>
                </select>
                <span>starting</span>
                <select
                  value={windowStartDow}
                  onChange={(e) => setWindowStartDow(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={1}>Mon</option>
                  <option value={2}>Tue</option>
                  <option value={3}>Wed</option>
                  <option value={4}>Thu</option>
                  <option value={5}>Fri</option>
                  <option value={6}>Sat</option>
                  <option value={7}>Sun</option>
                </select>
                <select
                  value={windowLen}
                  onChange={(e) => setWindowLen(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={1}>1 day</option>
                  <option value={2}>2 days</option>
                  <option value={3}>3 days</option>
                </select>
              </div>
              {scheduledAt && (
                <p className="text-xs text-gray-600">
                  Will pick a random time between your chosen days. Current pick:{" "}
                  <strong>
                    {scheduledAt.toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </strong>
                </p>
              )}
            </div>
          )}
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
        {/* Coach modal */}
        <CoachModal />
      </div>
    </div>
  );
}
