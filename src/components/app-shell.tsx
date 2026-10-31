"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";
import { useEffect } from "react";
import { InstallPrompt } from "@/components/install-prompt";
import { SiteBrand } from "@/components/site-brand";
import { useAuth } from "@/components/providers/auth-provider";
import { useFinance } from "@/components/providers/finance-provider";
import { Avatar, AvatarFallback, Button, Card, CardContent, Skeleton } from "@/components/ui";
import { appNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function NavigationRail() {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();
  const router = useRouter();

  return (
    <aside className="hidden w-[352px] flex-col border-r border-white/8 bg-black/20 px-6 py-8 lg:flex">
      <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(56,40,25,0.82),rgba(24,18,15,0.94))] px-5 py-5 shadow-[0_28px_72px_-46px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <SiteBrand compact className="w-full" subtitle="Личный кабинет управления финансами" />
      </div>

      <nav className="space-y-2.5">
        {appNavigation.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-4 rounded-[24px] border px-4 py-4 transition-colors",
                active
                  ? "border-[rgba(255,180,0,0.22)] bg-[rgba(255,180,0,0.12)] shadow-[0_18px_42px_-28px_rgba(255,166,0,0.45)]"
                  : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.03]",
              )}
            >
              <div
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-2xl transition-colors",
                  active
                    ? "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[#1e1406]"
                    : "bg-white/5 text-zinc-300",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", active ? "text-zinc-50" : "text-zinc-300")}>{item.label}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      <Card className="panel-highlight mt-auto">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-full border border-white/10">
              <AvatarFallback>{user?.fullName.slice(0, 2).toUpperCase() ?? "NL"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-100">{user?.fullName ?? "Пользователь"}</p>
              <p className="truncate text-sm text-zinc-500">{user?.email ?? "—"}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await signOutUser();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}

function MobileDock() {
  const pathname = usePathname();

  return (
    <div className="safe-bottom-offset fixed inset-x-0 z-30 flex justify-center px-4 lg:hidden">
      <div className="flex w-full max-w-lg items-center justify-between rounded-[28px] border border-white/10 bg-[#0b0908]/94 p-2 shadow-[0_20px_52px_-30px_rgba(0,0,0,0.92)] backdrop-blur-xl">
        {appNavigation.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] transition-colors",
                active
                  ? "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[#1e1406]"
                  : "text-zinc-400",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { loading } = useFinance();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex min-h-screen">
        <NavigationRail />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <Skeleton className="h-24 rounded-[32px]" />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
              <Skeleton className="h-96 rounded-[32px]" />
              <Skeleton className="h-96 rounded-[32px]" />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-60 rounded-[32px]" />
              <Skeleton className="h-60 rounded-[32px]" />
              <Skeleton className="h-60 rounded-[32px]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="mesh-overlay absolute inset-0 opacity-10" />
      <NavigationRail />
      <main className="safe-top safe-bottom relative flex-1 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <InstallPrompt />
          <div className="flex flex-col gap-4 rounded-[30px] border border-white/8 bg-white/[0.03] px-5 py-4 backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Личный финансовый центр</p>
              <p className="mt-1 text-lg font-semibold text-zinc-50">Чистая картина по деньгам на любом устройстве</p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href="/transactions">
                Новая операция
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {children}
        </div>
      </main>
      <MobileDock />
    </div>
  );
}
