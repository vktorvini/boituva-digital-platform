-- Monthly expense aggregation by the organization identified in TCE-SP records.
-- This grain is Prefeitura/Câmara, not municipal secretariat.
CREATE TABLE analytics.fato_despesa_mensal_orgao (
    tempo_id text NOT NULL REFERENCES analytics.dim_tempo (tempo_id),
    municipio_id_ibge bigint NOT NULL REFERENCES analytics.dim_municipio (municipio_id_ibge),
    orgao_nome text NOT NULL,
    despesa_empenhada numeric(18, 2) NOT NULL DEFAULT 0,
    despesa_liquidada numeric(18, 2) NOT NULL DEFAULT 0,
    despesa_paga numeric(18, 2) NOT NULL DEFAULT 0,
    CONSTRAINT fato_despesa_mensal_orgao_pkey
        PRIMARY KEY (tempo_id, municipio_id_ibge, orgao_nome)
);

CREATE INDEX idx_fato_despesa_mensal_orgao_org_period
    ON analytics.fato_despesa_mensal_orgao (municipio_id_ibge, orgao_nome, tempo_id);

ALTER TABLE analytics.fato_despesa_mensal_orgao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access on fato_despesa_mensal_orgao"
    ON analytics.fato_despesa_mensal_orgao
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow full access for service_role on fato_despesa_mensal_orgao"
    ON analytics.fato_despesa_mensal_orgao
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

GRANT SELECT ON analytics.fato_despesa_mensal_orgao TO anon, authenticated;
GRANT ALL ON analytics.fato_despesa_mensal_orgao TO service_role;

COMMENT ON TABLE analytics.fato_despesa_mensal_orgao IS
'Despesas mensais agregadas por órgão identificado nos dados TCE-SP. Órgão não equivale a secretaria.';

CREATE OR REPLACE VIEW public.vw_despesa_mensal_orgao AS
SELECT
    t.ano,
    t.mes_num,
    t.mes_nome,
    t.ano_mes_ref AS ano_mes,
    f.orgao_nome,
    f.despesa_empenhada,
    f.despesa_liquidada,
    f.despesa_paga,
    f.municipio_id_ibge
FROM analytics.fato_despesa_mensal_orgao f
INNER JOIN analytics.dim_tempo t
    ON f.tempo_id = t.tempo_id;

COMMENT ON VIEW public.vw_despesa_mensal_orgao IS
'Despesas empenhadas, liquidadas e pagas por mês e órgão TCE-SP (Prefeitura/Câmara), não por secretaria.';

GRANT SELECT ON public.vw_despesa_mensal_orgao TO anon, authenticated;
