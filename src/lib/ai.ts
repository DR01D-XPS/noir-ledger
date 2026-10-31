import { env, hasOpenAiCredentials } from "@/lib/env";
import { AiInsight, AiInsightBundle, AssistantRole, ReceiptDraft } from "@/lib/types";
import { createId } from "@/lib/utils";

interface AiSummaryInput {
  user: {
    name: string;
    currency: string;
    language: string;
    monthlySavingsBudget: number;
  };
  dashboard: {
    monthIncome: number;
    monthExpense: number;
    savingsTotal: number;
    savingsRate: number;
    goalProgress: number;
    spendingByCategory: Array<{
      name: string;
      value: number;
      change: number;
    }>;
  };
  analytics: {
    patterns: Array<{
      label: string;
      description: string;
      impact: string;
      tone: "positive" | "warning" | "neutral";
    }>;
    anomalies: Array<{
      amount: number;
      note: string;
      category?: {
        name: string;
      };
    }>;
    commentHighlights: Array<{
      category: string;
      note: string;
      date: string;
      amount: number;
    }>;
    goalForecasts: Array<{
      title: string;
      priority: "high" | "medium" | "low";
      completionRate: number;
      projectedDate: string;
      recommendedMonthlyAmount: number;
      requiredMonthlyAmount: number;
      share: number;
    }>;
  };
  monthContext: {
    transactionCount: number;
    goalsCount: number;
  };
  recentTransactions: Array<{
    type: string;
    amount: number;
    date: string;
    note: string;
    category: string;
  }>;
}

interface ReceiptParsingInput {
  imageDataUrl: string;
  fileName: string;
  profile: {
    currency: string;
    language: string;
  };
  categories: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

interface AssistantChatInput {
  profile: {
    fullName?: string;
    currency: string;
    language: string;
    monthlySavingsBudget?: number;
  };
  context: {
    dashboard?: {
      monthIncome: number;
      monthExpense: number;
    };
    analytics?: {
      topCategories?: Array<{
        name: string;
      }>;
    };
    commentHighlights?: Array<{
      category: string;
      note: string;
      date: string;
      amount: number;
    }>;
    goals?: Array<{
      title: string;
      priority?: "high" | "medium" | "low";
      targetAmount?: number;
      currentAmount?: number;
      deadline?: string;
      note?: string;
    }>;
    goalPlan?: Array<{
      title: string;
      priority: "high" | "medium" | "low";
      recommendedMonthlyAmount: number;
      share: number;
    }>;
  };
  messages: Array<{
    role: AssistantRole;
    message: string;
  }>;
}

interface OpenAiResponsePayload {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

function ensureOpenAiConfigured() {
  if (!hasOpenAiCredentials) {
    throw new Error("OpenAI не настроен. Добавь OPENAI_API_KEY в переменные окружения.");
  }
}

function extractOutputText(data: OpenAiResponsePayload) {
  return (
    data.output_text ??
    data.output?.[0]?.content?.find((item: { type?: string; text?: string }) => item.type === "output_text")?.text ??
    ""
  );
}

function sanitizeAssistantText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[*-]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function requestOpenAiJson({
  systemPrompt,
  userPayload,
  schemaName,
  schema,
  imageDataUrl,
}: {
  systemPrompt: string;
  userPayload: unknown;
  schemaName: string;
  schema: Record<string, unknown>;
  imageDataUrl?: string;
}) {
  ensureOpenAiConfigured();

  const content = [
    {
      type: "input_text",
      text: JSON.stringify(userPayload),
    },
  ] as Array<Record<string, unknown>>;

  if (imageDataUrl) {
    content.push({
      type: "input_image",
      image_url: imageDataUrl,
      detail: "high",
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("OpenAI JSON request failed", response.status, details);
    throw new Error(`OpenAI вернул ошибку ${response.status}.`);
  }

  const data = (await response.json()) as OpenAiResponsePayload;
  const rawText = extractOutputText(data);

  if (!rawText) {
    throw new Error("OpenAI не вернул структурированный ответ.");
  }

  return JSON.parse(rawText) as Record<string, unknown>;
}

async function requestOpenAiText({
  systemPrompt,
  userPayload,
}: {
  systemPrompt: string;
  userPayload: unknown;
}) {
  ensureOpenAiConfigured();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(userPayload) }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("OpenAI text request failed", response.status, details);
    throw new Error(`OpenAI вернул ошибку ${response.status}.`);
  }

  const data = (await response.json()) as OpenAiResponsePayload;
  const text = extractOutputText(data).trim();

  if (!text) {
    throw new Error("OpenAI не вернул текст ответа.");
  }

  return text;
}

async function createOpenAiInsights(input: AiSummaryInput) {
  const parsed = (await requestOpenAiJson({
    systemPrompt:
      "Ты финансовый помощник сервиса Noir Ledger. Используй суммы, категории, комментарии к операциям, цели и распределение бюджета накоплений. Верни только JSON на русском языке с полями summary, forecast и массивом insights из трех элементов. У каждого insight должны быть поля title, message, recommendation, tone, period и metric. Если метрики нет, верни null. Никакого markdown, только чистый JSON.",
    userPayload: input,
    schemaName: "finance_insights",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        forecast: { type: "string" },
        insights: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              message: { type: "string" },
              recommendation: { type: "string" },
              tone: { type: "string", enum: ["positive", "warning", "neutral"] },
              period: { type: "string", enum: ["week", "month", "long"] },
              metric: { type: ["string", "null"] },
            },
            required: ["title", "message", "recommendation", "tone", "period", "metric"],
          },
        },
      },
      required: ["summary", "forecast", "insights"],
    },
  })) as {
    summary: string;
    forecast: string;
    insights: Array<{
      title: string;
      message: string;
      recommendation: string;
      tone: AiInsight["tone"];
      period: AiInsight["period"];
      metric: string | null;
    }>;
  };

  const now = new Date().toISOString();

  return {
    summary: parsed.summary,
    forecast: parsed.forecast,
    insights: parsed.insights.map((insight, index) => ({
      id: createId(`ai_${index}`),
      userId: "openai",
      title: insight.title,
      message: insight.message,
      recommendation: insight.recommendation,
      tone: insight.tone,
      period: insight.period,
      metric: insight.metric ?? undefined,
      summary: index === 0 ? parsed.summary : undefined,
      forecast: index === 0 ? parsed.forecast : undefined,
      createdAt: now,
    })),
  } satisfies AiInsightBundle;
}

