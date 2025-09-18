import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { encryptAtRest } from "@/lib/keystore";
import { DEFAULT_FEEDBACK_NOTE } from "@/lib/constants";

export const runtime = "nodejs";

// Rate limiting for settings updates
type Bucket = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // per user per minute
const buckets = new Map<string, Bucket>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(userId);
  
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  bucket.count++;
  if (bucket.count > RATE_LIMIT_MAX) {
    return false;
  }
  
  // Clean up old buckets periodically
  if (buckets.size > 1000) {
    buckets.forEach((v, k) => {
      if (now >= v.resetAt) buckets.delete(k);
    });
  }
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const {
      custom_prompt,
      openrouter_api_key,
      ai_filter_enabled,
      ai_reviewer_enabled,
      auto_delete_mean,
      feedback_note,
    } = await request.json();

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const update: any = {};
    if (typeof custom_prompt !== "undefined") {
      const trimmed = String(custom_prompt).trim();
      if (trimmed.length > 1000) {
        return NextResponse.json(
          { error: "Custom prompt too long (max 1000 chars)" },
          { status: 400 }
        );
      }
      update.custom_prompt = trimmed;
    }
    if (typeof feedback_note !== "undefined") {
      const trimmed = String(feedback_note).trim();
      if (trimmed.length > 200) {
        return NextResponse.json(
          { error: "Feedback note too long (max 200 chars)" },
          { status: 400 }
        );
      }
      update.feedback_note = trimmed || DEFAULT_FEEDBACK_NOTE;
    }
    if (typeof openrouter_api_key !== "undefined") {
      const val = openrouter_api_key ? String(openrouter_api_key).trim() : null;
      if (val && val.length > 200) {
        return NextResponse.json(
          { error: "API key looks too long" },
          { status: 400 }
        );
      }
      update.openrouter_api_key = val ? encryptAtRest(val) : null;
    }

    if (typeof ai_filter_enabled !== "undefined") {
      if (typeof ai_filter_enabled !== "boolean") {
        return NextResponse.json(
          { error: "ai_filter_enabled must be boolean" },
          { status: 400 }
        );
      }
      update.ai_filter_enabled = ai_filter_enabled;
    }

    if (typeof ai_reviewer_enabled !== "undefined") {
      if (typeof ai_reviewer_enabled !== "boolean") {
        return NextResponse.json(
          { error: "ai_reviewer_enabled must be boolean" },
          { status: 400 }
        );
      }
      update.ai_reviewer_enabled = ai_reviewer_enabled;
    }

    if (typeof auto_delete_mean !== "undefined") {
      if (typeof auto_delete_mean !== "boolean") {
        return NextResponse.json(
          { error: "auto_delete_mean must be boolean" },
          { status: 400 }
        );
      }
      update.auto_delete_mean = auto_delete_mean;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(update)
      .eq("id", user.id);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
