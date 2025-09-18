import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { DEFAULT_FEEDBACK_NOTE } from '@/lib/constants'

export const runtime = 'nodejs'

// Simple rate limiting
type Bucket = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const buckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr;
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Validate token format (alphanumeric and hyphens, 3-100 chars)
    if (!/^[a-z0-9-]{3,100}$/i.test(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
    }

    // Rate limiting by IP
    const ip = getClientIp(request);
    const now = Date.now();
    const bucket = buckets.get(ip);
    
    if (!bucket || now >= bucket.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      bucket.count++;
      if (bucket.count > RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }
    }

    // Clean up old buckets periodically
    if (buckets.size > 1000) {
      buckets.forEach((v, k) => {
        if (now >= v.resetAt) buckets.delete(k);
      });
    }

    const supabase = createServerSupabaseClient()

    const { data: link, error: linkError } = await (supabase as any)
      .from('feedback_links')
      .select('user_id')
      .eq('share_token', token)
      .eq('is_active', true)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('username, public_key, ai_filter_enabled, ai_reviewer_enabled, feedback_note')
      .eq('id', link.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      username: user.username,
      public_key: user.public_key,
      ai_filter_enabled: user.ai_filter_enabled,
      ai_reviewer_enabled: user.ai_reviewer_enabled,
      feedback_note: user.feedback_note ?? DEFAULT_FEEDBACK_NOTE,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve token' }, { status: 500 })
  }
}
