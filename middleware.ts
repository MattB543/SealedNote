import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Handle magic-link redirect that lands anywhere with ?code=...
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    if (code) {
      const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)
      // Decide next hop based on whether the user has a profile row
      let target = '/auth/unlock'
      if (session?.user) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()
        if (!existing) target = '/auth/setup'
      }
      const base = process.env.NEXT_PUBLIC_APP_URL || url.origin
      // Important: preserve Set-Cookie headers from `createMiddlewareClient`
      // so the session persists after redirect
      const redirectUrl = new URL(target, base)
      return NextResponse.redirect(redirectUrl, { headers: res.headers })
    }
  } catch {}

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/settings', '/auth/setup', '/auth/unlock']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    // Redirect to sign in if trying to access protected route without session
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
