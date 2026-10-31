"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SiteBrand } from "@/components/site-brand";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui";

type AuthVariant = "login" | "register" | "forgot";

const copyByVariant: Record<
  AuthVariant,
  {
    title: string;
    description: string;
    headline: string;
    body: string;
  }
> = {
  login: {
    title: "Вход",
    description: "Открой свой кабинет и продолжай с любого устройства.",
    headline: "Деньги, цели и история операций в одном пространстве.",
    body: "Один аккаунт хранит твои операции, накопления, категории, чеки и переписку с финансовым ассистентом в одном интерфейсе.",
  },
  register: {
    title: "Создать аккаунт",
    description: "Только имя, email и пароль. Остальное настроишь уже внутри.",
    headline: "Чистый старт для личного финансового кабинета.",
    body: "Новый аккаунт создается без тестовых операций и без лишних подсказок. После регистрации ты получаешь пустой, аккуратный кабинет, готовый под твою реальную историю.",
  },
  forgot: {
    title: "Восстановить доступ",
    description: "Отправим письмо для смены пароля на указанный email.",
    headline: "Верни доступ и продолжай с того же места.",
    body: "После подтверждения письма можно будет задать новый пароль и снова войти в свой кабинет.",
  },
};

export function AuthScreen({ variant }: { variant: AuthVariant }) {
  const router = useRouter();
  const { signIn, signUp, resetUserPassword, status } = useAuth();
  const copy = copyByVariant[variant];

  const schema = z
    .object({
      fullName: z.string(),
      email: z.string().email("Укажи корректный email."),
      password: z.string(),
    })
    .superRefine((values, context) => {
      if (variant === "register" && values.fullName.trim().length < 2) {
        context.addIssue({
          code: "custom",
          path: ["fullName"],
          message: "Имя должно содержать минимум 2 символа.",
        });
      }

      if (variant !== "forgot" && values.password.length < 6) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Пароль должен быть не короче 6 символов.",
        });
      }
    });

  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  async function onSubmit(values: z.output<typeof schema>) {
    try {
      if (variant === "login") {
        await signIn(values.email, values.password);
        toast.success("Вход выполнен.");
        router.replace("/dashboard");
        return;
      }

      if (variant === "register") {
        const result = await signUp(values.fullName, values.email, values.password);
        if (result.requiresEmailConfirmation) {
          toast.success("Аккаунт создан. Подтверди email и затем войди.");
          router.replace("/login");
          return;
        }

        toast.success("Аккаунт создан.");
        router.replace("/dashboard");
        return;
      }

      await resetUserPassword(values.email);
      toast.success("Письмо для восстановления отправлено.");
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось завершить действие.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mesh-overlay absolute inset-0 opacity-20" />
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:px-8">
        <div className="hidden flex-col justify-between rounded-[36px] border border-white/8 bg-white/[0.03] p-10 backdrop-blur-xl lg:flex xl:p-12">
          <SiteBrand subtitle="Личный кабинет управления деньгами" />

          <div className="space-y-5">
            <h1
              className="max-w-[12ch] text-[clamp(3rem,4.8vw,5rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-zinc-50"
              style={{ textWrap: "balance" }}
            >
              {copy.headline}
            </h1>
            <p className="max-w-[36rem] text-lg leading-8 text-zinc-400">{copy.body}</p>
          </div>

          <p className="max-w-lg text-sm leading-7 text-zinc-500">
            Noir Ledger синхронизирует операции, категории, цели и AI-анализ в одном аккаунте на телефоне, планшете и компьютере.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-xl">
            <div className="mb-6 lg:hidden">
              <SiteBrand compact subtitle="Личный кабинет управления деньгами" />
            </div>

            <Card className="panel-highlight w-full overflow-hidden">
              <CardHeader className="border-b border-white/8 bg-white/[0.03]">
                <CardTitle className="text-3xl">{copy.title}</CardTitle>
                <CardDescription className="max-w-lg">{copy.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {variant === "register" ? (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Имя</Label>
                      <Input id="fullName" {...form.register("fullName")} />
                      {form.formState.errors.fullName ? (
                        <p className="text-sm text-red-300">{form.formState.errors.fullName.message}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
                    {form.formState.errors.email ? (
                      <p className="text-sm text-red-300">{form.formState.errors.email.message}</p>
                    ) : null}
                  </div>

                  {variant !== "forgot" ? (
                    <div className="space-y-2">
                      <Label htmlFor="password">Пароль</Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete={variant === "login" ? "current-password" : "new-password"}
                        {...form.register("password")}
                      />
                      {form.formState.errors.password ? (
                        <p className="text-sm text-red-300">{form.formState.errors.password.message}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <Button type="submit" size="lg" className="mt-2 w-full">
                    {variant === "login"
                      ? "Войти"
                      : variant === "register"
                        ? "Создать аккаунт"
                        : "Отправить письмо"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                  {variant === "login" ? (
                    <Link href="/register" className="hover:text-zinc-100">
                      Нет аккаунта? Создать
                    </Link>
                  ) : null}
                  {variant === "register" ? (
                    <Link href="/login" className="hover:text-zinc-100">
                      Уже есть аккаунт? Войти
                    </Link>
                  ) : null}
                  {variant === "forgot" ? (
                    <Link href="/login" className="hover:text-zinc-100">
                      Назад ко входу
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
