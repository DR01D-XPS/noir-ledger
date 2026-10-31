"use client";

import { PostgrestError } from "@supabase/supabase-js";
import { normalizeProfileCurrency } from "@/lib/currency";
import {
  createDefaultCategories,
  createDefaultProfile,
} from "@/lib/seed";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  AiChatMessage,
  AiInsight,
  AppUser,
  Category,
  CategoryFormValues,
  ContributionFormValues,
  FinanceState,
  GoalContribution,
  GoalFormValues,
  ReceiptScan,
  RuntimeMode,
  SavingsGoal,
  Transaction,
  TransactionFormValues,
  UserProfile,
} from "@/lib/types";
import { createId } from "@/lib/utils";

const localizedCategoryNames: Record<string, string> = {
  Salary: "Зарплата",
  Freelance: "Фриланс",
  Investments: "Инвестиции",
  "Food & Dining": "Кафе и рестораны",
  Groceries: "Продукты",
  Transport: "Транспорт",
  Entertainment: "Развлечения",
  Subscriptions: "Подписки",
  Home: "Дом",
  Savings: "Накопления",
  Transfer: "Перевод",
};

const localizedTexts: Record<string, string> = {
  "Monthly salary landed": "Зачисление основной зарплаты",
  "Client dinner and coffee": "Ужин с клиентом и кофе",
  "Apartment rent split": "Аренда и коммунальные платежи",
  "Weekly groceries": "Большая закупка на неделю",
  "Emergency fund top-up": "Пополнение резервного фонда",
  "Taxi and metro": "Такси и метро",
  "Streaming bundle": "Обновление сервисов и приложений",
  "Landing page sprint": "Оплата за лендинг и аудит",
  "Weekend tickets": "Билеты и выходные",
  "Late-night cafe streak": "Несколько поздних ужинов вне дома",
  "ETF dividends": "Дивиденды и купоны",
  "Stock-up run": "Пополнение бытовых запасов",
  "Vacation goal funding": "Перевод в цель на поездку",
  "Fuel and parking": "Бензин и парковка",
  "Friends gathering": "Встреча с друзьями",
  "Salary preview for next month": "Следующее поступление зарплаты",
  "Concert tickets": "Концерт и вечерняя программа",
  "Annual renewals": "Годовые продления сервисов",
  "Emergency Reserve": "Резервный фонд",
  "Tokyo Sprint": "Поездка в Токио",
  "Core safety buffer for 3 months of expenses.": "Финансовая подушка примерно на три месяца базовых расходов.",
  "Flight, hotel and a little design shopping.": "Перелет, проживание и небольшой запас на шопинг и музеи.",
  "Automatic reserve transfer": "Автоперевод в резерв",
  "Added from freelance income": "Часть дохода с фриланса",
  "Cafes grew faster than planned": "Траты на кафе выросли быстрее плана",
  "Spending on Food & Dining accelerated in the last two weeks and now exceeds your baseline by roughly 24%.":
    "Расходы по категории «Кафе и рестораны» заметно ускорились за последние две недели и сейчас примерно на 24% выше обычного уровня.",
  "Cap discretionary dining for the next seven days and redirect the difference to your reserve goal.":
    "Ограничь необязательные походы в кафе на ближайшие семь дней и переведи разницу в резервный фонд.",
  "Your cashflow stays healthy, but impulse food spending is starting to eat into your monthly margin.":
    "Денежный поток в целом выглядит устойчиво, но импульсивные траты на еду вне дома уже съедают часть месячного запаса.",
  "If you keep savings contributions above 600 per month, the reserve goal lands around late summer.":
    "Если удерживать пополнения накоплений выше базового уровня, резервный фонд закроется заметно раньше срока.",
  "Freelance momentum is helping": "Фриланс поддерживает свободный остаток",
  "Side income is covering entertainment and subscriptions almost entirely this month.":
    "Дополнительный доход уже почти полностью перекрывает развлечения и подписки в текущем месяце.",
  "Use the next freelance payout to fully fund one upcoming travel installment before rent week starts.":
    "Следующее поступление с подработки лучше сразу распределить между поездкой и резервом до даты крупных обязательных платежей.",
};

