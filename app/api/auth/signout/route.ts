import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Sign out from Supabase (clears server session)
    const { error } = await supabase.auth.signOut();
    
    // Continue even if sign out has errors
    
    // Clear all auth cookies explicitly
    const response = NextResponse.json({ success: true });
    
    // Clear Supabase auth cookies
    response.cookies.set({
      name: 'sb-auth-token',
      value: '',
      maxAge: 0,
      path: '/',
    });
    
    response.cookies.set({
      name: 'sb-refresh-token', 
      value: '',
      maxAge: 0,
      path: '/',
    });
    
    // Clear any session cookies with the Supabase prefix
    const cookieStore = cookies();
    cookieStore.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set({
          name: cookie.name,
          value: '',
          maxAge: 0,
          path: '/',
        });
      }
    });
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}