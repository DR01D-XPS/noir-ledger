import { Category, TransactionFormValues, TransactionType } from "@/lib/types";

export interface BankStatementEntry extends Omit<TransactionFormValues, "id"> {
  id: string;
  sourceRow: number;
  selected: boolean;
}

export interface BankStatementParseResult {
  entries: BankStatementEntry[];
  skippedRows: number;
}

const dateAliases = ["дата", "дата операции", "дата платежа", "date", "operation date", "transaction date"];
const amountAliases = ["сумма", "сумма операции", "amount", "operation amount", "transaction amount"];
const incomeAliases = ["приход", "поступление", "зачисление", "доход", "income", "credit"];
const expenseAliases = ["расход", "списание", "дебет", "debit", "expense"];
const descriptionAliases = [
  "описание",
  "назначение",
  "комментарий",
  "контрагент",
  "получатель",
  "merchant",
  "details",
  "description",
  "payment",
];
const typeAliases = ["тип", "вид операции", "type", "operation type"];

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

function findColumn(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.some((alias) => header === alias || header.includes(alias)));
}

function parseAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? "")
    .trim()
    .replace(/[−–—]/g, "-")
    .replace(/[₽$€£¥\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1");

  if (!raw) {
    return null;
  }

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  const normalized =
    lastComma >= 0 && lastDot >= 0
      ? lastComma > lastDot
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "")
      : raw.replace(",", ".");
  const amount = Number.parseFloat(normalized);

  return Number.isFinite(amount) ? amount : null;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 1 && value < 100000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + Math.floor(value) * 86_400_000).toISOString().slice(0, 10);
  }

  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const russianDate = raw.match(/^(\d{1,2})[.-](\d{1,2})[.-](\d{2,4})/);
  if (russianDate) {
    const [, day, month, year] = russianDate;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const date = new Date(`${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function findHeaderRow(rows: unknown[][]) {
  let bestRow = -1;
  let bestScore = 0;

  for (let index = 0; index < Math.min(rows.length, 12); index += 1) {
    const headers = rows[index].map(normalizeHeader);
    const score =
      Number(findColumn(headers, dateAliases) >= 0) * 3 +
      Number(findColumn(headers, amountAliases) >= 0 || findColumn(headers, expenseAliases) >= 0) * 3 +
      Number(findColumn(headers, descriptionAliases) >= 0);

    if (score > bestScore) {
      bestScore = score;
      bestRow = index;
    }
  }

  return bestScore >= 5 ? bestRow : -1;
}

function inferType(value: {
  amount: number | null;
  income: number | null;
  expense: number | null;
  type: string;
  note: string;
}): { type: TransactionType; amount: number } | null {
  if (value.expense !== null && Math.abs(value.expense) > 0) {
    return { type: "expense", amount: Math.abs(value.expense) };
  }

  if (value.income !== null && Math.abs(value.income) > 0) {
    return { type: "income", amount: Math.abs(value.income) };
  }

  if (value.amount === null || value.amount === 0) {
    return null;
  }

  const source = `${value.type} ${value.note}`.toLowerCase();
  if (/(расход|списан|дебет|debit|payment|оплата)/.test(source)) {
    return { type: "expense", amount: Math.abs(value.amount) };
  }
  if (/(доход|приход|поступлен|зачислен|income|credit)/.test(source)) {
    return { type: "income", amount: Math.abs(value.amount) };
  }

  return value.amount < 0
    ? { type: "expense", amount: Math.abs(value.amount) }
    : { type: "income", amount: value.amount };
}

function inferCategoryId(type: TransactionType, note: string, categories: Category[]) {
  const byIcon = (icon: string) => categories.find((category) => category.kind === type && category.icon === icon)?.id;
  const text = note.toLowerCase();

  if (type === "expense") {
    const rules: Array<[RegExp, string]> = [
      [/(пятер|магнит|лента|вкусвилл|перекрест|ашан|продукт|супермаркет|market)/, "groceries"],
      [/(кофе|coffee|cappuccino|latte)/, "cafe"],
      [/(кафе|ресторан|доставк.*ед|yandex.?eda|delivery club)/, "food"],
      [/(такси|yandex.?go|uber|метро|автобус|транспорт|заправк|азс)/, "transport"],
      [/(netflix|spotify|ivi|okko|подписк|yandex plus|apple.com\/bill)/, "subscriptions"],
      [/(аптек|клиник|медиц|doctor|health)/, "health"],
      [/(ozon|wildberries|marketplace|магазин|покупк)/, "shopping"],
    ];

    for (const [pattern, icon] of rules) {
      const categoryId = pattern.test(text) ? byIcon(icon) : undefined;
      if (categoryId) {
        return categoryId;
      }
    }
  }

  return categories.find((category) => category.kind === type)?.id ?? "";
}

function parseCsv(text: string): unknown[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", ",", "\t"].reduce((current, candidate) =>
    firstLine.split(candidate).length > firstLine.split(current).length ? candidate : current,
  );
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && character === delimiter) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(value.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }

    value += character;
  }

  row.push(value.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

async function readStatementRows(file: File): Promise<unknown[][]> {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return parseCsv(await file.text());
  }

  const { readSheet } = await import("read-excel-file/browser");
  return readSheet(file);
}

export async function parseBankStatement(file: File, categories: Category[]): Promise<BankStatementParseResult> {
  const rows = await readStatementRows(file);
  const headerRow = findHeaderRow(rows);

  if (headerRow < 0) {
    throw new Error("Не удалось найти колонки даты и суммы. Выбери CSV или XLSX-выписку с заголовками.");
  }

  const headers = rows[headerRow].map(normalizeHeader);
  const dateIndex = findColumn(headers, dateAliases);
  const amountIndex = findColumn(headers, amountAliases);
  const incomeIndex = findColumn(headers, incomeAliases);
  const expenseIndex = findColumn(headers, expenseAliases);
  const descriptionIndex = findColumn(headers, descriptionAliases);
  const typeIndex = findColumn(headers, typeAliases);
  const entries: BankStatementEntry[] = [];
  let skippedRows = 0;

  rows.slice(headerRow + 1).forEach((row, index) => {
    const date = parseDate(row[dateIndex]);
    const note = String(row[descriptionIndex] ?? "").trim();
    const operation = inferType({
      amount: amountIndex >= 0 ? parseAmount(row[amountIndex]) : null,
      income: incomeIndex >= 0 ? parseAmount(row[incomeIndex]) : null,
      expense: expenseIndex >= 0 ? parseAmount(row[expenseIndex]) : null,
      type: String(row[typeIndex] ?? ""),
      note,
    });

    if (!date || !operation || !note) {
      skippedRows += 1;
      return;
    }

    const categoryId = inferCategoryId(operation.type, note, categories);
    if (!categoryId) {
      skippedRows += 1;
      return;
    }

    entries.push({
      id: `statement-${headerRow + index + 2}`,
      sourceRow: headerRow + index + 2,
      type: operation.type,
      amount: operation.amount,
      categoryId,
      date,
      note,
      selected: true,
    });
  });

  return {
    entries: entries.slice(0, 500),
    skippedRows: skippedRows + Math.max(entries.length - 500, 0),
  };
}
