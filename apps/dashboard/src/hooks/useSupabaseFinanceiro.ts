/**
 * useSupabaseFinanceiro — camada de consumo das public views
 * ===========================================================
 * Consome EXCLUSIVAMENTE as views public.vw_* do Supabase.
 * O schema analytics nunca é acessado diretamente pelo frontend.
 *
 * Views consumidas (definidas em supabase/migrations/001_public_views.sql):
 *   public.vw_financeiro_mensal   → série mensal + saldos calculados
 *   public.vw_financeiro_anual    → agregado anual
 *   public.vw_receita_fonte       → receita por fonte de recurso
 *   public.vw_indicadores_ibge    → indicadores IBGE com valor_formatado
 *   public.vw_secretarias         → secretarias ativas
 *   public.vw_pipeline_status     → status da última atualização
 *
 * Padrões adotados:
 *   - React Query para cache e re-fetch automático
 *   - staleTime calibrado por frequência de atualização dos dados
 *   - Tipos TypeScript alinhados exatamente às colunas das views
 *   - Sem lógica de negócio nos hooks (saldos vêm prontos da view)
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── tipos ─────────────────────────────────────────────────────────────────────

export interface FinanceiroMensal {
  ano: number;
  mes_num: number;
  mes_nome: string;
  trimestre: number;
  ano_mes: string;
  receita_realizada: number;
  receita_prevista: number | null;
  despesa_empenhada: number;
  despesa_liquidada: number;
  despesa_paga: number;
  saldo_vs_pago: number;
  saldo_vs_empenhado: number;
  gap_empenhado_pago: number;
  pct_execucao_financeira: number | null;
  pct_pressao_fiscal: number | null;
  municipio_id_ibge: number;
}

export interface FinanceiroAnual {
  ano: number;
  receita_total: number;
  despesa_empenhada: number;
  despesa_liquidada: number;
  despesa_paga: number;
  saldo_vs_pago: number;
  saldo_vs_empenhado: number;
  pct_execucao_financeira: number | null;
  pct_pressao_fiscal: number | null;
  meses_com_dados: number;
}

export interface ReceitaFonte {
  ano: number;
  mes_num: number;
  mes_nome: string;
  trimestre: number;
  ano_mes: string;
  fonte_id: string;
  fonte_nome: string;
  fonte_grupo: string;
  vl_arrecadacao: number;
  pct_participacao_mes: number | null;
}

export interface IndicadorIbge {
  indicador_id: string;
  indicador_nome: string;
  valor: number;
  unidade: string;
  ano_referencia: number;
  fonte: string;
  fonte_url: string | null;
  valor_formatado: string;
  municipio_nome: string;
  uf_sigla: string;
}

export interface Secretaria {
  secretaria_id: string;
  secretaria_nome: string;
  eixo: string;
  ativo: boolean;
}

export interface DimTempo {
  tempo_id: string;
  ano: number;
  mes_num: number;
  mes_nome: string;
  trimestre: number;
  ano_mes: string;
}

export interface PipelineStatus {
  dataset: string;
  camada: string;
  fonte: string;
  status: string;
  iniciado_em: string;
  finalizado_em: string;
  registros_processados: number | null;
  observacoes: string | null;
  duracao_segundos: number | null;
}

// ── client helper ─────────────────────────────────────────────────────────────

function getClient() {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado. " +
      "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env"
    );
  }
  return supabase;
}

// ── hooks individuais ─────────────────────────────────────────────────────────

/**
 * Série mensal completa com saldos pré-calculados.
 * staleTime: 5 min — dados mudam apenas após execução do pipeline.
 */
