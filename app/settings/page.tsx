"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { usePrivateKey } from "@/components/PrivateKeyProvider";
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
  const { clearPrivateKey, privateKey } = usePrivateKey();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [feedbackNote, setFeedbackNote] = useState<string>(
    DEFAULT_FEEDBACK_NOTE
  );
  const [feedbackLink, setFeedbackLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [changingUsername, setChangingUsername] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      // Verify authenticated user and load profile
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        router.push("/");
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
      setNewUsername(userData.username || "");
      setCustomPrompt(userData.custom_prompt || PROMPT_EXAMPLES.balanced);
      setFeedbackNote(userData.feedback_note || DEFAULT_FEEDBACK_NOTE);
      if (userData.openrouter_api_key) {
        setHasOpenRouterKey(true);
        setOpenRouterKey("••••••••••••…"); // purely a display mask
      } else {
        setHasOpenRouterKey(false);
        setOpenRouterKey("");
      }

      // Set feedback link based on username
      if (userData.username) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        setFeedbackLink(`${baseUrl}/f/${userData.username}`);
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

  const saveUsername = async () => {
    try {
      setChangingUsername(true);
      setUsernameError(null);
      setMessage(null);

      const res = await fetch("/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update username");
      }

      // Update local state and feedback link
      setUser({
        ...user,
        username: newUsername,
        username_change_count: (user.username_change_count || 0) + 1,
      });
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      setFeedbackLink(`${baseUrl}/f/${newUsername}`);
      localStorage.setItem("ff_username", newUsername);

      setShowUsernameModal(false);
      setMessage("Username updated successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setUsernameError(error.message || "Failed to update username");
    } finally {
      setChangingUsername(false);
    }
  };

  const copyExportedKey = async () => {
    if (privateKey) {
      await navigator.clipboard.writeText(privateKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return; // Prevent double-clicks

    try {
      setSigningOut(true);

      // Clear private key from memory immediately
      clearPrivateKey();

      // Clear local storage
      localStorage.removeItem("ff_salt");
      localStorage.removeItem("ff_username");
      sessionStorage.removeItem("ff_session_private_key");

      // Sign out from Supabase and wait for completion
      const { error } = await supabase.auth.signOut();

      // Small delay to ensure cleanup completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Force reload clears everything
      window.location.href = "/";
    } catch (error) {
      // Even on error, force redirect after delay
      await new Promise((resolve) => setTimeout(resolve, 100));
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

        {/* Username & Feedback Link */}
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Profile</h2>

          <div className="space-y-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-0.5">Username</p>
              <div className="flex items-center gap-2">
                <p className="text-md font-medium">{user.username}</p>
                {user.username_change_count > 0 && (
                  <span className="text-xs text-gray-500">
                    ({user.username_change_count}/3 changes used)
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">
                Share this link to collect feedback
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-3 py-1.5 rounded flex-1 break-all">
                  {feedbackLink}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(feedbackLink);
                    setMessage("Link copied to clipboard!");
                    setTimeout(() => setMessage(null), 2000);
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300 whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            {(user.username_change_count || 0) < 3 && (
              <button
                onClick={() => {
                  setNewUsername(user.username);
                  setUsernameError(null);
                  setShowUsernameModal(true);
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                Change username/link
              </button>
            )}
          </div>

          {(user.username_change_count || 0) >= 3 && (
            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-sm text-yellow-800">
                You've reached the maximum number of username changes (3).
              </p>
            </div>
          )}
        </div>

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
                  ? "Before sending, people see AI suggestions to improve their feedback's constructiveness, clarity, and anonymity. They can apply rewrites or send their original message."
                  : "Enable to help senders improve their feedback before sending. The AI will suggest ways to be more constructive, protect anonymity, and communicate clearly."}
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
                  ? "Messages flagged by the filter are dropped silently."
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

        {/* Private Key Export */}
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Export Private Key</h2>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3">
            <p className="text-sm text-yellow-700 font-medium">
              ⚠️ Store your private key securely
            </p>
            <p className="text-sm text-gray-600 mt-1">
              You'll need your private key to decrypt feedback. Keep it in a
              password manager.
            </p>
          </div>

          {privateKey && (
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
              className="px-4 py-2 text-base rounded disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Username Modal */}
      {showUsernameModal && (user.username_change_count || 0) < 3 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-off-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">
              Change Username & Feedback Link
            </h3>

            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded mb-4">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                ⚠️ Important:
              </p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • You can only change your username{" "}
                  {3 - user.username_change_count} more time
                  {3 - user.username_change_count === 1 ? "" : "s"}
                </li>
                <li>• Old usernames cannot be reused</li>
                <li>• Your feedback link will update automatically</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Current username
              </label>
              <p className="text-sm bg-gray-100 px-3 py-2 rounded mb-4">
                {user.username}
              </p>

              <label className="block text-sm font-medium mb-2">
                New username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value.toLowerCase());
                  setUsernameError(null);
                }}
                placeholder="john-doe"
                maxLength={30}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-2">
                New link will be:{" "}
                {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/f/
                {newUsername || "..."}
              </p>
            </div>

            {usernameError && (
              <p className="text-sm text-red-600 mb-4">{usernameError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setNewUsername(user.username);
                  setUsernameError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveUsername}
                disabled={
                  changingUsername ||
                  !newUsername ||
                  newUsername === user.username
                }
                className="flex-1 px-4 py-2 bg-[#424133] text-white rounded-lg hover:bg-[#53524d] disabled:opacity-50"
              >
                {changingUsername ? "Updating..." : "Update Username"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Private Key Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-off-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Export Private Key</h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                ⚠️ Keep this key secure!
              </p>
              <p className="text-sm text-yellow-700">
                Anyone with this key can read your encrypted feedback
              </p>
            </div>

            {privateKey ? (
              <>
                <div className="bg-gray-100 p-3 rounded mb-4">
                  <label className="text-sm text-gray-600">
                    Your Private Key:
                  </label>
                  <textarea
                    readOnly
                    value={privateKey}
                    className="w-full h-24 mt-1 p-2 text-sm font-mono bg-off-white border rounded"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={copyExportedKey}
                      className="px-4 py-2 text-base rounded"
                    >
                      {copiedKey ? "✓ Copied!" : "Copy to Clipboard"}
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([privateKey], {
                          type: "text/plain",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `sealednote-private-key-${
                          user.username || "export"
                        }.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-4 py-2 text-base rounded"
                    >
                      Download as .txt
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600 mb-4">
                Your private key is not currently loaded. Please unlock your
                inbox first.
              </p>
            )}

            <button
              onClick={() => {
                setShowExportModal(false);
                setCopiedKey(false);
              }}
              className="w-full px-4 py-2 text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
