import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendFeedbackEmail } from "@/lib/email";
import crypto from "crypto";

export const runtime = "nodejs";

async function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && token === secret);
}

async function doDispatch(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const nowIso = new Date().toISOString();
    const limit = Number(process.env.DISPATCH_BATCH_LIMIT || 100);

    // Clean up claims older than 5 minutes (stuck claims)
    const cleanupCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await (supabase as any)
      .from("scheduled_feedback")
      .update({ claimed_by: null, claimed_at: null })
      .not("claimed_by", "is", null)
      .lt("claimed_at", cleanupCutoff);

    // First, claim rows by marking them (idempotent approach)
    // We'll use a unique claim_id to prevent double-processing
    const claimId = crypto.randomUUID();
    
    // Claim available rows by updating them with our claim_id and fetch full data atomically
    const { data: claimed, error: claimErr } = await (supabase as any)
      .from("scheduled_feedback")
      .update({ claimed_by: claimId, claimed_at: nowIso })
      .is("claimed_by", null)
      .lte("deliver_at", nowIso)
      .order("deliver_at", { ascending: true })
      .limit(limit)
      .select("*");

    if (claimErr) throw claimErr;
    
    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ delivered: 0 });
    }

    const userIds = Array.from(new Set(claimed.map((d: any) => d.user_id)));
    const { data: users, error: uerr } = await (supabase as any)
      .from("users")
      .select("id,email")
      .in("id", userIds);
    if (uerr) throw uerr;
    const emailByUser = new Map<string, string>();
    users?.forEach((u: any) => emailByUser.set(u.id, u.email));

    let delivered = 0;
    const successfulIds: string[] = [];
    
    for (const row of claimed) {
      const { error: insErr } = await (supabase as any)
        .from("feedback")
        .insert({
          user_id: row.user_id,
          encrypted_content: row.encrypted_content,
          encrypted_reasoning: row.encrypted_reasoning,
          encrypted_context: row.encrypted_context,
          is_mean: row.is_mean,
          status: "unread",
        });

      if (insErr) {
        // On error, unclaim the row for future retry
        try {
          await (supabase as any)
            .from("scheduled_feedback")
            .update({ claimed_by: null, claimed_at: null })
            .eq("id", row.id);
        } catch {}
        continue;
      }

      delivered++;
      successfulIds.push(row.id);
      
      const email = emailByUser.get(row.user_id);
      if (email) {
        try {
          await sendFeedbackEmail(email, !!row.is_mean);
        } catch {}
      }
    }

    // Delete successfully processed rows
    if (successfulIds.length > 0) {
      await (supabase as any)
        .from("scheduled_feedback")
        .delete()
        .in("id", successfulIds);
    }

    return NextResponse.json({ delivered });
  } catch (e) {
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return doDispatch(request);
}
export async function POST(request: NextRequest) {
  return doDispatch(request);
}
