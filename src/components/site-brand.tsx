"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteBrand({
  href = "/",
  subtitle,
  compact = false,
  className,
}: {
  href?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-4", compact ? "items-center gap-3" : "items-center", className)}
    >
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,180,0,0.18),rgba(255,138,0,0.08))] text-[var(--accent-soft)] shadow-[0_24px_60px_-30px_rgba(255,156,0,0.45)] transition-transform duration-200 group-hover:scale-[1.02]",
          compact ? "h-11 w-11 rounded-[20px]" : "h-16 w-16",
        )}
      >
        <CreditCard className={compact ? "h-4 w-4" : "h-6 w-6"} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("flex min-w-0 flex-col items-start", compact ? "gap-1" : "gap-2")}>
          <span
            className={cn(
              "text-gradient-brand block max-w-full font-semibold tracking-tight leading-[0.94]",
              compact
                ? "whitespace-nowrap text-[clamp(1.45rem,4.2vw,1.9rem)]"
                : "text-[2.2rem] sm:text-[2.55rem]",
            )}
            style={compact ? undefined : { textWrap: "balance" }}
          >
            Noir Ledger
          </span>
          <span className="rounded-full border border-[rgba(255,180,0,0.22)] bg-[rgba(255,180,0,0.12)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--accent-soft)]">
            by droid
          </span>
        </div>
        {subtitle ? (
          <p
            className={cn(
              "mt-1 max-w-md text-zinc-400",
              compact ? "max-w-[15rem] text-[0.95rem] leading-5" : "text-base",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
