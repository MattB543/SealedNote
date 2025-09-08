import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { encryptAtRest } from '@/lib/keystore'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { custom_prompt, openrouter_api_key } = await request.json()
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build update
    const update: any = {}
    if (typeof custom_prompt !== 'undefined') update.custom_prompt = custom_prompt
    if (typeof openrouter_api_key !== 'undefined') {
      update.openrouter_api_key = openrouter_api_key
        ? encryptAtRest(openrouter_api_key)
        : null
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: true })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(update)
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
