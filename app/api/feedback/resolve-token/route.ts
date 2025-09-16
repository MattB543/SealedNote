import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { DEFAULT_FEEDBACK_NOTE } from '@/lib/constants'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
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
