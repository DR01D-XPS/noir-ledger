import { createElement } from "react";
import {
  ArrowLeftRight,
  BadgeRussianRuble,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BriefcaseBusiness,
  CarTaxiFront,
  CircleDollarSign,
  Coffee,
  Dumbbell,
  Film,
  Flame,
  Gamepad2,
  Gem,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Hotel,
  Landmark,
  LucideIcon,
  MonitorSmartphone,
  PartyPopper,
  PillBottle,
  PlaneTakeoff,
  PiggyBank,
  Receipt,
  Rocket,
  ScanText,
  Shirt,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Ticket,
  Tv,
  UtensilsCrossed,
  WalletCards,
  WalletMinimal,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import { SupportedCurrency } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency: SupportedCurrency = "USD",
  language = "ru-RU",
) {
  try {
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(value % 1 === 0 ? 0 : 2)} ${currency}`;
  }
}

export function formatCompactCurrency(
  value: number,
  currency: SupportedCurrency = "USD",
  language = "ru-RU",
) {
  try {
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${value.toFixed(1)} ${currency}`;
  }
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDateLabel(value: string) {
  return format(parseISO(value), "dd MMM", { locale: ru });
}

export function formatLongDate(value: string) {
  return format(parseISO(value), "dd MMM yyyy", { locale: ru });
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const categoryIconMap: Record<string, LucideIcon> = {
  salary: CircleDollarSign,
  freelance: BriefcaseBusiness,
  investment: Landmark,
  bonus: HandCoins,
  cashback: BanknoteArrowDown,
  groceries: ShoppingBasket,
  shopping: ShoppingCart,
  food: UtensilsCrossed,
  cafe: Coffee,
  transport: CarTaxiFront,
  entertainment: Film,
  gaming: Gamepad2,
  event: Ticket,
  gift: PartyPopper,
  clothes: Shirt,
  subscriptions: Tv,
  home: Home,
  savings: PiggyBank,
  transfer: ArrowLeftRight,
  reserve: Flame,
  work: BanknoteArrowUp,
  wallet: WalletMinimal,
  wealth: Sparkles,
  ruble: BadgeRussianRuble,
  travel: PlaneTakeoff,
  hotel: Hotel,
  tech: MonitorSmartphone,
  education: GraduationCap,
  health: HeartPulse,
  medicine: PillBottle,
  fitness: Dumbbell,
  receipt: Receipt,
  scan: ScanText,
  rocket: Rocket,
  gem: Gem,
  cards: WalletCards,
};

export function getCategoryIcon(name: string) {
  return categoryIconMap[name] ?? CircleDollarSign;
}

export function renderCategoryIcon(name: string, className?: string) {
  return createElement(getCategoryIcon(name), { className });
}

export function groupBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K,
) {
  return items.reduce<Record<K, T[]>>((accumulator, item) => {
    const key = getKey(item);
    accumulator[key] ||= [];
    accumulator[key].push(item);
    return accumulator;
  }, {} as Record<K, T[]>);
}
