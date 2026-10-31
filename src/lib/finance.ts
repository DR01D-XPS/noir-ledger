import {
  AnalyticsSnapshot,
  AppUser,
  Category,
  CategorySlice,
  CommentHighlight,
  DashboardSnapshot,
  FinanceHealth,
  FinanceState,
  GoalContribution,
  GoalPriority,
  SavingsGoal,
  Transaction,
  TrendPoint,
  WeeklyPoint,
} from "@/lib/types";
import { format, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import { getDisplayCurrency } from "@/lib/currency";
import { groupBy } from "@/lib/utils";

function isSameMonth(dateValue: string, date = new Date()) {
  const value = new Date(dateValue);
  return value.getFullYear() === date.getFullYear() && value.getMonth() === date.getMonth();
}

function toNumber(value: number) {
  return Number(value.toFixed(2));
}

function hasMeaningfulNote(note: string) {
  return note.trim().length >= 4;
}

const goalPriorityMeta: Record<
  GoalPriority,
  {
    label: string;
    weight: number;
    accent: string;
  }
> = {
  high: {
    label: "Высокий приоритет",
    weight: 1.5,
    accent: "text-[#ffd27c]",
  },
  medium: {
    label: "Средний приоритет",
    weight: 1,
    accent: "text-[#ffb85c]",
  },
  low: {
    label: "Гибкий приоритет",
    weight: 0.72,
    accent: "text-[#c59d76]",
  },
};

export function getGoalPriorityMeta(priority: GoalPriority) {
  return goalPriorityMeta[priority] ?? goalPriorityMeta.medium;
}

function getDaysUntil(dateValue: string) {
  const ms = new Date(dateValue).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function getRequiredMonthlyAmount(goal: SavingsGoal) {
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const monthsRemaining = Math.max(getDaysUntil(goal.deadline) / 30, 1);
  return remaining / monthsRemaining;
}

function getProjectedDateByMonthlyContribution(goal: SavingsGoal, monthlyAmount: number) {
  if (goal.currentAmount >= goal.targetAmount) {
    return new Date().toISOString();
  }

  if (monthlyAmount <= 0) {
    return goal.deadline;
  }

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const projected = new Date();
  projected.setMonth(projected.getMonth() + Math.max(1, Math.ceil(remaining / monthlyAmount)));
  return projected.toISOString();
}

export function buildGoalAllocationPlan(goals: SavingsGoal[], monthlyBudget: number) {
  const sanitizedBudget = Math.max(0, monthlyBudget);
  const drafts = goals.map((goal) => {
    const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
    const daysRemaining = getDaysUntil(goal.deadline);
    const requiredMonthlyAmount = getRequiredMonthlyAmount(goal);
    const priority = goal.priority ?? "medium";
    const urgencyWeight =
      daysRemaining <= 45 ? 1.82 : daysRemaining <= 90 ? 1.56 : daysRemaining <= 180 ? 1.28 : daysRemaining <= 320 ? 1.08 : 0.92;
    const completionWeight = 1 + Math.max(0, 1 - goal.currentAmount / Math.max(goal.targetAmount, 1)) * 0.2;
    const weight =
      remainingAmount <= 0
        ? 0
        : Math.max(requiredMonthlyAmount, remainingAmount * 0.08, 1) *
          getGoalPriorityMeta(priority).weight *
          urgencyWeight *
          completionWeight;

    return {
      goal,
      priority,
      remainingAmount,
      daysRemaining,
      requiredMonthlyAmount,
      weight,
      allocated: 0,
    };
  });

  let remainingBudget = sanitizedBudget;
  let active = drafts.filter((draft) => draft.remainingAmount > 0 && draft.weight > 0);

  while (remainingBudget > 0.01 && active.length > 0) {
    const totalWeight = active.reduce((sum, draft) => sum + draft.weight, 0);
    if (totalWeight <= 0) {
      break;
    }

    let distributed = 0;

    for (const draft of active) {
      const proportionalShare = (remainingBudget * draft.weight) / totalWeight;
      const availableCapacity = Math.max(draft.remainingAmount - draft.allocated, 0);
      const allocation = Math.min(availableCapacity, proportionalShare);

      if (allocation > 0) {
        draft.allocated += allocation;
        distributed += allocation;
      }
    }

    if (distributed <= 0.01) {
      break;
    }

    remainingBudget = Math.max(0, remainingBudget - distributed);
    active = active.filter((draft) => draft.remainingAmount - draft.allocated > 0.01);
  }

  return drafts.map((draft) => ({
    id: draft.goal.id,
    title: draft.goal.title,
    priority: draft.priority,
    completionRate: Number(((draft.goal.currentAmount / draft.goal.targetAmount) * 100).toFixed(1)),
    projectedDate: getProjectedDateByMonthlyContribution(draft.goal, draft.allocated),
    recommendedMonthlyAmount: toNumber(draft.allocated),
    requiredMonthlyAmount: toNumber(draft.requiredMonthlyAmount),
    share: sanitizedBudget > 0 ? Number(((draft.allocated / sanitizedBudget) * 100).toFixed(1)) : 0,
  }));
}

export function attachCategory(
  transaction: Transaction,
  categories: Category[],
): Transaction & { category?: Category } {
  return {
    ...transaction,
    category: categories.find((category) => category.id === transaction.categoryId),
  };
}

export function getProjectedGoalDate(goal: SavingsGoal, contributions: GoalContribution[]) {
  const relevant = contributions.filter((item) => item.goalId === goal.id);
  const latest90Days = relevant.filter((item) => {
    const diff = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 90;
  });
  const monthlyPace = latest90Days.reduce((sum, item) => sum + item.amount, 0) / 3 || 3500;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const months = remaining / monthlyPace;
  const projected = new Date();
  projected.setMonth(projected.getMonth() + Math.ceil(months));
  return projected.toISOString();
}

export function createHealthScore(
  balance: number,
  monthIncome: number,
  monthExpense: number,
  savingsRate: number,
): FinanceHealth {
  const margin = monthIncome === 0 ? 0 : ((monthIncome - monthExpense) / monthIncome) * 100;
  const score = Math.round(Math.max(28, Math.min(96, margin * 1.2 + savingsRate)));

  if (score >= 76) {
    return {
      score,
      label: "Сильный",
      summary: "Баланс под контролем, а накопления двигаются стабильным темпом.",
      accent: "from-emerald-400/40 via-emerald-400/20 to-transparent",
    };
  }

  if (score >= 58) {
    return {
      score,
      label: "Стабильный",
      summary: "Ситуация выглядит уверенно, но несколько категорий уже требуют внимания.",
      accent: "from-amber-400/40 via-amber-300/15 to-transparent",
    };
  }

  return {
    score,
    label: "Под контролем",
    summary: "Расходы начинают съедать запас, лучше сократить необязательные траты.",
    accent: "from-red-500/40 via-amber-400/20 to-transparent",
  };
}

export function buildTrendSeries(transactions: Transaction[]): TrendPoint[] {
  const months = Array.from({ length: 6 }, (_, index) => subMonths(new Date(), 5 - index));
  let rollingBalance = 0;

  return months.map((monthDate) => {
    const monthTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
    });

    const income = monthTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = monthTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const savings = monthTransactions
      .filter((item) => item.type === "saving")
      .reduce((sum, item) => sum + item.amount, 0);
    const net = income - expense;
    rollingBalance += net;

    return {
      label: format(monthDate, "LLL", { locale: ru }),
      income: toNumber(income),
      expense: toNumber(expense),
      savings: toNumber(savings),
      net: toNumber(net),
      balance: toNumber(rollingBalance),
    };
  });
}

