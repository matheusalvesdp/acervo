-- Cole este script no Supabase: SQL Editor → New query → Run.
-- Cria a tabela das indicações e as regras que deixam cada pessoa
-- ver e alterar somente os próprios itens.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('filme', 'serie', 'livro')),
  title text not null check (char_length(title) between 1 and 200),
  creator text not null default '' check (char_length(creator) <= 200),
  year text not null default '' check (year = '' or year ~ '^[0-9]{4}$'),
  recommended_by text not null default '' check (char_length(recommended_by) <= 80),
  status text not null default 'fila' check (status in ('fila', 'andamento', 'concluido')),
  rating smallint not null default 0 check (rating between 0 and 5),
  notes text not null default '' check (char_length(notes) <= 2000),
  synopsis text not null default '' check (char_length(synopsis) <= 3000),
  genre text not null default '' check (char_length(genre) <= 80),
  cover_url text check (cover_url is null or cover_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_user_id_idx on public.items (user_id, created_at desc);

alter table public.items enable row level security;

drop policy if exists "ver os proprios itens" on public.items;
drop policy if exists "criar os proprios itens" on public.items;
drop policy if exists "editar os proprios itens" on public.items;
drop policy if exists "excluir os proprios itens" on public.items;

create policy "ver os proprios itens" on public.items
  for select to authenticated using (user_id = auth.uid());
create policy "criar os proprios itens" on public.items
  for insert to authenticated with check (user_id = auth.uid());
create policy "editar os proprios itens" on public.items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "excluir os proprios itens" on public.items
  for delete to authenticated using (user_id = auth.uid());

-- Mantém updated_at em dia a cada alteração.
create or replace function public.items_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items
  for each row execute function public.items_touch();
