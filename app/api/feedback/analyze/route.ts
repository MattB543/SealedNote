import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { decryptAtRest } from "@/lib/keystore";

export const runtime = "nodejs";

// Lightweight in-memory rate limit (per instance)
type Bucket = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5_000;

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
      .select("custom_prompt, ai_reviewer_enabled, openrouter_api_key")
      .eq("id", link.user_id)
      .single();
    if (recipError || !recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Respect preference: if Reviewer disabled, do not coach
    if (!recipient.ai_reviewer_enabled) {
      return NextResponse.json({ used_llm: false, disabled: true });
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
      // LLM not configured; disable coaching (no heuristics)
      return NextResponse.json({ used_llm: false, disabled: true });
    }

    const result = await coachWithOpenRouter(
      content,
      recipient.custom_prompt || "",
      openRouterKey
    );
    return NextResponse.json({ used_llm: true, ...result });
  } catch (error) {
    // Disable coaching on failure (no heuristics)
    return NextResponse.json({ used_llm: false, disabled: true });
  }
}

async function coachWithOpenRouter(
  content: string,
  customPrompt: string,
  key: string
) {
  const prompt = buildCoachPrompt(content, customPrompt);
  try {
    // GPT-5-mini was just launched, so it's available
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "FilteredFeedback",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 5000,
          response_format: { type: "json_object" },
          reasoning: {
            effort: "low",
          },
        }),
      }
    );
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
      example_present:
        parsedMissing.example_present ?? !parsedMissing.example_missing,
      example_missing:
        parsedMissing.example_missing ?? !parsedMissing.example_present,
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
  } catch (e) {
    throw e;
  }
}

function buildCoachPrompt(content: string, customPrompt: string) {
  return `
You are an anonymous feedback reviewing assistant. Your job is to:
1) Identify any risk that the text could reveal the author's identity (names, dates/times, locations, platforms, unique events).
2) Suggest improvements for constructiveness and clarity WITHOUT adding new information.
3) Provide rewrites that preserve the original message while improving delivery.

Recipient preference (tone/policy): "${
    customPrompt ||
    "Filter out only serious insults, threats, and purely hurtful comments with zero constructive value"
  }".

Output STRICT JSON (no prose) with exactly these keys:
{
  "needs_improvement": boolean,
  "missing": { "constructive": boolean, "actionable": boolean, "example_present": boolean },
  "suggestions": string[],
  "questions_to_help": string[],
  "anonymity": { "risk_level": "low"|"medium"|"high", "reason": string, "redact_suggestions": string[] },
  "quality_rewrite": string | null,
  "anon_rewrite": string | null
}

CRITICAL REWRITE RULES:
- NEVER add information, examples, or specifics not in the original feedback
- ONLY reorganize, rephrase, and soften the existing content
- Preserve the exact same core message and intent
- If anonymity risk exists, generalize identifying details but don't invent new ones
- Make the tone more constructive and easier to receive
- Keep rewrites concise - similar length to original

Other guidance:
- "suggestions" should be short tips for the sender (not content to add)
- Provide 2-3 brief "questions_to_help" for sender's consideration
- "quality_rewrite": improved tone/structure version (null if already good)
- "anon_rewrite": anonymized version (null if risk is low)

FEEDBACK:
"""${content}"""`;
}
