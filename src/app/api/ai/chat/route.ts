import { NextResponse } from "next/server";
import { generateAssistantReply } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const reply = await generateAssistantReply(payload);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Не удалось получить ответ ассистента.",
      },
      { status: 500 },
    );
  }
}
