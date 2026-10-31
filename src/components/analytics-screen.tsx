"use client";

import { AlertTriangle, ArrowUpRight, CalendarRange, Radar } from "lucide-react";
import {
  BalanceTrendChart,
  CashflowAreaChart,
  CategoryDonutChart,
  ForecastChip,
  WeeklyComparisonChart,
} from "@/components/charts";
import { useFinance } from "@/components/providers/finance-provider";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getDisplayCurrency } from "@/lib/currency";
import { formatCompactCurrency, formatLongDate } from "@/lib/utils";

export function AnalyticsScreen() {
  const { state, analytics } = useFinance();

  if (!state || !analytics) {
    return null;
  }

  const displayCurrency = getDisplayCurrency(state.profile);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="panel-highlight overflow-hidden">
          <CardContent className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Аналитика</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                  Смотри не только на итоговую сумму, а на ритм движения денег.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                  Здесь собраны временные ряды, распределение расходов, самые тяжёлые категории и
                  повторяющиеся финансовые паттерны.
                </p>
              </div>
              <Badge variant="warning">Интерактивно</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-[var(--accent-soft)]" />
              Карта паттернов
            </CardTitle>
            <CardDescription>Сигналы и закономерности, найденные в последних данных.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.patterns.map((pattern) => (
              <div key={pattern.label} className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-zinc-100">{pattern.label}</p>
                  <Badge
                    variant={
                      pattern.tone === "positive"
                        ? "success"
                        : pattern.tone === "warning"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {pattern.impact}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{pattern.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <CashflowAreaChart
          data={analytics.trend}
          currency={displayCurrency}
          language={state.profile.language}
        />
        <CategoryDonutChart
          data={analytics.categoryDistribution}
          currency={displayCurrency}
          language={state.profile.language}
          title="Распределение расходов"
          description="Как текущие траты разделены по категориям"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <WeeklyComparisonChart
          data={analytics.weeklyComparison}
          currency={displayCurrency}
          language={state.profile.language}
        />
        <BalanceTrendChart
          data={analytics.trend}
          currency={displayCurrency}
          language={state.profile.language}
          title="Эволюция баланса"
          description="Изменение общего баланса и денежного запаса по месяцам"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <Card className="panel-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--accent-soft)]" />
              Аномальные траты
            </CardTitle>
            <CardDescription>Крупные расходы, которые заметно выбиваются из обычного ритма.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.anomalies.length === 0 ? (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-zinc-400">
                Сейчас явных аномалий не найдено.
              </div>
            ) : (
              analytics.anomalies.map((transaction) => (
                <div key={transaction.id} className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-zinc-100">{transaction.category?.name ?? "Категория"}</p>
                    <p className="font-semibold text-red-200">
                      {formatCompactCurrency(transaction.amount, displayCurrency, state.profile.language)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{transaction.note || "Без комментария"}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {formatLongDate(transaction.date)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="panel-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-[var(--amber)]" />
              Прогноз и контекст
            </CardTitle>
            <CardDescription>
              Прогноз по целям и пояснения из комментариев к операциям.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {analytics.goalForecasts.map((goal) => (
                <ForecastChip key={goal.id} label={`${goal.title} / ${goal.completionRate}%`} date={goal.projectedDate} />
              ))}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-zinc-100">Комментарии к операциям</p>
                <Badge variant="muted">{analytics.commentHighlights.length}</Badge>
              </div>
              {analytics.commentHighlights.length === 0 ? (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-zinc-400">
                  Добавляй комментарии к операциям, и они появятся в аналитическом контексте.
                </div>
              ) : (
                analytics.commentHighlights.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-zinc-100">{item.category}</p>
                      <p className="text-sm text-zinc-500">
                        {formatCompactCurrency(item.amount, displayCurrency, state.profile.language)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{item.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {formatLongDate(item.date)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 pt-2">
              {analytics.topCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100">{category.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">Самые затратные категории текущего цикла</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-50">
                      {formatCompactCurrency(category.value, displayCurrency, state.profile.language)}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-[var(--accent-soft)]">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {category.change}% нагрузки
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
