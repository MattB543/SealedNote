"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { browserCrypto, generateSalt } from "@/lib/crypto-browser";
import { DEFAULT_FEEDBACK_NOTE } from "@/lib/constants";

export default function Setup() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  // Only needed if user chooses to save key locally in this browser
  const [storagePassword, setStoragePassword] = useState("");
  const [username, setUsername] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiReviewerEnabled, setAiReviewerEnabled] = useState(true);
  const [autoDeleteMean, setAutoDeleteMean] = useState(true);
  const [customPrompt, setCustomPrompt] = useState(
    "Filter out only serious insults, threats, and purely hurtful comments with zero constructive value"
  );
  const [feedbackNote, setFeedbackNote] = useState<string>(
    DEFAULT_FEEDBACK_NOTE
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Private key modal states
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKeyToDisplay, setPrivateKeyToDisplay] = useState("");
  const [userSalt, setUserSalt] = useState("");
  const [saveToLocalStorage, setSaveToLocalStorage] = useState(true);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Prefill username from email
  useEffect(() => {
    const email = session?.user?.email || "";
    if (email && !username) {
      const base = email.split("@")[0] || "";
      const sanitized = base.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      setUsername(sanitized);
    }
  }, [session, username]);

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (!username) {
        throw new Error("Please fill in all fields");
      }

      if (!/^[a-z0-9-]+$/.test(username)) {
        throw new Error(
          "Username can only contain lowercase letters, numbers, and hyphens"
        );
      }

      if (username.length < 3 || username.length > 30) {
        throw new Error("Username must be between 3 and 30 characters");
      }

      if (customPrompt && customPrompt.length > 1000) {
        throw new Error("Custom prompt must be 1000 characters or less");
      }

      if (feedbackNote && feedbackNote.length > 200) {
        throw new Error("Feedback note must be 200 characters or less");
      }

      if (openRouterKey && openRouterKey.length > 200) {
        throw new Error("API key is too long");
      }

      // Generate salt and RSA key pair
      const salt = generateSalt();
      const { publicKey, privateKey: rawPrivateKey } =
        await browserCrypto.generateKeyPairNoPassword();

      // Save user to database with ONLY the public key
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error("Not authenticated");
      }

      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: authData.user.email || "",
        username,
        public_key: publicKey,
        salt,
        ai_filter_enabled: aiEnabled,
        ai_reviewer_enabled: aiReviewerEnabled,
        auto_delete_mean: autoDeleteMean,
        custom_prompt: customPrompt ? customPrompt.trim() : null,
        feedback_note:
          (feedbackNote && feedbackNote.trim()) || DEFAULT_FEEDBACK_NOTE,
      });

      if (dbError) {
        if (dbError.message.includes("username")) {
          throw new Error("Username already taken");
        }
        throw dbError;
      }

      // If personal OpenRouter key provided, store via server to encrypt at rest
      if (openRouterKey && openRouterKey.trim().length > 0) {
        await fetch("/api/settings/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openrouter_api_key: openRouterKey.trim() }),
        });
      }

      // Generate initial feedback link: use username by default
      const shareToken = username;
      await supabase.from("feedback_links").insert({
        user_id: authData.user.id,
        share_token: shareToken,
        is_active: true,
      });

      // Show private key modal
      setPrivateKeyToDisplay(rawPrivateKey);
      setUserSalt(salt);
      setShowPrivateKeyModal(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!confirmedSaved) {
      alert("Please confirm that you have saved your private key");
      return;
    }

    // Save to localStorage if user chose to
    if (saveToLocalStorage) {
      if (!storagePassword || storagePassword.length < 8) {
        alert(
          "Please enter a password (min 8 chars) to encrypt and save your key"
        );
        return;
      }
      if (storagePassword.length > 128) {
        alert("Password must be 128 characters or less");
        return;
      }
      const encrypted = await browserCrypto.encryptPrivateKeyWithPassword(
        privateKeyToDisplay,
        storagePassword,
        userSalt
      );
      localStorage.setItem("ff_encrypted_private_key", encrypted);
      localStorage.setItem("ff_salt", userSalt);
    }

    // Redirect to unlock to immediately decrypt inbox
    router.push("/auth/unlock");
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(privateKeyToDisplay);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  return (
    <div className="min-h-full">
      {/* Step Wizard Modal */}
      {!showPrivateKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-1">
              Welcome! Set up your account
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Step {String(step)} of 2
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <label className="block text-md font-medium">
                    Choose a username
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Your feedback link will be:{" "}
                    {process.env.NEXT_PUBLIC_APP_URL}/f/
                    {username || "your-username"}
                  </p>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="john-doe"
                    maxLength={30}
                    minLength={3}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-md font-medium">
                    Feedback note for senders
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Shown on your public feedback page
                  </p>
                  <textarea
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder={DEFAULT_FEEDBACK_NOTE}
                    maxLength={200}
                    rows={2}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      // validate username before proceeding
                      if (!username) {
                        setError("Please choose a username");
                        return;
                      }
                      if (!/^[a-z0-9-]+$/.test(username)) {
                        setError(
                          "Username can only contain lowercase letters, numbers, and hyphens"
                        );
                        return;
                      }
                      setError(null);
                      setStep(2);
                    }}
                    className="px-4 py-2 rounded-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-3 ">
                    <label className="text-md font-medium flex-1">
                      AI Filtering
                    </label>
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={aiEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAiEnabled(checked);
                        if (!checked) setAutoDeleteMean(false);
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Have an AI read each feedback and apply a filter
                  </p>
                  {aiEnabled && (
                    <div>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        maxLength={1000}
                        className="w-full text-sm h-18 px-3 py-2 border rounded-lg resize-none"
                        placeholder="e.g., Filter out only serious insults, threats, and purely hurtful comments with zero constructive value"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <label className="text-md font-medium flex-1">
                      Auto-delete filtered feedback
                    </label>
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={autoDeleteMean}
                      onChange={(e) => setAutoDeleteMean(e.target.checked)}
                      disabled={!aiEnabled}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Drops filtered messages instead of saving them
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <label className="text-md font-medium flex-1">
                      AI Coach for Senders
                    </label>
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={aiReviewerEnabled}
                      onChange={(e) => setAiReviewerEnabled(e.target.checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Gives senders customized coaching to improve feedback
                    quality
                  </p>
                </div>

                <div>
                  <label className="block text-md font-medium ">
                    Your OpenRouter API key{" "}
                    <span className="text-sm text-gray-500">Optional</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Used for AI calls. Leave empty to use the app's default key
                  </p>
                  <input
                    type="password"
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSetup}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loading ? "Setting up..." : "Create Encryption Key"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Private Key Modal */}
      {showPrivateKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-red-600">
              Save Your Private Encryption Key
            </h3>

            <div className="bg-red-50 border-2 border-red-300 rounded p-4 mb-4">
              <p className="text-sm mb-3 font-semibold">
                This is your <u>ONLY</u> chance to save this key. Without it,
                you cannot read your feedback.
              </p>
              <ul className="text-sm space-y-1 text-red-700">
                <li>• Save this in your password manager</li>
                <li>• We can never recover this for you</li>
                <li>• Losing this = losing access to your feedback</li>
                <li>• This key is never sent to our servers</li>
              </ul>
            </div>

            <div className="bg-gray-100 p-3 rounded mb-4">
              <label className="text-sm text-gray-600">Your Private Key:</label>
              <textarea
                readOnly
                value={privateKeyToDisplay}
                className="w-full h-24 mt-1 p-2 text-[11px] font-mono bg-white border rounded"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyToClipboard}
                className="mt-2 text-sm px-3 py-1 rounded"
              >
                {copiedToClipboard ? "✓ Copied!" : "Copy to Clipboard"}
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={saveToLocalStorage}
                  onChange={(e) => setSaveToLocalStorage(e.target.checked)}
                  className="mt-1"
                />
                <div className="w-full">
                  <p className="text-sm font-medium">
                    Save key in this browser
                  </p>
                  <p className="text-sm text-gray-600">
                    Encrypt and save your key locally in this browser so you can
                    use a password instead of pasting the full key every time
                  </p>
                  {saveToLocalStorage && (
                    <input
                      type="password"
                      value={storagePassword}
                      onChange={(e) => setStoragePassword(e.target.value)}
                      placeholder="Create a password (8+ chars) to encrypt & save your key"
                      minLength={8}
                      className="mt-2 w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  )}
                </div>
              </label>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 rounded">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={confirmedSaved}
                  onChange={(e) => setConfirmedSaved(e.target.checked)}
                />
                <span className="text-sm font-medium">
                  I have saved my private key in my password manager
                </span>
              </label>
            </div>

            <button
              onClick={handleContinue}
              disabled={!confirmedSaved}
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Test Decryption
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
