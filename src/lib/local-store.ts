import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createDefaultCategories, createEmptyFinanceState } from "@/lib/seed";
import { AppUser, Category, FinanceState } from "@/lib/types";

const SESSION_TTL_DAYS = 30;
export const LOCAL_SESSION_COOKIE = "noirledger_session";

interface LocalUserRecord {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  createdAt: string;
}

interface LocalSessionRecord {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface LocalStoreFile {
  users: LocalUserRecord[];
  sessions: LocalSessionRecord[];
  states: Record<string, FinanceState>;
}

function resolveLocalDataDir() {
  if (process.env.NOIR_DATA_DIR) {
    return process.env.NOIR_DATA_DIR;
  }

  if (process.platform === "win32") {
    return path.join(process.cwd(), ".local-data");
  }

  return process.env.NODE_ENV === "production"
    ? "/opt/noirledger/shared/local-data"
    : path.join(process.cwd(), ".local-data");
}

function getStoreFilePath() {
  return path.join(resolveLocalDataDir(), "store.json");
}

function emptyStore(): LocalStoreFile {
  return {
    users: [],
    sessions: [],
    states: {},
  };
}

let storeQueue = Promise.resolve();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toAppUser(record: LocalUserRecord): AppUser {
  return {
    id: record.id,
    email: record.email,
    fullName: record.fullName,
    createdAt: record.createdAt,
  };
}

function buildPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function computeSessionExpiry() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_TTL_DAYS);
  return date.toISOString();
}

async function ensureStoreFile() {
  const filePath = getStoreFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, `${JSON.stringify(emptyStore(), null, 2)}\n`, "utf8");
  }

  return filePath;
}

async function readStoreFile() {
  const filePath = await ensureStoreFile();
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<LocalStoreFile>;

  return {
    users: parsed.users ?? [],
    sessions: parsed.sessions ?? [],
    states: parsed.states ?? {},
  } satisfies LocalStoreFile;
}

async function writeStoreFile(store: LocalStoreFile) {
  const filePath = await ensureStoreFile();
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
}

function dropExpiredSessions(store: LocalStoreFile) {
  const now = Date.now();
  store.sessions = store.sessions.filter((session) => new Date(session.expiresAt).getTime() > now);
}

async function withStore<T>(operation: (store: LocalStoreFile) => Promise<T> | T) {
  const pending = storeQueue.then(async () => {
    const store = await readStoreFile();
    dropExpiredSessions(store);
    const result = await operation(store);
    await writeStoreFile(store);
    return result;
  });

  storeQueue = pending.then(
    () => undefined,
    () => undefined,
  );

  return pending;
}

