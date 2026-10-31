alter table public.profiles
add column if not exists display_currency text not null default 'USD';

update public.profiles
set display_currency = currency
where display_currency is null;

create table if not exists public.receipt_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant text not null default '',
  total numeric(12,2) not null check (total > 0),
  transaction_date date not null default current_date,
  category_id uuid not null references public.categories(id) on delete restrict,
  category_name text not null default '',
  note text not null default '',
  confidence numeric(4,2) not null default 0.5,
  image_name text not null default '',
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.receipt_scans enable row level security;
alter table public.ai_chat_messages enable row level security;

create policy "receipt_scans_manage_own" on public.receipt_scans
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ai_chat_messages_manage_own" on public.ai_chat_messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists receipt_scans_user_created_idx on public.receipt_scans (user_id, created_at desc);
create index if not exists ai_chat_messages_user_created_idx on public.ai_chat_messages (user_id, created_at asc);

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
    display_currency,
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
    'RUB',
    'RUB',
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
    (new.id, 'Зарплата', 'income', '#b97750', 'salary', true),
    (new.id, 'Фриланс', 'income', '#c58a5a', 'freelance', true),
    (new.id, 'Инвестиции', 'income', '#d0a06c', 'investment', true),
    (new.id, 'Кафе и рестораны', 'expense', '#ba7a54', 'food', true),
    (new.id, 'Продукты', 'expense', '#9c7657', 'groceries', true),
    (new.id, 'Транспорт', 'expense', '#8f684e', 'transport', true),
    (new.id, 'Развлечения', 'expense', '#c99967', 'entertainment', true),
    (new.id, 'Подписки', 'expense', '#857063', 'subscriptions', true),
    (new.id, 'Дом', 'expense', '#775949', 'home', true),
    (new.id, 'Накопления', 'saving', '#c89b67', 'savings', true),
    (new.id, 'Перевод', 'transfer', '#7c6556', 'transfer', true);

  return new;
end;
$$;
