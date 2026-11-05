-- ============================================================================
-- Boituva Digital Platform — Public Views (camada de consumo frontend)
-- ============================================================================
-- Arquivo: supabase/migrations/001_public_views.sql
-- Executar: cole no Supabase SQL Editor e execute
--
-- Estratégia:
--   analytics.*  → escrita exclusiva dos pipelines Python
--   public.vw_* → leitura pelo frontend via Supabase anon key
--
-- As views no schema public são automaticamente expostas pela API REST
-- do Supabase sem necessidade de configurar "Exposed Schemas".
-- Política: apenas SELECT, sem RLS adicional necessário (dados públicos).
--
-- Nomes das views:
--   public.vw_financeiro_mensal       → fato + dim_tempo (série mensal)
--   public.vw_financeiro_anual        → agregado anual da série mensal
--   public.vw_receita_fonte           → receita por fonte de recurso
--   public.vw_indicadores_ibge        → indicadores socioeconômicos IBGE
--   public.vw_secretarias             → dimensão de secretarias municipais
--   public.vw_dim_tempo               → calendário completo disponível
-- ============================================================================


-- ============================================================================
-- 1. vw_financeiro_mensal
-- ============================================================================
-- Propósito: série mensal de receita e despesas para gráficos e KPIs.
-- Join: fato_financeiro_mensal ⨝ dim_tempo
-- Colunas para frontend: ano, mes_num, mes_nome, trimestre, ano_mes_ref,
--   receita_realizada, receita_prevista, despesa_empenhada,
--   despesa_liquidada, despesa_paga + saldos calculados inline.
--
-- Nota: saldos calculados aqui evitam lógica duplicada no frontend.
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_financeiro_mensal AS
SELECT
    -- ── identificação temporal ─────────────────────────────────────────────
    t.ano,
    t.mes_num,
    t.mes_nome,
    t.trimestre,
    t.ano_mes_ref                                       AS ano_mes,

    -- ── receita ────────────────────────────────────────────────────────────
    f.receita_realizada,
    f.receita_prevista,                                -- NULL até integração LOA

    -- ── despesa por estágio ────────────────────────────────────────────────
    f.despesa_empenhada,
    f.despesa_liquidada,
    f.despesa_paga,

    -- ── saldos calculados (evita lógica no frontend) ───────────────────────
    f.receita_realizada - f.despesa_paga               AS saldo_vs_pago,
    f.receita_realizada - f.despesa_empenhada          AS saldo_vs_empenhado,
    f.despesa_empenhada - f.despesa_paga               AS gap_empenhado_pago,

    -- ── taxa de execução financeira ────────────────────────────────────────
    CASE
        WHEN f.despesa_empenhada > 0
        THEN ROUND((f.despesa_paga / f.despesa_empenhada * 100)::numeric, 2)
        ELSE NULL
    END                                                AS pct_execucao_financeira,

    -- ── pressão fiscal (gap / receita) ─────────────────────────────────────
    CASE
        WHEN f.receita_realizada > 0
        THEN ROUND(
            ((f.despesa_empenhada - f.despesa_paga) / f.receita_realizada * 100)::numeric, 2
        )
        ELSE NULL
    END                                                AS pct_pressao_fiscal,

    -- ── rastreabilidade ────────────────────────────────────────────────────
    f.municipio_id_ibge

FROM analytics.fato_financeiro_mensal f
INNER JOIN analytics.dim_tempo t
    ON f.tempo_id = t.tempo_id
ORDER BY t.ano ASC, t.mes_num ASC;

COMMENT ON VIEW public.vw_financeiro_mensal IS
'Série mensal de receita e despesas de Boituva. Join fato_financeiro_mensal x dim_tempo.
Atualizada a cada execução do pipeline upload_exec_cloud.
Fonte: TCE-SP via pipeline Boituva Digital Platform.';


