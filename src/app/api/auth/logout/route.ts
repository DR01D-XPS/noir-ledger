import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LOCAL_SESSION_COOKIE, removeLocalSession } from "@/lib/local-store";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
  await removeLocalSession(sessionId);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCAL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
