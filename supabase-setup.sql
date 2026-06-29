-- Executar no Supabase → SQL Editor (gratuito)

create table if not exists quiz_results (
  id text primary key,
  name text not null,
  percent int not null,
  correct int not null,
  total int not null,
  wrong int not null default 0,
  grade text default '',
  answers jsonb default '{}',
  created_at timestamptz default now(),
  source text default ''
);

alter table quiz_results enable row level security;

create policy "Permitir inserção pública"
  on quiz_results for insert with check (true);

create policy "Permitir leitura pública"
  on quiz_results for select using (true);