"use client";

import { useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";

export default function SignInPage() {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      if (!email) {
        throw new Error("Please enter your email");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      setMessage("Magic link sent! Check your email to continue.");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-off-white rounded-lg shadow p-6 space-y-4">
          <h1 className="text-2xl font-bold">Sign In</h1>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
          )}
          
          {message ? (
            <div className="p-6 bg-gray-100 text-[#424133] rounded-lg text-center">
              <div className="text-lg font-medium">{message}</div>
              <p className="mt-2 text-sm text-gray-600">
                By continuing, you agree to our terms and privacy policy
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border rounded-lg"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !email}
                className="w-full py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
              
              <p className="text-sm text-gray-600 text-center">
                We'll send you a secure link to sign in - no password needed!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}