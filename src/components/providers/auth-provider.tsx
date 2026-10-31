"use client";

import {
  PropsWithChildren,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  SignUpResult,
  getCurrentUser,
  resetPassword,
  resolveRuntimeMode,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AppUser, RuntimeMode } from "@/lib/types";

interface AuthContextValue {
  user: AppUser | null;
  mode: RuntimeMode;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUp: (fullName: string, email: string, password: string) => Promise<SignUpResult>;
  signOutUser: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  patchUser: (patch: Partial<AppUser>) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [mode] = useState<RuntimeMode>(resolveRuntimeMode());
  const [user, setUser] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    "loading",
  );

  const refreshSession = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser(mode);
      startTransition(() => {
        setUser(currentUser);
        setStatus(currentUser ? "authenticated" : "unauthenticated");
      });
    } catch {
      startTransition(() => {
        setUser(null);
        setStatus("unauthenticated");
      });
    }
  }, [mode]);

  useEffect(() => {
    void refreshSession();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await refreshSession();
    });

    return () => subscription.unsubscribe();
  }, [refreshSession]);

  const value: AuthContextValue = {
    user,
    mode,
    status,
    async signIn(email, password) {
      const nextUser = await signInWithPassword(mode, email, password);
      startTransition(() => {
        setUser(nextUser);
        setStatus("authenticated");
      });
      return nextUser;
    },
    async signUp(fullName, email, password) {
      const result = await signUpWithPassword(mode, fullName, email, password);
      await refreshSession();
      return result;
    },
    async signOutUser() {
      await signOut(mode);
      startTransition(() => {
        setUser(null);
        setStatus("unauthenticated");
      });
    },
    async resetUserPassword(email) {
      await resetPassword(mode, email);
    },
    patchUser(patch) {
      startTransition(() => {
        setUser((current) => (current ? { ...current, ...patch } : current));
      });
    },
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
