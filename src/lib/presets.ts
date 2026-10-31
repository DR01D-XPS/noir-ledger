import { PresetOption, TransactionType } from "@/lib/types";

export const categoryPresetsByType: Record<TransactionType, PresetOption[]> = {
  income: [
    { id: "salary", label: "Зарплата", icon: "salary", color: "#ffb400", description: "Оклад и регулярные выплаты" },
    { id: "freelance", label: "Фриланс", icon: "freelance", color: "#ff9800", description: "Проекты и подработка" },
    { id: "bonus", label: "Бонусы", icon: "bonus", color: "#ffc754", description: "Премии, кэшбек и бонусы" },
    { id: "investment", label: "Инвестиции", icon: "investment", color: "#ffcf73", description: "Дивиденды и прибыль" },
    { id: "cashback", label: "Возвраты", icon: "cashback", color: "#d68a47", description: "Возвраты и кэшбек" },
  ],
  expense: [
    { id: "food", label: "Ресторан", icon: "food", color: "#ffb14a", description: "Ужины, доставка и кафе" },
    { id: "cafe", label: "Кофе", icon: "cafe", color: "#ff9a2b", description: "Кофе и быстрые перекусы" },
    { id: "groceries", label: "Продукты", icon: "groceries", color: "#d7924a", description: "Покупки в магазине" },
    { id: "shopping", label: "Покупки", icon: "shopping", color: "#e0a74a", description: "Маркетплейсы и магазины" },
    { id: "transport", label: "Транспорт", icon: "transport", color: "#cb7a36", description: "Такси, метро и поездки" },
    { id: "entertainment", label: "Развлечения", icon: "entertainment", color: "#ffbf59", description: "Кино, концерты и отдых" },
    { id: "gaming", label: "Игры", icon: "gaming", color: "#d47d27", description: "Игры и цифровой досуг" },
    { id: "event", label: "События", icon: "event", color: "#ffcf73", description: "Билеты и мероприятия" },
    { id: "subscriptions", label: "Подписки", icon: "subscriptions", color: "#9d7a5a", description: "Сервисы и приложения" },
    { id: "home", label: "Дом", icon: "home", color: "#aa6d39", description: "Аренда, ремонт и быт" },
    { id: "health", label: "Здоровье", icon: "health", color: "#d46d3d", description: "Врачи и лечение" },
    { id: "fitness", label: "Спорт", icon: "fitness", color: "#ff9f3d", description: "Зал и активность" },
    { id: "travel", label: "Путешествия", icon: "travel", color: "#ffbe4f", description: "Поездки и перелеты" },
    { id: "hotel", label: "Отели", icon: "hotel", color: "#cf8644", description: "Проживание и бронирования" },
    { id: "clothes", label: "Одежда", icon: "clothes", color: "#c97a46", description: "Гардероб и аксессуары" },
    { id: "education", label: "Обучение", icon: "education", color: "#ffb85d", description: "Курсы и развитие" },
    { id: "tech", label: "Техника", icon: "tech", color: "#d1853d", description: "Гаджеты и электроника" },
    { id: "gift", label: "Подарки", icon: "gift", color: "#ff9a38", description: "Подарки и праздники" },
  ],
  saving: [
    { id: "savings", label: "Накопления", icon: "savings", color: "#ffbf54", description: "Базовый накопительный контур" },
    { id: "reserve", label: "Резерв", icon: "reserve", color: "#ff9a21", description: "Подушка безопасности" },
    { id: "wealth", label: "Капитал", icon: "wealth", color: "#ffd67d", description: "Долгий рост и капитал" },
    { id: "travel", label: "Фонд поездок", icon: "travel", color: "#e89d42", description: "Накопления на путешествия" },
  ],
  transfer: [
    { id: "transfer", label: "Перевод", icon: "transfer", color: "#a27a58", description: "Между счетами и картами" },
    { id: "wallet", label: "Кошелек", icon: "wallet", color: "#ba8a5f", description: "Наличные и личные переводы" },
  ],
};

export const goalPresets: PresetOption[] = [
  { id: "reserve", label: "Резервный фонд", icon: "reserve", color: "#ff9f1f", description: "Запас на спокойные месяцы" },
  { id: "travel", label: "Путешествие", icon: "travel", color: "#ffb950", description: "Поездка, отпуск, впечатления" },
  { id: "home", label: "Дом", icon: "home", color: "#d88442", description: "Ремонт, мебель, жилье" },
  { id: "tech", label: "Техника", icon: "tech", color: "#cb7c39", description: "Ноутбук, телефон, гаджеты" },
  { id: "education", label: "Обучение", icon: "education", color: "#ffbf60", description: "Курсы и профессиональный рост" },
  { id: "health", label: "Здоровье", icon: "health", color: "#d96a40", description: "Медицина и восстановление" },
  { id: "shopping", label: "Крупная покупка", icon: "shopping", color: "#e3a450", description: "Вещи и важные покупки" },
  { id: "wealth", label: "Капитал", icon: "wealth", color: "#ffd67d", description: "Долгосрочное накопление" },
];

export function findCategoryPreset(type: TransactionType, presetId: string) {
  return categoryPresetsByType[type].find((preset) => preset.id === presetId) ?? categoryPresetsByType[type][0];
}

export function findGoalPreset(presetId: string) {
  return goalPresets.find((preset) => preset.id === presetId) ?? goalPresets[0];
}