export function buildWeeklySeries(transactions: Transaction[]): WeeklyPoint[] {
  const weeks = Array.from({ length: 8 }, (_, index) => subWeeks(new Date(), 7 - index));

  return weeks.map((week) => {
    const start = startOfWeek(week, { weekStartsOn: 1 });
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const batch = transactions.filter((item) => {
      const date = new Date(item.date);
      return date >= start && date < end;
    });

    return {
      label: format(start, "dd MMM", { locale: ru }),
      income: toNumber(
        batch.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0),
      ),
      expense: toNumber(
        batch.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0),
      ),
    };
  });
}

export function buildCategoryDistribution(
  transactions: Transaction[],
  categories: Category[],
): CategorySlice[] {
  const expenses = transactions.filter((item) => item.type === "expense");
  const grouped = groupBy(expenses, (item) => item.categoryId);

  return Object.entries(grouped)
    .map(([categoryId, items]) => {
      const category = categories.find((entry) => entry.id === categoryId);
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      return {
        id: categoryId,
        name: category?.name ?? "Без категории",
        value: toNumber(total),
        color: category?.color ?? "#ca8752",
        change: Math.round(Math.min(99, total / 800)),
      };
    })
    .sort((left, right) => right.value - left.value);
}

export function buildDashboardSnapshot(state: FinanceState): DashboardSnapshot {
  const sortedTransactions = [...state.transactions].sort((left, right) =>
    right.date.localeCompare(left.date),
  );
  const monthIncome = sortedTransactions
    .filter((item) => item.type === "income" && isSameMonth(item.date))
    .reduce((sum, item) => sum + item.amount, 0);
  const monthExpense = sortedTransactions
    .filter((item) => item.type === "expense" && isSameMonth(item.date))
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = sortedTransactions.reduce((sum, item) => {
    if (item.type === "income") return sum + item.amount;
    if (item.type === "expense") return sum - item.amount;
    return sum;
  }, 0);
  const savingsTotal = state.goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const goalProgress =
    state.goals.reduce((sum, goal) => sum + goal.currentAmount / goal.targetAmount, 0) /
    Math.max(state.goals.length, 1);
  const savingsRate = monthIncome === 0 ? 0 : (savingsTotal / Math.max(balance, 1)) * 100;

  return {
    balance: toNumber(balance),
    monthIncome: toNumber(monthIncome),
    monthExpense: toNumber(monthExpense),
    savingsTotal: toNumber(savingsTotal),
    savingsRate: Number(Math.max(0, Math.min(100, savingsRate)).toFixed(1)),
    goalProgress: Number((goalProgress * 100).toFixed(1)),
    recentTransactions: sortedTransactions.slice(0, 6).map((item) => attachCategory(item, state.categories)),
    spendingByCategory: buildCategoryDistribution(
      sortedTransactions.filter((item) => isSameMonth(item.date)),
      state.categories,
    ).slice(0, 5),
    balanceTrend: buildTrendSeries(sortedTransactions),
    health: createHealthScore(balance, monthIncome, monthExpense, savingsRate),
    latestInsight: state.aiInsights[0] ?? null,
  };
}

