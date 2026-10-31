"use client";

import { AppUser, RuntimeMode } from "@/lib/types";

export interface SignUpResult {
  user: AppUser;
  requiresEmailConfirmation: boolean;
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as T & { error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Не удалось выполнить запрос.");
  }

  return payload as T;
}

export function resolveRuntimeMode(): RuntimeMode {
  return "demo";
}

export async function getCurrentUser(mode: RuntimeMode) {
  void mode;

  const payload = await readJson<{ user: AppUser | null }>("/api/auth/session", {
    method: "GET",
  });

  return payload.user;
}

export async function signInWithPassword(
  mode: RuntimeMode,
  email: string,
  password: string,
) {
  void mode;

  const payload = await readJson<{ user: AppUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return payload.user;
}

export async function signUpWithPassword(
  mode: RuntimeMode,
  fullName: string,
  email: string,
  password: string,
): Promise<SignUpResult> {
  void mode;

  return readJson<SignUpResult>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName,
      email,
      password,
    }),
  });
}

export async function resetPassword(mode: RuntimeMode, email: string) {
  void mode;
  void email;
  throw new Error("Восстановление пароля пока не подключено. Используй обычный вход email и пароль.");
}

export async function signOut(mode: RuntimeMode) {
  void mode;

  await readJson<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}
