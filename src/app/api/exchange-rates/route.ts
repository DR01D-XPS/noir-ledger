import { NextResponse } from "next/server";
import { getFallbackExchangeRates, isSupportedCurrency, supportedCurrencies } from "@/lib/currency";
import { SupportedCurrency } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base");
  const normalizedBase = isSupportedCurrency(base ?? "") ? (base as SupportedCurrency) : "RUB";
  const fallback = getFallbackExchangeRates(normalizedBase);

  try {
    const targets = supportedCurrencies
      .map((currency) => currency.code)
      .filter((currency) => currency !== normalizedBase)
      .join(",");

    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${normalizedBase}&to=${targets}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const data = (await response.json()) as {
      rates?: Record<string, number>;
      date?: string;
    };

    const rates = {
      ...fallback.rates,
      [normalizedBase]: 1,
    };

    for (const currency of supportedCurrencies) {
      if (currency.code === normalizedBase) {
        continue;
      }

      const liveValue = data.rates?.[currency.code];
      if (typeof liveValue === "number" && Number.isFinite(liveValue)) {
        rates[currency.code] = Number(liveValue.toFixed(6));
      }
    }

    return NextResponse.json({
      base: normalizedBase,
      rates,
      source: "live",
      updatedAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
