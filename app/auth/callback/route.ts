import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange code for session
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (authError) {
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=auth_failed`)
    }

    if (session?.user) {
      // Check if user already exists in our database
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!existingUser) {
        // New user - redirect to setup page
        return NextResponse.redirect(`${requestUrl.origin}/auth/setup`)
      }
      
      // Existing user - redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }
  }

  // Something went wrong
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_code`)
}
