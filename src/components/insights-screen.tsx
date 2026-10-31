"use client";

import { AlertTriangle, BrainCircuit, ReceiptText, RefreshCw, Send, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { getDisplayCurrency } from "@/lib/currency";
import { formatCompactCurrency, formatLongDate } from "@/lib/utils";

export function InsightsScreen() {
  const { state, analytics, dashboard, refreshingAi, regenerateInsights, sendChatMessage, sendingChat } = useFinance();
  const [message, setMessage] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [state?.chatMessages.length]);

  if (!state || !analytics || !dashboard) {
    return null;
  }

  const displayCurrency = getDisplayCurrency(state.profile);
  const hasAiSourceData = state.transactions.length > 0 || state.goals.length > 0 || state.receiptScans.length > 0;
  const summary =
    state.aiInsights[0]?.summary ??
    (hasAiSourceData
      ? refreshingAi
        ? "OpenAI анализирует операции, комментарии, категории и цели. Это займет несколько секунд."
        : "Советы еще не рассчитаны для текущих данных. Нажми «Обновить советы», когда захочешь получить новую сводку."
      : "Добавь первые операции или загрузи выписку, затем нажми «Обновить советы».");
  const forecast =
    state.aiInsights[0]?.forecast ??
    (hasAiSourceData
      ? "Прогноз будет рассчитан в момент ручного обновления вместе с советами."
      : "После импорта или добавления операций ассистент сможет собрать прогноз по накоплениям и расходам.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    try {
      await sendChatMessage(trimmed);
      setMessage("");
    } catch (error) {
      console.error(error);
    }
  }

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
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]">
        <Card className="panel-highlight overflow-hidden">
          <CardContent className="p-6 sm:p-7">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={refreshingAi ? "warning" : "muted"}>
                  {refreshingAi ? "OpenAI обновляет советы" : "Советы обновляются вручную"}
                </Badge>
                <Badge variant="muted">Комментарии операций учитываются в анализе</Badge>
                <Button type="button" size="sm" onClick={handleRefreshInsights} disabled={refreshingAi || !hasAiSourceData}>
                  <RefreshCw className={`h-4 w-4 ${refreshingAi ? "animate-spin" : ""}`} />
                  {refreshingAi ? "Обновляем" : "Обновить советы"}
                </Button>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Финансовый ассистент</p>
                <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                  OpenAI видит траты, доходы, чеки, цели и общий темп движения денег в одном контуре.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                  Здесь собраны персональные выводы, предупреждения о перерасходе, прогноз по накоплениям и чат,
                  который отвечает с учетом твоих категорий, комментариев к операциям и текущего плана по целям.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent-soft)]" />
              Краткая сводка
            </CardTitle>
            <CardDescription>Текущее состояние и ближайший прогноз без лишнего шума.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-[rgba(255,180,0,0.24)] bg-[linear-gradient(180deg,rgba(255,180,0,0.14),rgba(255,138,0,0.08))] p-5 text-sm leading-7 text-zinc-100">
              {summary}
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-7 text-zinc-300">
              {forecast}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {state.aiInsights.length === 0 ? (
            <Card className="panel-highlight">
              <CardContent className="p-6 text-sm leading-7 text-zinc-400">
                {hasAiSourceData
                  ? refreshingAi
                    ? "OpenAI разбирает последние движения. Новые рекомендации появятся здесь сразу после ответа."
                    : "Операции уже сохранены. Нажми «Обновить советы», чтобы ассистент использовал их в новом анализе."
                  : "Добавь первые операции или загрузи выписку, затем обнови советы вручную."}
              </CardContent>
            </Card>
          ) : (
            state.aiInsights.map((insight) => (
              <Card key={insight.id} className="panel-highlight">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/8 bg-[rgba(255,180,0,0.12)] text-[var(--accent-soft)]">
                        <BrainCircuit className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-50">{insight.title}</p>
                        <p className="text-sm text-zinc-500">
                          {insight.period === "week"
                            ? "Горизонт: неделя"
                            : insight.period === "month"
                              ? "Горизонт: месяц"
                              : "Горизонт: долгий срок"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        insight.tone === "positive"
                          ? "success"
                          : insight.tone === "warning"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {insight.metric ?? insight.tone}
                    </Badge>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-zinc-300">{insight.message}</p>
                  <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-sm font-medium text-[var(--accent-soft)]">{insight.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="panel-highlight">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[var(--accent-soft)]" />
                  Аномальные траты
                </CardTitle>
                <CardDescription>Операции, которые заметно выбиваются из привычного ритма.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.anomalies.length === 0 ? (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-zinc-400">
                    Сейчас явных аномалий не видно.
                  </div>
                ) : (
                  analytics.anomalies.slice(0, 4).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-zinc-100">{transaction.category?.name ?? "Категория"}</p>
                        <p className="font-semibold text-red-200">
                          {formatCompactCurrency(transaction.amount, displayCurrency, state.profile.language)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-zinc-500">{transaction.note || "Без комментария"}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="panel-highlight">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-[var(--amber)]" />
                  Последние чеки
                </CardTitle>
                <CardDescription>Распознанные чеки уже привязаны к расходам и аналитике.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {state.receiptScans.length === 0 ? (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-zinc-400">
                    Загрузи первый чек в разделе операций, и он появится здесь.
                  </div>
                ) : (
                  state.receiptScans.slice(0, 4).map((scan) => (
                    <div
                      key={scan.id}
                      className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-zinc-100">{scan.merchant}</p>
                        <p className="font-semibold text-zinc-100">
                          {formatCompactCurrency(scan.total, displayCurrency, state.profile.language)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-zinc-500">
                        {scan.categoryName} · {formatLongDate(scan.transactionDate)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="panel-highlight min-h-0 2xl:sticky 2xl:top-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-[var(--accent-soft)]" />
              AI-ассистент
            </CardTitle>
            <CardDescription>
              Спрашивай про накопления, приоритеты целей, бюджеты и поведение расходов.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-[min(72vh,760px)] min-h-[560px] flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                "Как мне копить сразу на несколько целей?",
                "Где у меня главный перерасход?",
                "Как быстрее собрать резервный фонд?",
              ].map((prompt) => (
                <Button key={prompt} variant="secondary" size="sm" onClick={() => setMessage(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>

            <div
              ref={messagesRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-[24px] border border-white/8 bg-black/20 p-4 pr-3"
            >
              {state.chatMessages.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm leading-7 text-zinc-400">
                  Ассистент уже видит баланс, категории трат, цели, чеки и комментарии к операциям. Можно
                  спросить, как делить деньги между несколькими целями, где слабое место в расходах или как
                  ускорить накопления.
                </div>
              ) : (
                state.chatMessages.map((item) => (
                  <div
                    key={item.id}
                    className={`max-w-[88%] rounded-[22px] px-4 py-4 text-sm leading-7 whitespace-pre-line ${
                      item.role === "assistant"
                        ? "border border-white/8 bg-white/[0.04] text-zinc-200"
                        : "ml-auto border border-[rgba(255,180,0,0.26)] bg-[rgba(255,180,0,0.12)] text-zinc-100"
                    }`}
                  >
                    <p>{item.message}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                      {item.role === "assistant" ? "Ассистент" : "Ты"}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Например: как мне копить сразу на несколько вещей?"
              />
              <Button type="submit" className="w-full" disabled={sendingChat || !message.trim()}>
                <Send className="h-4 w-4" />
                {sendingChat ? "Ассистент думает..." : "Отправить вопрос"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