async function createOpenAiReceiptDraft(input: ReceiptParsingInput) {
  const parsed = (await requestOpenAiJson({
    systemPrompt:
      "Ты модуль OCR и финансовой классификации. Извлеки из изображения чека продавца, сумму, дату и краткий комментарий, а затем выбери самую подходящую категорию только из списка категорий пользователя. Если дата неразборчива, используй сегодняшнюю. Верни только JSON.",
    userPayload: {
      fileName: input.fileName,
      profile: input.profile,
      categories: input.categories,
    },
    imageDataUrl: input.imageDataUrl,
    schemaName: "receipt_draft",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        merchant: { type: "string" },
        total: { type: "number" },
        transactionDate: { type: "string" },
        categoryId: {
          type: "string",
          enum: input.categories.map((category) => category.id),
        },
        note: { type: "string" },
        confidence: { type: "number" },
      },
      required: ["merchant", "total", "transactionDate", "categoryId", "note", "confidence"],
    },
  })) as {
    merchant: string;
    total: number;
    transactionDate: string;
    categoryId: string;
    note: string;
    confidence: number;
  };

  const matchedCategory = input.categories.find((category) => category.id === parsed.categoryId);

  return {
    merchant: parsed.merchant,
    total: Number(parsed.total.toFixed(2)),
    transactionDate: parsed.transactionDate.slice(0, 10),
    categoryId: parsed.categoryId,
    categoryName: matchedCategory?.name ?? "Прочие расходы",
    note: parsed.note,
    confidence: Number(Math.max(0, Math.min(1, parsed.confidence)).toFixed(2)),
    imageName: input.fileName,
  } satisfies ReceiptDraft;
}

async function createOpenAiAssistantReply(input: AssistantChatInput) {
  const reply = await requestOpenAiText({
    systemPrompt: [
      "Ты встроенный финансовый ассистент сервиса Noir Ledger.",
      "Отвечай только на русском языке.",
      "Используй контекст пользователя: доходы, расходы, цели, динамику по категориям, аномалии, комментарии к операциям и план распределения накоплений.",
      "Отвечай практично, по делу и без воды.",
      "Не используй markdown, звездочки, заголовки и техническую разметку. Нужен обычный чистый текст с короткими абзацами.",
      "Если контекста не хватает, скажи об этом прямо и предложи следующий полезный шаг.",
    ].join(" "),
    userPayload: {
      profile: input.profile,
      context: input.context,
      messages: input.messages,
    },
  });

  return sanitizeAssistantText(reply);
}

export async function generateFinanceInsights(input: AiSummaryInput) {
  return createOpenAiInsights(input);
}

export async function parseReceipt(input: ReceiptParsingInput) {
  return createOpenAiReceiptDraft(input);
}

export async function generateAssistantReply(input: AssistantChatInput) {
  return createOpenAiAssistantReply(input);
}
