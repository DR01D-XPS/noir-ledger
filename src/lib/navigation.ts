import {
  BrainCircuit,
  ChartSpline,
  CircleDollarSign,
  LayoutDashboard,
  Settings,
  Target,
} from "lucide-react";

export const appNavigation = [
  {
    href: "/dashboard",
    label: "Обзор",
    description: "Баланс и главная картина",
    icon: LayoutDashboard,
  },
  {
    href: "/transactions",
    label: "Операции",
    description: "Доходы и расходы",
    icon: CircleDollarSign,
  },
  {
    href: "/analytics",
    label: "Аналитика",
    description: "Динамика и категории",
    icon: ChartSpline,
  },
  {
    href: "/goals",
    label: "Цели",
    description: "Накопления и прогноз",
    icon: Target,
  },
  {
    href: "/insights",
    label: "Ассистент",
    description: "OpenAI и чековый разбор",
    icon: BrainCircuit,
  },
  {
    href: "/settings",
    label: "Профиль",
    description: "Имя, валюта и категории",
    icon: Settings,
  },
] as const;