export function findAnomalies(
  transactions: Transaction[],
  categories: Category[],
): Array<Transaction & { category?: Category }> {
  const expenses = transactions.filter((item) => item.type === "expense");
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const anomalyIcons = new Set([
    "entertainment",
    "gaming",
    "event",
    "travel",
    "hotel",
    "tech",
    "gift",
    "clothes",
    "education",
  ]);

  const median = (values: number[]) => {
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : (sorted[middle] ?? 0);
  };
  const overallMedian = median(expenses.map((item) => item.amount));

  return expenses
    .filter((item) => {
      const category = categoriesById.get(item.categoryId);
      if (!category || !anomalyIcons.has(category.icon)) {
        return false;
      }

      const comparable = expenses.filter(
        (candidate) => candidate.categoryId === item.categoryId && candidate.id !== item.id,
      );
      if (comparable.length < 3) {
        return false;
      }

      const categoryMedian = median(comparable.map((candidate) => candidate.amount));
      return item.amount >= categoryMedian * 2.75 && item.amount >= overallMedian * 4;
    })
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 4)
    .map((item) => attachCategory(item, categories));
}

export function buildPatterns(
  transactions: Transaction[],
  categories: Category[],
  goals: SavingsGoal[],
  contributions: GoalContribution[],
): AnalyticsSnapshot["patterns"] {
  const distribution = buildCategoryDistribution(transactions, categories);
  const topCategory = distribution[0];
  const foodCategory = distribution.find(
    (item) => categories.find((category) => category.id === item.id)?.icon === "food",
  );
  const lastMonth = buildTrendSeries(transactions).at(-1);
  const projectedGoal = goals[0]
    ? format(getProjectedGoalDate(goals[0], contributions), "dd MMM", { locale: ru })
    : "скоро";

  const patterns = [
    topCategory && {
      label: "Главная точка давления",
      description: `Категория «${topCategory.name}» сейчас сильнее всего влияет на общий расходный поток.`,
      impact: `${Math.round(topCategory.value)} за текущий цикл`,
      tone: "warning" as const,
    },
    foodCategory && {
      label: "Рост повседневных трат",
      description: "Расходы на еду вне дома растут быстрее обычного базового темпа.",
      impact: `${Math.round(foodCategory.change)}% выше нормы`,
      tone: "warning" as const,
    },
    lastMonth && {
      label: "Месячный запас",
      description: "Доходы пока опережают расходы и сохраняют комфортный зазор.",
      impact: `${Math.round(lastMonth.net)} чистого результата`,
      tone: "positive" as const,
    },
    goals[0] && {
      label: "Темп по цели",
      description: `Цель «${goals[0].title}» остается в графике при текущем ритме пополнений.`,
      impact: `Прогноз на ${projectedGoal}`,
      tone: "neutral" as const,
    },
  ].filter((pattern): pattern is AnalyticsSnapshot["patterns"][number] => Boolean(pattern));

  return patterns;
}

