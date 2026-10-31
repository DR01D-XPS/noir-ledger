import { NextResponse } from "next/server";
import { generateFinanceInsights } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await generateFinanceInsights(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Не удалось сгенерировать рекомендации.",
      },
      { status: 500 },
    );
  }
}
