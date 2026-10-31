"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PiggyBank, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GoalRing } from "@/components/charts";
import { PresetPicker } from "@/components/preset-picker";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { getDisplayCurrency } from "@/lib/currency";
import { buildGoalAllocationPlan, getGoalPriorityMeta, getProjectedGoalDate } from "@/lib/finance";
import { findGoalPreset, goalPresets } from "@/lib/presets";
import { ContributionFormValues, GoalFormValues, GoalPriority, SavingsGoal } from "@/lib/types";
import { formatCompactCurrency, formatLongDate, getCategoryIcon, renderCategoryIcon } from "@/lib/utils";

const goalSchema = z.object({
  title: z.string().min(2),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0),
  deadline: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
  presetId: z.string().min(2),
  note: z.string().max(240),
});

const contributionSchema = z.object({
  goalId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string().min(1),
  note: z.string().max(200),
});

const priorityOptions: Array<{ value: GoalPriority; label: string; description: string }> = [
  { value: "high", label: "Высокий", description: "Срочно или действительно важно" },
  { value: "medium", label: "Средний", description: "Нормальный рабочий приоритет" },
  { value: "low", label: "Гибкий", description: "Можно двигать мягче и спокойнее" },
];

function GoalDialog({
  open,
  onOpenChange,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: SavingsGoal | null;
}) {
  const { saveGoal } = useFinance();
  const form = useForm<z.input<typeof goalSchema>, unknown, z.output<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: new Date().toISOString().slice(0, 10),
      priority: "medium",
      presetId: goalPresets[0].id,
      note: "",
    },
  });

  useEffect(() => {
    const matchedPreset =
      goalPresets.find(
        (preset) => preset.icon === initialValues?.icon && preset.color === initialValues?.color,
      ) ?? goalPresets[0];

    form.reset({
      title: initialValues?.title ?? "",
      targetAmount: initialValues?.targetAmount ?? 0,
      currentAmount: initialValues?.currentAmount ?? 0,
      deadline: initialValues?.deadline.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      priority: initialValues?.priority ?? "medium",
      presetId: matchedPreset.id,
      note: initialValues?.note ?? "",
    });
  }, [form, initialValues]);

  const selectedPresetId = useWatch({
    control: form.control,
    name: "presetId",
  });
  const selectedPreset = findGoalPreset(selectedPresetId ?? goalPresets[0].id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialValues ? "Редактировать цель" : "Новая цель накопления"}</DialogTitle>
          <DialogDescription>Название, сумма, срок, приоритет и готовый стиль в одном окне.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await saveGoal({
                id: initialValues?.id,
                title: values.title,
                targetAmount: values.targetAmount,
                currentAmount: values.currentAmount,
                deadline: values.deadline,
                priority: values.priority,
                color: selectedPreset.color,
                icon: selectedPreset.icon,
                note: values.note,
              } satisfies GoalFormValues);
              toast.success(initialValues ? "Цель обновлена." : "Цель создана.");
              onOpenChange(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Не удалось сохранить цель.");
            }
          })}
        >
          <div className="space-y-2">
            <Label>Название</Label>
            <Input {...form.register("title")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Целевая сумма</Label>
              <Input type="number" step="0.01" {...form.register("targetAmount")} />
            </div>
            <div className="space-y-2">
              <Label>Уже накоплено</Label>
              <Input type="number" step="0.01" {...form.register("currentAmount")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Срок</Label>
              <Input type="date" {...form.register("deadline")} />
            </div>
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Стиль цели</Label>
            <Controller
              control={form.control}
              name="presetId"
              render={({ field }) => (
                <PresetPicker options={goalPresets} value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl"
                style={{ backgroundColor: `${selectedPreset.color}26`, color: selectedPreset.color }}
              >
                {renderCategoryIcon(selectedPreset.icon, "h-5 w-5")}
              </span>
              <div>
                <p className="font-medium text-zinc-100">{selectedPreset.label}</p>
                <p className="text-sm text-zinc-500">{selectedPreset.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea {...form.register("note")} />
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

function ContributionDialog({
  open,
  onOpenChange,
  goalId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string | null;
}) {
  const { contributeToGoal } = useFinance();
  const form = useForm<z.input<typeof contributionSchema>, unknown, z.output<typeof contributionSchema>>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      goalId: goalId ?? "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: "",
    },
  });

  useEffect(() => {
    form.reset({
      goalId: goalId ?? "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
  }, [form, goalId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Пополнить цель</DialogTitle>
          <DialogDescription>Быстро добавь вклад и обнови прогноз достижения.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await contributeToGoal(values satisfies ContributionFormValues);
              toast.success("Пополнение добавлено.");
              onOpenChange(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Не удалось добавить пополнение.");
            }
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Сумма</Label>
              <Input type="number" step="0.01" {...form.register("amount")} />
            </div>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input type="date" {...form.register("date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea {...form.register("note")} placeholder="Например: часть зарплаты или премии" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Пополнить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GoalsScreen() {
  const { state, deleteGoal, saveProfile } = useFinance();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState<string | null>(null);

  const allocationPlan = useMemo(
    () => (state ? buildGoalAllocationPlan(state.goals, state.profile.monthlySavingsBudget) : []),
    [state],
  );

  if (!state) {
    return null;
  }

  const allocationByGoalId = new Map(allocationPlan.map((item) => [item.id, item]));
  const displayCurrency = getDisplayCurrency(state.profile);
  const budgetValue = budgetDraft ?? String(state.profile.monthlySavingsBudget ?? 0);
  const totalTarget = state.goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrent = state.goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const orderedGoals = [...state.goals].sort((left, right) => {
    const leftWeight = getGoalPriorityMeta(left.priority ?? "medium").weight;
    const rightWeight = getGoalPriorityMeta(right.priority ?? "medium").weight;

    if (leftWeight !== rightWeight) {
      return rightWeight - leftWeight;
    }

    return new Date(left.deadline).getTime() - new Date(right.deadline).getTime();
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="panel-highlight overflow-hidden">
          <CardContent className="p-6 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Цели накопления</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                  Один бюджет накоплений сам распределяется по важности и срокам целей.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                  Ты задаешь общий ежемесячный резерв на накопления, а приложение предлагает, сколько логично
                  направлять в каждую цель с учетом дедлайна, приоритета и остатка до нужной суммы.
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingGoal(null);
                  setGoalDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Добавить цель
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="panel-highlight">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Общий объем целей</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-50">
                {formatCompactCurrency(totalTarget, displayCurrency, state.profile.language)}
              </p>
              <p className="mt-2 text-sm text-zinc-500">Сумма всех финансовых целей вместе.</p>
            </CardContent>
          </Card>
          <Card className="panel-highlight">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Уже накоплено</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-50">
                {formatCompactCurrency(totalCurrent, displayCurrency, state.profile.language)}
              </p>
              <p className="mt-2 text-sm text-zinc-500">Текущий фактический прогресс по целям.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="panel-highlight">
        <CardContent className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Единый бюджет накоплений</p>
            <p className="text-sm leading-7 text-zinc-400">
              Укажи, сколько ты готов откладывать в месяц. План по целям пересоберется автоматически.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[220px_auto]">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={budgetValue}
              onChange={(event) => setBudgetDraft(event.target.value)}
            />
            <Button
              onClick={async () => {
                try {
                  await saveProfile({
                    monthlySavingsBudget: Number(budgetValue || 0),
                  });
                  setBudgetDraft(null);
                  toast.success("Бюджет накоплений сохранен.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Не удалось сохранить бюджет накоплений.");
                }
              }}
            >
              Сохранить бюджет
            </Button>
          </div>
        </CardContent>
      </Card>

      {state.goals.length === 0 ? (
        <Card className="panel-highlight">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-medium text-zinc-100">Целей пока нет</p>
            <p className="mt-2 text-sm text-zinc-500">
              Создай первую цель, чтобы увидеть прогноз, приоритет и автоматическое распределение бюджета.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          {orderedGoals.map((goal) => {
            const progress = Number(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1));
            const projectedDate = getProjectedGoalDate(goal, state.contributions);
            const plan = allocationByGoalId.get(goal.id);
            const priorityMeta = getGoalPriorityMeta(goal.priority ?? "medium");
            const GoalIcon = getCategoryIcon(goal.icon);
            const recommendedAmount = plan?.recommendedMonthlyAmount ?? 0;
            const requiredAmount = plan?.requiredMonthlyAmount ?? 0;
            const budgetPressure = Math.max(requiredAmount - recommendedAmount, 0);

            return (
              <Card key={goal.id} className="panel-highlight h-full">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <GoalRing
                      value={progress}
                      color={goal.color}
                      label={goal.title}
                      amount={formatCompactCurrency(goal.currentAmount, displayCurrency, state.profile.language)}
                    />
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                        style={{ backgroundColor: `${goal.color}24`, color: goal.color }}
                      >
                        <GoalIcon className="h-5 w-5" />
                      </span>
                      <Badge variant="muted" className={priorityMeta.accent}>
                        {priorityMeta.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span>Цель {formatCompactCurrency(goal.targetAmount, displayCurrency, state.profile.language)}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-sm text-zinc-400">Срок</p>
                      <p className="mt-1 font-medium text-zinc-100">{formatLongDate(goal.deadline)}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-sm text-zinc-400">Прогноз по темпу</p>
                      <p className="mt-1 font-medium text-zinc-100">{formatLongDate(projectedDate)}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-sm text-zinc-400">Рекомендуем в месяц</p>
                      <p className="mt-1 font-medium text-zinc-100">
                        {formatCompactCurrency(recommendedAmount, displayCurrency, state.profile.language)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {plan?.share ? `${plan.share}% общего бюджета накоплений` : "План пока не распределен"}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <p className="text-sm text-zinc-400">Нужно по сроку</p>
                      <p className="mt-1 font-medium text-zinc-100">
                        {formatCompactCurrency(requiredAmount, displayCurrency, state.profile.language)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {budgetPressure > 0
                          ? `Не хватает ${formatCompactCurrency(budgetPressure, displayCurrency, state.profile.language)} в месяц`
                          : "Бюджета достаточно для текущего срока"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <p className="text-sm leading-7 text-zinc-400">
                      {goal.note || "Комментарий по цели пока не добавлен."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setActiveGoalId(goal.id);
                        setContributionDialogOpen(true);
                      }}
                    >
                      <PiggyBank className="h-4 w-4" />
                      Пополнить
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingGoal(goal);
                        setGoalDialogOpen(true);
                      }}
                    >
                      Изменить
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await deleteGoal(goal.id);
                          toast.success("Цель удалена.");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Не удалось удалить цель.");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} initialValues={editingGoal} />
      <ContributionDialog
        open={contributionDialogOpen}
        onOpenChange={setContributionDialogOpen}
        goalId={activeGoalId}
      />
    </div>
  );
}
