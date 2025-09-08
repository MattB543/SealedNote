"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { browserCrypto } from "@/lib/crypto-browser";
import Link from "next/link";

interface Feedback {
  id: string;
  encrypted_content: string;
  encrypted_reasoning: string;
  is_mean: boolean;
  status: string;
  created_at: string;
  read_at: string | null;
}

interface DecryptedFeedback extends Feedback {
  content?: string;
  reasoning?: string;
}

export default function Dashboard() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [decryptedFeedback, setDecryptedFeedback] = useState<
    DecryptedFeedback[]
  >([]);
  const [password, setPassword] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [feedbackLink, setFeedbackLink] = useState("");
  const [activeTab, setActiveTab] = useState<"inbox" | "mean">("inbox");
  const [copied, setCopied] = useState(false);
  const [decryptMethod, setDecryptMethod] = useState<"password" | "key">(
    "password"
  );
  const [canUsePassword, setCanUsePassword] = useState(false);

  useEffect(() => {
    loadUserData();
    loadFeedback();
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

      // Check if we have encrypted private key in localStorage
      const encryptedPrivateKey = localStorage.getItem(
        "ff_encrypted_private_key"
      );
      const storedSalt = localStorage.getItem("ff_salt");

      if (encryptedPrivateKey && storedSalt && storedSalt === userData.salt) {
        // We have the encrypted private key, user can use password to decrypt
        setDecryptMethod("password");
        setCanUsePassword(true);
      } else {
        // No stored key, user needs to paste their private key
        setDecryptMethod("key");
        setCanUsePassword(false);
      }

      // Get active feedback link
      const { data: linkData, error: linkError } = await supabase
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

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/feedback/list");
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setFeedback(data.feedback || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptWithPassword = async () => {
    try {
      setDecrypting(true);
      setError(null);

      if (!password) {
        throw new Error("Please enter your encryption password");
      }

      if (!user?.salt) {
        throw new Error("User data not loaded");
      }

      // Get encrypted private key from localStorage
      const encryptedPrivateKey = localStorage.getItem(
        "ff_encrypted_private_key"
      );

      if (encryptedPrivateKey) {
        // Decrypt the private key using password
        const decryptedPrivateKey =
          await browserCrypto.decryptPrivateKeyWithPassword(
            encryptedPrivateKey,
            password,
            user.salt
          );
        setPrivateKey(decryptedPrivateKey);

        // Decrypt all feedback
        await decryptAllFeedback(decryptedPrivateKey);
      } else {
        throw new Error(
          'No stored private key found. Please use the "Enter Private Key" option.'
        );
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDecrypting(false);
    }
  };

  const handleDecryptWithKey = async () => {
    try {
      setDecrypting(true);
      setError(null);

      if (!privateKeyInput) {
        throw new Error("Please paste your private key");
      }

      // Validate that it looks like a private key
      if (!privateKeyInput.includes("BEGIN PRIVATE KEY")) {
        throw new Error("Invalid private key format");
      }

      setPrivateKey(privateKeyInput);

      // Decrypt all feedback
      await decryptAllFeedback(privateKeyInput);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDecrypting(false);
    }
  };

  const decryptAllFeedback = async (key: string) => {
    const decrypted = await Promise.all(
      feedback.map(async (item) => {
        try {
          const content = await browserCrypto.decrypt(
            item.encrypted_content,
            key
          );
          const reasoning = await browserCrypto.decrypt(
            item.encrypted_reasoning,
            key
          );
          return { ...item, content, reasoning };
        } catch (err) {
          return {
            ...item,
            content: "[Decryption failed]",
            reasoning: "[Decryption failed]",
          };
        }
      })
    );
    setDecryptedFeedback(decrypted);
  };

  const markAsRead = async (feedbackId: string) => {
    try {
      const response = await fetch("/api/feedback/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId }),
      });

      if (response.ok) {
        // Update local state
        setFeedback((prev) =>
          prev.map((f) => (f.id === feedbackId ? { ...f, status: "read" } : f))
        );
        setDecryptedFeedback((prev) =>
          prev.map((f) => (f.id === feedbackId ? { ...f, status: "read" } : f))
        );
      }
    } catch (error) {
      // Failed to mark as read
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(feedbackLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inboxFeedback = decryptedFeedback.filter((f) => !f.is_mean);
  const meanFeedback = decryptedFeedback.filter((f) => f.is_mean);
  const unreadInbox = feedback.filter(
    (f) => !f.is_mean && f.status === "unread"
  ).length;
  const unreadMean = feedback.filter(
    (f) => f.is_mean && f.status === "unread"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Your Feedback Dashboard</h1>
            <Link
              href="/settings"
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-settings"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
                <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              </svg>
              Settings
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Your feedback link:</span>
            <code className="flex-1 text-sm bg-white px-2 py-1 rounded border">
              {feedbackLink}
            </code>
            <button
              onClick={copyLink}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => window.open(feedbackLink, "_blank")}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Open
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "inbox"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Inbox {unreadInbox > 0 && `(${unreadInbox} unread)`}
            </button>
            <button
              onClick={() => setActiveTab("mean")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "mean"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Filtered Feedback {unreadMean > 0 && `(${unreadMean} unread)`}
            </button>
          </div>

          {!privateKey && feedback.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="mb-4">
                {canUsePassword && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setDecryptMethod("password")}
                      className={`px-3 py-1 text-sm rounded ${
                        decryptMethod === "password"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Use Password
                    </button>

                    <button
                      onClick={() => setDecryptMethod("key")}
                      className={`px-3 py-1 text-sm rounded ${
                        decryptMethod === "key"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Enter Private Key
                    </button>
                  </div>
                )}

                {decryptMethod === "password" && canUsePassword ? (
                  <>
                    <p className="mb-3 text-sm font-medium">
                      🔒 Enter encryption password to read feedback:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your encryption password"
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleDecryptWithPassword}
                        disabled={decrypting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {decrypting ? "Decrypting..." : "Decrypt"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-sm font-medium">
                      🔑 Paste your private key to decrypt feedback:
                    </p>
                    <textarea
                      placeholder="-----BEGIN PRIVATE KEY-----
...paste your private key here...
-----END PRIVATE KEY-----"
                      value={privateKeyInput}
                      onChange={(e) => setPrivateKeyInput(e.target.value)}
                      className="w-full h-24 p-2 text-xs font-mono border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      onClick={handleDecryptWithKey}
                      disabled={decrypting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {decrypting ? "Decrypting..." : "Decrypt Feedback"}
                    </button>
                  </>
                )}
              </div>

              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          )}

          {privateKey && decryptedFeedback.length > 0 && (
            <div className="space-y-4">
              {activeTab === "inbox" && (
                <>
                  {inboxFeedback.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No feedback in your inbox yet
                    </p>
                  ) : (
                    inboxFeedback.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${
                          item.status === "unread"
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.status === "unread"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {item.status === "unread" ? "Unread" : "Read"}
                          </span>
                          {item.reasoning && (
                            <abbr
                              className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 ml-2 cursor-help no-underline"
                              title={item.reasoning}
                            >
                              AI Reasoning
                            </abbr>
                          )}
                          <span className="ml-2 text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-gray-800 mb-2">{item.content}</p>
                        {item.status === "unread" && (
                          <button
                            onClick={() => markAsRead(item.id)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === "mean" && (
                <>
                  {meanFeedback.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No filtered feedback
                    </p>
                  ) : (
                    meanFeedback.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${
                          item.status === "unread"
                            ? "bg-orange-50 border-orange-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.status === "unread"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {item.status === "unread" ? "Unread" : "Read"}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 mb-2 p-2 pl-0 bg-yellow-50 rounded text-sm text-yellow-800">
                          <strong>Why filtered:</strong> {item.reasoning}
                        </div>
                        <p className="text-gray-800 mb-2">{item.content}</p>
                        {item.status === "unread" && (
                          <button
                            onClick={() => markAsRead(item.id)}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {feedback.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No feedback yet. Share your link to start receiving feedback!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
