"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Coins,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { BalanceTrendChart, CategoryDonutChart, GoalRing } from "@/components/charts";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/ui";
import { getDisplayCurrency } from "@/lib/currency";
import { getProjectedGoalDate } from "@/lib/finance";
import { formatCompactCurrency, formatCurrency, formatLongDate, getCategoryIcon } from "@/lib/utils";

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="panel-highlight">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/8 bg-[rgba(255,180,0,0.12)] text-[var(--accent-soft)]">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</span>
        </div>
        <p className="text-3xl font-semibold text-zinc-50">{value}</p>
        <p className="mt-2 text-sm text-zinc-400">{note}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardScreen() {
  const { state, dashboard, refreshingAi, regenerateInsights } = useFinance();

  if (!state || !dashboard) {
    return null;
  }

  const profile = state.profile;
  const displayCurrency = getDisplayCurrency(profile);
  const activeGoals = state.goals.slice(0, 2);
  const focusInsight = dashboard.latestInsight;
  const hasAiSourceData = state.transactions.length > 0 || state.goals.length > 0 || state.receiptScans.length > 0;
  const pendingInsightSummary = refreshingAi
    ? "OpenAI анализирует последние операции, категории и цели."
    : "Советы не обновляются сами: нажми кнопку, когда захочешь пересчитать их по новым данным.";
  const nextStep =
    focusInsight?.recommendation ??
    (hasAiSourceData
      ? pendingInsightSummary
      : "Добавь первые операции или загрузи выписку, затем обнови советы вручную.");

  async function handleRefreshInsights() {
    try {
      await regenerateInsights();
      toast.success("Советы обновлены.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось обновить советы.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,0.72fr)]">
        <Card className="panel-highlight overflow-hidden">
          <CardContent className="relative p-6 sm:p-7">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,180,0,0.16),transparent_62%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <Badge className="mb-4">{dashboard.health.label}</Badge>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Общий баланс</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                  {formatCurrency(dashboard.balance, displayCurrency, profile.language)}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">{dashboard.health.summary}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/transactions">
                      Новая операция
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/insights">Открыть ассистента</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleRefreshInsights}
                    disabled={refreshingAi || !hasAiSourceData}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingAi ? "animate-spin" : ""}`} />
                    {refreshingAi ? "Обновляем" : "Обновить советы"}
                  </Button>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-zinc-400">Индекс финансового здоровья</p>
                  <ShieldCheck className="h-4 w-4 text-[var(--accent-soft)]" />
                </div>
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <p className="text-sm text-zinc-400">Оценка</p>
                    <p className="mt-2 text-4xl font-semibold text-zinc-50">{dashboard.health.score}</p>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                      <span>Прогресс по целям</span>
                      <span>{dashboard.goalProgress}%</span>
                    </div>
                    <Progress value={dashboard.goalProgress} />
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <p className="text-sm text-zinc-400">Накопления</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-50">
                      {formatCurrency(dashboard.savingsTotal, displayCurrency, profile.language)}
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {dashboard.savingsRate.toFixed(1)}% текущего капитала уже направлено в цели.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-highlight h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-[var(--accent-soft)]" />
              AI-сводка
            </CardTitle>
            <CardDescription>Короткий фокус по текущему ритму денег и накоплений.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[26px] border border-[rgba(255,180,0,0.24)] bg-[linear-gradient(180deg,rgba(255,180,0,0.14),rgba(255,138,0,0.08))] p-5">
              <p className="text-sm leading-7 text-zinc-100">
                {focusInsight?.summary ??
                  (hasAiSourceData
                    ? pendingInsightSummary
                    : "Когда появятся первые операции, OpenAI соберет краткую сводку по темпу доходов, расходов и накоплений.")}
              </p>
            </div>

            {focusInsight ? (
              <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-zinc-50">{focusInsight.title}</p>
                  <Badge variant="warning">{focusInsight.metric ?? "Фокус"}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{focusInsight.message}</p>
                <p className="mt-4 text-sm font-medium text-[var(--accent-soft)]">{focusInsight.recommendation}</p>
              </div>
            ) : (
              <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <Badge variant={refreshingAi ? "warning" : "muted"}>
                    {refreshingAi ? "OpenAI обновляет советы" : "Ручное обновление"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {hasAiSourceData
                    ? "Нажми «Обновить советы», когда захочешь учесть новые операции, комментарии и цели."
                    : "Добавь первые операции или загрузи выписку, затем запусти анализ вручную."}
                </p>
              </div>
            )}

            <Button asChild variant="secondary" className="w-full">
              <Link href="/insights">Все рекомендации</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Доходы"
          value={formatCurrency(dashboard.monthIncome, displayCurrency, profile.language)}
          note="Все поступления за текущий месяц."
          icon={TrendingUp}
        />
        <MetricCard
          label="Расходы"
          value={formatCurrency(dashboard.monthExpense, displayCurrency, profile.language)}
          note="Текущая нагрузка по расходам."
          icon={TrendingDown}
        />
        <MetricCard
          label="Накопления"
          value={formatCurrency(dashboard.savingsTotal, displayCurrency, profile.language)}
          note="Общая сумма по активным целям."
          icon={Coins}
        />
        <MetricCard
          label="Прогресс"
          value={`${dashboard.goalProgress}%`}
          note="Средний темп выполнения целей."
          icon={Target}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)]">
        <BalanceTrendChart data={dashboard.balanceTrend} currency={displayCurrency} language={profile.language} />
        <CategoryDonutChart data={dashboard.spendingByCategory} currency={displayCurrency} language={profile.language} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="panel-highlight">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Последние операции</CardTitle>
              <CardDescription>Свежие движения по счету без лишних деталей.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transactions">Вся история</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recentTransactions.map((transaction) => {
              const Icon = getCategoryIcon(transaction.category?.icon ?? "wallet");
              const isExpense = transaction.type === "expense";
              const isIncome = transaction.type === "income";

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl border border-white/8 ${
                      isExpense
                        ? "bg-red-500/10 text-red-200"
                        : isIncome
                          ? "bg-emerald-500/10 text-emerald-200"
                          : "bg-[rgba(255,180,0,0.12)] text-[var(--accent-soft)]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="truncate font-medium text-zinc-100">{transaction.category?.name ?? "Категория"}</p>
                      <p
                        className={`font-semibold ${
                          isExpense ? "text-red-200" : isIncome ? "text-emerald-200" : "text-[var(--accent-soft)]"
                        }`}
                      >
                        {isExpense ? "-" : "+"}
                        {formatCompactCurrency(transaction.amount, displayCurrency, profile.language)}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-4 text-sm text-zinc-500">
                      <span className="truncate">{transaction.note || "Без комментария"}</span>
                      <span>{formatLongDate(transaction.date)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="panel-highlight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--amber)]" />
                Активные цели
              </CardTitle>
              <CardDescription>Самый важный прогресс на текущий момент.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeGoals.length === 0 ? (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-zinc-400">
                  Создай первую цель, чтобы видеть прогноз и темп накоплений.
                </div>
              ) : (
                activeGoals.map((goal) => (
                  <div key={goal.id} className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
                    <GoalRing
                      value={Number(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1))}
                      color={goal.color}
                      label={goal.title}
                      amount={formatCurrency(goal.currentAmount, displayCurrency, profile.language)}
                    />
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                        <span>Цель {formatCompactCurrency(goal.targetAmount, displayCurrency, profile.language)}</span>
                        <span>{formatLongDate(goal.deadline)}</span>
                      </div>
                      <Progress value={(goal.currentAmount / goal.targetAmount) * 100} />
                    </div>
                    <p className="mt-3 text-sm text-zinc-500">
                      Прогноз: {formatLongDate(getProjectedGoalDate(goal, state.contributions))}
                    </p>
                  </div>
                ))
              )}
              <Button asChild variant="secondary" className="w-full">
                <Link href="/goals">Управлять целями</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="panel-highlight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--accent-soft)]" />
                Точка внимания
              </CardTitle>
              <CardDescription>Куда стоит посмотреть в первую очередь.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-zinc-500">Самая затратная категория</p>
                <p className="mt-2 font-medium text-zinc-100">
                  {dashboard.spendingByCategory[0]?.name ?? "Пока недостаточно данных"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-zinc-500">Прогресс по целям</p>
                <p className="mt-2 font-medium text-zinc-100">{dashboard.goalProgress}%</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-zinc-500">Следующий шаг</p>
                <p className="mt-2 text-sm leading-7 text-zinc-300">{nextStep}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