-- ============================================================================
-- 2. vw_financeiro_anual
-- ============================================================================
-- Propósito: agregado anual para comparação histórica (gráfico de barras/linha).
-- Calculado inline a partir da view vw_financeiro_mensal para evitar
-- duplicação de lógica de join.
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_financeiro_anual AS
SELECT
    ano,

    -- ── totais anuais ──────────────────────────────────────────────────────
    SUM(receita_realizada)                             AS receita_total,
    SUM(despesa_empenhada)                             AS despesa_empenhada,
    SUM(despesa_liquidada)                             AS despesa_liquidada,
    SUM(despesa_paga)                                  AS despesa_paga,

    -- ── saldos anuais ──────────────────────────────────────────────────────
    SUM(receita_realizada) - SUM(despesa_paga)         AS saldo_vs_pago,
    SUM(receita_realizada) - SUM(despesa_empenhada)    AS saldo_vs_empenhado,

    -- ── taxas anuais ───────────────────────────────────────────────────────
    CASE
        WHEN SUM(despesa_empenhada) > 0
        THEN ROUND((SUM(despesa_paga) / SUM(despesa_empenhada) * 100)::numeric, 2)
        ELSE NULL
    END                                                AS pct_execucao_financeira,

    CASE
        WHEN SUM(receita_realizada) > 0
        THEN ROUND(
            ((SUM(despesa_empenhada) - SUM(despesa_paga)) / SUM(receita_realizada) * 100)::numeric, 2
        )
        ELSE NULL
    END                                                AS pct_pressao_fiscal,

    COUNT(DISTINCT mes_num)                            AS meses_com_dados

FROM public.vw_financeiro_mensal
GROUP BY ano
ORDER BY ano ASC;

COMMENT ON VIEW public.vw_financeiro_anual IS
'Consolidado anual de receita e despesas de Boituva.
Calculado a partir de vw_financeiro_mensal (não acessa analytics diretamente).
Fonte: TCE-SP via pipeline Boituva Digital Platform.';


-- ============================================================================
-- 3. vw_receita_fonte
-- ============================================================================
-- Propósito: receita mensal por fonte de recurso — gráfico de composição.
-- Join: fato_receita_mensal_fonte ⨝ dim_tempo ⨝ dim_fonte_recurso
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_receita_fonte AS
SELECT
    -- ── temporal ──────────────────────────────────────────────────────────
    t.ano,
    t.mes_num,
    t.mes_nome,
    t.trimestre,
    t.ano_mes_ref                                      AS ano_mes,

    -- ── fonte de recurso ──────────────────────────────────────────────────
    fr.fonte_id,
    fr.fonte_nome,
    fr.grupo                                           AS fonte_grupo,

    -- ── valor ─────────────────────────────────────────────────────────────
    r.valor                                            AS vl_arrecadacao,

    -- ── participação no mês (calculada via subquery inline) ───────────────
    ROUND(
        (r.valor / NULLIF(
            SUM(r.valor) OVER (PARTITION BY r.tempo_id), 0
        ) * 100)::numeric, 2
    )                                                  AS pct_participacao_mes

FROM analytics.fato_receita_mensal_fonte r
INNER JOIN analytics.dim_tempo t
    ON r.tempo_id = t.tempo_id
INNER JOIN analytics.dim_fonte_recurso fr
    ON r.fonte_id = fr.fonte_id
ORDER BY t.ano ASC, t.mes_num ASC, r.valor DESC;

COMMENT ON VIEW public.vw_receita_fonte IS
'Receita mensal de Boituva por fonte de recurso (tesouro, federal, estadual, convênios).
Join fato_receita_mensal_fonte x dim_tempo x dim_fonte_recurso.
Inclui percentual de participação por mês calculado via window function.
Fonte: TCE-SP via pipeline Boituva Digital Platform.';


