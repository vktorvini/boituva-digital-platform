-- ============================================================================
-- 002_rls_security.sql
-- Propósito: Configurar Row Level Security (RLS) e permissões granulares.
-- ============================================================================

-- 1. Revogar privilégios públicos do schema analytics e metadata (opcional, mas boa prática)
REVOKE ALL ON SCHEMA analytics FROM PUBLIC;
REVOKE ALL ON SCHEMA metadata FROM PUBLIC;

-- Concede uso do schema para o anon (necessário para que as views possam ser acessadas caso a view owner defina security invoker, mas aqui usaremos security definer ou default)
GRANT USAGE ON SCHEMA analytics TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA metadata TO anon, authenticated, service_role;

-- 2. Habilitar RLS em TODAS as tabelas do schema analytics
ALTER TABLE analytics.dim_tempo ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.dim_secretaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.dim_fonte_recurso ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.dim_municipio ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.fato_financeiro_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.fato_receita_mensal_fonte ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.fato_ibge_indicador_municipio ENABLE ROW LEVEL SECURITY;

-- 3. Habilitar RLS em TODAS as tabelas do schema metadata
ALTER TABLE metadata.pipeline_execucao ENABLE ROW LEVEL SECURITY;

-- 4. Criar Policies - Somente Leitura (SELECT) para o usuário "anon" (frontend)
-- Como as views públicas acessam os dados, precisamos permitir que o 'anon' role leia as tabelas base
-- se as views forem executadas com SECURITY INVOKER. Por padrão são SECURITY DEFINER do owner, mas
-- habilitar a policy SELECT garante que consultas da API REST também fiquem readonly.

-- Schema: analytics
CREATE POLICY "Allow public read-only access on dim_tempo" ON analytics.dim_tempo FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on dim_secretaria" ON analytics.dim_secretaria FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on dim_fonte_recurso" ON analytics.dim_fonte_recurso FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on dim_municipio" ON analytics.dim_municipio FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on fato_financeiro_mensal" ON analytics.fato_financeiro_mensal FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on fato_receita_mensal_fonte" ON analytics.fato_receita_mensal_fonte FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read-only access on fato_ibge_indicador_municipio" ON analytics.fato_ibge_indicador_municipio FOR SELECT TO anon, authenticated USING (true);

-- Schema: metadata
CREATE POLICY "Allow public read-only access on pipeline_execucao" ON metadata.pipeline_execucao FOR SELECT TO anon, authenticated USING (true);

-- 5. Criar Policies - Acesso Total (ALL) para o usuário "service_role" (backend Python)
CREATE POLICY "Allow full access for service_role on dim_tempo" ON analytics.dim_tempo FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for service_role on dim_secretaria" ON analytics.dim_secretaria FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for service_role on dim_fonte_recurso" ON analytics.dim_fonte_recurso FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for service_role on dim_municipio" ON analytics.dim_municipio FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for service_role on fato_financeiro_mensal" ON analytics.fato_financeiro_mensal FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for service_role on fato_receita_mensal_fonte" ON analytics.fato_receita_mensal_fonte FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for service_role on fato_ibge_indicador_municipio" ON analytics.fato_ibge_indicador_municipio FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for service_role on pipeline_execucao" ON metadata.pipeline_execucao FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Grant SELECT nas views públicas para anon e authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
