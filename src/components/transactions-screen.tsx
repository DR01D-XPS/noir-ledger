"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Plus, ReceiptText, SlidersHorizontal, Trash2 } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BankStatementDialog } from "@/components/bank-statement-dialog";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { getDisplayCurrency } from "@/lib/currency";
import { categoryPresetsByType } from "@/lib/presets";
import { ReceiptDraft, TransactionFormValues, TransactionType } from "@/lib/types";
import { formatCompactCurrency, formatLongDate, getCategoryIcon, renderCategoryIcon } from "@/lib/utils";

const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer", "saving"]),
  amount: z.coerce.number().positive(),
  categoryId: z.string().min(1),
  date: z.string().min(1),
  note: z.string().max(200),
});

const receiptSchema = z.object({
  total: z.coerce.number().positive(),
  transactionDate: z.string().min(1),
  categoryId: z.string().min(1),
  note: z.string().max(200),
});

const transactionTypeLabels: Record<TransactionType, string> = {
  income: "Доход",
  expense: "Расход",
  saving: "Накопление",
  transfer: "Перевод",
};

function getCategoryDescription(type: TransactionType, icon: string, name: string) {
  const preset = categoryPresetsByType[type].find((item) => item.icon === icon || item.label === name);
  return preset?.description;
}

function CategorySelectOption({
  type,
  name,
  icon,
  color,
}: {
  type: TransactionType;
  name: string;
  icon: string;
  color: string;
}) {
  const description = getCategoryDescription(type, icon, name);

  return (
    <div className="flex items-center gap-3">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/8"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {renderCategoryIcon(icon, "h-4 w-4")}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-100">{name}</span>
        {description ? <span className="block text-xs text-zinc-500">{description}</span> : null}
      </span>
    </div>
  );
}

function CategoryPickerCard({
  category,
  selected,
  onSelect,
}: {
  category: {
    id: string;
    name: string;
    kind: TransactionType;
    icon: string;
    color: string;
  };
  selected: boolean;
  onSelect: (categoryId: string) => void;
}) {
  const description = getCategoryDescription(category.kind, category.icon, category.name);

  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
        selected
          ? "border-[rgba(255,180,0,0.34)] bg-[linear-gradient(180deg,rgba(255,180,0,0.14),rgba(255,138,0,0.08))] shadow-[0_18px_36px_-26px_rgba(255,156,0,0.46)]"
          : "border-white/8 bg-white/[0.03] hover:border-[rgba(255,180,0,0.2)] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/8"
          style={{ backgroundColor: `${category.color}22`, color: category.color }}
        >
          {renderCategoryIcon(category.icon, "h-4.5 w-4.5")}
        </span>
        <span className="min-w-0">
          <span className="block font-medium text-zinc-100">{category.name}</span>
          {description ? <span className="mt-1 block text-sm leading-6 text-zinc-500">{description}</span> : null}
        </span>
      </div>
    </button>
  );
}

