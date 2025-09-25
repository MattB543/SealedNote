"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { browserCrypto, generateSalt } from "@/lib/crypto-browser";
import { DEFAULT_FEEDBACK_NOTE } from "@/lib/constants";

export default function Setup() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
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
  const [testDecryptionLoading, setTestDecryptionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Private key modal states
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKeyToDisplay, setPrivateKeyToDisplay] = useState("");
  const [userSalt, setUserSalt] = useState("");
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

  const prepareSetupPayload = () => {
    const sanitizedUsername = username.trim().toLowerCase();
    if (!sanitizedUsername) {
      throw new Error("Please fill in all fields");
    }
    if (!/^[a-z0-9-]+$/.test(sanitizedUsername)) {
      throw new Error(
        "Username can only contain lowercase letters, numbers, and hyphens"
      );
    }
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 30) {
      throw new Error("Username must be between 3 and 30 characters");
    }

    const trimmedPrompt = customPrompt ? customPrompt.trim() : null;
    if (trimmedPrompt && trimmedPrompt.length > 1000) {
      throw new Error("Custom prompt must be 1000 characters or less");
    }

    const trimmedNote = feedbackNote ? feedbackNote.trim() : "";
    if (trimmedNote && trimmedNote.length > 200) {
      throw new Error("Feedback note must be 200 characters or less");
    }

    const trimmedOpenRouter = openRouterKey.trim();
    if (trimmedOpenRouter && trimmedOpenRouter.length > 200) {
      throw new Error("API key is too long");
    }

    setUsername(sanitizedUsername);
    setCustomPrompt(trimmedPrompt || "");
    setFeedbackNote(trimmedNote);
    setOpenRouterKey(trimmedOpenRouter);

    return {
      username: sanitizedUsername,
      aiFilterEnabled: aiEnabled,
      aiReviewerEnabled,
      autoDeleteMean,
      customPrompt:
        trimmedPrompt && trimmedPrompt.length > 0 ? trimmedPrompt : null,
      feedbackNote:
        trimmedNote && trimmedNote.length > 0
          ? trimmedNote
          : DEFAULT_FEEDBACK_NOTE,
      openRouterKey: trimmedOpenRouter.length > 0 ? trimmedOpenRouter : null,
    };
  };

  const handleRSASetup = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = prepareSetupPayload();

      const salt = generateSalt();
      const { publicKey, privateKey: rawPrivateKey } =
        await browserCrypto.generateKeyPairNoPassword();

      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error("Not authenticated");
      }

      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: authData.user.email || "",
        username: payload.username,
        public_key: publicKey,
        salt,
        ai_filter_enabled: payload.aiFilterEnabled,
        ai_reviewer_enabled: payload.aiReviewerEnabled,
        auto_delete_mean: payload.autoDeleteMean,
        custom_prompt: payload.customPrompt,
        feedback_note: payload.feedbackNote,
      });

      if (dbError) {
        if (dbError.message?.includes("username")) {
          throw new Error("Username already taken");
        }
        throw new Error("Failed to create account. Please try again.");
      }

      if (payload.openRouterKey) {
        await fetch("/api/settings/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openrouter_api_key: payload.openRouterKey }),
        });
      }

      await supabase.from("feedback_links").insert({
        user_id: authData.user.id,
        share_token: payload.username,
        is_active: true,
      });

      setPrivateKeyToDisplay(rawPrivateKey);
      setUserSalt(salt);

      // Store username
      localStorage.setItem("ff_username", payload.username);

      setShowPrivateKeyModal(true);
    } catch (error: any) {
      setError(error.message || "Failed to set up account");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!confirmedSaved) {
      alert("Please confirm that you have saved your private key");
      return;
    }

    setTestDecryptionLoading(true);

    try {
      // Store salt for later use
      localStorage.setItem("ff_salt", userSalt);

      // Redirect to unlock to immediately decrypt inbox
      router.push("/auth/unlock");
    } catch (error) {
      setTestDecryptionLoading(false);
    }
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
          <div className="bg-off-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <div className="flex items-center gap-3">
                    <label className="text-md font-medium flex-1">
                      AI Filtering
                    </label>
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer"
                      checked={aiEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAiEnabled(checked);
                        if (!checked) setAutoDeleteMean(false);
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Have an AI read each feedback and apply the following filter
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
                      className="w-4 h-4 cursor-pointer"
                      checked={autoDeleteMean}
                      onChange={(e) => setAutoDeleteMean(e.target.checked)}
                      disabled={!aiEnabled}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Drops filtered messages instead of saving them in a separate
                    inbox
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <label className="text-md font-medium flex-1">
                      AI coach for senders
                    </label>
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer"
                      checked={aiReviewerEnabled}
                      onChange={(e) => setAiReviewerEnabled(e.target.checked)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Gives senders customized suggestions to improve their
                    feedback quality
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
                    onClick={handleRSASetup}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loading ? "Setting up..." : "Next"}
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
          <div className="bg-off-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2">Secure your inbox</h3>
            <p className="text-sm text-gray-600 mb-4">
              We care about your privacy, so we encrypt all feedback you
              receive. Save your private key now to access your messages later.
            </p>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded p-4 mb-4">
              <p className="text-sm mb-1 font-semibold">
                This is your <u>ONLY</u> chance to save this key. Without it,
                you cannot read your feedback.
              </p>
              <ul className="text-sm">
                <li>• Save it in your password manager or download it</li>
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
                className="w-full h-20 mt-1 p-2 text-[11px] font-mono bg-off-white border rounded"
                onClick={(e) => e.currentTarget.select()}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={copyToClipboard}
                  className="text-sm px-3 py-1 rounded"
                >
                  {copiedToClipboard ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([privateKeyToDisplay], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `sealednote-private-key-${username}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="text-sm px-3 py-1 rounded"
                >
                  Download as .txt
                </button>
              </div>
            </div>

            <label className="mb-4 p-3 bg-yellow-50 rounded cursor-pointer hover:bg-yellow-100 transition-colors flex items-center gap-2">
              <input
                type="checkbox"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
              />
              <span className="text-sm font-medium select-none">
                I have saved my private key
              </span>
            </label>

            <button
              onClick={handleContinue}
              disabled={!confirmedSaved || testDecryptionLoading}
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {testDecryptionLoading ? "Testing..." : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
