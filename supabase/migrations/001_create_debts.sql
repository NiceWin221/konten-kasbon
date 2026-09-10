-- 1. ENUM
create type public.debt_type as enum (
  'owed_to_me',
  'i_owe'
);

-- 2. TABLE

create table public.debts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  type public.debt_type not null,

  counterpart_name text not null,

  amount bigint not null
    check (amount > 0),

  note text
    check (note is null or char_length(note) <= 200),

  due_date date,

  settled_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- 3. INDEX

create index debts_user_id_idx
  on public.debts(user_id);

create index debts_user_id_settled_at_idx
  on public.debts(user_id, settled_at);

create index debts_user_id_type_idx
  on public.debts(user_id, type);

-- 4. UPDATED_AT TRIGGER

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_debts_updated_at
before update on public.debts
for each row
execute function public.handle_updated_at();

-- 5. ENABLE ROW LEVEL SECURITY

alter table public.debts enable row level security;

-- 6. RLS POLICIES
-- SELECT: user hanya bisa melihat debt miliknya
create policy "Users can view their own debts"
on public.debts
for select
to authenticated
using (auth.uid() = user_id);


-- INSERT: user hanya boleh membuat debt miliknya sendiri
create policy "Users can create their own debts"
on public.debts
for insert
to authenticated
with check (auth.uid() = user_id);


-- UPDATE: user hanya bisa update debt miliknya
create policy "Users can update their own debts"
on public.debts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- DELETE: user hanya bisa menghapus debt miliknya
create policy "Users can delete their own debts"
on public.debts
for delete
to authenticated
using (auth.uid() = user_id);