import { NextResponse } from "next/server";
import { parseReceipt } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const draft = await parseReceipt(payload);
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Не удалось распознать чек.",
      },
      { status: 500 },
    );
  }
}
