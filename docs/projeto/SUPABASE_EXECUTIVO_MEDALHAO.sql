-- Modelo executivo medalhao para Boituva Digital Platform
-- Suba este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists dim_tempo (
  tempo_id text primary key,
  ano integer not null,
  mes_num integer not null,
  mes_nome text not null,
  trimestre integer not null,
  ano_mes_ref text not null unique
);

create table if not exists dim_secretaria (
  secretaria_id text primary key,
  secretaria_nome text not null,
  eixo text not null,
  ativo boolean not null default true
);

create table if not exists dim_fonte_recurso (
  fonte_id uuid primary key default gen_random_uuid(),
  fonte_nome text not null unique,
  grupo text
);

create table if not exists dim_municipio (
  municipio_id_ibge bigint primary key,
  municipio_nome text not null,
  uf_sigla text not null,
  regiao text,
  regiao_imediata text,
  regiao_intermediaria text
);

create table if not exists fato_financeiro_mensal (
  tempo_id text not null references dim_tempo(tempo_id),
  municipio_id_ibge bigint not null references dim_municipio(municipio_id_ibge),
  receita_prevista numeric(16,2) not null default 0,
  receita_realizada numeric(16,2) not null default 0,
  despesa_empenhada numeric(16,2) not null default 0,
  despesa_liquidada numeric(16,2) not null default 0,
  despesa_paga numeric(16,2) not null default 0,
  primary key (tempo_id, municipio_id_ibge)
);

create table if not exists fato_receita_mensal_fonte (
  tempo_id text not null references dim_tempo(tempo_id),
  municipio_id_ibge bigint not null references dim_municipio(municipio_id_ibge),
  fonte_id uuid not null references dim_fonte_recurso(fonte_id),
  valor numeric(16,2) not null default 0,
  primary key (tempo_id, municipio_id_ibge, fonte_id)
);

create table if not exists fato_despesa_mensal_secretaria (
  tempo_id text not null references dim_tempo(tempo_id),
  municipio_id_ibge bigint not null references dim_municipio(municipio_id_ibge),
  secretaria_id text not null references dim_secretaria(secretaria_id),
  programa text,
  empenhado numeric(16,2) not null default 0,
  liquidado numeric(16,2) not null default 0,
  pago numeric(16,2) not null default 0,
  meta_fisica numeric(16,2) not null default 0,
  entrega_fisica numeric(16,2) not null default 0,
  primary key (tempo_id, municipio_id_ibge, secretaria_id)
);

create table if not exists fato_governanca_digital (
  ano integer not null,
  municipio_id_ibge bigint not null references dim_municipio(municipio_id_ibge),
  secretaria_id text not null references dim_secretaria(secretaria_id),
  maturidade numeric(8,2) not null default 0,
  qualidade_dados numeric(8,2) not null default 0,
  servicos_digitais integer not null default 0,
  integracoes integer not null default 0,
  risco text not null,
  primary key (ano, municipio_id_ibge, secretaria_id)
);

create table if not exists fato_ibge_indicador_municipio (
  indicador_id text not null,
  municipio_id_ibge bigint not null references dim_municipio(municipio_id_ibge),
  ano_referencia integer not null,
  indicador_nome text not null,
  valor numeric(16,4) not null,
  unidade text,
  fonte text,
  fonte_url text,
  primary key (indicador_id, municipio_id_ibge, ano_referencia)
);

create or replace view vw_exec_resumo_periodo as
select
  t.ano,
  t.mes_num,
  t.mes_nome,
  t.ano_mes_ref,
  m.municipio_nome,
  f.receita_prevista,
  f.receita_realizada,
  f.despesa_empenhada,
  f.despesa_liquidada,
  f.despesa_paga,
  (f.receita_realizada - f.despesa_paga) as saldo_vs_pago,
  (f.receita_realizada - f.despesa_empenhada) as saldo_vs_empenhado,
  case
    when f.receita_realizada = 0 then 0
    else (f.despesa_empenhada - f.despesa_paga) / f.receita_realizada
  end as pressao_fiscal
from fato_financeiro_mensal f
join dim_tempo t on t.tempo_id = f.tempo_id
join dim_municipio m on m.municipio_id_ibge = f.municipio_id_ibge;

create or replace view vw_exec_secretarias as
select
  t.ano,
  t.mes_num,
  t.mes_nome,
  t.ano_mes_ref,
  m.municipio_nome,
  s.secretaria_id,
  s.secretaria_nome,
  s.eixo,
  d.programa,
  d.empenhado,
  d.liquidado,
  d.pago,
  d.meta_fisica,
  d.entrega_fisica,
  case when d.empenhado = 0 then 0 else d.pago / d.empenhado end as execucao_financeira,
  case when d.meta_fisica = 0 then 0 else d.entrega_fisica / d.meta_fisica end as execucao_fisica
from fato_despesa_mensal_secretaria d
join dim_tempo t on t.tempo_id = d.tempo_id
join dim_municipio m on m.municipio_id_ibge = d.municipio_id_ibge
join dim_secretaria s on s.secretaria_id = d.secretaria_id;

create or replace view vw_exec_ibge_municipio as
select
  m.municipio_id_ibge,
  m.municipio_nome,
  m.uf_sigla,
  m.regiao,
  m.regiao_imediata,
  m.regiao_intermediaria,
  i.indicador_id,
  i.indicador_nome,
  i.ano_referencia,
  i.valor,
  i.unidade,
  i.fonte,
  i.fonte_url
from fato_ibge_indicador_municipio i
join dim_municipio m on m.municipio_id_ibge = i.municipio_id_ibge;
