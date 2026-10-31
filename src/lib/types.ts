export type RuntimeMode = "demo" | "supabase";
export type TransactionType = "income" | "expense" | "transfer" | "saving";
export type InsightTone = "positive" | "warning" | "neutral";
export type InsightPeriod = "week" | "month" | "long";
export type SupportedCurrency = "RUB" | "USD" | "EUR" | "GBP" | "CNY" | "AED";
export type AssistantRole = "user" | "assistant";
export type GoalPriority = "high" | "medium" | "low";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: string;
  demo?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  currency: SupportedCurrency;
  displayCurrency: SupportedCurrency;
  language: string;
  monthlySavingsBudget: number;
  notificationsEmail: boolean;
  notificationsPush: boolean;
  aiEnabled: boolean;
  aiProvider: "mock" | "openai";
  onboardingCompleted: boolean;
}

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  kind: TransactionType;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: GoalPriority;
  color: string;
  icon: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  userId: string;
  goalId: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface AiInsight {
  id: string;
  userId: string;
  period: InsightPeriod;
  title: string;
  message: string;
  recommendation: string;
  tone: InsightTone;
  metric?: string;
  summary?: string;
  forecast?: string;
  createdAt: string;
}

export interface FinanceState {
  profile: UserProfile;
  categories: Category[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  contributions: GoalContribution[];
  aiInsights: AiInsight[];
  receiptScans: ReceiptScan[];
  chatMessages: AiChatMessage[];
  updatedAt: string;
}

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
  savings: number;
  net: number;
  balance: number;
}

export interface CategorySlice {
  id: string;
  name: string;
  value: number;
  color: string;
  change: number;
}

export interface WeeklyPoint {
  label: string;
  income: number;
  expense: number;
}

export interface SpendingPattern {
  label: string;
  description: string;
  impact: string;
  tone: InsightTone;
}

export interface CommentHighlight {
  id: string;
  category: string;
  note: string;
  date: string;
  amount: number;
}

export interface FinanceHealth {
  score: number;
  label: "Сильный" | "Стабильный" | "Под контролем";
  summary: string;
  accent: string;
}

export interface DashboardSnapshot {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  savingsTotal: number;
  savingsRate: number;
  goalProgress: number;
  recentTransactions: Array<Transaction & { category?: Category }>;
  spendingByCategory: CategorySlice[];
  balanceTrend: TrendPoint[];
  health: FinanceHealth;
  latestInsight?: AiInsight | null;
}

export interface AnalyticsSnapshot {
  trend: TrendPoint[];
  weeklyComparison: WeeklyPoint[];
  categoryDistribution: CategorySlice[];
  topCategories: CategorySlice[];
  patterns: SpendingPattern[];
  commentHighlights: CommentHighlight[];
  anomalies: Array<Transaction & { category?: Category }>;
  goalForecasts: Array<{
    id: string;
    title: string;
    priority: GoalPriority;
    completionRate: number;
    projectedDate: string;
    recommendedMonthlyAmount: number;
    requiredMonthlyAmount: number;
    share: number;
  }>;
}

export interface AiInsightBundle {
  summary: string;
  forecast: string;
  insights: AiInsight[];
}

export interface ExchangeRateBundle {
  base: SupportedCurrency;
  rates: Record<SupportedCurrency, number>;
  source: "live" | "fallback";
  updatedAt: string;
}

export interface CurrencyOption {
  code: SupportedCurrency;
  label: string;
  locale: string;
}

export interface PresetOption {
  id: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

export interface ReceiptScan {
  id: string;
  userId: string;
  merchant: string;
  total: number;
  transactionDate: string;
  categoryId: string;
  categoryName: string;
  note: string;
  confidence: number;
  imageName: string;
  transactionId?: string;
  createdAt: string;
}

export interface ReceiptDraft {
  merchant: string;
  total: number;
  transactionDate: string;
  categoryId: string;
  categoryName: string;
  note: string;
  confidence: number;
  imageName: string;
}

export interface AiChatMessage {
  id: string;
  userId: string;
  role: AssistantRole;
  message: string;
  createdAt: string;
}

export interface TransactionFormValues {
  id?: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
}

export interface GoalFormValues {
  id?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: GoalPriority;
  color: string;
  icon: string;
  note: string;
}

export interface CategoryFormValues {
  id?: string;
  name: string;
  kind: TransactionType;
  color: string;
  icon: string;
}

export interface ContributionFormValues {
  goalId: string;
  amount: number;
  date: string;
  note: string;
}

export interface ProfileFormValues {
  fullName: string;
  displayCurrency: SupportedCurrency;
  language: string;
}
