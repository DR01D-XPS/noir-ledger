"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { FinanceProvider } from "@/components/providers/finance-provider";

function PwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
  }, []);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
        <FinanceProvider>
        {children}
        <PwaRegistration />
        <Toaster
          richColors
          closeButton
          theme="dark"
          position="top-right"
          toastOptions={{
            className:
              "border border-white/10 !bg-[#101010] !text-zinc-100 backdrop-blur-2xl",
          }}
        />
      </FinanceProvider>
    </AuthProvider>
  );
}
