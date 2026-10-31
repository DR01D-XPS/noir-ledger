"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, ChartSpline, ShieldCheck, Sparkles, Target } from "lucide-react";
import { SiteBrand } from "@/components/site-brand";
import { Button, Card, CardContent } from "@/components/ui";

const features = [
  {
    icon: ChartSpline,
    title: "Вся картина по деньгам",
    description: "Баланс, расходы, доходы и категории без перегруженных таблиц и лишних экранов.",
  },
  {
    icon: Target,
    title: "Цели и накопления",
    description: "Прогресс по целям, пополнения и понятный прогноз достижения в одном месте.",
  },
  {
    icon: BrainCircuit,
    title: "OpenAI внутри продукта",
    description: "Разбор чеков, рекомендации, финансовый чат и подсказки на основе твоих данных.",
  },
  {
    icon: ShieldCheck,
    title: "Один аккаунт на всех устройствах",
    description: "Операции и история синхронизируются через аккаунт и доступны везде одинаково.",
  },
];

export function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="mesh-overlay absolute inset-0 opacity-20" />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-[28px] border border-white/8 bg-white/[0.03] px-5 py-4 backdrop-blur-xl">
          <SiteBrand compact subtitle="Премиальный контроль личных финансов" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Создать аккаунт
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid items-center gap-8 pb-16 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,180,0,0.24)] bg-[rgba(255,180,0,0.11)] px-4 py-2 text-sm text-[var(--accent-soft)]">
              <Sparkles className="h-4 w-4" />
              Личный финансовый центр в черно-янтарной стилистике
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-zinc-50 sm:text-6xl">
                Деньги под контролем в интерфейсе, который выглядит{" "}
                <span className="text-gradient">дорого, спокойно и собранно</span>.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-400">
                Noir Ledger объединяет операции, аналитику, цели накопления, AI-ассистента и
                распознавание чеков в одном аккуратном кабинете для телефона, планшета и компьютера.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">
                  Начать
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link href="/login">Войти</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-[rgba(255,180,0,0.16)] blur-3xl" />
            <div className="absolute right-2 top-0 h-28 w-28 rounded-full bg-[rgba(255,138,0,0.14)] blur-3xl" />

            <Card className="panel-highlight overflow-hidden rounded-[34px] border-white/12 bg-[linear-gradient(180deg,rgba(32,24,19,0.92),rgba(12,11,11,0.94))]">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between rounded-[26px] border border-white/8 bg-[rgba(255,255,255,0.04)] px-5 py-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Общий баланс</p>
                    <p className="mt-2 text-4xl font-semibold text-zinc-50">284 000 ₽</p>
                  </div>
                  <div className="rounded-full border border-[rgba(255,180,0,0.24)] bg-[rgba(255,180,0,0.13)] px-4 py-2 text-sm text-[var(--accent-soft)]">
                    под контролем
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[28px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-sm uppercase tracking-[0.16em] text-zinc-500">Фокус месяца</p>
                    <p className="mt-3 max-w-md text-lg font-medium leading-8 text-zinc-100">
                      Основная нагрузка сейчас идет по категории «Кафе и рестораны», а ближайшая цель
                      по резерву уже закрыта на 39%.
                    </p>
                    <div className="mt-5 flex gap-3">
                      <div className="rounded-2xl border border-[rgba(255,180,0,0.22)] bg-[rgba(255,180,0,0.12)] px-4 py-3 text-sm text-zinc-100">
                        AI-ассистент
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3 text-sm text-zinc-300">
                        Чеки и OCR
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                      <p className="text-sm text-zinc-400">Доходы</p>
                      <p className="mt-2 text-2xl font-semibold text-zinc-50">285 000 ₽</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                      <p className="text-sm text-zinc-400">Расходы</p>
                      <p className="mt-2 text-2xl font-semibold text-zinc-50">96 400 ₽</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                      <p className="text-sm text-zinc-400">Накопления</p>
                      <p className="mt-2 text-2xl font-semibold text-zinc-50">284 000 ₽</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="panel-highlight h-full">
                <CardContent className="p-6">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(255,180,0,0.12)] text-[var(--accent-soft)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-50">{feature.title}</p>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}
