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
  const [mode, setMode] = useState<"password" | "key">("password");

  useEffect(() => {
    (async () => {
      let redirected = false;
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (!uid) {
          router.push("/auth/signin");
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("salt")
          .eq("id", uid)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profile) {
          redirected = true;
          router.replace("/auth/setup");
          return;
        }

        if (profile.salt) {
          setUserSalt(profile.salt);
        }
        const enc = localStorage.getItem("ff_encrypted_private_key");
        const storedSalt = localStorage.getItem("ff_salt");
        const passwordPossible = Boolean(
          enc && storedSalt && profile.salt && storedSalt === profile.salt
        );
        setCanUsePassword(passwordPossible);
        setMode(passwordPossible ? "password" : "key");
      } catch {
      } finally {
        if (!redirected) {
          setInitializing(false);
        }
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
        <div className="w-full min-h-[254px] max-w-md bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Unlock</h1>
          <p className="text-sm text-gray-600">
            Preparing your unlock options…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Decrypt your inbox</h1>
        <p className="text-md text-gray-600 mb-4">
          Enter your encryption password below. Or{" "}
          <p
            role="button"
            className="button-link"
            onClick={() => setMode("key")}
          >
            use your private key directly
          </p>
          .
        </p>

        {error && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {mode === "password" && canUsePassword ? (
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your encryption password"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button
              onClick={unlockWithPassword}
              disabled={loading}
              className="w-full py-2 rounded disabled:opacity-50"
            >
              {loading ? "Decrypting..." : "Decrypt Inbox"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              placeholder={`-----BEGIN PRIVATE KEY-----\n...paste your private key here...\n-----END PRIVATE KEY-----`}
              className="w-full h-28 p-2 text-sm font-mono border rounded-lg"
            />
            <button
              onClick={unlockWithKey}
              disabled={loading}
              className="w-full py-2 rounded disabled:opacity-50"
            >
              {loading ? "Decrypting..." : "Decrypt"}
            </button>
            {canUsePassword && (
              <button
                type="button"
                onClick={() => setMode("password")}
                className="button-link !text-[#424133]"
              >
                Use password instead
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
