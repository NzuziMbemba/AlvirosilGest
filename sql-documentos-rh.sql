-- =====================================================================
-- AlviroGest — Módulo "Documentos RH" (fase 1)
-- Execute no Supabase: SQL Editor > New query > colar tudo > Run.
--
-- ANTES DE EXECUTAR, confirme o nome da coluna que liga o perfil à farmácia:
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'perfis_utilizador';
-- Este script assume que a coluna se chama  farmacia_id.
-- Se tiver outro nome, substitua-o na função farmacia_do_gerente() abaixo.
-- O script pode ser executado mais do que uma vez sem estragar nada.
-- =====================================================================

-- 1) Função de segurança: devolve a farmácia do utilizador, só se for Gerente
create or replace function public.farmacia_do_gerente()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select farmacia_id
  from public.perfis_utilizador
  where user_id = auth.uid() and papel = 'gerente'
  limit 1
$$;
revoke all on function public.farmacia_do_gerente() from public;
grant execute on function public.farmacia_do_gerente() to authenticated;

-- 2) Dados da empresa empregadora (um registo por farmácia)
create table if not exists public.empresa_dados (
  farmacia_id uuid primary key references public.farmacias(id) on delete cascade,
  razao_social text,
  nif text,
  sede text,
  cidade text,
  farmacia_morada text,
  representante_nome text,
  representante_cargo text,
  telefone text,
  email text,
  logo_empresa_url text,
  atualizado_em timestamptz not null default now()
);

-- 3) Modelos de documentos (editáveis)
create table if not exists public.documento_modelos (
  id uuid primary key default gen_random_uuid(),
  farmacia_id uuid not null references public.farmacias(id) on delete cascade,
  codigo text not null,
  titulo text not null,
  categoria text not null,
  grupo_logo text not null default 'empresa' check (grupo_logo in ('empresa', 'farmacia')),
  orientacao text not null default 'retrato' check (orientacao in ('retrato', 'paisagem')),
  corpo_html text not null,
  versao integer not null default 1,
  atualizado_em timestamptz not null default now(),
  unique (farmacia_id, codigo)
);

-- 4) Histórico de versões dos modelos
create table if not exists public.documento_modelos_historico (
  id uuid primary key default gen_random_uuid(),
  modelo_id uuid not null references public.documento_modelos(id) on delete cascade,
  farmacia_id uuid not null references public.farmacias(id) on delete cascade,
  versao integer not null,
  titulo text not null,
  corpo_html text not null,
  guardado_em timestamptz not null default now()
);
create index if not exists idx_modelos_historico_modelo
  on public.documento_modelos_historico (modelo_id, versao desc);

-- 5) Ao alterar um modelo, guarda a versão anterior no histórico
create or replace function public.guardar_historico_modelo()
returns trigger
language plpgsql
as $$
begin
  if new.corpo_html is distinct from old.corpo_html or new.titulo is distinct from old.titulo then
    insert into public.documento_modelos_historico (modelo_id, farmacia_id, versao, titulo, corpo_html)
    values (old.id, old.farmacia_id, old.versao, old.titulo, old.corpo_html);
    new.versao := old.versao + 1;
    new.atualizado_em := now();
  end if;
  return new;
end;
$$;
drop trigger if exists trg_historico_modelo on public.documento_modelos;
create trigger trg_historico_modelo
before update on public.documento_modelos
for each row execute function public.guardar_historico_modelo();

-- 6) Segurança: só o Gerente da própria farmácia vê e altera estes dados
alter table public.empresa_dados enable row level security;
alter table public.documento_modelos enable row level security;
alter table public.documento_modelos_historico enable row level security;

drop policy if exists "gerente gere empresa_dados" on public.empresa_dados;
create policy "gerente gere empresa_dados" on public.empresa_dados
  for all to authenticated
  using (farmacia_id = public.farmacia_do_gerente())
  with check (farmacia_id = public.farmacia_do_gerente());

drop policy if exists "gerente gere documento_modelos" on public.documento_modelos;
create policy "gerente gere documento_modelos" on public.documento_modelos
  for all to authenticated
  using (farmacia_id = public.farmacia_do_gerente())
  with check (farmacia_id = public.farmacia_do_gerente());

drop policy if exists "gerente gere historico" on public.documento_modelos_historico;
create policy "gerente gere historico" on public.documento_modelos_historico
  for all to authenticated
  using (farmacia_id = public.farmacia_do_gerente())
  with check (farmacia_id = public.farmacia_do_gerente());

-- 7) Verificação: deve devolver 3 linhas, com rowsecurity = true
select tablename, rowsecurity from pg_tables
where schemaname = 'public'
  and tablename in ('empresa_dados', 'documento_modelos', 'documento_modelos_historico');
