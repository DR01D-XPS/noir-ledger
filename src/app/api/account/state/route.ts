import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  LOCAL_SESSION_COOKIE,
  getLocalUserBySession,
  loadLocalFinanceState,
  saveLocalFinanceState,
} from "@/lib/local-store";
import { FinanceState } from "@/lib/types";

const stateSchema = z.object({
  state: z.custom<FinanceState>(),
});

async function resolveCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
  return getLocalUserBySession(sessionId);
}

export async function GET() {
  const user = await resolveCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Сессия не найдена." }, { status: 401 });
  }

  const state = await loadLocalFinanceState(user);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const user = await resolveCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Сессия не найдена." }, { status: 401 });
  }

  try {
    const payload = stateSchema.parse(await request.json());
    const state = await saveLocalFinanceState(user, payload.state);
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось сохранить изменения.",
      },
      { status: 400 },
    );
  }
}
