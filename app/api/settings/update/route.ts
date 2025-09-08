import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { encryptAtRest } from "@/lib/keystore";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { custom_prompt, openrouter_api_key } = await request.json();

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
