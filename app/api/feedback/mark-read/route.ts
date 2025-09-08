import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { feedbackId } = await request.json()
    
    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Missing feedback ID' },
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
