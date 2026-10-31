create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  currency text not null default 'USD',
  language text not null default 'ru-RU',
  notifications_email boolean not null default true,
  notifications_push boolean not null default true,
  ai_enabled boolean not null default true,
  ai_provider text not null default 'mock' check (ai_provider in ('mock', 'openai')),
  onboarding_completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense', 'transfer', 'saving')),
  color text not null default '#f97316',
  icon text not null default 'wallet',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  type text not null check (type in ('income', 'expense', 'transfer', 'saving')),
  amount numeric(12,2) not null check (amount > 0),
  note text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0,
  deadline date not null,
  color text not null default '#f97316',
  icon text not null default 'savings',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period in ('week', 'month', 'long')),
  title text not null,
  message text not null,
  recommendation text not null,
  tone text not null check (tone in ('positive', 'warning', 'neutral')),
  metric text,
  summary text,
  forecast text,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  month date not null,
  limit_amount numeric(12,2) not null check (limit_amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  type text not null check (type in ('income', 'expense', 'transfer', 'saving')),
  amount numeric(12,2) not null check (amount > 0),
  cadence text not null check (cadence in ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_run_at date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.savings_goals;
create trigger set_goals_updated_at
before update on public.savings_goals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    currency,
    language,
    notifications_email,
    notifications_push,
    ai_enabled,
    ai_provider,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'USD',
    'ru-RU',
    true,
    true,
    true,
    'mock',
    true
  )
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, kind, color, icon, is_default)
  values
    (new.id, 'Salary', 'income', '#f97316', 'salary', true),
    (new.id, 'Freelance', 'income', '#fb923c', 'freelance', true),
    (new.id, 'Investments', 'income', '#fbbf24', 'investment', true),
    (new.id, 'Food & Dining', 'expense', '#f97316', 'food', true),
    (new.id, 'Groceries', 'expense', '#fb923c', 'groceries', true),
    (new.id, 'Transport', 'expense', '#fdba74', 'transport', true),
    (new.id, 'Entertainment', 'expense', '#f59e0b', 'entertainment', true),
    (new.id, 'Subscriptions', 'expense', '#fcd34d', 'subscriptions', true),
    (new.id, 'Home', 'expense', '#ea580c', 'home', true),
    (new.id, 'Savings', 'saving', '#facc15', 'savings', true),
    (new.id, 'Transfer', 'transfer', '#a16207', 'transfer', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.ai_insights enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);

create policy "categories_manage_own" on public.categories
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_manage_own" on public.transactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_manage_own" on public.savings_goals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goal_contributions_manage_own" on public.goal_contributions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ai_insights_manage_own" on public.ai_insights
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets_manage_own" on public.budgets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurring_manage_own" on public.recurring_transactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists categories_user_idx on public.categories (user_id);
create index if not exists goals_user_idx on public.savings_goals (user_id);
create index if not exists contributions_goal_idx on public.goal_contributions (goal_id, date desc);
create index if not exists ai_user_created_idx on public.ai_insights (user_id, created_at desc);