function TransactionDialog({
  open,
  onOpenChange,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: TransactionFormValues | null;
}) {
  const { state, saveTransaction } = useFinance();
  const form = useForm<z.input<typeof transactionSchema>, unknown, z.output<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialValues?.type ?? "expense",
      amount: initialValues?.amount ?? 0,
      categoryId: initialValues?.categoryId ?? "",
      date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
      note: initialValues?.note ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      type: initialValues?.type ?? "expense",
      amount: initialValues?.amount ?? 0,
      categoryId:
        initialValues?.categoryId ?? state?.categories.find((item) => item.kind === "expense")?.id ?? "",
      date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
      note: initialValues?.note ?? "",
    });
  }, [form, initialValues, state?.categories]);

  const transactionType = useWatch({
    control: form.control,
    name: "type",
  });
  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });
  const categories = state?.categories.filter((item) => item.kind === transactionType) ?? [];
  const selectedCategory = categories.find((item) => item.id === selectedCategoryId) ?? null;
  const displayCurrency = state ? getDisplayCurrency(state.profile) : "RUB";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialValues?.id ? "Редактировать операцию" : "Новая операция"}</DialogTitle>
          <DialogDescription>
            Укажи сумму в валюте отображения, выбери категорию и при необходимости добавь комментарий.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await saveTransaction({
                id: initialValues?.id,
                ...values,
              } satisfies TransactionFormValues);
              toast.success(initialValues?.id ? "Операция обновлена." : "Операция добавлена.");
              onOpenChange(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Не удалось сохранить операцию.");
            }
          })}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,0.7fr)]">
            <div className="space-y-2">
              <Label>Тип операции</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value as TransactionType);
                      const currentCategoryId = form.getValues("categoryId");
                      const canKeepCurrentCategory = state?.categories.some(
                        (item) => item.kind === value && item.id === currentCategoryId,
                      );
                      const fallbackCategory = state?.categories.find((item) => item.kind === value)?.id ?? "";
                      form.setValue("categoryId", canKeepCurrentCategory ? currentCategoryId : fallbackCategory, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Доход</SelectItem>
                      <SelectItem value="expense">Расход</SelectItem>
                      <SelectItem value="saving">Накопление</SelectItem>
                      <SelectItem value="transfer">Перевод</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Сумма ({displayCurrency})</Label>
              <Input type="number" step="0.01" {...form.register("amount")} />
            </div>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input type="date" {...form.register("date")} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Категория</Label>
              {selectedCategory ? (
                <Badge variant="muted" className="max-w-full">
                  {selectedCategory.name}
                </Badge>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <CategoryPickerCard
                  key={category.id}
                  category={category}
                  selected={category.id === selectedCategoryId}
                  onSelect={(categoryId) => {
                    form.setValue("categoryId", categoryId, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              className="min-h-24"
              {...form.register("note")}
              placeholder="Например: оплата проекта, аренда, перевод в резерв"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptReviewDialog({
  open,
  onOpenChange,
  draft,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ReceiptDraft | null;
  onConfirm: (draft: ReceiptDraft) => Promise<void>;
}) {
  const { state } = useFinance();
  const form = useForm<z.input<typeof receiptSchema>, unknown, z.output<typeof receiptSchema>>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      total: draft?.total ?? 0,
      transactionDate: draft?.transactionDate ?? new Date().toISOString().slice(0, 10),
      categoryId: draft?.categoryId ?? "",
      note: draft?.note ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      total: draft?.total ?? 0,
      transactionDate: draft?.transactionDate ?? new Date().toISOString().slice(0, 10),
      categoryId: draft?.categoryId ?? "",
      note: draft?.note ?? "",
    });
  }, [draft, form]);

  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });

  if (!draft || !state) {
    return null;
  }

  const displayCurrency = getDisplayCurrency(state.profile);
  const receiptCategories = state.categories.filter((category) => category.kind === "expense");
  const selectedCategory = receiptCategories.find((item) => item.id === selectedCategoryId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Чек распознан</DialogTitle>
          <DialogDescription>
            Проверь сумму, дату и категорию. После подтверждения расход сразу появится в ленте и аналитике.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onConfirm({
              ...draft,
              total: values.total,
              transactionDate: values.transactionDate,
              categoryId: values.categoryId,
              categoryName:
                state.categories.find((category) => category.id === values.categoryId)?.name ?? draft.categoryName,
              note: values.note,
            });
          })}
        >
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
            <p className="text-sm text-zinc-400">Продавец</p>
            <p className="mt-1 font-medium text-zinc-100">{draft.merchant}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Уверенность {Math.round(draft.confidence * 100)}%
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Сумма ({displayCurrency})</Label>
              <Input type="number" step="0.01" {...form.register("total")} />
            </div>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input type="date" {...form.register("transactionDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Категория</Label>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-14">
                    {selectedCategory ? (
                      <CategorySelectOption
                        type={selectedCategory.kind}
                        name={selectedCategory.name}
                        icon={selectedCategory.icon}
                        color={selectedCategory.color}
                      />
                    ) : (
                      <SelectValue placeholder="Выбери категорию" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-h-[22rem]">
                    {receiptCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <CategorySelectOption
                          type={category.kind}
                          name={category.name}
                          icon={category.icon}
                          color={category.color}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea {...form.register("note")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
            <Button type="submit">
              <ReceiptText className="h-4 w-4" />
              Добавить расход
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение чека."));
    reader.readAsDataURL(file);
  });
}

export function TransactionsScreen() {
  const { state, deleteTransaction, scanReceipt, ingestReceipt, scanningReceipt } = useFinance();
  const [renderNow] = useState(() => Date.now());
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("90");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionFormValues | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft | null>(null);
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!state) {
    return null;
  }

  const displayCurrency = getDisplayCurrency(state.profile);
  const transactions = [...state.transactions].sort((left, right) => right.date.localeCompare(left.date));

  const filtered = transactions.filter((transaction) => {
    const days = Number(rangeFilter);
    const diff = (renderNow - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24);

    if (diff > days) {
      return false;
    }
    if (typeFilter !== "all" && transaction.type !== typeFilter) {
      return false;
    }
    if (categoryFilter !== "all" && transaction.categoryId !== categoryFilter) {
      return false;
    }

    return true;
  });

  const totals = filtered.reduce(
    (accumulator, transaction) => {
      if (transaction.type === "income") accumulator.income += transaction.amount;
      if (transaction.type === "expense") accumulator.expense += transaction.amount;
      if (transaction.type === "saving") accumulator.saving += transaction.amount;
      return accumulator;
    },
    { income: 0, expense: 0, saving: 0 },
  );

  async function handleReceiptFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const draft = await scanReceipt({
        imageDataUrl,
        fileName: file.name,
      });
      setReceiptDraft(draft);
      setReceiptDialogOpen(true);
      toast.success("Чек распознан, проверь данные перед сохранением.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось обработать чек.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="panel-highlight overflow-hidden">
          <CardContent className="p-6 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Операции</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                  Контролируй доходы, расходы и чековый поток без лишних экранов.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                  Можно вносить операции вручную или загрузить чек: AI распознает сумму, дату и категорию, после
                  чего расход сразу попадет в аналитику.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptFileChange}
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={scanningReceipt}>
                  <ReceiptText className="h-4 w-4" />
                  {scanningReceipt ? "Сканируем чек..." : "Сканировать чек"}
                </Button>
                <Button variant="secondary" onClick={() => setStatementDialogOpen(true)}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Импорт выписки
                </Button>
                <Button
                  onClick={() => {
                    setEditingTransaction(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Добавить операцию
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {[
            ["Доходы", totals.income, "Все поступления в выбранном периоде"],
            ["Расходы", totals.expense, "Текущая нагрузка по тратам"],
            ["Накопления", totals.saving, "Сумма, переведенная в цели"],
          ].map(([label, amount, note]) => (
            <Card key={label} className="panel-highlight">
              <CardContent className="p-5">
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-zinc-50">
                  {formatCompactCurrency(amount as number, displayCurrency, state.profile.language)}
                </p>
                <p className="mt-2 text-sm text-zinc-500">{note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <Card className="panel-highlight xl:sticky xl:top-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--accent-soft)]" />
              Фильтры
            </CardTitle>
            <CardDescription>Фильтрация по типу, периоду и категории.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <div className="flex flex-wrap gap-2">
                {(["all", "income", "expense", "saving", "transfer"] as const).map((item) => (
                  <Button
                    key={item}
                    variant={typeFilter === item ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setTypeFilter(item)}
                  >
                    {item === "all" ? "Все" : transactionTypeLabels[item]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Период</Label>
              <Select value={rangeFilter} onValueChange={setRangeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Последние 30 дней</SelectItem>
                  <SelectItem value="90">Последние 90 дней</SelectItem>
                  <SelectItem value="180">Последние 6 месяцев</SelectItem>
                  <SelectItem value="365">Последний год</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {state.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-highlight overflow-hidden">
          <CardHeader className="border-b border-white/8 bg-white/[0.02]">
            <CardTitle>Лента операций</CardTitle>
            <CardDescription>
              {filtered.length === 0
                ? "В выбранном срезе пока нет операций."
                : `${filtered.length} операций в текущем фильтре.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {filtered.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/8 bg-white/[0.02] px-5 py-10 text-center">
                <p className="text-lg font-medium text-zinc-100">В этом срезе пока нет операций</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Измени фильтры, добавь операцию вручную или загрузи чек.
                </p>
              </div>
            ) : (
              <div className="space-y-4 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-1">
                {filtered.map((transaction) => {
                  const category = state.categories.find((item) => item.id === transaction.categoryId);
                  const Icon = getCategoryIcon(category?.icon ?? "wallet");
                  const tone =
                    transaction.type === "expense"
                      ? "text-red-200"
                      : transaction.type === "income"
                        ? "text-emerald-200"
                        : "text-[var(--accent-soft)]";

                  return (
                    <Card key={transaction.id} className="panel-highlight">
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-[var(--accent-soft)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium text-zinc-100">{category?.name ?? "Категория"}</p>
                              <Badge variant="muted">{transactionTypeLabels[transaction.type]}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-zinc-500">
                              {transaction.note || "Без комментария"} · {formatLongDate(transaction.date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:items-end">
                          <p className={`text-lg font-semibold ${tone}`}>
                            {transaction.type === "expense" ? "-" : "+"}
                            {formatCompactCurrency(transaction.amount, displayCurrency, state.profile.language)}
                          </p>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingTransaction({
                                  id: transaction.id,
                                  type: transaction.type,
                                  amount: transaction.amount,
                                  categoryId: transaction.categoryId,
                                  date: transaction.date.slice(0, 10),
                                  note: transaction.note,
                                });
                                setDialogOpen(true);
                              }}
                            >
                              Изменить
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                try {
                                  await deleteTransaction(transaction.id);
                                  toast.success("Операция удалена.");
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : "Не удалось удалить операцию.");
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} initialValues={editingTransaction} />
      <BankStatementDialog open={statementDialogOpen} onOpenChange={setStatementDialogOpen} />
      <ReceiptReviewDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        draft={receiptDraft}
        onConfirm={async (draft) => {
          try {
            await ingestReceipt(draft);
            setReceiptDialogOpen(false);
            setReceiptDraft(null);
            toast.success("Расход по чеку добавлен.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Не удалось сохранить чек.");
          }
        }}
      />
    </div>
  );
}
