import {
  CurrencyOption,
  ExchangeRateBundle,
  FinanceState,
  SupportedCurrency,
  UserProfile,
} from "@/lib/types";

const usdBaseRates: Record<SupportedCurrency, number> = {
  RUB: 92,
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CNY: 7.26,
  AED: 3.67,
};

export const supportedCurrencies: CurrencyOption[] = [
  { code: "RUB", label: "Российский рубль", locale: "ru-RU" },
  { code: "USD", label: "Доллар США", locale: "en-US" },
  { code: "EUR", label: "Евро", locale: "de-DE" },
  { code: "GBP", label: "Фунт стерлингов", locale: "en-GB" },
  { code: "CNY", label: "Китайский юань", locale: "zh-CN" },
  { code: "AED", label: "Дирхам ОАЭ", locale: "ar-AE" },
];

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return supportedCurrencies.some((currency) => currency.code === value);
}

export function getCurrencyOption(code: SupportedCurrency) {
  return supportedCurrencies.find((currency) => currency.code === code) ?? supportedCurrencies[0];
}

export function getDisplayCurrency(profile: UserProfile) {
  return profile.displayCurrency ?? profile.currency;
}

export function getFallbackExchangeRates(base: SupportedCurrency): ExchangeRateBundle {
  const rates = Object.fromEntries(
    supportedCurrencies.map((currency) => {
      const value = usdBaseRates[currency.code] / usdBaseRates[base];
      return [currency.code, Number(value.toFixed(6))];
    }),
  ) as Record<SupportedCurrency, number>;

  return {
    base,
    rates,
    source: "fallback",
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeProfileCurrency(profile: UserProfile): UserProfile {
  const baseCurrency = isSupportedCurrency(profile.currency) ? profile.currency : "RUB";
  const displayCurrency = isSupportedCurrency(profile.displayCurrency)
    ? profile.displayCurrency
    : baseCurrency;

  return {
    ...profile,
    currency: baseCurrency,
    displayCurrency,
  };
}

export function convertCurrencyAmount(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  bundle = getFallbackExchangeRates(from),
) {
  if (from === to) {
    return Number(amount.toFixed(2));
  }

  const rates = bundle.base === from || bundle.base === to ? bundle : getFallbackExchangeRates(from);
  const amountInBase =
    from === rates.base ? amount : amount / Math.max(rates.rates[from] || 1, 0.000001);
  const result = to === rates.base ? amountInBase : amountInBase * rates.rates[to];

  return Number(result.toFixed(2));
}

export function presentFinanceState(
  sourceState: FinanceState,
  bundle: ExchangeRateBundle = getFallbackExchangeRates(sourceState.profile.currency),
): FinanceState {
  const profile = normalizeProfileCurrency(sourceState.profile);
  const displayCurrency = getDisplayCurrency(profile);

  if (profile.currency === displayCurrency) {
    return {
      ...sourceState,
      profile,
    };
  }

  const convert = (amount: number) =>
    convertCurrencyAmount(amount, profile.currency, displayCurrency, bundle);

  return {
    ...sourceState,
    profile,
    transactions: sourceState.transactions.map((transaction) => ({
      ...transaction,
      amount: convert(transaction.amount),
    })),
    goals: sourceState.goals.map((goal) => ({
      ...goal,
      targetAmount: convert(goal.targetAmount),
      currentAmount: convert(goal.currentAmount),
    })),
    contributions: sourceState.contributions.map((contribution) => ({
      ...contribution,
      amount: convert(contribution.amount),
    })),
    receiptScans: sourceState.receiptScans.map((scan) => ({
      ...scan,
      total: convert(scan.total),
    })),
  };
}
