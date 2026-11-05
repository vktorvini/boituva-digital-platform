import { supabase, hasSupabaseConfig } from "@/lib/supabase";

export interface CandidateResult {
  nome: string;
  partido: string;
  votos: number;
  percentual: string;
  status: "Eleito" | "Não Eleito" | "Suplente";
}

export interface ElectionYearSummary {
  ano: number;
  cargo: string;
  total_votos: number;
  brancos_nulos: number;
  abstencao: number;
  candidatos: CandidateResult[]; // Candidatos a Prefeito
  vereadores: CandidateResult[]; // Vereadores Eleitos
  vereadores_resumo?: string;
}

/**
 * Busca o histórico de eleições municipais para Boituva consumindo o nosso Banco de Dados
 * Os dados são populados via script de pipeline (sync_tse_history.py)
 */
export async function fetchTseElectionHistory(): Promise<ElectionYearSummary[]> {
  if (!hasSupabaseConfig || !supabase) {
    console.warn("Supabase não configurado. Usando fallback.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("tse_eleicoes_boituva")
      .select("*")
      .order("ano", { ascending: false });

    if (error) {
      console.warn("Tabela 'tse_eleicoes_boituva' ainda não populada.");
      return [];
    }

    const groupedByYear = (data || []).reduce((acc: any, curr: any) => {
      if (!acc[curr.ano]) {
        acc[curr.ano] = {
          ano: curr.ano,
          cargo: "Prefeito e Vereadores",
          total_votos: 0,
          brancos_nulos: 0, 
          abstencao: 0,
          candidatos: [],
          vereadores: [],
          vereadores_resumo: "Dados oficiais via Pipeline"
        };
      }
      
      const candidate = {
        nome: curr.candidato_nome,
        partido: curr.partido,
        votos: curr.votos,
        percentual: `${curr.percentual}%`,
        status: curr.situacao === "ELEITO" ? "Eleito" : "Não Eleito"
      };

      if (curr.cargo === "Prefeito") {
        acc[curr.ano].candidatos.push(candidate);
        acc[curr.ano].total_votos += curr.votos;
      } else {
        acc[curr.ano].vereadores.push(candidate);
      }
      
      return acc;
    }, {});

    Object.values(groupedByYear).forEach((year: any) => {
      year.candidatos.sort((a: any, b: any) => b.votos - a.votos);
      year.vereadores.sort((a: any, b: any) => b.votos - a.votos);
      year.vereadores_resumo = `${year.vereadores.length} vereadores eleitos em ${year.ano}`;
    });

    return Object.values(groupedByYear) as ElectionYearSummary[];

  } catch (err) {
    console.error("Erro ao carregar histórico do Banco de Dados:", err);
    return [];
  }
}
