-- Supabase → SQL Editor → Run (script completo, pode executar mais de uma vez)
-- Rastreamento: dispositivo + nome (mesmo aparelho, nome diferente = outro usuário)

-- 1. Tabela
create table if not exists quiz_results (
  id text primary key,
  device_key text not null default 'legacy',
  student_key text not null,
  name text not null,
  percent int not null,
  correct int not null,
  total int not null,
  wrong int not null default 0,
  grade text default '',
  answers jsonb default '{}',
  attempts_history jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  source text default ''
);

-- 2. Colunas novas (se tabela já existia)
alter table quiz_results add column if not exists device_key text;
alter table quiz_results add column if not exists student_key text;
alter table quiz_results add column if not exists attempts_history jsonb default '[]';
alter table quiz_results add column if not exists updated_at timestamptz default now();

update quiz_results
set device_key = 'legacy'
where device_key is null;

update quiz_results
set student_key = lower(trim(name))
where student_key is null;

update quiz_results
set updated_at = created_at
where updated_at is null;

-- 3. Segurança (RLS)
alter table quiz_results enable row level security;

drop policy if exists "Permitir inserção pública" on quiz_results;
create policy "Permitir inserção pública"
  on quiz_results for insert with check (true);

drop policy if exists "Permitir leitura pública" on quiz_results;
create policy "Permitir leitura pública"
  on quiz_results for select using (true);

drop policy if exists "Permitir atualização pública" on quiz_results;
create policy "Permitir atualização pública"
  on quiz_results for update using (true);

drop policy if exists "Permitir exclusão pública" on quiz_results;
create policy "Permitir exclusão pública"
  on quiz_results for delete using (true);

-- 4. Índices (dispositivo + nome do aluno)
create index if not exists idx_quiz_results_student_key on quiz_results(student_key);
create index if not exists idx_quiz_results_device_key on quiz_results(device_key);
create index if not exists idx_quiz_results_device_student on quiz_results(device_key, student_key);

-- 5. Realtime (atualização automática no dashboard)
do $$
begin
  alter publication supabase_realtime add table quiz_results;
exception
  when duplicate_object then null;
end $$;