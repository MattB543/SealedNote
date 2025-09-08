import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendFeedbackEmail } from "@/lib/email";

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

    // Atomically claim rows: delete due rows and return them in one call
    const { data: claimed, error: claimErr } = await (supabase as any)
      .from("scheduled_feedback")
      .delete()
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
    for (const row of claimed) {
      const { error: insErr } = await (supabase as any)
        .from("feedback")
        .insert({
          user_id: row.user_id,
          encrypted_content: row.encrypted_content,
          encrypted_reasoning: row.encrypted_reasoning,
          is_mean: row.is_mean,
          status: "unread",
        });

      if (insErr) {
        // Try to put it back so a future run can retry
        try {
          await (supabase as any).from("scheduled_feedback").insert({
            id: row.id,
            user_id: row.user_id,
            encrypted_content: row.encrypted_content,
            encrypted_reasoning: row.encrypted_reasoning,
            is_mean: row.is_mean,
            deliver_at: row.deliver_at,
            created_at: row.created_at,
          });
        } catch {}
        continue;
      }

      delivered++;
      const email = emailByUser.get(row.user_id);
      if (email) {
        try {
          await sendFeedbackEmail(email, !!row.is_mean);
        } catch {}
      }
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