const softenedDefaultColorsByIcon: Record<string, string> = {
  salary: "#ca8752",
  freelance: "#d49567",
  investment: "#d9b07a",
  food: "#ca8752",
  groceries: "#c48a61",
  transport: "#b8845c",
  entertainment: "#d19f6b",
  subscriptions: "#b7956d",
  home: "#a96f4c",
  savings: "#d9b07a",
  transfer: "#8f694f",
};

function translateSeedText(text: string) {
  return localizedTexts[text] ?? text;
}

function hasLatinText(text?: string | null) {
  return Boolean(text && /[A-Za-z]/.test(text));
}

function normalizeFinanceState(state: FinanceState): FinanceState {
  const categories = state.categories.map((category) => ({
    ...category,
    name: localizedCategoryNames[category.name] ?? category.name,
    color:
      category.isDefault && softenedDefaultColorsByIcon[category.icon]
        ? softenedDefaultColorsByIcon[category.icon]
        : category.color,
  }));

  const transactions = state.transactions.map((transaction) => ({
    ...transaction,
    note: translateSeedText(transaction.note),
  }));

  const goals = state.goals.map((goal) => ({
    ...goal,
    priority: goal.priority ?? "medium",
    title: translateSeedText(goal.title),
    note: translateSeedText(goal.note),
    color:
      goal.color === "#f97316"
        ? "#ca8752"
        : goal.color === "#fbbf24"
          ? "#d9b07a"
          : goal.color,
  }));

  const contributions = state.contributions.map((contribution) => ({
    ...contribution,
    note: translateSeedText(contribution.note),
  }));

  const shouldRegenerateInsights = state.aiInsights.some((insight) =>
    [insight.title, insight.message, insight.recommendation, insight.summary, insight.forecast].some(
      (value) => hasLatinText(value),
    ),
  );

  const aiInsights = shouldRegenerateInsights
    ? []
    : state.aiInsights.map((insight) => ({
        ...insight,
        title: translateSeedText(insight.title),
        message: translateSeedText(insight.message),
        recommendation: translateSeedText(insight.recommendation),
        summary: insight.summary ? translateSeedText(insight.summary) : undefined,
        forecast: insight.forecast ? translateSeedText(insight.forecast) : undefined,
      }));

  return {
    ...state,
    profile: normalizeProfileCurrency({
      ...state.profile,
      language: "ru-RU",
      monthlySavingsBudget: Math.max(0, state.profile.monthlySavingsBudget ?? 0),
      notificationsEmail: false,
      notificationsPush: false,
      aiEnabled: true,
      aiProvider: "openai",
    }),
    categories,
    transactions,
    goals,
    contributions,
    aiInsights,
    receiptScans: state.receiptScans ?? [],
    chatMessages: state.chatMessages ?? [],
  };
}

