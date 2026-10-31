"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { CategorySlice, SupportedCurrency, TrendPoint, WeeklyPoint } from "@/lib/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

function ChartViewport({
  children,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);

      setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className="h-full w-full">{size.width > 0 && size.height > 0 ? children(size) : null}</div>;
}

function CurrencyTooltip({
  active,
  payload,
  label,
  currency,
  language,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | null; name?: string }>;
  label?: string;
  currency: SupportedCurrency;
  language: string;
}) {
  const normalizedPayload = (payload ?? []).filter(
    (entry): entry is { value: number; name: string } =>
      typeof entry.value === "number" && Number.isFinite(entry.value) && Boolean(entry.name),
  );

  if (!active || normalizedPayload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090806]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="space-y-1.5">
        {normalizedPayload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-zinc-300">{entry.name}</span>
            <span className="font-medium text-zinc-50">
              {formatCompactCurrency(entry.value, currency, language)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 text-center text-sm leading-7 text-zinc-500">
      {message}
    </div>
  );
}

function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300"
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function BalanceTrendChart({
  data,
  currency = "RUB",
  language = "ru-RU",
  title = "Динамика баланса",
  description = "Изменение общего баланса за последние месяцы",
}: {
  data: TrendPoint[];
  currency?: SupportedCurrency;
  language?: string;
  title?: string;
  description?: string;
}) {
  return (
    <Card className="panel-highlight min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-72 min-w-0 px-3 pb-5 sm:px-6">
        {data.length === 0 ? (
          <EmptyChartState message="График появится, когда в истории накопится достаточно операций." />
        ) : (
          <ChartViewport>
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={data} margin={{ left: 8, right: 6, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#ffb400" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ff8a00" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  tickFormatter={(value) => formatCompactCurrency(value, currency, language)}
                />
                <Tooltip content={<CurrencyTooltip currency={currency} language={language} />} />
                <Area type="monotone" dataKey="balance" stroke="#ffb400" fill="url(#balanceGradient)" strokeWidth={2.5} />
              </AreaChart>
            )}
          </ChartViewport>
        )}
      </CardContent>
    </Card>
  );
}

export function CashflowAreaChart({
  data,
  currency = "RUB",
  language = "ru-RU",
  title = "Доходы и расходы",
  description = "Тренд доходов и расходов по времени",
}: {
  data: TrendPoint[];
  currency?: SupportedCurrency;
  language?: string;
  title?: string;
  description?: string;
}) {
  return (
    <Card className="panel-highlight min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-72 min-w-0 px-3 pb-5 sm:px-6">
        {data.length === 0 ? (
          <EmptyChartState message="Здесь появится сравнение доходов и расходов после первых операций." />
        ) : (
          <ChartViewport>
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={data} margin={{ left: 8, right: 6, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#ffd47a" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="#ffd47a" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#ff8a00" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#ff8a00" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  tickFormatter={(value) => formatCompactCurrency(value, currency, language)}
                />
                <Tooltip content={<CurrencyTooltip currency={currency} language={language} />} />
                <Area type="monotone" dataKey="income" name="Доходы" stroke="#ffd47a" fill="url(#incomeGradient)" strokeWidth={2.25} />
                <Area type="monotone" dataKey="expense" name="Расходы" stroke="#ff8a00" fill="url(#expenseGradient)" strokeWidth={2.25} />
              </AreaChart>
            )}
          </ChartViewport>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryDonutChart({
  data,
  currency = "RUB",
  language = "ru-RU",
  title = "Структура категорий",
  description = "Распределение расходов по категориям",
}: {
  data: CategorySlice[];
  currency?: SupportedCurrency;
  language?: string;
  title?: string;
  description?: string;
}) {
  const legendItems = data.slice(0, 6);

  return (
    <Card className="panel-highlight min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="h-56 min-w-0 sm:h-64">
          {data.length === 0 ? (
            <EmptyChartState message="Диаграмма появится, когда появятся первые расходные категории." />
          ) : (
            <ChartViewport>
              {({ width, height }) => {
                const chartSize = Math.max(0, Math.min(width, height));
                const outerRadius = Math.max(58, Math.min(94, Math.floor((chartSize - 20) / 2)));
                const innerRadius = Math.max(38, outerRadius - 26);

                return (
                  <PieChart width={width} height={height}>
                    <Tooltip content={<CurrencyTooltip currency={currency} language={language} />} />
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={innerRadius}
                      outerRadius={outerRadius}
                      paddingAngle={3}
                      stroke="rgba(12,10,9,0.92)"
                      strokeWidth={2}
                    >
                      {data.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                );
              }}
            </ChartViewport>
          )}
        </div>

        <div className="min-w-0 space-y-3 lg:max-h-64 lg:overflow-y-auto lg:pr-1">
          {legendItems.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <div className="min-w-0 flex items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">{entry.name}</p>
                  <p className="text-xs text-zinc-500">{entry.change}% от нагрузки</p>
                </div>
              </div>
              <p className="shrink-0 text-sm text-zinc-100">{formatCompactCurrency(entry.value, currency, language)}</p>
            </div>
          ))}

          {data.length > legendItems.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-500">
              Еще категорий: {data.length - legendItems.length}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function WeeklyComparisonChart({
  data,
  currency = "RUB",
  language = "ru-RU",
  title = "Сравнение по неделям",
  description = "Доходы и расходы по неделям",
}: {
  data: WeeklyPoint[];
  currency?: SupportedCurrency;
  language?: string;
  title?: string;
  description?: string;
}) {
  const chartData = data.map((point) => ({
    ...point,
    incomeBar: point.income > 0 ? point.income : null,
    expenseBar: point.expense > 0 ? point.expense : null,
  }));

  return (
    <Card className="panel-highlight min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 px-3 pb-5 sm:px-6">
        {data.length === 0 ? (
          <div className="h-72">
            <EmptyChartState message="После накопления недельной истории здесь появится сравнение периодов." />
          </div>
        ) : (
          <div className="h-72">
            <ChartViewport>
              {({ width, height }) => (
                <BarChart
                  width={width}
                  height={height}
                  data={chartData}
                  barCategoryGap="34%"
                  barGap={8}
                  margin={{ left: 8, right: 6, top: 8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={72}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                    tickFormatter={(value) => formatCompactCurrency(value, currency, language)}
                  />
                  <Tooltip cursor={false} content={<CurrencyTooltip currency={currency} language={language} />} />
                  <Bar
                    dataKey="incomeBar"
                    name="Доходы"
                    fill="#ffd47a"
                    radius={[14, 14, 0, 0]}
                    activeBar={false}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="expenseBar"
                    name="Расходы"
                    fill="#ff8a00"
                    radius={[14, 14, 0, 0]}
                    activeBar={false}
                    maxBarSize={24}
                  />
                </BarChart>
              )}
            </ChartViewport>
          </div>
        )}
        <ChartLegend
          items={[
            { label: "Доходы", color: "#ffd47a" },
            { label: "Расходы", color: "#ff8a00" },
          ]}
        />
      </CardContent>
    </Card>
  );
}

export function GoalRing({
  value,
  color,
  label,
  amount,
}: {
  value: number;
  color: string;
  label: string;
  amount: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div className="flex min-w-0 items-center gap-4">
      <div
        className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${normalized}%, rgba(255,255,255,0.08) ${normalized}% 100%)`,
        }}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#090806] text-sm font-semibold text-zinc-50">
          {Math.round(normalized)}%
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-zinc-400">{label}</p>
        <p className="truncate text-lg font-semibold text-zinc-50">{amount}</p>
      </div>
    </div>
  );
}

export function InsightSpark({
  title,
  value,
  change,
  currency = "RUB",
  language = "ru-RU",
}: {
  title: string;
  value: number;
  change: string;
  currency?: SupportedCurrency;
  language?: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-50">{formatCurrency(value, currency, language)}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--accent-soft)]">{change}</p>
    </div>
  );
}

export function ForecastChip({ label, date }: { label: string; date: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-sm text-zinc-300">{label}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
        {format(new Date(date), "dd MMM yyyy", { locale: ru })}
      </p>
    </div>
  );
}