-- ============================================================================
-- 4. vw_indicadores_ibge
-- ============================================================================
-- Propósito: indicadores socioeconômicos do município para cards KPI.
-- Fonte: fato_ibge_indicador_municipio (carregado de data/reference/ibge_indicators.json)
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_indicadores_ibge AS
SELECT
    i.indicador_id,
    i.indicador_nome,
    i.valor,
    i.unidade,
    i.ano_referencia,
    i.fonte,
    i.fonte_url,

    -- ── valor formatado como texto (conveniente para frontend) ─────────────
    CASE i.unidade
        WHEN 'pessoas'       THEN TO_CHAR(i.valor, 'FM999G999G999')
        WHEN 'km2'           THEN TO_CHAR(i.valor, 'FM999G990D99') || ' km²'
        WHEN 'hab_km2'       THEN TO_CHAR(i.valor, 'FM999G990D99') || ' hab/km²'
        WHEN 'percentual'    THEN TO_CHAR(i.valor, 'FM990D99') || '%'
        WHEN 'indice'        THEN TO_CHAR(i.valor, 'FM0D000')
        WHEN 'obitos_por_mil' THEN TO_CHAR(i.valor, 'FM990D99') || '/mil'
        WHEN 'brl'           THEN 'R$ ' || TO_CHAR(i.valor, 'FM999G999G990D00')
        ELSE i.valor::text
    END                                                AS valor_formatado,

    -- ── município de referência ────────────────────────────────────────────
    m.municipio_nome,
    m.uf_sigla

FROM analytics.fato_ibge_indicador_municipio i
INNER JOIN analytics.dim_municipio m
    ON i.municipio_id_ibge = m.municipio_id_ibge
ORDER BY i.ano_referencia DESC, i.indicador_id ASC;

COMMENT ON VIEW public.vw_indicadores_ibge IS
'Indicadores socioeconômicos do município de Boituva (IBGE/PNUD/DATASUS).
Inclui valor_formatado pronto para exibição no frontend.
Fonte: IBGE via data/reference/ibge_indicators.json.';


-- ============================================================================
-- 5. vw_secretarias
-- ============================================================================
-- Propósito: tabela de secretarias municipais para filtros e labels no frontend.
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_secretarias AS
SELECT
    secretaria_id,
    secretaria_nome,
    eixo,
    ativo
FROM analytics.dim_secretaria
WHERE ativo = true
ORDER BY eixo ASC, secretaria_nome ASC;

COMMENT ON VIEW public.vw_secretarias IS
'Secretarias municipais ativas de Boituva. Usada para filtros e labels no dashboard.
Fonte: data/reference/secretarias.json via pipeline upload_exec_cloud.';


-- ============================================================================
-- 6. vw_dim_tempo
-- ============================================================================
-- Propósito: calendário completo disponível nos dados — usado para filtros.
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_dim_tempo AS
SELECT
    tempo_id,
    ano,
    mes_num,
    mes_nome,
    trimestre,
    ano_mes_ref                                        AS ano_mes
FROM analytics.dim_tempo
ORDER BY ano ASC, mes_num ASC;

COMMENT ON VIEW public.vw_dim_tempo IS
'Calendário de períodos disponíveis nos dados de Boituva.
Usado pelo frontend para popular filtros de ano/mês.';


-- ============================================================================
-- 7. vw_pipeline_status (observabilidade)
-- ============================================================================
-- Propósito: permite que o frontend exiba o status da última atualização
-- sem expor a tabela de metadata diretamente.
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_pipeline_status AS
SELECT
    dataset,
    camada,
    pipeline AS fonte,
    status,
    data_execucao::text AS iniciado_em,
    data_execucao::text AS finalizado_em,
    registros AS registros_processados,
    mensagem AS observacoes,
    duracao_segundos
FROM metadata.pipeline_execucao
ORDER BY data_execucao DESC;

COMMENT ON VIEW public.vw_pipeline_status IS
'Status das últimas execuções dos pipelines de dados de Boituva.
Permite que o frontend mostre "Atualizado em: ..." sem expor metadata completo.';


