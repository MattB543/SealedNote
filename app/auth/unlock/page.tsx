"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { browserCrypto } from "@/lib/crypto-browser";
import { usePrivateKey } from "@/components/PrivateKeyProvider";

export default function Unlock() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { privateKey, setPrivateKey, clearPrivateKey } = usePrivateKey();
  const [userSalt, setUserSalt] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (privateKey) {
      router.replace("/dashboard");
      return;
    }

    (async () => {
      let redirected = false;
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (!uid) {
          router.push("/");
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
      } catch {
      } finally {
        if (!redirected) {
          setInitializing(false);
        }
      }
    })();
  }, [privateKey, router, supabase]);

  const unlockWithKey = async (keyToUse?: string) => {
    try {
      setLoading(true);
      setError(null);
      const key = keyToUse || privateKeyInput;
      if (!key || !key.includes("BEGIN PRIVATE KEY")) {
        throw new Error("Please provide a valid private key");
      }
      setPrivateKey(key);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Failed to unlock");
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = async (file: File) => {
    try {
      setError(null);
      const text = await file.text();
      if (!text.includes("BEGIN PRIVATE KEY")) {
        throw new Error("Invalid key file - must contain a private key");
      }
      setPrivateKeyInput(text);
      // Auto-unlock after successful file read
      await unlockWithKey(text);
    } catch (e: any) {
      setError(e?.message || "Failed to read key file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        await handleFileDrop(file);
      } else {
        setError("Please drop a .txt file containing your private key");
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileDrop(files[0]);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full min-h-[254px] max-w-md bg-off-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Unlock</h1>
          <p className="text-sm text-gray-600">
            Preparing your unlock options…
          </p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    // Clear private key from memory
    clearPrivateKey();

    // Clear all localStorage
    localStorage.removeItem("ff_salt");
    localStorage.removeItem("ff_username");
    sessionStorage.removeItem("ff_session_private_key");

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Redirect to home page
    router.push("/");
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center w-full max-w-md">
        <div
          className={`w-full bg-off-white rounded-lg shadow p-6 transition-all ${
            isDragging ? "ring-4 ring-blue-400 ring-opacity-50" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h1 className="text-2xl font-bold mb-4">
            Unlock Your Encrypted Inbox
          </h1>

          {error && (
            <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="pointer-events-none">
                <svg
                  className="mx-auto h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {isDragging
                    ? "Drop your key file here"
                    : "Drop your private key .txt file here or click to browse"}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 py-2 bg-off-white text-gray-500">
                  or paste your key below
                </span>
              </div>
            </div>

            <textarea
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              placeholder={`-----BEGIN PRIVATE KEY-----\npaste your private key here\n-----END PRIVATE KEY-----`}
              className="w-full h-20 p-2 text-sm font-mono border rounded-lg"
            />
            <button
              onClick={() => unlockWithKey()}
              disabled={loading}
              className="w-full py-2 rounded disabled:opacity-50"
            >
              {loading ? "Decrypting..." : "Decrypt"}
            </button>
          </div>
        </div>
        <span
          role="button"
          onClick={handleSignOut}
          className="button-link mt-4 inline-block text-sm"
        >
          Sign out
        </span>
      </div>
    </div>
  );
}
