import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { decryptAtRest } from "@/lib/keystore";

export const runtime = "nodejs";

// Lightweight in-memory rate limit (per instance)
type Bucket = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;

function pruneBuckets() {
  const now = Date.now();
  buckets.forEach((v, k) => {
    if (now >= v.resetAt) buckets.delete(k);
  });
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS;
    const keys = Array.from(buckets.keys());
    for (let i = 0; i < excess && i < keys.length; i++) buckets.delete(keys[i]);
  }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const anyReq = req as any;
  if (anyReq.ip) return String(anyReq.ip);
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr;
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    pruneBuckets();
    const { content, shareToken } = await request.json();

    if (!content || !shareToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Feedback must be 1000 characters or less" },
        { status: 400 }
      );
    }

    // rate limit
    const ip = getClientIp(request);
    const key = `${ip}:${shareToken}:analyze`;
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || now >= b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      b.count++;
      if (b.count > RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again soon." },
          { status: 429 }
        );
      }
    }

    const supabase = createServerSupabaseClient();

    // Resolve shareToken → recipient
    const { data: link, error: linkError } = await (supabase as any)
      .from("feedback_links")
      .select("user_id")
      .eq("share_token", shareToken)
      .eq("is_active", true)
      .single();
    if (linkError || !link) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    const { data: recipient, error: recipError } = await (supabase as any)
      .from("users")
      .select("custom_prompt, ai_filter_enabled, openrouter_api_key")
      .eq("id", link.user_id)
      .single();
    if (recipError || !recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Respect preference: if AI disabled, return heuristic hints only
    if (!recipient.ai_filter_enabled) {
      const hints = heuristicCoach(content);
      return NextResponse.json({
        used_llm: false,
        needs_improvement: hints.needs_improvement,
        missing: hints.missing,
        anonymity: hints.anonymity,
        suggestions: hints.suggestions,
        questions_to_help: hints.questions_to_help,
        quality_rewrite: null,
        anon_rewrite: hints.anon_rewrite,
        note: "AI filtering disabled; heuristic-only suggestions.",
      });
    }

    // Select key: user's decrypted key or app default
    let openRouterKey: string | undefined;
    if (recipient.openrouter_api_key) {
      try {
        openRouterKey = decryptAtRest(recipient.openrouter_api_key);
      } catch {}
    }
    if (!openRouterKey) openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      const hints = heuristicCoach(content);
      return NextResponse.json({
        used_llm: false,
        needs_improvement: hints.needs_improvement,
        missing: hints.missing,
        anonymity: hints.anonymity,
        suggestions: hints.suggestions,
        questions_to_help: hints.questions_to_help,
        quality_rewrite: null,
        anon_rewrite: hints.anon_rewrite,
        note: "LLM not configured; heuristic-only suggestions.",
      });
    }

    const result = await coachWithOpenRouter(
      content,
      recipient.custom_prompt || "",
      openRouterKey
    );
    return NextResponse.json({ used_llm: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}

function heuristicCoach(text: string) {
  const missingBase = {
    constructive:
      !/(because|so that|impact|effect|help|improve|so you can)/i.test(text),
    actionable: !/(try|consider|could you|please|next time|suggest)/i.test(text),
    example_missing: !/(for example|e\.g\.|such as|like when)/i.test(text),
  };
  const missing = {
    ...missingBase,
    example_present: !missingBase.example_missing,
  } as any;
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

async function coachWithOpenRouter(
  content: string,
  customPrompt: string,
  key: string
) {
  const prompt = buildCoachPrompt(content, customPrompt);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "FilteredFeedback",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) throw new Error("OpenRouter API request failed");

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }
    const parsedMissing = parsed.missing ?? {
      constructive: false,
      actionable: false,
      example_present: true,
    };
    const normalizedMissing = {
      constructive: !!parsedMissing.constructive,
      actionable: !!parsedMissing.actionable,
      example_present: parsedMissing.example_present ?? !parsedMissing.example_missing,
      example_missing: parsedMissing.example_missing ?? !parsedMissing.example_present,
    };
    return {
      needs_improvement: !!parsed.needs_improvement,
      missing: normalizedMissing,
      anonymity: parsed.anonymity ?? {
        risk_level: "low",
        reason: "",
        redact_suggestions: [],
      },
      suggestions: parsed.suggestions ?? [],
      questions_to_help: parsed.questions_to_help ?? [],
      quality_rewrite: parsed.quality_rewrite ?? null,
      anon_rewrite: parsed.anon_rewrite ?? null,
    };
  } catch {
    const h = heuristicCoach(content);
    return {
      needs_improvement: h.needs_improvement,
      missing: h.missing,
      anonymity: h.anonymity,
      suggestions: h.suggestions,
      questions_to_help: h.questions_to_help,
      quality_rewrite: null,
      anon_rewrite: h.anon_rewrite,
    };
  }
}

function buildCoachPrompt(content: string, customPrompt: string) {
  return `
Act as a helpful coach. Analyze the FEEDBACK for: (1) constructiveness, (2) actionability, (3) presence of at least one example, and (4) sender anonymity risk (specifics that could reveal identity).
Recipient's filtering preference: "${
    customPrompt ||
    "Filter only serious insults, threats, and purely hurtful comments with zero constructive value"
  }".

Return STRICT JSON with these keys:
{
  "needs_improvement": boolean,
  "missing": { "constructive": boolean, "actionable": boolean, "example_present": boolean },
  "suggestions": string[],
  "questions_to_help": string[],
  "anonymity": { "risk_level": "low"|"medium"|"high", "reason": string, "redact_suggestions": string[] },
  "quality_rewrite": string | null,
  "anon_rewrite": string | null
}

FEEDBACK:
"""${content}"""`;
}
