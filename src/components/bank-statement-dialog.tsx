"use client";

import { ChangeEvent, useRef, useState } from "react";
import { FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { BankStatementEntry, parseBankStatement } from "@/lib/bank-statement";
import { getDisplayCurrency } from "@/lib/currency";
import { TransactionType } from "@/lib/types";
import { formatCompactCurrency, formatLongDate, renderCategoryIcon } from "@/lib/utils";

const typeLabels: Record<TransactionType, string> = {
  income: "Доход",
  expense: "Расход",
  saving: "Накопление",
  transfer: "Перевод",
};

function nextCategoryId(type: TransactionType, categories: Parameters<typeof parseBankStatement>[1]) {
  return categories.find((category) => category.kind === type)?.id ?? "";
}

export function BankStatementDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, importTransactions } = useFinance();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [entries, setEntries] = useState<BankStatementEntry[]>([]);
  const [fileName, setFileName] = useState("");
  const [skippedRows, setSkippedRows] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  if (!state) {
    return null;
  }

  const currentState = state;
  const displayCurrency = getDisplayCurrency(currentState.profile);
  const selectedEntries = entries.filter((entry) => entry.selected);

  function reset() {
    setEntries([]);
    setFileName("");
    setSkippedRows(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function updateEntry(id: string, patch: Partial<BankStatementEntry>) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setParsing(true);
    try {
      const result = await parseBankStatement(file, currentState.categories);
      setEntries(result.entries);
      setSkippedRows(result.skippedRows);
      setFileName(file.name);

      if (result.entries.length === 0) {
        toast.error("Не удалось найти операции в выписке.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось прочитать выписку.");
      reset();
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (selectedEntries.length === 0) {
      toast.error("Выбери хотя бы одну операцию.");
      return;
    }

    setImporting(true);
    try {
      const result = await importTransactions(
        selectedEntries.map((entry) => ({
          type: entry.type,
          amount: entry.amount,
          categoryId: entry.categoryId,
          date: entry.date,
          note: entry.note,
        })),
      );
      toast.success(
        result.skipped > 0
          ? `Добавлено: ${result.imported}. Пропущено дублей: ${result.skipped}.`
          : `Импортировано операций: ${result.imported}.`,
      );
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось импортировать выписку.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          reset();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Импорт банковской выписки</DialogTitle>
          <DialogDescription>
            Загрузи CSV или XLSX. Выписка разбирается прямо в браузере, затем можно проверить категории и исключить лишние строки.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
        />

        {entries.length === 0 ? (
          <button
            type="button"
            className="grid min-h-52 w-full place-items-center rounded-[28px] border border-dashed border-[rgba(255,180,0,0.28)] bg-[rgba(255,180,0,0.05)] p-8 text-center transition hover:bg-[rgba(255,180,0,0.09)]"
            onClick={() => inputRef.current?.click()}
            disabled={parsing}
          >
            <span className="flex flex-col items-center gap-3">
              {parsing ? <LoaderCircle className="h-7 w-7 animate-spin text-[var(--accent-soft)]" /> : <FileSpreadsheet className="h-7 w-7 text-[var(--accent-soft)]" />}
              <span className="text-base font-medium text-zinc-100">
                {parsing ? "Разбираем выписку..." : "Выбрать банковскую выписку"}
              </span>
              <span className="max-w-md text-sm leading-6 text-zinc-500">
                Поддерживаются выгрузки CSV и XLSX из банковских приложений.
              </span>
            </span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-[var(--accent-soft)]" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-100">{fileName}</p>
                  <p className="text-sm text-zinc-500">Найдено операций: {entries.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {skippedRows > 0 ? <Badge variant="muted">Пропущено строк: {skippedRows}</Badge> : null}
                <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Другой файл
                </Button>
              </div>
            </div>

            <div className="max-h-[46vh] overflow-auto rounded-[24px] border border-white/8">
              <div className="min-w-[760px] divide-y divide-white/8">
                {entries.map((entry) => {
                  const categories = currentState.categories.filter((category) => category.kind === entry.type);
                  const category = currentState.categories.find((item) => item.id === entry.categoryId);

                  return (
                    <div key={entry.id} className="grid grid-cols-[28px_120px_minmax(170px,1fr)_220px_130px] items-center gap-3 px-4 py-3">
                      <input
                        aria-label={`Импортировать строку ${entry.sourceRow}`}
                        type="checkbox"
                        checked={entry.selected}
                        onChange={(event) => updateEntry(entry.id, { selected: event.target.checked })}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <p className="text-sm text-zinc-400">{formatLongDate(entry.date)}</p>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-100">{entry.note}</p>
                        <Select
                          value={entry.type}
                          onValueChange={(value) => {
                            const type = value as TransactionType;
                            updateEntry(entry.id, {
                              type,
                              categoryId: nextCategoryId(type, currentState.categories),
                            });
                          }}
                        >
                          <SelectTrigger className="mt-1 h-8 border-0 bg-transparent px-0 text-xs text-zinc-500 shadow-none hover:bg-transparent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(typeLabels).map(([type, label]) => (
                              <SelectItem key={type} value={type}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Select value={entry.categoryId} onValueChange={(categoryId) => updateEntry(entry.id, { categoryId })}>
                        <SelectTrigger className="h-11">
                          {category ? (
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="text-[var(--accent-soft)]">{renderCategoryIcon(category.icon, "h-4 w-4")}</span>
                              <span className="truncate">{category.name}</span>
                            </span>
                          ) : (
                            <SelectValue placeholder="Категория" />
                          )}
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {categories.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className={`text-right font-semibold ${entry.type === "expense" ? "text-red-200" : "text-emerald-200"}`}>
                        {entry.type === "expense" ? "-" : "+"}
                        {formatCompactCurrency(entry.amount, displayCurrency, currentState.profile.language)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="button" disabled={selectedEntries.length === 0 || importing} onClick={handleImport}>
            {importing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Импортировать {selectedEntries.length || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
