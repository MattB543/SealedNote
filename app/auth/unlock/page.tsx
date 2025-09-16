"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { browserCrypto } from "@/lib/crypto-browser";

export default function Unlock() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [userSalt, setUserSalt] = useState<string | null>(null);
  const [canUsePassword, setCanUsePassword] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [password, setPassword] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (!uid) {
          router.push("/auth/signin");
          return;
        }
        const { data: u } = await supabase
          .from("users")
          .select("salt")
          .eq("id", uid)
          .single();
        if (u?.salt) {
          setUserSalt(u.salt);
        }
        const enc = localStorage.getItem("ff_encrypted_private_key");
        const storedSalt = localStorage.getItem("ff_salt");
        setCanUsePassword(Boolean(enc && storedSalt && u?.salt && storedSalt === u.salt));
      } catch {}
      finally {
        setInitializing(false);
      }
    })();
  }, [router, supabase]);

  const unlockWithPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!canUsePassword || !userSalt) {
        throw new Error("No saved key for this account on this browser");
      }
      if (!password) throw new Error("Enter your encryption password");
      const enc = localStorage.getItem("ff_encrypted_private_key");
      if (!enc) throw new Error("Missing saved key");
      const pk = await browserCrypto.decryptPrivateKeyWithPassword(
        enc,
        password,
        userSalt
      );
      sessionStorage.setItem("ff_session_private_key", pk);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Failed to unlock");
    } finally {
      setLoading(false);
    }
  };

  const unlockWithKey = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!privateKeyInput || !privateKeyInput.includes("BEGIN PRIVATE KEY")) {
        throw new Error("Paste a valid private key");
      }
      sessionStorage.setItem("ff_session_private_key", privateKeyInput);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Failed to unlock");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Unlock</h1>
          <p className="text-sm text-gray-600">Preparing your unlock options…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Unlock</h1>
        <p className="text-sm text-gray-600 mb-4">
          Unlock your inbox by entering your encryption password or pasting your
          private key.
        </p>

        {error && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        {canUsePassword ? (
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your encryption password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={unlockWithPassword}
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Unlocking..." : "Unlock"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              placeholder={`-----BEGIN PRIVATE KEY-----\n...paste your private key here...\n-----END PRIVATE KEY-----`}
              className="w-full h-28 p-2 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={unlockWithKey}
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Unlocking..." : "Unlock"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
