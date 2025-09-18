"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { browserCrypto } from "@/lib/crypto-browser";
import { DEFAULT_FEEDBACK_NOTE } from "@/lib/constants";
import Link from "next/link";

const PROMPT_EXAMPLES = {
  strict: "Filter anything negative, harsh, or critical",
  balanced:
    "Filter out only serious insults, threats, and purely hurtful comments with zero constructive value",
  lenient: "Only filter extreme hate speech and threats",
};

export default function Settings() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [feedbackNote, setFeedbackNote] = useState<string>(
    DEFAULT_FEEDBACK_NOTE
  );
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
  const [signingOut, setSigningOut] = useState(false);

  const loadUserData = useCallback(async () => {
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
      setFeedbackNote(userData.feedback_note || DEFAULT_FEEDBACK_NOTE);
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
  }, [router, supabase]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

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

  const saveFeedbackNote = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_note: feedbackNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage("Feedback note updated!");
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage("Failed to update feedback note");
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
    if (signingOut) return; // Prevent double-clicks
    
    try {
      setSigningOut(true);
      
      // Clear local storage first
      localStorage.removeItem("ff_encrypted_private_key");
      localStorage.removeItem("ff_salt");
      localStorage.removeItem("ff_private_key");
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
      }
      
      // Use window.location for a full page reload to clear all state
      // This ensures the server component properly checks auth state
      window.location.href = "/";
    } catch (err) {
      console.error("Error during sign out:", err);
      // Force redirect even on error
      window.location.href = "/";
    }
  };

  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-[#424133] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Link
            href="/dashboard"
            className="text-[#424133] hover:underline text-lg"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}

        {/* Feedback Note for Senders */}
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-semibold">Feedback Note</h2>
              <p className="text-sm text-gray-600">
                Shown on your share page above the text box.
              </p>
            </div>
          </div>
          <textarea
            value={feedbackNote}
            onChange={(e) => setFeedbackNote(e.target.value)}
            placeholder={DEFAULT_FEEDBACK_NOTE}
            maxLength={200}
            className="w-full px-3 py-3 border rounded-lg h-24 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-gray-500">
              {feedbackNote.length}/200
            </span>
            <button
              onClick={saveFeedbackNote}
              disabled={saving}
              className="px-4 py-2 text-base rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Custom Filter Instructions */}
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-semibold">
                Custom Filter Instructions
              </h2>
              <p className="text-sm text-gray-600">
                {user.ai_filter_enabled
                  ? "AI filtering is currently enabled. Customize how the AI filters feedback before it reaches you."
                  : "AI filtering is currently disabled. Enable it to customize how feedback is filtered."}
              </p>
            </div>
            <button
              onClick={async () => {
                const next = !user.ai_filter_enabled;
                try {
                  setSaving(true);
                  const payload: any = { ai_filter_enabled: next };
                  if (!next) {
                    payload.auto_delete_mean = false;
                  }
                  const res = await fetch("/api/settings/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Failed");
                  setUser({
                    ...user,
                    ai_filter_enabled: next,
                    ...(next ? {} : { auto_delete_mean: false }),
                  });
                  setMessage(`AI filtering ${next ? "enabled" : "disabled"}`);
                  setTimeout(() => setMessage(null), 2000);
                } catch {
                } finally {
                  setSaving(false);
                }
              }}
              className="px-4 py-2 text-base rounded disabled:opacity-50"
            >
              {user.ai_filter_enabled ? "Disable" : "Enable"}
            </button>
          </div>

          {user.ai_filter_enabled && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              maxLength={1000}
              className="w-full h-24 px-3 py-2 border rounded-lg resize-none"
              placeholder="Enter your custom filtering instructions..."
            />
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={saveCustomPrompt}
              disabled={saving}
              className="px-4 py-2 text-base rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Filter Settings"}
            </button>
          </div>
        </div>

        {/* AI Reviewer Toggle */}
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-lg font-semibold">AI Reviewer (Coach)</h2>
              <p className="text-sm text-gray-600">
                {user.ai_reviewer_enabled
                  ? "Senders will see coaching suggestions before sending."
                  : "Enable to provide coaching suggestions to senders."}
              </p>
            </div>
            <button
              onClick={async () => {
                const next = !user.ai_reviewer_enabled;
                try {
                  setSaving(true);
                  const res = await fetch("/api/settings/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ai_reviewer_enabled: next }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Failed");
                  setUser({ ...user, ai_reviewer_enabled: next });
                  setMessage(`AI reviewer ${next ? "enabled" : "disabled"}`);
                  setTimeout(() => setMessage(null), 2000);
                } catch {
                } finally {
                  setSaving(false);
                }
              }}
              className="px-4 py-2 text-base rounded disabled:opacity-50"
            >
              {user.ai_reviewer_enabled ? "Disable" : "Enable"}
            </button>
          </div>
        </div>

        {/* Auto-delete toggle */}
        <div
          className={`bg-off-white rounded-lg shadow-sm p-6 mb-6 ${
            !user.ai_filter_enabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-lg font-semibold">
                Auto‑delete filtered feedback
              </h2>
              <p className="text-sm text-gray-600">
                {user.auto_delete_mean
                  ? "Messages flagged as mean are dropped silently."
                  : "Enable to automatically drop feedback flagged as mean."}
              </p>
            </div>
            <button
              onClick={async () => {
                const next = !user.auto_delete_mean;
                try {
                  setSaving(true);
                  const res = await fetch("/api/settings/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ auto_delete_mean: next }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Failed");
                  setUser({ ...user, auto_delete_mean: next });
                  setMessage(`Auto-delete ${next ? "enabled" : "disabled"}`);
                  setTimeout(() => setMessage(null), 2000);
                } catch {
                } finally {
                  setSaving(false);
                }
              }}
              disabled={!user.ai_filter_enabled || saving}
              className="px-4 py-2 text-base rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !user.ai_filter_enabled
                  ? "Enable AI filtering to enable auto-delete feature"
                  : undefined
              }
            >
              {user.auto_delete_mean ? "Disable" : "Enable"}
            </button>
          </div>
        </div>

        {/* Feedback Link */}
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-semibold">Feedback Link</h2>
              <p className="text-sm text-gray-600">
                Share this link to collect feedback securely.
              </p>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg mb-2">
            <p className="text-sm text-gray-600 mb-1">Current link:</p>
            <code className="text-sm break-all">{feedbackLink}</code>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <button
              onClick={generateNewLink}
              className="px-4 py-2 text-base rounded"
            >
              Generate New Link
            </button>
            <p className="text-sm text-gray-500 mt-2">
              This will disable your old link
            </p>
          </div>
        </div>

        {/* OpenRouter Key */}
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-2">
          <div>
            <h2 className="text-lg font-semibold">OpenRouter API Key</h2>
            <p className="text-sm text-gray-600">
              Use your own key to run AI filtering under your own control. If
              left empty, the default app key is used
            </p>
          </div>
          {hasOpenRouterKey ? (
            <div className="mb-3 p-3 bg-green-50 rounded">
              <p className="text-sm text-green-800">
                Using personal key:{" "}
                <code className="bg-off-white px-1 py-0.5 rounded">
                  {openRouterKey}
                </code>
              </p>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">Using default app key</p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="password"
              maxLength={200}
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
            {hasOpenRouterKey && (
              <button
                onClick={async () => {
                  setOpenRouterKey("");
                  await saveOpenRouterKey();
                }}
                className="px-4 py-2 text-base rounded"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex justify-end mt-3 ">
            <button
              onClick={saveOpenRouterKey}
              disabled={saving}
              className="px-4 py-2 text-base rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Key"}
            </button>
          </div>
        </div>

        {/* Private Key Management */}
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Private Key Management</h2>

          {hasLocalKey ? (
            <div className="p-3 bg-gray-50 border border-[#424133] rounded mb-3">
              <p className="text-md text-[#424133] font-medium">
                ✓ Private key saved in browser
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Your encrypted private key is stored locally in this browser
              </p>
              <button
                onClick={removeLocalKey}
                className="mt-3 inline-flex items-center px-3 py-1.5 rounded text-sm"
              >
                Remove from browser
              </button>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3">
              <p className="text-sm text-yellow-700 font-medium">
                ⚠️ Private key not saved in browser
              </p>
              <p className="text-sm text-gray-600 mt-1">
                You'll need to enter your full private key each time to read
                feedback
              </p>
            </div>
          )}

          {hasLocalKey && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 text-base rounded"
              >
                Export Private Key
              </button>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="bg-off-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-semibold">Account</h2>
              <p className="text-sm text-gray-600">
                Signing out clears your session on this device.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-4 py-2 text-base rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>

      {/* Export Private Key Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-off-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                />

                {exportError && (
                  <p className="text-sm text-red-600 mb-3">{exportError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleExportKey}
                    className="px-4 py-2 text-base rounded-lg"
                  >
                    Decrypt and Export
                  </button>
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      setExportPassword("");
                      setExportError(null);
                    }}
                    className="px-4 py-2 text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
                  <p className="text-sm text-yellow-700">
                    Anyone with this key can read your encrypted feedback
                  </p>
                </div>

                <div className="bg-gray-100 p-3 rounded mb-4">
                  <label className="text-sm text-gray-600">
                    Your Private Key:
                  </label>
                  <textarea
                    readOnly
                    value={exportedKey}
                    className="w-full h-24 mt-1 p-2 text-sm font-mono bg-off-white border rounded"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={copyExportedKey}
                    className="mt-2 px-4 py-2 text-base rounded"
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
                  className="w-full px-4 py-2 text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
