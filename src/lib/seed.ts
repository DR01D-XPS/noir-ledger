import {
  AiInsight,
  AppUser,
  Category,
  FinanceState,
  GoalContribution,
  SavingsGoal,
  Transaction,
  UserProfile,
} from "@/lib/types";
import { categoryPresetsByType } from "@/lib/presets";
import { createId } from "@/lib/utils";

function isoDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

export function createDefaultCategories(userId: string | null): Category[] {
  const now = new Date().toISOString();
  const orderedTypes = ["income", "expense", "saving", "transfer"] as const;

  return orderedTypes.flatMap((kind) =>
    categoryPresetsByType[kind].map((preset) => ({
      id: `cat_default_${kind}_${preset.id}`,
      userId,
      name: preset.label,
      kind,
      color: preset.color,
      icon: preset.icon,
      isDefault: true,
      createdAt: now,
    })),
  );
}

export function createDefaultProfile(user: AppUser): UserProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    currency: "RUB",
    displayCurrency: "RUB",
    language: "ru-RU",
    monthlySavingsBudget: 0,
    notificationsEmail: false,
    notificationsPush: false,
    aiEnabled: true,
    aiProvider: "openai",
    onboardingCompleted: true,
  };
}

export function createEmptyFinanceState(user: AppUser): FinanceState {
  return {
    profile: createDefaultProfile(user),
    categories: createDefaultCategories(user.id),
    transactions: [],
    goals: [],
    contributions: [],
    aiInsights: [],
    receiptScans: [],
    chatMessages: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createSeededFinanceState(user: AppUser): FinanceState {
  const categories = createDefaultCategories(user.id);
  const categoryByIcon = new Map(categories.map((item) => [item.icon, item.id]));

  const transactions: Transaction[] = [
    ["income", 285000, "salary", -32, "Зачисление основной зарплаты"],
    ["expense", 5200, "food", -30, "Ужин с клиентом и кофе"],
    ["expense", 68000, "home", -28, "Аренда и коммунальные платежи"],
    ["expense", 12400, "groceries", -27, "Большая закупка на неделю"],
    ["saving", 35000, "savings", -26, "Пополнение резервного фонда"],
    ["expense", 4100, "transport", -24, "Такси и метро"],
    ["expense", 1890, "subscriptions", -22, "Обновление сервисов и приложений"],
    ["income", 54000, "freelance", -20, "Оплата за лендинг и аудит"],
    ["expense", 7600, "entertainment", -17, "Билеты и выходные"],
    ["expense", 6900, "food", -14, "Несколько поздних ужинов вне дома"],
    ["income", 18400, "investment", -13, "Дивиденды и купоны"],
    ["expense", 13600, "groceries", -11, "Пополнение бытовых запасов"],
    ["saving", 28000, "savings", -10, "Перевод в цель на поездку"],
    ["expense", 3700, "transport", -8, "Бензин и парковка"],
    ["expense", 9800, "food", -6, "Встреча с друзьями"],
    ["income", 285000, "salary", -3, "Следующее поступление зарплаты"],
    ["expense", 9500, "entertainment", -2, "Концерт и вечерняя программа"],
    ["expense", 4200, "subscriptions", -1, "Годовые продления сервисов"],
  ].map(([type, amount, categoryIcon, offset, note]) => {
    const date = isoDate(offset as number);
    return {
      id: createId("txn"),
      userId: user.id,
      type: type as Transaction["type"],
      amount: amount as number,
      categoryId: categoryByIcon.get(categoryIcon as string) ?? categories[0].id,
      date,
      note: note as string,
      createdAt: date,
      updatedAt: date,
    };
  });

  const goals: SavingsGoal[] = [
    {
      id: createId("goal"),
      userId: user.id,
      title: "Резервный фонд",
      targetAmount: 420000,
      currentAmount: 186000,
      deadline: isoDate(150),
      priority: "high",
      color: "#ca8752",
      icon: "reserve",
      note: "Финансовая подушка примерно на три месяца базовых расходов.",
      createdAt: isoDate(-42),
      updatedAt: isoDate(-5),
    },
    {
      id: createId("goal"),
      userId: user.id,
      title: "Поездка в Токио",
      targetAmount: 290000,
      currentAmount: 98000,
      deadline: isoDate(220),
      priority: "medium",
      color: "#d9b07a",
      icon: "rocket",
      note: "Перелет, проживание и небольшой запас на шопинг и музеи.",
      createdAt: isoDate(-60),
      updatedAt: isoDate(-8),
    },
  ];

  const contributions: GoalContribution[] = [
    {
      id: createId("contrib"),
      userId: user.id,
      goalId: goals[0].id,
      amount: 35000,
      date: isoDate(-26),
      note: "Автоперевод в резерв",
      createdAt: isoDate(-26),
    },
    {
      id: createId("contrib"),
      userId: user.id,
      goalId: goals[1].id,
      amount: 28000,
      date: isoDate(-10),
      note: "Часть дохода с фриланса",
      createdAt: isoDate(-10),
    },
  ];

  const aiInsights: AiInsight[] = [
    {
      id: createId("ai"),
      userId: user.id,
      period: "month",
      title: "Траты на кафе выросли быстрее плана",
      message:
        "Расходы по категории «Кафе и рестораны» заметно ускорились за последние две недели и сейчас примерно на 24% выше обычного уровня.",
      recommendation:
        "Ограничь необязательные походы в кафе на ближайшие семь дней и переведи разницу в резервный фонд.",
      tone: "warning",
      metric: "+24%",
      summary:
        "Денежный поток в целом выглядит устойчиво, но импульсивные траты на еду вне дома уже съедают часть месячного запаса.",
      forecast:
        "Если удерживать пополнения накоплений выше 28 000 рублей в месяц, резервный фонд закроется заметно раньше срока.",
      createdAt: isoDate(-1),
    },
    {
      id: createId("ai"),
      userId: user.id,
      period: "week",
      title: "Фриланс поддерживает свободный остаток",
      message:
        "Дополнительный доход уже почти полностью перекрывает развлечения и подписки в текущем месяце.",
      recommendation:
        "Следующее поступление с подработки лучше сразу распределить между поездкой и резервом до даты крупных обязательных платежей.",
      tone: "positive",
      metric: "54 000 ₽",
      createdAt: isoDate(-1),
    },
  ];

  return {
    profile: {
      ...createDefaultProfile(user),
      monthlySavingsBudget: 42000,
    },
    categories,
    transactions,
    goals,
    contributions,
    aiInsights,
    receiptScans: [],
    chatMessages: [],
    updatedAt: new Date().toISOString(),
  };
}