export function buildCommentHighlights(
  transactions: Transaction[],
  categories: Category[],
): CommentHighlight[] {
  return [...transactions]
    .filter((transaction) => hasMeaningfulNote(transaction.note))
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 6)
    .map((transaction) => ({
      id: transaction.id,
      category: categories.find((category) => category.id === transaction.categoryId)?.name ?? "Без категории",
      note: transaction.note,
      date: transaction.date,
      amount: transaction.amount,
    }));
}

export function buildAnalyticsSnapshot(state: FinanceState): AnalyticsSnapshot {
  const trend = buildTrendSeries(state.transactions);
  const categoryDistribution = buildCategoryDistribution(
    state.transactions.filter((item) => isSameMonth(item.date)),
    state.categories,
  );
  const goalForecasts = buildGoalAllocationPlan(state.goals, state.profile.monthlySavingsBudget);

  return {
    trend,
    weeklyComparison: buildWeeklySeries(state.transactions),
    categoryDistribution,
    topCategories: categoryDistribution.slice(0, 5),
    patterns: buildPatterns(state.transactions, state.categories, state.goals, state.contributions),
    commentHighlights: buildCommentHighlights(state.transactions, state.categories),
    anomalies: findAnomalies(state.transactions, state.categories),
    goalForecasts,
  };
}

export function buildAiSummaryInput(state: FinanceState, user: AppUser) {
  const dashboard = buildDashboardSnapshot(state);
  const analytics = buildAnalyticsSnapshot(state);
  const recentTransactions = [...state.transactions]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 12)
    .map((transaction) => attachCategory(transaction, state.categories))
    .map((transaction) => ({
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      note: transaction.note,
      category: transaction.category?.name ?? "Без категории",
    }));

  return {
    user: {
      name: user.fullName,
      currency: getDisplayCurrency(state.profile),
      language: state.profile.language,
      monthlySavingsBudget: state.profile.monthlySavingsBudget,
    },
    dashboard,
    analytics,
    monthContext: {
      startDate: startOfMonth(new Date()).toISOString(),
      transactionCount: state.transactions.length,
      goalsCount: state.goals.length,
    },
    recentTransactions,
  };
}

export function buildAssistantContext(state: FinanceState, user: AppUser) {
  const dashboard = buildDashboardSnapshot(state);
  const analytics = buildAnalyticsSnapshot(state);
  const goalPlan = buildGoalAllocationPlan(state.goals, state.profile.monthlySavingsBudget);
  const recentTransactions = [...state.transactions]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 10)
    .map((transaction) => attachCategory(transaction, state.categories))
    .map((transaction) => ({
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      note: transaction.note,
      category: transaction.category?.name ?? "Без категории",
    }));

  return {
    user: {
      id: user.id,
      name: user.fullName,
      currency: getDisplayCurrency(state.profile),
      language: state.profile.language,
      monthlySavingsBudget: state.profile.monthlySavingsBudget,
    },
    dashboard,
    analytics,
    commentHighlights: analytics.commentHighlights,
    goals: state.goals.map((goal) => ({
      title: goal.title,
      priority: goal.priority ?? "medium",
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      note: goal.note,
    })),
    goalPlan,
    recentTransactions,
  };
}
