import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LOCAL_SESSION_COOKIE, getLocalUserBySession } from "@/lib/local-store";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
  const user = await getLocalUserBySession(sessionId);

  return NextResponse.json({
    user,
  });
}
