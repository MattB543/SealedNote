"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { browserCrypto, generateSalt } from "@/lib/crypto-browser";

export default function Setup() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  // Only needed if user chooses to save key locally in this browser
  const [storagePassword, setStoragePassword] = useState("");
  const [username, setUsername] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Private key modal states
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKeyToDisplay, setPrivateKeyToDisplay] = useState("");
  const [encryptedPrivateKey, setEncryptedPrivateKey] = useState("");
  const [userSalt, setUserSalt] = useState("");
  const [saveToLocalStorage, setSaveToLocalStorage] = useState(true);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

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
      });

      if (dbError) {
        if (dbError.message.includes("username")) {
          throw new Error("Username already taken");
        }
        throw dbError;
      }

      // If personal OpenRouter key provided, store via server to encrypt at rest
      if (openRouterKey && openRouterKey.trim().length > 0) {
        await fetch('/api/settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ openrouter_api_key: openRouterKey.trim() }),
        })
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
      const encrypted = await browserCrypto.encryptPrivateKeyWithPassword(
        privateKeyToDisplay,
        storagePassword,
        userSalt
      );
      localStorage.setItem("ff_encrypted_private_key", encrypted);
      localStorage.setItem("ff_salt", userSalt);
    }

    // Redirect to dashboard
    router.push("/dashboard");
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(privateKeyToDisplay);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2">
          Welcome! Set up your account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium">AI Filtering</label>
          <span
            className={`text-xs px-2 py-1 rounded ${aiEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}
          >
            {aiEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            type="button"
            onClick={() => setAiEnabled((v) => !v)}
            className="ml-auto px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            Toggle
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose a username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="john-doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your feedback link will be: {process.env.NEXT_PUBLIC_APP_URL}/f/
              {username || "your-username"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Optional: Your OpenRouter API key
            </label>
            <input
              type="password"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use the app's default key
            </p>
          </div>

          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Create Private Key"}
          </button>
        </div>
      </div>

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
              <label className="text-xs text-gray-600">Your Private Key:</label>
              <textarea
                readOnly
                value={privateKeyToDisplay}
                className="w-full h-32 mt-1 p-2 text-xs font-mono bg-white border rounded"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyToClipboard}
                className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                {copiedToClipboard ? "✓ Copied!" : "Copy to Clipboard"}
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={saveToLocalStorage}
                  onChange={(e) => setSaveToLocalStorage(e.target.checked)}
                  className="mt-1"
                />
                <div className="w-full">
                  <p className="text-sm font-medium">Save in this browser</p>
                  <p className="text-xs text-gray-600">
                    Your private key will be encrypted and saved in this
                    browser. You can then unlock it with a password instead of
                    pasting the full key each time.
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
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