-- ============================================================================
-- Índices recomendados no schema analytics
-- ============================================================================
-- Execute após criar as tabelas. Melhora performance dos joins nas views.

-- fato_financeiro_mensal: FK principal para join com dim_tempo
CREATE INDEX IF NOT EXISTS idx_fato_financeiro_tempo_id
    ON analytics.fato_financeiro_mensal (tempo_id);

-- fato_financeiro_mensal: filtro por município (quando múltiplos municípios forem adicionados)
CREATE INDEX IF NOT EXISTS idx_fato_financeiro_municipio
    ON analytics.fato_financeiro_mensal (municipio_id_ibge);

-- fato_receita_mensal_fonte: FKs para os dois joins da vw_receita_fonte
CREATE INDEX IF NOT EXISTS idx_fato_receita_tempo_id
    ON analytics.fato_receita_mensal_fonte (tempo_id);

CREATE INDEX IF NOT EXISTS idx_fato_receita_fonte_id
    ON analytics.fato_receita_mensal_fonte (fonte_id);

-- fato_ibge_indicador: FK para join com dim_municipio
CREATE INDEX IF NOT EXISTS idx_fato_ibge_municipio
    ON analytics.fato_ibge_indicador_municipio (municipio_id_ibge);

-- dim_tempo: lookups por ano (filtro mais comum no frontend)
CREATE INDEX IF NOT EXISTS idx_dim_tempo_ano
    ON analytics.dim_tempo (ano);

-- pipeline_execucao: ordem desc por data_execucao (vw_pipeline_status)
CREATE INDEX IF NOT EXISTS idx_pipeline_exec_finalizado
    ON metadata.pipeline_execucao (data_execucao DESC NULLS LAST);


-- ============================================================================
-- Validação: verifica se as views retornam dados
-- ============================================================================
-- Execute após aplicar a migration para confirmar:
--
-- SELECT COUNT(*) FROM public.vw_financeiro_mensal;     -- deve ser > 0
-- SELECT COUNT(*) FROM public.vw_financeiro_anual;      -- deve retornar 1 linha por ano
-- SELECT COUNT(*) FROM public.vw_receita_fonte;         -- deve ser > 0
-- SELECT COUNT(*) FROM public.vw_indicadores_ibge;      -- deve ser >= 6
-- SELECT COUNT(*) FROM public.vw_secretarias;           -- deve ser 7
-- SELECT COUNT(*) FROM public.vw_dim_tempo;             -- deve ser = meses disponíveis
-- SELECT COUNT(*) FROM public.vw_pipeline_status;       -- deve ser >= 1 após 1 execução
--
-- Para validar performance (plano de execução):
-- EXPLAIN ANALYZE SELECT * FROM public.vw_financeiro_mensal WHERE ano = 2025;
-- EXPLAIN ANALYZE SELECT * FROM public.vw_receita_fonte WHERE ano = 2025;
-- ============================================================================


-- ============================================================================
-- Nota sobre Materialized Views (uso futuro)
-- ============================================================================
-- Quando usar MATERIALIZED VIEW:
--   - Volume > 500k linhas em fato_financeiro_mensal
--   - Latência da vw_financeiro_anual > 200ms (medir com EXPLAIN ANALYZE)
--   - Dashboard com > 50 usuários simultâneos
--
-- Exemplo de materialização futura:
--
-- CREATE MATERIALIZED VIEW public.mvw_financeiro_anual AS
--   SELECT * FROM public.vw_financeiro_anual;
-- CREATE UNIQUE INDEX ON public.mvw_financeiro_anual (ano);
--
-- Refresh após pipeline:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY public.mvw_financeiro_anual;
--
-- No contexto atual (Boituva, ~150 registros mensais, equipe pequena),
-- views simples são suficientes. Materializar prematuramente é overengineering.
-- ============================================================================
