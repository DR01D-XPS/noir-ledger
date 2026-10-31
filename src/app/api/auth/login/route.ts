import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCAL_SESSION_COOKIE, loginLocalAccount } from "@/lib/local-store";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const result = await loginLocalAccount(payload.email, payload.password);

    const response = NextResponse.json({
      user: result.user,
    });

    response.cookies.set(LOCAL_SESSION_COOKIE, result.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Проверь email и пароль."
        : error instanceof Error
          ? error.message
          : "Не удалось выполнить вход.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
