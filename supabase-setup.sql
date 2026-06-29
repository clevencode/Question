-- Executar no Supabase → SQL Editor (gratuito)

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

create policy "Permitir inserção pública"
  on quiz_results for insert with check (true);

create policy "Permitir leitura pública"
  on quiz_results for select using (true);

create policy "Permitir exclusão pública"
  on quiz_results for delete using (true);

create index if not exists idx_quiz_results_student_key on quiz_results(student_key);

-- Se a tabela já existir, executar apenas:
-- alter table quiz_results add column if not exists student_key text;
-- update quiz_results set student_key = lower(trim(name)) where student_key is null;

-- Atualização em tempo real no dashboard (opcional)
alter publication supabase_realtime add table quiz_results;