"use client";

import Link from "next/link";
import { useSupabase } from "@/components/SupabaseProvider";
import { useState } from "react";

export function SignInForm() {
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

      if (!email) throw new Error("Enter your email");

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
    <div className="w-full max-w-sm mx-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {message ? (
        <div className="min-h-[108px] p-6 bg-gray-100 text-[#424133] rounded-lg flex flex-col justify-center items-center text-center leading-0.5">
          <div className="text-lg font-medium">{message}</div>
          <p className="mt-1 text-center text-sm text-gray-600">
            By continuing, you agree to our terms and privacy policy
          </p>
        </div>
      ) : (
        <div className="space-y-2 min-[480px]:space-y-2.5 sm:space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="you@example.com"
            className="w-full px-3 h-8 min-[480px]:h-11 sm:h-12 border rounded-lg text-sm min-[480px]:text-base"
            autoComplete="email"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-8 min-[480px]:h-11 sm:h-12 rounded-lg disabled:opacity-50 text-sm min-[480px]:text-base"
          >
            {loading ? "Sending..." : "Log in / Sign up"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SignInCard() {
  return (
    <div className="max-w-md w-full bg-off-white rounded-lg shadow-lg p-8">
      <SignInForm />
    </div>
  );
}
