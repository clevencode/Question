-- Executar no Supabase → SQL Editor (tabela já existente)
-- Adiciona apenas o que falta, sem recriar políticas

alter table quiz_results add column if not exists student_key text;

update quiz_results
set student_key = lower(trim(name))
where student_key is null;

create index if not exists idx_quiz_results_student_key on quiz_results(student_key);

-- Realtime (ignorar erro se já estiver ativo)
do $$
begin
  alter publication supabase_realtime add table quiz_results;
exception
  when duplicate_object then null;
end $$;