import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// Rate limiting for mark-read operations
type Bucket = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // per user per minute
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
    const { feedbackId } = await request.json()
    
    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Missing feedback ID' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(feedbackId)) {
      return NextResponse.json(
        { error: 'Invalid feedback ID format' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Update feedback status
    const { error: updateError } = await supabase
      .from('feedback')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .eq('user_id', user.id) // Ensure user owns this feedback

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    )
  }
}
