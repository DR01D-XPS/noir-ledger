import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCAL_SESSION_COOKIE, registerLocalAccount } from "@/lib/local-store";

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const result = await registerLocalAccount(payload.fullName, payload.email, payload.password);

    const response = NextResponse.json({
      user: result.user,
      requiresEmailConfirmation: false,
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
        ? "Проверь введённые данные."
        : error instanceof Error
          ? error.message
          : "Не удалось создать аккаунт.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
