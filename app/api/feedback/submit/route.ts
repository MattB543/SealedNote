import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { encryptWithPublicKey } from "@/lib/crypto-server";
import { decryptAtRest } from "@/lib/keystore";
import { sendFeedbackEmail } from "@/lib/email";

export const runtime = "nodejs";

// Simple in-memory rate limit (best-effort; per-instance)
type Bucket = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // per IP+token per minute
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
    for (let i = 0; i < excess && i < keys.length; i++) {
      buckets.delete(keys[i]);
    }
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

// THE AUDITABLE ENDPOINT - This is where all feedback processing happens
export async function POST(request: NextRequest) {
  try {
    pruneBuckets();
    const {
      content,
      shareToken,
      isEncrypted,
      encrypted_content,
      encrypted_reasoning,
      deliverAt,
    } = await request.json();

    // Validate input
    if ((!content && !isEncrypted) || !shareToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Rate limit: per IP + token
    const ip = getClientIp(request);
    const key = `${ip}:${shareToken}`;
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || now >= b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      b.count++;
      if (b.count > RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again soon." },
          { status: 429 }
        );
      }
    }

    if (content && content.length > 1000) {
      return NextResponse.json(
        { error: "Feedback must be 1000 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Step 1: Resolve share token -> user
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

    // Step 2: Get recipient info
    const { data: recipient, error: recipientError } = await (supabase as any)
      .from("users")
      .select(
        "id, email, public_key, custom_prompt, openrouter_api_key, ai_filter_enabled"
      )
      .eq("id", link.user_id)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Enforce recipient preference: if AI disabled, require client-side encryption
    if (!recipient.ai_filter_enabled) {
      if (!isEncrypted || !encrypted_content || !encrypted_reasoning) {
        return NextResponse.json(
          { error: "AI filtering disabled: encrypted payload required" },
          { status: 400 }
        );
      }
    }

    // Basic size guard even for encrypted payloads (protect DB/email abuse)
    if (isEncrypted) {
      const maxEncLen = 16384; // ~16KB per field
      if (
        (encrypted_content && encrypted_content.length > maxEncLen) ||
        (encrypted_reasoning && encrypted_reasoning.length > maxEncLen)
      ) {
        return NextResponse.json(
          { error: "Encrypted payload too large" },
          { status: 413 }
        );
      }
    }

    let encryptedContentOut: string;
    let encryptedReasoningOut: string;
    let isMean = false;

    if (isEncrypted) {
      // Client-side encryption path (AI disabled)
      if (!encrypted_content || !encrypted_reasoning) {
        return NextResponse.json(
          { error: "Missing encrypted payload" },
          { status: 400 }
        );
      }
      encryptedContentOut = encrypted_content;
      encryptedReasoningOut = encrypted_reasoning;
      isMean = false;
    } else {
      // Server-side classification + encryption path
      let userKey: string | null = null;
      if (recipient.openrouter_api_key) {
        try {
          userKey = decryptAtRest(recipient.openrouter_api_key);
        } catch {}
      }
      const classification = await classifyWithOpenRouter(
        content,
        recipient.custom_prompt,
        userKey || process.env.OPENROUTER_API_KEY
      );
      encryptedContentOut = encryptWithPublicKey(content, recipient.public_key);
      encryptedReasoningOut = encryptWithPublicKey(
        classification.reasoning,
        recipient.public_key
      );
      isMean = classification.is_mean;
    }

    // If scheduling requested and valid, store in scheduled_feedback and skip email
    let scheduledAtIso: string | null = null;
    if (deliverAt) {
      const when = new Date(deliverAt);
      const nowDt = new Date();
      const max = new Date(nowDt.getTime() + 14 * 24 * 60 * 60 * 1000);
      if (!Number.isNaN(when.getTime()) && when > nowDt && when <= max) {
        scheduledAtIso = when.toISOString();
      }
    }

    if (scheduledAtIso) {
      const { error: sErr } = await (supabase as any)
        .from("scheduled_feedback")
        .insert({
          user_id: recipient.id,
          encrypted_content: encryptedContentOut,
          encrypted_reasoning: encryptedReasoningOut,
          is_mean: isMean,
          deliver_at: scheduledAtIso,
        });
      if (sErr) throw sErr;
      return NextResponse.json({ success: true, scheduledAt: scheduledAtIso });
    } else {
      // Save immediately to inbox
      const { error: insertError } = await (supabase as any)
        .from("feedback")
        .insert({
          user_id: recipient.id,
          encrypted_content: encryptedContentOut,
          encrypted_reasoning: encryptedReasoningOut,
          is_mean: isMean,
          status: "unread",
        });
      if (insertError) throw insertError;

      // Notify recipient (best-effort)
      await sendFeedbackEmail(recipient.email, isMean);
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// LLM Classification using OpenRouter
async function classifyWithOpenRouter(
  content: string,
  customPrompt: string | null,
  key?: string | null
): Promise<{ is_mean: boolean; reasoning: string }> {
  const openRouterKey = key || undefined;

  if (!openRouterKey) {
    // If no API key, default to not mean
    return {
      is_mean: false,
      reasoning: "LLM classification not configured, defaulted to main inbox",
    };
  }

  const prompt = buildClassificationPrompt(content, customPrompt);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "FilteredFeedback",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 5000,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("OpenRouter API request failed");
    }

    const data = await response.json();
    const result: string = data.choices?.[0]?.message?.content ?? "";

    // Try strict parse first
    try {
      return JSON.parse(result);
    } catch {}

    // Attempt to extract JSON object from mixed text
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }

    // Default: not mean
    return {
      is_mean: false,
      reasoning: "Failed to parse LLM response, defaulted to main inbox",
    };
  } catch (error) {
    // If OpenRouter fails, default to NOT mean
    return {
      is_mean: false,
      reasoning: "LLM service unavailable, defaulted to main inbox",
    };
  }
}

// Build the classification prompt
function buildClassificationPrompt(
  content: string,
  customPrompt: string | null
): string {
  const defaultInstructions =
    "Filter only serious insults, threats, and purely hurtful comments with zero constructive value";
  const instructions = customPrompt || defaultInstructions;

  return `Carefully classify the below feedback as mean or not, based on the instructions provided.

Instructions: ${instructions}

Feedback: ${content}

Respond with JSON only:
{ "is_mean": boolean, "reasoning": "one sentence explanation" }`;
}
