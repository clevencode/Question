-- Executar no Supabase → SQL Editor (projeto NOVO, tabela ainda não existe)

create table if not exists quiz_results (
  id text primary key,
  student_key text not null,
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

drop policy if exists "Permitir inserção pública" on quiz_results;
create policy "Permitir inserção pública"
  on quiz_results for insert with check (true);

drop policy if exists "Permitir leitura pública" on quiz_results;
create policy "Permitir leitura pública"
  on quiz_results for select using (true);

drop policy if exists "Permitir exclusão pública" on quiz_results;
create policy "Permitir exclusão pública"
  on quiz_results for delete using (true);

create index if not exists idx_quiz_results_student_key on quiz_results(student_key);

do $$
begin
  alter publication supabase_realtime add table quiz_results;
exception
  when duplicate_object then null;
end $$;