async function readDemoState() {
  const response = await fetch("/api/account/state", {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { state?: FinanceState; error?: string }
    | null;

  if (!response.ok || !payload?.state) {
    throw new Error(payload?.error ?? "Не удалось загрузить данные аккаунта.");
  }

  return payload.state;
}

async function writeDemoState(state: FinanceState) {
  const response = await fetch("/api/account/state", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state: {
        ...state,
        updatedAt: new Date().toISOString(),
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { state?: FinanceState; error?: string }
    | null;

  if (!response.ok || !payload?.state) {
    throw new Error(payload?.error ?? "Не удалось сохранить данные аккаунта.");
  }

  return payload.state;
}

function mapError(error: PostgrestError | Error | null) {
  if (!error) {
    return null;
  }

  return new Error(error.message);
}

function mapProfileRow(row: {
  id: string;
  full_name: string;
  currency: string;
  display_currency: string | null;
  language: string;
  monthly_savings_budget?: number | null;
  notifications_email: boolean;
  notifications_push: boolean;
  ai_enabled: boolean;
  ai_provider: "mock" | "openai";
  onboarding_completed: boolean;
}): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    currency: row.currency as UserProfile["currency"],
    displayCurrency: (row.display_currency ?? row.currency) as UserProfile["displayCurrency"],
    language: row.language,
    monthlySavingsBudget: Math.max(0, row.monthly_savings_budget ?? 0),
    notificationsEmail: row.notifications_email,
    notificationsPush: row.notifications_push,
    aiEnabled: row.ai_enabled,
    aiProvider: row.ai_provider,
    onboardingCompleted: row.onboarding_completed,
  };
}

function mapCategoryRow(row: {
  id: string;
  user_id: string | null;
  name: string;
  kind: Category["kind"];
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    kind: row.kind,
    color: row.color,
    icon: row.icon,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

function mapTransactionRow(row: {
  id: string;
  user_id: string;
  type: Transaction["type"];
  amount: number;
  category_id: string;
  date: string;
  note: string;
  created_at: string;
  updated_at: string;
}): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    categoryId: row.category_id,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGoalRow(row: {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  priority?: SavingsGoal["priority"] | null;
  color: string;
  icon: string;
  note: string;
  created_at: string;
  updated_at: string;
}): SavingsGoal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    deadline: row.deadline,
    priority: row.priority ?? "medium",
    color: row.color,
    icon: row.icon,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContributionRow(row: {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  date: string;
  note: string;
  created_at: string;
}): GoalContribution {
  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    amount: row.amount,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapAiRow(row: {
  id: string;
  user_id: string;
  period: AiInsight["period"];
  title: string;
  message: string;
  recommendation: string;
  tone: AiInsight["tone"];
  metric: string | null;
  summary: string | null;
  forecast: string | null;
  created_at: string;
}): AiInsight {
  return {
    id: row.id,
    userId: row.user_id,
    period: row.period,
    title: row.title,
    message: row.message,
    recommendation: row.recommendation,
    tone: row.tone,
    metric: row.metric ?? undefined,
    summary: row.summary ?? undefined,
    forecast: row.forecast ?? undefined,
    createdAt: row.created_at,
  };
}

function mapReceiptRow(row: {
  id: string;
  user_id: string;
  merchant: string;
  total: number;
  transaction_date: string;
  category_id: string;
  category_name: string;
  note: string;
  confidence: number;
  image_name: string;
  transaction_id: string | null;
  created_at: string;
}): ReceiptScan {
  return {
    id: row.id,
    userId: row.user_id,
    merchant: row.merchant,
    total: row.total,
    transactionDate: row.transaction_date,
    categoryId: row.category_id,
    categoryName: row.category_name,
    note: row.note,
    confidence: row.confidence,
    imageName: row.image_name,
    transactionId: row.transaction_id ?? undefined,
    createdAt: row.created_at,
  };
}

function mapChatRow(row: {
  id: string;
  user_id: string;
  role: AiChatMessage["role"];
  message: string;
  created_at: string;
}): AiChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    message: row.message,
    createdAt: row.created_at,
  };
}

async function loadDemoState(user: AppUser) {
  void user;
  return normalizeFinanceState(await readDemoState());
}

async function loadSupabaseState(user: AppUser): Promise<FinanceState> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  let fallbackCategories: Category[] = [];

  const [
    profileRes,
    categoriesRes,
    transactionsRes,
    goalsRes,
    contributionsRes,
    aiRes,
    receiptsRes,
    chatRes,
  ] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("created_at", { ascending: true }),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("savings_goals").select("*").order("created_at", { ascending: false }),
      supabase
        .from("goal_contributions")
        .select("*")
        .order("date", { ascending: false }),
      supabase.from("ai_insights").select("*").order("created_at", { ascending: false }),
      supabase.from("receipt_scans").select("*").order("created_at", { ascending: false }),
      supabase.from("ai_chat_messages").select("*").order("created_at", { ascending: true }),
    ]);

  const profileError =
    mapError(profileRes.error) ??
    mapError(categoriesRes.error) ??
    mapError(transactionsRes.error) ??
    mapError(goalsRes.error) ??
    mapError(contributionsRes.error) ??
    mapError(aiRes.error) ??
    mapError(receiptsRes.error) ??
    mapError(chatRes.error);
  if (profileError) {
    throw profileError;
  }

  if (!profileRes.data) {
    const profile = createDefaultProfile(user);
    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      full_name: profile.fullName,
      currency: profile.currency,
      display_currency: profile.displayCurrency,
      language: profile.language,
      notifications_email: profile.notificationsEmail,
      notifications_push: profile.notificationsPush,
      ai_enabled: profile.aiEnabled,
      ai_provider: profile.aiProvider,
      onboarding_completed: profile.onboardingCompleted,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  if (!categoriesRes.data?.length) {
    const defaults = createDefaultCategories(user.id);
    fallbackCategories = defaults;
    const { error } = await supabase.from("categories").insert(
      defaults.map((category) => ({
        user_id: category.userId,
        name: category.name,
        kind: category.kind,
        color: category.color,
        icon: category.icon,
        is_default: category.isDefault,
      })),
    );
    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    profile: profileRes.data ? mapProfileRow(profileRes.data) : createDefaultProfile(user),
    categories:
      categoriesRes.data && categoriesRes.data.length > 0
        ? categoriesRes.data.map(mapCategoryRow)
        : fallbackCategories,
    transactions: (transactionsRes.data ?? []).map(mapTransactionRow),
    goals: (goalsRes.data ?? []).map(mapGoalRow),
    contributions: (contributionsRes.data ?? []).map(mapContributionRow),
    aiInsights: (aiRes.data ?? []).map(mapAiRow),
    receiptScans: (receiptsRes.data ?? []).map(mapReceiptRow),
    chatMessages: (chatRes.data ?? []).map(mapChatRow),
    updatedAt: new Date().toISOString(),
  } satisfies FinanceState;
}

export async function loadFinanceState(mode: RuntimeMode, user: AppUser) {
  if (mode === "demo") {
    return loadDemoState(user);
  }

  const state = await loadSupabaseState(user);
  return normalizeFinanceState(state);
}

export async function upsertTransaction(
  mode: RuntimeMode,
  user: AppUser,
  values: TransactionFormValues,
): Promise<Transaction> {
  if (mode === "demo") {
    const state = await readDemoState();
    const transaction: Transaction = {
      id: values.id ?? createId("txn"),
      userId: user.id,
      type: values.type,
      amount: values.amount,
      categoryId: values.categoryId,
      date: values.date,
      note: values.note,
      createdAt:
        state.transactions.find((item) => item.id === values.id)?.createdAt ??
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const transactions = values.id
      ? state.transactions.map((item) => (item.id === values.id ? transaction : item))
      : [transaction, ...state.transactions];
    await writeDemoState({ ...state, transactions });
    return transaction;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { data, error } = await supabase
    .from("transactions")
    .upsert({
      id: values.id,
      user_id: user.id,
      type: values.type,
      amount: values.amount,
      category_id: values.categoryId,
      date: values.date,
      note: values.note,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Не удалось сохранить операцию.");
  }

  return mapTransactionRow(data);
}

export async function createTransactions(
  mode: RuntimeMode,
  user: AppUser,
  values: Array<Omit<TransactionFormValues, "id">>,
): Promise<Transaction[]> {
  if (values.length === 0) {
    return [];
  }

  if (mode === "demo") {
    const state = await readDemoState();
    const now = new Date().toISOString();
    const created = values.map((value) => ({
      id: createId("txn"),
      userId: user.id,
      type: value.type,
      amount: value.amount,
      categoryId: value.categoryId,
      date: value.date,
      note: value.note,
      createdAt: now,
      updatedAt: now,
    } satisfies Transaction));

    await writeDemoState({
      ...state,
      transactions: [...created, ...state.transactions],
    });

    return created;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert(
      values.map((value) => ({
        id: createId("txn"),
        user_id: user.id,
        type: value.type,
        amount: value.amount,
        category_id: value.categoryId,
        date: value.date,
        note: value.note,
      })),
    )
    .select("*");

  if (error || !data) {
    throw new Error(error?.message ?? "Не удалось импортировать операции.");
  }

  return data.map(mapTransactionRow);
}

export async function removeTransaction(
  mode: RuntimeMode,
  user: AppUser,
  transactionId: string,
) {
  if (mode === "demo") {
    const state = await readDemoState();
    await writeDemoState({
      ...state,
      transactions: state.transactions.filter((item) => item.id !== transactionId),
    });
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertGoal(
  mode: RuntimeMode,
  user: AppUser,
  values: GoalFormValues,
) {
  if (mode === "demo") {
    const state = await readDemoState();
    const goal: SavingsGoal = {
      id: values.id ?? createId("goal"),
      userId: user.id,
      title: values.title,
      targetAmount: values.targetAmount,
      currentAmount: values.currentAmount,
      deadline: values.deadline,
      priority: values.priority,
      color: values.color,
      icon: values.icon,
      note: values.note,
      createdAt:
        state.goals.find((item) => item.id === values.id)?.createdAt ??
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const goals = values.id
      ? state.goals.map((item) => (item.id === values.id ? goal : item))
      : [goal, ...state.goals];
    await writeDemoState({ ...state, goals });
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { error } = await supabase.from("savings_goals").upsert({
    id: values.id,
    user_id: user.id,
    title: values.title,
    target_amount: values.targetAmount,
    current_amount: values.currentAmount,
    deadline: values.deadline,
    color: values.color,
    icon: values.icon,
    note: values.note,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function removeGoal(mode: RuntimeMode, user: AppUser, goalId: string) {
  if (mode === "demo") {
    const state = await readDemoState();
    await writeDemoState({
      ...state,
      goals: state.goals.filter((item) => item.id !== goalId),
      contributions: state.contributions.filter((item) => item.goalId !== goalId),
    });
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { error } = await supabase.from("savings_goals").delete().eq("id", goalId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function addGoalContribution(
  mode: RuntimeMode,
  user: AppUser,
  values: ContributionFormValues,
) {
  if (mode === "demo") {
    const state = await readDemoState();
    const contribution: GoalContribution = {
      id: createId("contrib"),
      userId: user.id,
      goalId: values.goalId,
      amount: values.amount,
      date: values.date,
      note: values.note,
      createdAt: new Date().toISOString(),
    };
    const goals = state.goals.map((goal) =>
      goal.id === values.goalId
        ? {
            ...goal,
            currentAmount: goal.currentAmount + values.amount,
            updatedAt: new Date().toISOString(),
          }
        : goal,
    );
    await writeDemoState({
      ...state,
      goals,
      contributions: [contribution, ...state.contributions],
    });
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const goal = await supabase
    .from("savings_goals")
    .select("current_amount")
    .eq("id", values.goalId)
    .single();
  if (goal.error || !goal.data) {
    throw new Error(goal.error?.message ?? "Цель не найдена.");
  }

  const { error: contributionError } = await supabase.from("goal_contributions").insert({
    user_id: user.id,
    goal_id: values.goalId,
    amount: values.amount,
    date: values.date,
    note: values.note,
  });
  if (contributionError) {
    throw new Error(contributionError.message);
  }

  const { error: updateError } = await supabase
    .from("savings_goals")
    .update({
      current_amount: goal.data.current_amount + values.amount,
    })
    .eq("id", values.goalId);
  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function upsertCategory(
  mode: RuntimeMode,
  user: AppUser,
  values: CategoryFormValues,
) {
  if (mode === "demo") {
    const state = await readDemoState();
    const category: Category = {
      id: values.id ?? createId("cat"),
      userId: user.id,
      name: values.name,
      kind: values.kind,
      color: values.color,
      icon: values.icon,
      isDefault: false,
      createdAt:
        state.categories.find((item) => item.id === values.id)?.createdAt ??
        new Date().toISOString(),
    };
    const categories = values.id
      ? state.categories.map((item) => (item.id === values.id ? category : item))
      : [category, ...state.categories];
    await writeDemoState({ ...state, categories });
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { error } = await supabase.from("categories").upsert({
    id: values.id,
    user_id: user.id,
    name: values.name,
    kind: values.kind,
    color: values.color,
    icon: values.icon,
    is_default: false,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProfile(
  mode: RuntimeMode,
  user: AppUser,
  patch: Partial<UserProfile>,
) {
  if (mode === "demo") {
    const state = await readDemoState();
    await writeDemoState({
      ...state,
      profile: {
        ...state.profile,
        ...patch,
        monthlySavingsBudget: Math.max(0, patch.monthlySavingsBudget ?? state.profile.monthlySavingsBudget ?? 0),
      },
    });
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const updatePayload = {
    full_name: patch.fullName,
    currency: patch.currency,
    display_currency: patch.displayCurrency,
    language: patch.language,
    notifications_email: patch.notificationsEmail,
    notifications_push: patch.notificationsPush,
    ai_enabled: patch.aiEnabled,
    ai_provider: patch.aiProvider,
    onboarding_completed: patch.onboardingCompleted,
  };

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function replaceAiInsights(
  mode: RuntimeMode,
  user: AppUser,
  insights: AiInsight[],
) {
  if (mode === "demo") {
    const state = await readDemoState();
    await writeDemoState({
      ...state,
      aiInsights: insights,
    });
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { error: deleteError } = await supabase
    .from("ai_insights")
    .delete()
    .eq("user_id", user.id);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error } = await supabase.from("ai_insights").insert(
    insights.map((item) => ({
      user_id: user.id,
      period: item.period,
      title: item.title,
      message: item.message,
      recommendation: item.recommendation,
      tone: item.tone,
      metric: item.metric ?? null,
      summary: item.summary ?? null,
      forecast: item.forecast ?? null,
    })),
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function addReceiptScan(
  mode: RuntimeMode,
  user: AppUser,
  scan: Omit<ReceiptScan, "id" | "createdAt" | "userId">,
) {
  const payload: ReceiptScan = {
    id: createId("receipt"),
    userId: user.id,
    createdAt: new Date().toISOString(),
    ...scan,
  };

  if (mode === "demo") {
    const state = await readDemoState();
    await writeDemoState({
      ...state,
      receiptScans: [payload, ...(state.receiptScans ?? [])],
    });
    return payload;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { data, error } = await supabase
    .from("receipt_scans")
    .insert({
      user_id: user.id,
      merchant: payload.merchant,
      total: payload.total,
      transaction_date: payload.transactionDate,
      category_id: payload.categoryId,
      category_name: payload.categoryName,
      note: payload.note,
      confidence: payload.confidence,
      image_name: payload.imageName,
      transaction_id: payload.transactionId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Не удалось сохранить чек.");
  }

  return mapReceiptRow(data);
}

export async function appendChatMessage(
  mode: RuntimeMode,
  user: AppUser,
  message: Omit<AiChatMessage, "id" | "userId" | "createdAt">,
) {
  const payload: AiChatMessage = {
    id: createId("chat"),
    userId: user.id,
    createdAt: new Date().toISOString(),
    ...message,
  };

  if (mode === "demo") {
    const state = await readDemoState();
    await writeDemoState({
      ...state,
      chatMessages: [...(state.chatMessages ?? []), payload],
    });
    return payload;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase не настроен.");
  }

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .insert({
      user_id: user.id,
      role: payload.role,
      message: payload.message,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Не удалось сохранить сообщение.");
  }

  return mapChatRow(data);
}