function ensureNonEmptyName(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

function mergeDefaultCategories(user: AppUser, categories: Category[]) {
  const defaults = createDefaultCategories(user.id);
  const merged = [...categories];

  for (const defaultCategory of defaults) {
    const exists = merged.some(
      (category) =>
        category.kind === defaultCategory.kind &&
        (category.icon === defaultCategory.icon ||
          normalizeCategoryName(category.name) === normalizeCategoryName(defaultCategory.name)),
    );

    if (!exists) {
      merged.push(defaultCategory);
    }
  }

  const defaultsInOrder: Category[] = [];
  const custom: Category[] = [];

  for (const category of merged) {
    if (category.isDefault) {
      defaultsInOrder.push(category);
    } else {
      custom.push(category);
    }
  }

  defaultsInOrder.sort((left, right) => {
    const leftIndex = defaults.findIndex(
      (item) =>
        item.kind === left.kind &&
        (item.icon === left.icon || normalizeCategoryName(item.name) === normalizeCategoryName(left.name)),
    );
    const rightIndex = defaults.findIndex(
      (item) =>
        item.kind === right.kind &&
        (item.icon === right.icon || normalizeCategoryName(item.name) === normalizeCategoryName(right.name)),
    );

    return leftIndex - rightIndex;
  });

  custom.sort((left, right) => left.name.localeCompare(right.name, "ru"));

  return [...defaultsInOrder, ...custom];
}

function ensureUserState(user: AppUser, currentState?: FinanceState) {
  if (!currentState) {
    return createEmptyFinanceState(user);
  }

  return {
    ...currentState,
    profile: {
      ...currentState.profile,
      id: user.id,
      fullName: ensureNonEmptyName(currentState.profile.fullName, user.fullName),
      monthlySavingsBudget: Math.max(0, currentState.profile.monthlySavingsBudget ?? 0),
      notificationsEmail: false,
      notificationsPush: false,
      aiEnabled: true,
      aiProvider: "openai",
    },
    categories: mergeDefaultCategories(
      user,
      currentState.categories.length > 0
        ? currentState.categories.map((category) => ({
            ...category,
            userId: user.id,
          }))
        : createEmptyFinanceState(user).categories,
    ),
    transactions: currentState.transactions.map((transaction) => ({
      ...transaction,
      userId: user.id,
    })),
    goals: currentState.goals.map((goal) => ({
      ...goal,
      userId: user.id,
      priority: goal.priority ?? "medium",
    })),
    contributions: currentState.contributions.map((contribution) => ({
      ...contribution,
      userId: user.id,
    })),
    aiInsights: currentState.aiInsights.map((insight) => ({
      ...insight,
      userId: user.id,
    })),
    receiptScans: (currentState.receiptScans ?? []).map((receipt) => ({
      ...receipt,
      userId: user.id,
    })),
    chatMessages: (currentState.chatMessages ?? []).map((message) => ({
      ...message,
      userId: user.id,
    })),
    updatedAt: new Date().toISOString(),
  } satisfies FinanceState;
}

export async function registerLocalAccount(fullName: string, email: string, password: string) {
  return withStore(async (store) => {
    const normalizedEmail = normalizeEmail(email);
    const existing = store.users.find((user) => user.email === normalizedEmail);
    if (existing) {
      throw new Error("Аккаунт с таким email уже существует.");
    }

    const createdAt = new Date().toISOString();
    const userRecord: LocalUserRecord = {
      id: randomUUID(),
      email: normalizedEmail,
      fullName: ensureNonEmptyName(fullName, normalizedEmail.split("@")[0] ?? "Пользователь"),
      passwordHash: buildPasswordHash(password),
      createdAt,
    };

    const session: LocalSessionRecord = {
      id: randomUUID(),
      userId: userRecord.id,
      createdAt,
      expiresAt: computeSessionExpiry(),
    };

    store.users.push(userRecord);
    store.sessions.push(session);
    store.states[userRecord.id] = createEmptyFinanceState(toAppUser(userRecord));

    return {
      user: toAppUser(userRecord),
      sessionId: session.id,
    };
  });
}

export async function loginLocalAccount(email: string, password: string) {
  return withStore(async (store) => {
    const normalizedEmail = normalizeEmail(email);
    const userRecord = store.users.find((user) => user.email === normalizedEmail);
    if (!userRecord || !verifyPassword(password, userRecord.passwordHash)) {
      throw new Error("Неверный email или пароль.");
    }

    const session: LocalSessionRecord = {
      id: randomUUID(),
      userId: userRecord.id,
      createdAt: new Date().toISOString(),
      expiresAt: computeSessionExpiry(),
    };

    store.sessions.push(session);

    if (!store.states[userRecord.id]) {
      store.states[userRecord.id] = createEmptyFinanceState(toAppUser(userRecord));
    }

    return {
      user: toAppUser(userRecord),
      sessionId: session.id,
    };
  });
}

export async function getLocalUserBySession(sessionId: string | null | undefined) {
  if (!sessionId) {
    return null;
  }

  return withStore(async (store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) {
      return null;
    }

    const userRecord = store.users.find((item) => item.id === session.userId);
    return userRecord ? toAppUser(userRecord) : null;
  });
}

export async function removeLocalSession(sessionId: string | null | undefined) {
  if (!sessionId) {
    return;
  }

  await withStore(async (store) => {
    store.sessions = store.sessions.filter((session) => session.id !== sessionId);
  });
}

export async function loadLocalFinanceState(user: AppUser) {
  return withStore(async (store) => {
    const ensured = ensureUserState(user, store.states[user.id]);
    store.states[user.id] = ensured;
    return ensured;
  });
}

export async function saveLocalFinanceState(user: AppUser, nextState: FinanceState) {
  return withStore(async (store) => {
    const normalizedState = ensureUserState(user, nextState);
    store.states[user.id] = normalizedState;

    const userRecord = store.users.find((item) => item.id === user.id);
    if (userRecord) {
      userRecord.fullName = normalizedState.profile.fullName;
    }

    return normalizedState;
  });
}
