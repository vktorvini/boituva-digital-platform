import { supabase } from "@/lib/supabase";

function getClient() {
  if (!supabase) {
    throw new Error("Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }

  return supabase;
}

export async function fetchFinanceiroAnual() {
  const client = getClient();
  const { data, error } = await client
    .from("gold_financeiro_anual")
    .select("*")
    .order("ano", { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchFinanceiroMensal() {
  const client = getClient();
  const { data, error } = await client
    .from("gold_financeiro_mensal")
    .select("*")
    .order("ano", { ascending: true })
    .order("mes_num", { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchDespesaEvento() {
  const client = getClient();
  const { data, error } = await client
    .from("gold_despesa_mensal_evento")
    .select("*")
    .order("ano", { ascending: true })
    .order("mes_num", { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchReceitaFonte() {
  const client = getClient();
  const { data, error } = await client
    .from("gold_receita_mensal_fonte")
    .select("*")
    .order("ano", { ascending: true })
    .order("mes_num", { ascending: true });

  if (error) throw error;
  return data;
}
