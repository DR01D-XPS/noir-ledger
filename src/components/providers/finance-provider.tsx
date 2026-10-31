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
import { useAuth } from "@/components/providers/auth-provider";
import {
  convertCurrencyAmount,
  getDisplayCurrency,
  getFallbackExchangeRates,
  normalizeProfileCurrency,
  presentFinanceState,
} from "@/lib/currency";
import {
  buildAiSummaryInput,
  buildAnalyticsSnapshot,
  buildAssistantContext,
  buildDashboardSnapshot,
} from "@/lib/finance";
import {
  addGoalContribution,
  addReceiptScan,
  appendChatMessage,
  createTransactions,
  loadFinanceState,
  removeGoal,
  removeTransaction,
  replaceAiInsights,
  updateProfile,
  upsertCategory,
  upsertGoal,
  upsertTransaction,
} from "@/lib/repository";
import {
  AiInsight,
  AnalyticsSnapshot,
  CategoryFormValues,
  ContributionFormValues,
  DashboardSnapshot,
  ExchangeRateBundle,
  FinanceState,
  GoalFormValues,
  ReceiptDraft,
  TransactionFormValues,
  UserProfile,
} from "@/lib/types";

interface FinanceContextValue {
  state: FinanceState | null;
  dashboard: DashboardSnapshot | null;
  analytics: AnalyticsSnapshot | null;
  exchangeRates: ExchangeRateBundle | null;
  loading: boolean;
  refreshingAi: boolean;
  scanningReceipt: boolean;
  sendingChat: boolean;
  reload: () => Promise<void>;
  saveTransaction: (values: TransactionFormValues) => Promise<void>;
  importTransactions: (
    values: Array<Omit<TransactionFormValues, "id">>,
  ) => Promise<{ imported: number; skipped: number }>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  saveGoal: (values: GoalFormValues) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  contributeToGoal: (values: ContributionFormValues) => Promise<void>;
  saveCategory: (values: CategoryFormValues) => Promise<void>;
  saveProfile: (values: Partial<UserProfile>) => Promise<void>;
  regenerateInsights: () => Promise<AiInsight[]>;
  scanReceipt: (input: { imageDataUrl: string; fileName: string }) => Promise<ReceiptDraft>;
  ingestReceipt: (draft: ReceiptDraft) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function getTransactionFingerprint(
  value: Pick<TransactionFormValues, "type" | "amount" | "categoryId" | "date" | "note">,
) {
  return [
    value.type,
    Math.round(value.amount * 100),
    value.categoryId,
    value.date.slice(0, 10),
    value.note.trim().toLowerCase().replace(/\s+/g, " "),
  ].join("|");
}

export function FinanceProvider({ children }: PropsWithChildren) {
  const { user, mode, status, patchUser } = useAuth();
  const [sourceState, setSourceState] = useState<FinanceState | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingAi, setRefreshingAi] = useState(false);
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  const buildPresentedState = useCallback(
    (snapshot: FinanceState) =>
      presentFinanceState(
        snapshot,
        exchangeRates ?? getFallbackExchangeRates(normalizeProfileCurrency(snapshot.profile).currency),
      ),
    [exchangeRates],
  );

