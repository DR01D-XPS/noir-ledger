"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Languages, Palette, Settings2, UserRound, WalletCards } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PresetPicker } from "@/components/preset-picker";
import { useAuth } from "@/components/providers/auth-provider";
import { useFinance } from "@/components/providers/finance-provider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { supportedCurrencies } from "@/lib/currency";
import { categoryPresetsByType, findCategoryPreset } from "@/lib/presets";
import { ProfileFormValues } from "@/lib/types";
import { getCategoryIcon, renderCategoryIcon } from "@/lib/utils";

const profileSchema = z.object({
  fullName: z.string().min(2, "Укажи имя."),
  displayCurrency: z.enum(["RUB", "USD", "EUR", "GBP", "CNY", "AED"]),
  language: z.string().min(2),
});

const categorySchema = z.object({
  name: z.string().min(2, "Название слишком короткое."),
  kind: z.enum(["income", "expense", "transfer", "saving"]),
  presetId: z.string().min(2),
});

function PresetGlyph({
  icon,
  color,
}: {
  icon: string;
  color: string;
}) {
  return (
    <span
      className="grid h-12 w-12 place-items-center rounded-2xl border border-white/8"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {renderCategoryIcon(icon, "h-5 w-5")}
    </span>
  );
}

export function SettingsScreen() {
  const { user } = useAuth();
  const { state, saveProfile, saveCategory } = useFinance();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      displayCurrency: "RUB",
      language: "ru-RU",
    },
  });

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      kind: "expense",
      presetId: categoryPresetsByType.expense[0].id,
    },
  });

  const categoryKind = useWatch({
    control: categoryForm.control,
    name: "kind",
  });
  const presetId = useWatch({
    control: categoryForm.control,
    name: "presetId",
  });
  const activePreset = findCategoryPreset(
    categoryKind ?? "expense",
    presetId ?? categoryPresetsByType.expense[0].id,
  );

  useEffect(() => {
    if (!state) {
      return;
    }

    profileForm.reset({
      fullName: state.profile.fullName,
      displayCurrency: state.profile.displayCurrency,
      language: state.profile.language,
    });
  }, [profileForm, state]);

  useEffect(() => {
    const nextPreset = categoryPresetsByType[categoryKind ?? "expense"][0];
    categoryForm.setValue("presetId", nextPreset.id);
  }, [categoryForm, categoryKind]);

  if (!state) {
    return null;
  }

  const customCategories = state.categories.filter((category) => !category.isDefault);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <Card className="panel-highlight overflow-hidden">
          <CardContent className="p-6 sm:p-7">
            <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Профиль</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Настройки без перегруза: имя, валюта и собственные категории.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
              Базовая валюта истории хранится отдельно, а валюта отображения переключается свободно. Все изменения
              сохраняются в аккаунте и одинаково отображаются на всех устройствах.
            </p>
          </CardContent>
        </Card>

        <Card className="panel-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[var(--accent-soft)]" />
              Аккаунт
            </CardTitle>
            <CardDescription>Краткая карточка текущего профиля.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-zinc-500">Email</p>
              <p className="mt-1 font-medium text-zinc-100">{user?.email ?? "не указан"}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-zinc-500">Имя</p>
              <p className="mt-1 font-medium text-zinc-100">{state.profile.fullName}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-zinc-500">Базовая валюта</p>
              <p className="mt-1 font-medium text-zinc-100">{state.profile.currency}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-zinc-500">Валюта отображения</p>
              <p className="mt-1 font-medium text-zinc-100">{state.profile.displayCurrency}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="panel-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[var(--accent-soft)]" />
              Основные настройки
            </CardTitle>
            <CardDescription>Только то, что действительно влияет на ежедневную работу.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={profileForm.handleSubmit(async (values) => {
                try {
                  await saveProfile(values);
                  toast.success("Настройки сохранены.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Не удалось сохранить настройки.");
                }
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Имя</Label>
                  <Input {...profileForm.register("fullName")} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <WalletCards className="h-4 w-4 text-zinc-500" />
                    Валюта отображения
                  </Label>
                  <Controller
                    control={profileForm.control}
                    name="displayCurrency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedCurrencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} · {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-zinc-500" />
                  Язык интерфейса
                </Label>
                <Controller
                  control={profileForm.control}
                  name="language"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru-RU">Русский</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-zinc-400">
                История хранится в <span className="font-medium text-zinc-100">{state.profile.currency}</span>, а
                витринная валюта свободно переключается без искажения прошлых записей и аналитики.
              </div>

              <Button type="submit">Сохранить настройки</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="panel-highlight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[var(--amber)]" />
                Новая категория
              </CardTitle>
              <CardDescription>
                Выбери готовую иконку и цветовой стиль, чтобы интерфейс оставался цельным.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={categoryForm.handleSubmit(async (values) => {
                  try {
                    const preset = findCategoryPreset(values.kind, values.presetId);
                    await saveCategory({
                      name: values.name,
                      kind: values.kind,
                      color: preset.color,
                      icon: preset.icon,
                    });
                    categoryForm.reset({
                      name: "",
                      kind: "expense",
                      presetId: categoryPresetsByType.expense[0].id,
                    });
                    toast.success("Категория добавлена.");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Не удалось сохранить категорию.");
                  }
                })}
              >
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input {...categoryForm.register("name")} />
                </div>

                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Controller
                    control={categoryForm.control}
                    name="kind"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Расход</SelectItem>
                          <SelectItem value="income">Доход</SelectItem>
                          <SelectItem value="saving">Накопление</SelectItem>
                          <SelectItem value="transfer">Перевод</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Иконка и стиль</Label>
                  <Controller
                    control={categoryForm.control}
                    name="presetId"
                    render={({ field }) => (
                      <PresetPicker
                        options={categoryPresetsByType[categoryKind ?? "expense"]}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <PresetGlyph icon={activePreset.icon} color={activePreset.color} />
                    <div>
                      <p className="font-medium text-zinc-100">{activePreset.label}</p>
                      <p className="text-sm text-zinc-500">{activePreset.description}</p>
                    </div>
                  </div>
                </div>

                <Button type="submit">Создать категорию</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="panel-highlight">
            <CardHeader>
              <CardTitle>Свои категории</CardTitle>
              <CardDescription>Личные категории поверх базового набора.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories.length === 0 ? (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-zinc-400">
                  Пользовательских категорий пока нет.
                </div>
              ) : (
                customCategories.map((category) => {
                  const Icon = getCategoryIcon(category.icon);

                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/8"
                          style={{ backgroundColor: `${category.color}22`, color: category.color }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-100">{category.name}</p>
                          <p className="text-sm text-zinc-500">
                            {category.kind === "expense"
                              ? "Расход"
                              : category.kind === "income"
                                ? "Доход"
                                : category.kind === "saving"
                                  ? "Накопление"
                                  : "Перевод"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="muted">{category.icon}</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
