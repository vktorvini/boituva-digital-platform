import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export interface TseSourceRow {
  dataset_key: string;
  packages: number;
  resources: number;
}

export interface TseSourceData {
  status: string;
  summary: {
    datasets: number;
    packages: number;
    resources: number;
  };
  rows: TseSourceRow[];
}

export interface SidraSourceRow {
  indicador_id: string;
  municipio_id_ibge: number;
  ano_nome: string;
  valor_numerico: number | null;
  unidade: string;
}

export interface SidraSourceData {
  status: string;
  summary: {
    rows: number;
    indicadores: number;
  };
  rows: SidraSourceRow[];
  grouped: Array<{
    indicador_id: string;
    registros: number;
    media_valor: number | null;
  }>;
}

export interface PncpSummaryRow {
  dataset_key: string;
  registros: number;
  valor_total: number;
}

export interface PncpDetailRow {
  dataset_key: string;
  numero_controle_pncp: string | null;
  orgao_entidade: string | null;
  municipio_nome: string | null;
  uf_sigla: string | null;
  valor_total: number | null;
  data_inclusao: string | null;
  valor_total_num: number | null;
}

export interface PncpSourceData {
  status: string;
  summary: {
    datasets: number;
    registros: number;
    valor_total: number;
  };
  rows: PncpSummaryRow[];
  detail: PncpDetailRow[];
}

export interface SiconfiSourceData {
  status: string;
  summary: Array<{
    an_exercicio: number;
    nr_periodo: number;
    registros: number;
    has_more: boolean;
  }>;
  detail: Array<Record<string, string | number | null>>;
}

export interface TcespSourceData {
  status: string;
  summary: {
    exports: number;
    sucesso: number;
  };
  rows: Array<{
    dataset_key: string;
    url: string;
    output_path: string;
    status: string;
    error_message: string | null;
  }>;
  regional?: {
    status: string;
    summary?: {
      municipios: number;
      com_nota_iegm_2025: number;
      com_nota_igovti_2025: number;
    };
    rows: Array<Record<string, string | number | boolean | null>>;
    axes: Array<{
      axis: string;
      boituva_value: number | null;
      regional_average: number;
      benchmark_municipio: string;
      benchmark_value: number;
      gap_to_regional_average: number | null;
    }>;
  };
}

export interface ExecFiscalRow {
  ano: number;
  mes_num: number;
  ano_mes_ref: string;
  receita_realizada: number;
  despesa_paga: number;
  despesa_empenhada: number;
  saldo_vs_pago: number;
  saldo_vs_empenhado: number;
  pressao_fiscal: number;
}

async function fetchSourceJson<T>(fileName: string): Promise<T> {
  const response = await fetch(`/data/sources/${fileName}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao carregar /data/sources/${fileName}`);
  }
  return response.json() as Promise<T>;
}

export function fetchTseSourceData() {
  return fetchSourceJson<TseSourceData>("tse.json");
}

export function fetchSidraSourceData() {
  return fetchSourceJson<SidraSourceData>("sidra.json");
}

export function fetchPncpSourceData() {
  return fetchSourceJson<PncpSourceData>("pncp.json");
}

export function fetchSiconfiSourceData() {
  return fetchSourceJson<SiconfiSourceData>("siconfi.json");
}

export function fetchTcespSourceData() {
  return fetchSourceJson<TcespSourceData>("tcesp.json");
}

export async function fetchExecFiscalSeries(): Promise<ExecFiscalRow[]> {
  if (!hasSupabaseConfig || !supabase) return [];

  const { data, error } = await supabase
    .from("vw_exec_resumo_periodo")
    .select("ano,mes_num,ano_mes_ref,receita_realizada,despesa_paga,despesa_empenhada,saldo_vs_pago,saldo_vs_empenhado,pressao_fiscal")
    .order("ano", { ascending: true })
    .order("mes_num", { ascending: true });

  if (error) return [];
  return (data ?? []) as ExecFiscalRow[];
}