  const loadExchangeRates = useCallback(async (snapshot: FinanceState) => {
    const profile = normalizeProfileCurrency(snapshot.profile);
    const fallback = getFallbackExchangeRates(profile.currency);
    setExchangeRates(fallback);

    try {
      const response = await fetch(`/api/exchange-rates?base=${profile.currency}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as ExchangeRateBundle;
      startTransition(() => {
        setExchangeRates(data);
      });
    } catch {
      startTransition(() => {
        setExchangeRates(fallback);
      });
    }
  }, []);

  const syncSnapshot = useCallback(
    async (currentUser: NonNullable<typeof user>, options?: { withLoading?: boolean }) => {
      if (options?.withLoading) {
        setLoading(true);
      }

      try {
        const snapshot = await loadFinanceState(mode, currentUser);
        startTransition(() => {
          setSourceState(snapshot);
        });
        await loadExchangeRates(snapshot);
        return snapshot;
      } finally {
        if (options?.withLoading) {
          setLoading(false);
        }
      }
    },
    [loadExchangeRates, mode],
  );

  const reload = useCallback(async () => {
    if (!user || status !== "authenticated") {
      startTransition(() => {
        setSourceState(null);
        setExchangeRates(null);
        setLoading(false);
      });
      return;
    }

    await syncSnapshot(user, { withLoading: true });
  }, [status, syncSnapshot, user]);

  const state = sourceState ? buildPresentedState(sourceState) : null;
  const dashboard = state ? buildDashboardSnapshot(state) : null;
  const analytics = state ? buildAnalyticsSnapshot(state) : null;

  const toBaseAmount = useCallback(
    (amount: number) => {
      if (!sourceState) {
        return amount;
      }

      const profile = normalizeProfileCurrency(sourceState.profile);
      return convertCurrencyAmount(
        amount,
        getDisplayCurrency(profile),
        profile.currency,
        exchangeRates ?? getFallbackExchangeRates(profile.currency),
      );
    },
    [exchangeRates, sourceState],
  );

  const regenerateFromSnapshot = useCallback(
    async (snapshot: FinanceState) => {
      if (!user) {
        throw new Error("Нет активной сессии.");
      }

      setRefreshingAi(true);

      try {
        const response = await fetch("/api/ai/insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildAiSummaryInput(buildPresentedState(snapshot), user)),
        });

        if (!response.ok) {
          throw new Error("Не удалось сгенерировать ИИ-рекомендации.");
        }

        const bundle = (await response.json()) as {
          summary: string;
          forecast: string;
          insights: AiInsight[];
        };

        const normalizedInsights = bundle.insights.map((insight, index) => ({
          ...insight,
          userId: user.id,
          summary: index === 0 ? bundle.summary : undefined,
          forecast: index === 0 ? bundle.forecast : undefined,
        }));

        await replaceAiInsights(mode, user, normalizedInsights);
        await syncSnapshot(user);
        return normalizedInsights;
      } finally {
        setRefreshingAi(false);
      }
    },
    [buildPresentedState, mode, syncSnapshot, user],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const withUser = async <T,>(callback: (currentUser: NonNullable<typeof user>) => Promise<T>) => {
    if (!user) {
      throw new Error("Нет активной сессии.");
    }

    return callback(user);
  };

  const value: FinanceContextValue = {
    state,
    dashboard,
    analytics,
    exchangeRates,
    loading,
    refreshingAi,
    scanningReceipt,
    sendingChat,
    reload,
    async saveTransaction(values) {
      await withUser(async (currentUser) => {
        await upsertTransaction(mode, currentUser, {
          ...values,
          amount: toBaseAmount(values.amount),
        });
        await syncSnapshot(currentUser);
      });
    },
    async importTransactions(values) {
      return withUser(async (currentUser) => {
        const existing = new Set(
          (sourceState?.transactions ?? []).map((transaction) => getTransactionFingerprint(transaction)),
        );
        const imported: Array<Omit<TransactionFormValues, "id">> = [];
        let skipped = 0;

        for (const value of values) {
          const normalized = {
            ...value,
            amount: toBaseAmount(value.amount),
          } satisfies Omit<TransactionFormValues, "id">;
          const fingerprint = getTransactionFingerprint(normalized);

          if (existing.has(fingerprint)) {
            skipped += 1;
            continue;
          }

          existing.add(fingerprint);
          imported.push(normalized);
        }

        await createTransactions(mode, currentUser, imported);
        await syncSnapshot(currentUser);

        return {
          imported: imported.length,
          skipped,
        };
      });
    },
    async deleteTransaction(transactionId) {
      await withUser(async (currentUser) => {
        await removeTransaction(mode, currentUser, transactionId);
        await syncSnapshot(currentUser);
      });
    },
    async saveGoal(values) {
      await withUser(async (currentUser) => {
        await upsertGoal(mode, currentUser, {
          ...values,
          targetAmount: toBaseAmount(values.targetAmount),
          currentAmount: toBaseAmount(values.currentAmount),
        });
        await syncSnapshot(currentUser);
      });
    },
    async deleteGoal(goalId) {
      await withUser(async (currentUser) => {
        await removeGoal(mode, currentUser, goalId);
        await syncSnapshot(currentUser);
      });
    },
    async contributeToGoal(values) {
      await withUser(async (currentUser) => {
        await addGoalContribution(mode, currentUser, {
          ...values,
          amount: toBaseAmount(values.amount),
        });
        await syncSnapshot(currentUser);
      });
    },
    async saveCategory(values) {
      await withUser((currentUser) => upsertCategory(mode, currentUser, values));
      await reload();
    },
    async saveProfile(values) {
      await withUser(async (currentUser) => {
        await updateProfile(mode, currentUser, values);
        await syncSnapshot(currentUser);
      });

      if (values.fullName) {
        patchUser({ fullName: values.fullName });
      }
    },
    async regenerateInsights() {
      if (!sourceState) {
        throw new Error("Финансовые данные недоступны.");
      }

      return regenerateFromSnapshot(sourceState);
    },
    async scanReceipt(input) {
      if (!state) {
        throw new Error("Финансовые данные недоступны.");
      }

      setScanningReceipt(true);

      try {
        const response = await fetch("/api/ai/receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...input,
            profile: state.profile,
            categories: state.categories
              .filter((category) => category.kind === "expense")
              .map((category) => ({
                id: category.id,
                name: category.name,
                icon: category.icon,
              })),
          }),
        });

        if (!response.ok) {
          throw new Error("Не удалось распознать чек.");
        }

        const data = (await response.json()) as { draft: ReceiptDraft };
        return data.draft;
      } finally {
        setScanningReceipt(false);
      }
    },
    async ingestReceipt(draft) {
      await withUser(async (currentUser) => {
        const transaction = await upsertTransaction(mode, currentUser, {
          type: "expense",
          amount: toBaseAmount(draft.total),
          categoryId: draft.categoryId,
          date: draft.transactionDate,
          note: draft.note,
        });

        await addReceiptScan(mode, currentUser, {
          merchant: draft.merchant,
          total: toBaseAmount(draft.total),
          transactionDate: draft.transactionDate,
          categoryId: draft.categoryId,
          categoryName: draft.categoryName,
          note: draft.note,
          confidence: draft.confidence,
          imageName: draft.imageName,
          transactionId: transaction.id,
        });

        await syncSnapshot(currentUser);
      });
    },
    async sendChatMessage(message) {
      if (!user || !sourceState) {
        throw new Error("Финансовые данные недоступны.");
      }

      const trimmed = message.trim();
      if (!trimmed) {
        return;
      }

      setSendingChat(true);

      try {
        const userMessage = await appendChatMessage(mode, user, {
          role: "user",
          message: trimmed,
        });

        startTransition(() => {
          setSourceState((current) =>
            current
              ? {
                  ...current,
                  chatMessages: [...(current.chatMessages ?? []), userMessage],
                }
              : current,
          );
        });

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile: state ? state.profile : buildPresentedState(sourceState).profile,
            context: buildAssistantContext(buildPresentedState(sourceState), user),
            messages: [...(sourceState.chatMessages ?? []), userMessage].map((item) => ({
              role: item.role,
              message: item.message,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Не удалось получить ответ финансового ассистента.");
        }

        const data = (await response.json()) as { reply: string };
        const assistantMessage = await appendChatMessage(mode, user, {
          role: "assistant",
          message: data.reply,
        });

        startTransition(() => {
          setSourceState((current) =>
            current
              ? {
                  ...current,
                  chatMessages: [...(current.chatMessages ?? []), assistantMessage],
                }
              : current,
          );
        });
      } finally {
        setSendingChat(false);
      }
    },
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used inside FinanceProvider.");
  }

  return context;
}
