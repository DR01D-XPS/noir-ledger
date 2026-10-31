"use client";

import { Share2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";

const DISMISS_KEY = "noir-ledger::install-prompt-dismissed";

export function InstallPrompt() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const isIos = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";

    return isIos && !isStandalone && !dismissed;
  });

  if (!visible) {
    return null;
  }

  return (
    <div className="w-full rounded-[24px] border border-white/10 bg-[#0d0d0d]/94 p-4 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.88)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[rgba(185,121,86,0.14)] text-[var(--accent-soft)]">
          <Share2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-100">Добавь Noir Ledger на экран iPhone</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Нажми «Поделиться» в Safari и выбери «На экран Домой». После этого сервис будет открываться в standalone-режиме, как отдельное приложение.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            window.sessionStorage.setItem(DISMISS_KEY, "1");
            setVisible(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
