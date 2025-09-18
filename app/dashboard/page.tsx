"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [feedbackLink, setFeedbackLink] = useState("");
  const [activeTab, setActiveTab] = useState<"inbox" | "mean">("inbox");
  const [copied, setCopied] = useState(false);
  const [initializing, setInitializing] = useState(true);

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
  }, [router, supabase]);

  const loadFeedback = useCallback(async () => {
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
  }, []);

  const decryptAllFeedback = useCallback(
    async (key: string) => {
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
    },
    [feedback]
  );

  useEffect(() => {
    let redirected = false;
    const init = async () => {
      try {
        if (typeof window === "undefined") return;
        const sessionKey = sessionStorage.getItem("ff_session_private_key");
        if (!sessionKey) {
          redirected = true;
          router.replace("/auth/unlock");
          return;
        }
        setPrivateKey(sessionKey);
        await Promise.all([loadUserData(), loadFeedback()]);
      } catch (err: any) {
        setError(err.message ?? "Failed to load dashboard");
      } finally {
        if (!redirected) {
          setInitializing(false);
        }
      }
    };

    void init();

    return () => {
      redirected = true;
    };
  }, [loadFeedback, loadUserData, router]);

  useEffect(() => {
    if (!privateKey || feedback.length === 0) {
      if (feedback.length === 0) {
        setDecryptedFeedback([]);
      }
      return;
    }

    const run = async () => {
      try {
        await decryptAllFeedback(privateKey);
      } catch (err: any) {
        setError(err.message ?? "Failed to decrypt feedback");
      }
    };

    void run();
  }, [privateKey, decryptAllFeedback, feedback.length]);

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
  const hasFilteredMessages = feedback.some((f) => f.is_mean);
  const autoDeleteEnabled = Boolean(user?.auto_delete_mean);

  useEffect(() => {
    if (autoDeleteEnabled && !hasFilteredMessages && activeTab !== "inbox") {
      setActiveTab("inbox");
    }
  }, [activeTab, autoDeleteEnabled, hasFilteredMessages]);

  if (initializing || loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-[#424133] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-off-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 paper-bg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-3 p-2 px-3 bg-gray-50 rounded-lg w-fit">
              <a 
                href={feedbackLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-md text-gray-600 underline sm:no-underline hover:text-gray-800"
                onClick={(e) => {
                  if (window.innerWidth >= 640) {
                    e.preventDefault();
                  }
                }}
              >
                {feedbackLink}
              </a>
              <div className="flex items-center gap-1">
                <button
                  onClick={copyLink}
                  className="px-2 py-0.5 h-[22px] sm:px-3 sm:py-1 sm:h-[28px] text-sm !bg-gray-100 !text-[#424133] rounded hover:!bg-gray-200"
                >
                  {copied ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon icon-tabler icons-tabler-outline icon-tabler-check sm:w-[18px] sm:h-[18px]"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M5 12l5 5l10 -10" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon icon-tabler icons-tabler-outline icon-tabler-copy sm:w-[18px] sm:h-[18px]"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
                      <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => window.open(feedbackLink, "_blank")}
                  className="hidden sm:flex px-3 py-1 text-sm h-[28px] !bg-gray-100 !text-[#424133] rounded hover:!bg-gray-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="icon icon-tabler icons-tabler-outline icon-tabler-external-link"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
                    <path d="M11 13l9 -9" />
                    <path d="M15 4h5v5" />
                  </svg>
                </button>
              </div>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-md bg-gray-100 text-[#424133] rounded-lg hover:bg-gray-200 h-[44px] w-fit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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

          <div className="h-px bg-gray-200 my-4"></div>

          <h1 className="text-2xl font-bold text-[#424133] mb-4">
            Your Feedback
          </h1>
          {(!autoDeleteEnabled || hasFilteredMessages) && (
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab("inbox")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === "inbox"
                    ? "bg-[#646148] text-white"
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
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {privateKey && (
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
                            ? "bg-[#42413315] border-[#42413315]"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="mb-2">
                          {item.reasoning && (
                            <abbr
                              className="text-sm px-2 py-1 rounded bg-gray-200 text-gray-600 cursor-help no-underline"
                              title={item.reasoning}
                            >
                              AI Reasoning
                            </abbr>
                          )}
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                            <span className="text-gray-400 mx-1">•</span>
                            {new Date(item.created_at).toLocaleTimeString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>

                        <p className="text-gray-800 mb-2">{item.content}</p>
                        {item.status === "unread" && (
                          <button
                            onClick={() => markAsRead(item.id)}
                            className="text-sm button-link !text-gray-500"
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
                            className={`text-sm px-2 py-1 rounded ${
                              item.status === "unread"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {item.status === "unread" ? "Unread" : "Read"}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
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
                            className="mt-2 text-sm"
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