export function useFinanceiroMensal(ano?: number) {
  return useQuery<FinanceiroMensal[]>({
    queryKey: ["vw_financeiro_mensal", ano],
    queryFn: async () => {
      let query = getClient()
        .from("vw_financeiro_mensal")
        .select(`
          ano, mes_num, mes_nome, trimestre, ano_mes,
          receita_realizada, receita_prevista,
          despesa_empenhada, despesa_liquidada, despesa_paga,
          saldo_vs_pago, saldo_vs_empenhado, gap_empenhado_pago,
          pct_execucao_financeira, pct_pressao_fiscal,
          municipio_id_ibge
        `)
        .order("ano", { ascending: true })
        .order("mes_num", { ascending: true });

      if (ano) query = query.eq("ano", ano);

      const { data, error } = await query;
      if (error) throw new Error(`vw_financeiro_mensal: ${error.message}`);
      return (data ?? []) as FinanceiroMensal[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Consolidado anual — comparação histórica e gráfico de tendência.
 * staleTime: 10 min — muda apenas quando novos anos são processados.
 */
export function useFinanceiroAnual() {
  return useQuery<FinanceiroAnual[]>({
    queryKey: ["vw_financeiro_anual"],
    queryFn: async () => {
      const { data, error } = await getClient()
        .from("vw_financeiro_anual")
        .select(`
          ano,
          receita_total, despesa_empenhada, despesa_liquidada, despesa_paga,
          saldo_vs_pago, saldo_vs_empenhado,
          pct_execucao_financeira, pct_pressao_fiscal,
          meses_com_dados
        `)
        .order("ano", { ascending: true });

      if (error) throw new Error(`vw_financeiro_anual: ${error.message}`);
      return (data ?? []) as FinanceiroAnual[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Receita por fonte de recurso — composição da arrecadação.
 * staleTime: 5 min.
 */
export function useReceitaFonte(ano?: number) {
  return useQuery<ReceitaFonte[]>({
    queryKey: ["vw_receita_fonte", ano],
    queryFn: async () => {
      let query = getClient()
        .from("vw_receita_fonte")
        .select(`
          ano, mes_num, mes_nome, trimestre, ano_mes,
          fonte_id, fonte_nome, fonte_grupo,
          vl_arrecadacao, pct_participacao_mes
        `)
        .order("ano", { ascending: true })
        .order("mes_num", { ascending: true })
        .order("vl_arrecadacao", { ascending: false });

      if (ano) query = query.eq("ano", ano);

      const { data, error } = await query;
      if (error) throw new Error(`vw_receita_fonte: ${error.message}`);
      return (data ?? []) as ReceitaFonte[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Indicadores socioeconômicos do IBGE com valor_formatado pronto.
 * staleTime: 60 min — muda raramente (dados de referência estáveis).
 */
export function useIndicadoresIbge() {
  return useQuery<IndicadorIbge[]>({
    queryKey: ["vw_indicadores_ibge"],
    queryFn: async () => {
      const { data, error } = await getClient()
        .from("vw_indicadores_ibge")
        .select(`
          indicador_id, indicador_nome,
          valor, unidade, valor_formatado,
          ano_referencia, fonte, fonte_url,
          municipio_nome, uf_sigla
        `)
        .order("ano_referencia", { ascending: false });

      if (error) throw new Error(`vw_indicadores_ibge: ${error.message}`);
      return (data ?? []) as IndicadorIbge[];
    },
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Secretarias municipais ativas — usado para filtros e labels.
 * staleTime: 24h — praticamente estático.
 */
export function useSecretarias() {
  return useQuery<Secretaria[]>({
    queryKey: ["vw_secretarias"],
    queryFn: async () => {
      const { data, error } = await getClient()
        .from("vw_secretarias")
        .select("secretaria_id, secretaria_nome, eixo, ativo")
        .order("eixo", { ascending: true })
        .order("secretaria_nome", { ascending: true });

      if (error) throw new Error(`vw_secretarias: ${error.message}`);
      return (data ?? []) as Secretaria[];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Calendário disponível — anos e meses com dados para popular filtros.
 * staleTime: 10 min.
 */
export function useDimTempo() {
  return useQuery<DimTempo[]>({
    queryKey: ["vw_dim_tempo"],
    queryFn: async () => {
      const { data, error } = await getClient()
        .from("vw_dim_tempo")
        .select("tempo_id, ano, mes_num, mes_nome, trimestre, ano_mes")
        .order("ano", { ascending: true })
        .order("mes_num", { ascending: true });

      if (error) throw new Error(`vw_dim_tempo: ${error.message}`);
      return (data ?? []) as DimTempo[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Status das últimas execuções do pipeline — observabilidade no frontend.
 * Exibe "Atualizado em: ..." sem expor metadata completo.
 * staleTime: 1 min — útil durante execução do pipeline.
 */
export function usePipelineStatus(dataset?: string) {
  return useQuery<PipelineStatus[]>({
    queryKey: ["vw_pipeline_status", dataset],
    queryFn: async () => {
      let query = getClient()
        .from("vw_pipeline_status")
        .select(
          "dataset, camada, fonte, status, iniciado_em, finalizado_em, " +
          "registros_processados, observacoes, duracao_segundos"
        )
        .order("finalizado_em", { ascending: false })
        .limit(20);

      if (dataset) query = query.eq("dataset", dataset);

      const { data, error } = await query;
      if (error) throw new Error(`vw_pipeline_status: ${error.message}`);
      return (data ?? []) as PipelineStatus[];
    },
    staleTime: 60 * 1000,
  });
}

// ── hook agregado principal ───────────────────────────────────────────────────

/**
 * useSupabaseFinanceiro — hook principal do dashboard executivo.
 *
 * Agrega dados de múltiplas views públicas e computa KPIs prontos.
 * Uso recomendado: import { useSupabaseFinanceiro } nas páginas principais.
 *
 * Exemplo:
 *   const { kpis, isLoading, isError } = useSupabaseFinanceiro(2025);
 */
export function useSupabaseFinanceiro(ano?: number, mes: string = "all") {
  const mensal        = useFinanceiroMensal(ano);
  const anual         = useFinanceiroAnual();
  const receitaFonte  = useReceitaFonte(ano);
  const indicadores   = useIndicadoresIbge();

  const isLoading = mensal.isLoading || anual.isLoading || receitaFonte.isLoading;
  const isError   = mensal.isError   || anual.isError   || receitaFonte.isError;
  const error     = mensal.error     || anual.error     || receitaFonte.error;

  const mesNum = mes !== "all" ? Number(mes) : null;

  const anoData = (mensal.data ?? []).filter((r) => {
    if (ano && r.ano !== ano) return false;
    if (mesNum != null && !Number.isNaN(mesNum) && r.mes_num !== mesNum) return false;
    return true;
  });

  // KPIs calculados a partir dos saldos que já vêm prontos da view
  const kpis = {
    receitaTotal:            anoData.reduce((s, r) => s + (r.receita_realizada    ?? 0), 0),
    despesaPaga:             anoData.reduce((s, r) => s + (r.despesa_paga         ?? 0), 0),
    despesaEmpenhada:        anoData.reduce((s, r) => s + (r.despesa_empenhada    ?? 0), 0),
    despesaLiquidada:        anoData.reduce((s, r) => s + (r.despesa_liquidada    ?? 0), 0),
    saldoPago:               anoData.reduce((s, r) => s + (r.saldo_vs_pago        ?? 0), 0),
    saldoEmpenhado:          anoData.reduce((s, r) => s + (r.saldo_vs_empenhado   ?? 0), 0),
    gapEmpenhadoPago:        anoData.reduce((s, r) => s + (r.gap_empenhado_pago   ?? 0), 0),
  };

  // Taxas agregadas (média ponderada pela receita)
  const pctExecucaoFinanceira =
    kpis.despesaEmpenhada > 0
      ? Math.round((kpis.despesaPaga / kpis.despesaEmpenhada) * 10000) / 100
      : null;

  const pctPressaoFiscal =
    kpis.receitaTotal > 0
      ? Math.round((kpis.gapEmpenhadoPago / kpis.receitaTotal) * 10000) / 100
      : null;

  // Anos disponíveis para o seletor de filtro
  const anosDisponiveis = [...new Set((anual.data ?? []).map((r) => r.ano))].sort((a, b) => b - a);

  return {
    // queries individuais (para acesso granular)
    mensal,
    anual,
    receitaFonte,
    indicadores,
    // estado
    isLoading,
    isError,
    error,
    // dados do ano selecionado
    anoData,
    // KPIs prontos para exibição
    kpis,
    pctExecucaoFinanceira,
    pctPressaoFiscal,
    // meta
    anosDisponiveis,
  };
}
