export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Noir Ledger",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
};

export const hasSupabaseCredentials =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const hasOpenAiCredentials = Boolean(env.openAiApiKey);
