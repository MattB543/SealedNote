"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { browserCrypto } from "@/lib/crypto-browser";
import Link from "next/link";

const PROMPT_EXAMPLES = {
  strict: "Filter anything negative, harsh, or critical",
  balanced:
    "Filter only serious insults, threats, and purely hurtful comments with zero constructive value",
  lenient: "Only filter extreme hate speech and threats",
};

export default function Settings() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [feedbackLink, setFeedbackLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasLocalKey, setHasLocalKey] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportedKey, setExportedKey] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Verify authenticated user and load profile
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        router.push("/auth/signin");
        return;
      }
      const userId = authData.user.id;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      setUser(userData);
      setCustomPrompt(userData.custom_prompt || PROMPT_EXAMPLES.balanced);
      if (userData.openrouter_api_key) {
        setHasOpenRouterKey(true);
        setOpenRouterKey("••••••••••••…"); // purely a display mask
      } else {
        setHasOpenRouterKey(false);
        setOpenRouterKey("");
      }

      // Check if we have encrypted private key in localStorage
      const encryptedPrivateKey = localStorage.getItem(
        "ff_encrypted_private_key"
      );
      const storedSalt = localStorage.getItem("ff_salt");
      setHasLocalKey(
        !!(encryptedPrivateKey && storedSalt && storedSalt === userData.salt)
      );

      // Get active feedback link
      const { data: linkData } = await supabase
        .from("feedback_links")
        .select("share_token")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (linkData) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        setFeedbackLink(`${baseUrl}/f/${linkData.share_token}`);
      }
    } catch (error: any) {
      // Error loading user data
    }
  };

  const saveCustomPrompt = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_prompt: customPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage("Filter settings updated successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const saveOpenRouterKey = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const isMasked = hasOpenRouterKey && openRouterKey.endsWith("…");
      const valueToStore = isMasked ? undefined : openRouterKey.trim() || null;
      if (valueToStore !== undefined) {
        const res = await fetch("/api/settings/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openrouter_api_key: valueToStore }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setMessage(
          valueToStore ? "OpenRouter key saved" : "OpenRouter key removed"
        );
      } else {
        setMessage("No changes to OpenRouter key");
      }
      await loadUserData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage("Failed to update OpenRouter key");
    } finally {
      setSaving(false);
    }
  };

  const generateNewLink = async () => {
    try {
      // Deactivate old links
      const { data: authData2 } = await supabase.auth.getUser();
      const userId2 = authData2?.user?.id;
      await supabase
        .from("feedback_links")
        .update({ is_active: false })
        .eq("user_id", userId2);

      // Create new link
      const shareToken = (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).substring(2, 15);
      const { error } = await supabase.from("feedback_links").insert({
        user_id: userId2,
        share_token: shareToken,
        is_active: true,
      });

      if (error) throw error;

      await loadUserData();
      setMessage("New feedback link generated!");
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage("Failed to generate new link");
    }
  };

  const removeLocalKey = () => {
    localStorage.removeItem("ff_encrypted_private_key");
    localStorage.removeItem("ff_salt");
    setHasLocalKey(false);
    setMessage("Private key removed from browser");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportKey = async () => {
    try {
      setExportError(null);

      if (!exportPassword) {
        setExportError("Please enter your encryption password");
        return;
      }

      const encryptedPrivateKey = localStorage.getItem(
        "ff_encrypted_private_key"
      );
      const salt = localStorage.getItem("ff_salt");

      if (!encryptedPrivateKey || !salt) {
        setExportError("No private key found in browser");
        return;
      }

      // Decrypt the private key with password
      const decryptedKey = await browserCrypto.decryptPrivateKeyWithPassword(
        encryptedPrivateKey,
        exportPassword,
        salt
      );

      setExportedKey(decryptedKey);
    } catch (error: any) {
      setExportError("Incorrect password");
    }
  };

  const copyExportedKey = async () => {
    await navigator.clipboard.writeText(exportedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}

        {/* Custom Filter Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Custom Filter Instructions
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium">AI Filtering</label>
            <span
              className={`text-xs px-2 py-1 rounded ${
                user.ai_filter_enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {user.ai_filter_enabled ? "Enabled" : "Disabled"}
            </span>
            <button
              onClick={async () => {
                const next = !user.ai_filter_enabled;
                const { error } = await supabase
                  .from("users")
                  .update({ ai_filter_enabled: next })
                  .eq("id", user.id);
                if (!error) {
                  setUser({ ...user, ai_filter_enabled: next });
                  setMessage(`AI filtering ${next ? "enabled" : "disabled"}`);
                  setTimeout(() => setMessage(null), 2000);
                }
              }}
              className="ml-auto px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              {user.ai_filter_enabled ? "Disable" : "Enable"}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Customize how the AI filters feedback before it reaches you
          </p>

          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full h-24 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your custom filtering instructions..."
          />

          <button
            onClick={saveCustomPrompt}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Filter Settings"}
          </button>
        </div>

        {/* Feedback Link */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Feedback Link</h2>
          <div className="p-3 bg-gray-50 rounded-lg mb-3">
            <p className="text-sm text-gray-600 mb-1">Current link:</p>
            <code className="text-sm">{feedbackLink}</code>
          </div>
          <button
            onClick={generateNewLink}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Generate New Link
          </button>
          <p className="text-xs text-gray-500 mt-2">
            This will disable your old link
          </p>
        </div>

        {/* OpenRouter Key */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">OpenRouter API Key</h2>
          {hasOpenRouterKey ? (
            <div className="mb-3 p-3 bg-green-50 rounded">
              <p className="text-sm text-green-800">
                Using personal key:{" "}
                <code className="bg-white px-1 py-0.5 rounded">
                  {openRouterKey}
                </code>
              </p>
            </div>
          ) : (
            <div className="mb-3 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">Using default app key</p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="password"
              value={
                hasOpenRouterKey && openRouterKey.endsWith("…")
                  ? ""
                  : openRouterKey
              }
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder={
                hasOpenRouterKey
                  ? "Enter new key to replace (optional)"
                  : "sk-or-v1-..."
              }
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={saveOpenRouterKey}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {hasOpenRouterKey && (
              <button
                onClick={async () => {
                  setOpenRouterKey("");
                  await saveOpenRouterKey();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            If left empty, the default app key is used
          </p>
        </div>

        {/* Private Key Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Private Key Management</h2>

          {hasLocalKey ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded mb-3">
              <p className="text-sm text-green-700 font-medium">
                ✓ Private key saved in browser
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Your encrypted private key is stored locally in this browser
              </p>
              <button
                onClick={removeLocalKey}
                className="mt-3 text-sm text-red-600 hover:underline"
              >
                Remove from browser
              </button>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3">
              <p className="text-sm text-yellow-700 font-medium">
                ⚠️ Private key not saved in browser
              </p>
              <p className="text-xs text-gray-600 mt-1">
                You'll need to enter your full private key each time to read
                feedback
              </p>
            </div>
          )}

          {hasLocalKey && (
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
            >
              Export Private Key
            </button>
          )}
        </div>

        {/* Account */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Export Private Key Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Export Private Key</h3>

            {!exportedKey ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your encryption password to export your private key
                </p>

                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Enter your encryption password"
                  className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {exportError && (
                  <p className="text-sm text-red-600 mb-3">{exportError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleExportKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Decrypt and Export
                  </button>
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      setExportPassword("");
                      setExportError(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">
                    ⚠️ Keep this key secure!
                  </p>
                  <p className="text-xs text-yellow-700">
                    Anyone with this key can read your encrypted feedback
                  </p>
                </div>

                <div className="bg-gray-100 p-3 rounded mb-4">
                  <label className="text-xs text-gray-600">
                    Your Private Key:
                  </label>
                  <textarea
                    readOnly
                    value={exportedKey}
                    className="w-full h-32 mt-1 p-2 text-xs font-mono bg-white border rounded"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={copyExportedKey}
                    className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    {copiedKey ? "✓ Copied!" : "Copy to Clipboard"}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportPassword("");
                    setExportedKey("");
                    setExportError(null);
                  }}
                  className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
