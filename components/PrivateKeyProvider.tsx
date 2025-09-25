"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type PrivateKeyContextValue = {
  privateKey: string | null;
  setPrivateKey: (key: string | null) => void;
  clearPrivateKey: () => void;
};

const PrivateKeyContext = createContext<PrivateKeyContextValue | undefined>(
  undefined
);

export function PrivateKeyProvider({ children }: { children: ReactNode }) {
  const [privateKey, setPrivateKeyState] = useState<string | null>(null);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const privateKeyRef = useRef<string | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    privateKeyRef.current = privateKey;
  }, [privateKey]);
  
  // Clear any existing timeout and set a new one
  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set 30-minute timeout for security
    if (privateKeyRef.current) {
      timeoutRef.current = setTimeout(() => {
        setPrivateKeyState(null);
        privateKeyRef.current = null;
        // Only redirect if we're not already on auth pages
        if (typeof window !== 'undefined' && 
            !window.location.pathname.startsWith('/auth/')) {
          router.push("/auth/unlock");
        }
      }, 30 * 60 * 1000); // 30 minutes
    }
  }, [router]);

  const setPrivateKey = useCallback((key: string | null) => {
    setPrivateKeyState(key ?? null);
  }, []);

  const clearPrivateKey = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPrivateKeyState(null);
  }, []);

  // Set up timeout when private key changes
  useEffect(() => {
    resetTimeout();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [privateKey, resetTimeout]);

  // Reset timeout on user activity
  useEffect(() => {
    if (!privateKey) return;
    
    // Throttle activity handler to prevent excessive resets
    let activityTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (activityTimeout) return;
      
      activityTimeout = setTimeout(() => {
        activityTimeout = null;
        resetTimeout();
      }, 1000); // Throttle to once per second
    };
    
    // Listen for user activity events
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    return () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [privateKey, resetTimeout]);

  const value = useMemo(
    () => ({ privateKey, setPrivateKey, clearPrivateKey }),
    [privateKey, setPrivateKey, clearPrivateKey]
  );

  return (
    <PrivateKeyContext.Provider value={value}>
      {children}
    </PrivateKeyContext.Provider>
  );
}

export function usePrivateKey() {
  const context = useContext(PrivateKeyContext);
  if (!context) {
    throw new Error("usePrivateKey must be used within a PrivateKeyProvider");
  }
  return context;
}
