import { supabase } from "@/lib/supabase";

export async function fetchFinanceiroAnual() {
  const { data, error } = await supabase
    .from("gold_financeiro_anual")
    .select("*")
    .order("ano", { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchFinanceiroMensal() {
  const { data, error } = await supabase
    .from("gold_financeiro_mensal")
    .select("*")
    .order("ano", { ascending: true })
    .order("mes_num", { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchDespesaEvento() {
  const { data, error } = await supabase
    .from("gold_despesa_mensal_evento")
    .select("*")
    .order("ano", { ascending: true })
    .order("mes_num", { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchReceitaFonte() {
  const { data, error } = await supabase
    .from("gold_receita_mensal_fonte")
    .select("*")
    .order("ano", { ascending: true })
    .order("mes_num", { ascending: true });

  if (error) throw error;
  return data;
}