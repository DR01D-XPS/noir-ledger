"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { PresetOption } from "@/lib/types";
import { cn, getCategoryIcon } from "@/lib/utils";

export function PresetPicker({
  options,
  value,
  onChange,
  className,
}: {
  options: PresetOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {options.map((option) => {
        const Icon = getCategoryIcon(option.icon);
        const active = value === option.id;

        return (
          <Button
            key={option.id}
            type="button"
            variant="secondary"
            className={cn(
              "h-auto items-start justify-start rounded-[24px] px-4 py-4 text-left",
              active && "border-[rgba(202,135,82,0.35)] bg-[rgba(202,135,82,0.12)]",
            )}
            onClick={() => onChange(option.id)}
          >
            <span
              className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ backgroundColor: `${option.color}26`, color: option.color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-zinc-50">
                <span className="truncate">{option.label}</span>
                {active ? <Check className="h-4 w-4 text-[var(--accent-soft)]" /> : null}
              </span>
              {option.description ? (
                <span className="mt-1 block text-xs leading-5 text-zinc-500">{option.description}</span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
