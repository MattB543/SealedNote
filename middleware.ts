import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Generate nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  // Set up CSP with nonce
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-eval' 'strict-dynamic'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'nonce-${nonce}' 'unsafe-inline';
    img-src 'self' data: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.openrouter.ai ${
      isDev ? "ws: wss:" : ""
    };
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    ${!isDev ? "upgrade-insecure-requests;" : ""}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // Create response with nonce header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set CSP and other security headers
  res.headers.set("Content-Security-Policy", cspHeader);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );

  if (!isDev) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Set custom headers
  res.headers.set("X-Commit-SHA", process.env.VERCEL_GIT_COMMIT_SHA || "local");
  res.headers.set("X-Build-ID", process.env.VERCEL_DEPLOYMENT_ID || "dev");
  const repo =
    process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : "unknown";
  res.headers.set("X-Repo", repo);
  res.headers.set("X-Branch", process.env.VERCEL_GIT_COMMIT_REF || "unknown");

  // Protected routes that require authentication
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/auth/setup",
    "/auth/unlock",
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Only create Supabase client and check auth for protected routes or auth callback
  const url = new URL(req.url);
  const isAuthCallback = req.nextUrl.pathname === "/auth/callback";
  const code = isAuthCallback ? url.searchParams.get("code") : null;
  
  if (code || isProtectedPath) {
    const supabase = createMiddlewareClient({ req, res });
    
    // Only exchange codes on the /auth/callback route for security
    if (code && isAuthCallback) {
      try {
        const {
          data: { session },
        } = await supabase.auth.exchangeCodeForSession(code);
        // Decide next hop based on whether the user has a profile row
        let target = "/auth/unlock";
        if (session?.user) {
          const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();
          if (!existing) target = "/auth/setup";
        }
        const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
        // Important: preserve Set-Cookie headers from `createMiddlewareClient`
        // so the session persists after redirect
        const redirectUrl = new URL(target, base);
        return NextResponse.redirect(redirectUrl, { headers: res.headers });
      } catch (error) {
        // Continue with normal flow if code exchange fails
      }
    }
    
    // Only check user for protected paths
    if (isProtectedPath) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to home page if trying to access protected route without session
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return res;
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
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
