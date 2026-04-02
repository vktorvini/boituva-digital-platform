import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  FinanceiroMensal,
  FinanceiroAnual,
  ReceitaMensalFonte,
  DespesaMensalEvento,
  IndicadorFiscal,
} from "@/data/mockData";

interface UseDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error: string | null;
}

function useAsyncQuery<T>(fetcher: () => Promise<T>): UseDataResult<T> {
  const [state, setState] = useState<UseDataResult<T>>({
    data: null,
    isLoading: true,
    isError: false,
    isEmpty: false,
    error: null,
  });

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const result = await fetcher();
        const empty = Array.isArray(result) ? result.length === 0 : !result;

        if (!active) return;

        setState({
          data: result,
          isLoading: false,
          isError: false,
          isEmpty: empty,
          error: null,
        });
      } catch (e) {
        if (!active) return;

        setState({
          data: null,
          isLoading: false,
          isError: true,
          isEmpty: false,
          error: (e as Error).message,
        });
      }
    }

    run();

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useFinanceiroMensal(): UseDataResult<FinanceiroMensal[]> {
  return useAsyncQuery(async () => {
    const { data, error } = await supabase
      .from("gold_financeiro_mensal")
      .select("*")
      .order("ano", { ascending: true })
      .order("mes_num", { ascending: true });

    if (error) throw error;

    const meses = [
      "",
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    return (data ?? []).map((item) => ({
      ano: item.ano,
      mes_num: item.mes_num,
      mes_nome: meses[item.mes_num] ?? `Mês ${item.mes_num}`,
      ano_mes_ref: item.ano_mes_ref,
      receita_realizada: item.receita_total ?? 0,
      despesa_empenhada: item.despesa_empenhada ?? 0,
      despesa_liquidada: item.despesa_liquidada ?? 0,
      despesa_paga: item.despesa_paga ?? 0,
      despesa_anulada: item.despesa_anulada ?? 0,
      despesa_reforcada: item.despesa_reforcada ?? 0,
      despesa_outros_eventos: item.despesa_outros_eventos ?? 0,
      saldo_receita_vs_pago: item.saldo_receita_vs_pago ?? 0,
      saldo_receita_vs_empenhado: item.saldo_receita_vs_empenhado ?? 0,
      saldo_acumulado_vs_pago: item.saldo_acumulado_vs_pago ?? 0,
      saldo_acumulado_vs_empenhado: item.saldo_acumulado_vs_empenhado ?? 0,
    })) as FinanceiroMensal[];
  });
}

export function useFinanceiroAnual(ano?: number): UseDataResult<FinanceiroAnual | null> {
  return useAsyncQuery(async () => {
    let query = supabase
      .from("gold_financeiro_anual")
      .select("*")
      .order("ano", { ascending: true });

    if (ano) {
      query = query.eq("ano", ano);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const row = ano
      ? data.find((item) => item.ano === ano) ?? null
      : data[data.length - 1];

    if (!row) return null;

    const receitaRealizada = row.receita_total ?? 0;
    const despesaEmpenhada = row.despesa_empenhada ?? 0;

    return {
      ano: row.ano,
      receita_realizada: receitaRealizada,
      receita_prevista: receitaRealizada,
      despesa_empenhada: despesaEmpenhada,
      despesa_autorizada: despesaEmpenhada,
      percentual_execucao_receita: 100,
      percentual_execucao_despesa: 100,
      despesa_liquidada: row.despesa_liquidada ?? 0,
      despesa_paga: row.despesa_paga ?? 0,
      despesa_anulada: row.despesa_anulada ?? 0,
      despesa_reforcada: row.despesa_reforcada ?? 0,
      despesa_outros_eventos: row.despesa_outros_eventos ?? 0,
      saldo_receita_vs_pago: row.saldo_receita_vs_pago ?? 0,
      saldo_receita_vs_empenhado: row.saldo_receita_vs_empenhado ?? 0,
    } as FinanceiroAnual;
  });
}

export function useReceitaMensalFonte(): UseDataResult<ReceitaMensalFonte[]> {
  return useAsyncQuery(async () => {
    const { data, error } = await supabase
      .from("gold_receita_mensal_fonte")
      .select("*")
      .eq("ano", 2025)
      .eq("mes_num", 6)
      .order("vl_arrecadacao_total", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((item, index) => ({
      id: `${item.ano}-${item.mes_num}-${index}`,
      fonte: item.ds_fonte_recurso_norm ?? "Sem classificação",
      valor_previsto: item.vl_arrecadacao_total ?? 0,
      valor_realizado: item.vl_arrecadacao_total ?? 0,
      percentual: 100,
    })) as ReceitaMensalFonte[];
  });
}

export function useDespesaMensalEvento(): UseDataResult<DespesaMensalEvento[]> {
  return useAsyncQuery(async () => {
    const { data, error } = await supabase
      .from("gold_despesa_mensal_evento")
      .select("*")
      .order("ano", { ascending: true })
      .order("mes_num", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((item) => ({
      ano: item.ano,
      mes_num: item.mes_num,
      ano_mes_ref: item.ano_mes_ref,
      categoria_evento: item.categoria_evento,
      vl_despesa_total: item.vl_despesa_total ?? 0,
    })) as DespesaMensalEvento[];
  });
}

export function useIndicadoresFiscais(): UseDataResult<IndicadorFiscal[]> {
  return useAsyncQuery(async () => {
    return [];
  });
}

export function useAlertasAtivos(): UseDataResult<IndicadorFiscal[]> {
  return useAsyncQuery(async () => {
    return [];
  });
}