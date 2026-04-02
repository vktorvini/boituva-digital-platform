// Mock data compatível com estrutura gold para futura migração Supabase/Postgres

export interface FinanceiroMensal {
  id: string;
  ano: number;
  mes: number;
  mes_nome: string;
  receita_realizada: number;
  despesa_empenhada: number;
  despesa_liquidada: number;
  despesa_paga: number;
  superavit_deficit: number;
}

export interface FinanceiroAnual {
  id: string;
  ano: number;
  receita_prevista: number;
  receita_realizada: number;
  despesa_autorizada: number;
  despesa_empenhada: number;
  despesa_liquidada: number;
  despesa_paga: number;
  percentual_execucao_receita: number;
  percentual_execucao_despesa: number;
}

export interface ReceitaMensalFonte {
  id: string;
  ano: number;
  mes: number;
  fonte: string;
  valor_previsto: number;
  valor_realizado: number;
  percentual: number;
}

export interface DespesaMensalEvento {
  id: string;
  ano: number;
  mes: number;
  secretaria: string;
  funcao: string;
  valor_empenhado: number;
  valor_liquidado: number;
  valor_pago: number;
}

export interface IndicadorFiscal {
  id: string;
  ano: number;
  trimestre: number;
  indicador: string;
  valor: number;
  limite_legal: number;
  status: "normal" | "atencao" | "critico";
  descricao: string;
}

// --- GOLD_FINANCEIRO_MENSAL ---
export const goldFinanceiroMensal: FinanceiroMensal[] = [
  { id: "fm-1", ano: 2025, mes: 1, mes_nome: "Janeiro", receita_realizada: 42500000, despesa_empenhada: 40200000, despesa_liquidada: 38100000, despesa_paga: 36800000, superavit_deficit: 2300000 },
  { id: "fm-2", ano: 2025, mes: 2, mes_nome: "Fevereiro", receita_realizada: 38900000, despesa_empenhada: 39100000, despesa_liquidada: 37500000, despesa_paga: 35200000, superavit_deficit: -200000 },
  { id: "fm-3", ano: 2025, mes: 3, mes_nome: "Março", receita_realizada: 45200000, despesa_empenhada: 42800000, despesa_liquidada: 41200000, despesa_paga: 39500000, superavit_deficit: 2400000 },
  { id: "fm-4", ano: 2025, mes: 4, mes_nome: "Abril", receita_realizada: 41300000, despesa_empenhada: 43500000, despesa_liquidada: 40100000, despesa_paga: 38200000, superavit_deficit: -2200000 },
  { id: "fm-5", ano: 2025, mes: 5, mes_nome: "Maio", receita_realizada: 44800000, despesa_empenhada: 41900000, despesa_liquidada: 40500000, despesa_paga: 39100000, superavit_deficit: 2900000 },
  { id: "fm-6", ano: 2025, mes: 6, mes_nome: "Junho", receita_realizada: 43100000, despesa_empenhada: 44200000, despesa_liquidada: 42800000, despesa_paga: 41500000, superavit_deficit: -1100000 },
];

// --- GOLD_FINANCEIRO_ANUAL ---
export const goldFinanceiroAnual: FinanceiroAnual[] = [
  { id: "fa-1", ano: 2023, receita_prevista: 480000000, receita_realizada: 462000000, despesa_autorizada: 490000000, despesa_empenhada: 455000000, despesa_liquidada: 438000000, despesa_paga: 420000000, percentual_execucao_receita: 96.25, percentual_execucao_despesa: 92.86 },
  { id: "fa-2", ano: 2024, receita_prevista: 510000000, receita_realizada: 498000000, despesa_autorizada: 520000000, despesa_empenhada: 488000000, despesa_liquidada: 472000000, despesa_paga: 458000000, percentual_execucao_receita: 97.65, percentual_execucao_despesa: 93.85 },
  { id: "fa-3", ano: 2025, receita_prevista: 540000000, receita_realizada: 255800000, despesa_autorizada: 550000000, despesa_empenhada: 251700000, despesa_liquidada: 240200000, despesa_paga: 230300000, percentual_execucao_receita: 47.37, percentual_execucao_despesa: 45.76 },
];

// --- GOLD_RECEITA_MENSAL_FONTE ---
export const goldReceitaMensalFonte: ReceitaMensalFonte[] = [
  { id: "rf-1", ano: 2025, mes: 6, fonte: "ISSQN", valor_previsto: 8500000, valor_realizado: 9200000, percentual: 108.2 },
  { id: "rf-2", ano: 2025, mes: 6, fonte: "IPTU", valor_previsto: 6200000, valor_realizado: 5800000, percentual: 93.5 },
  { id: "rf-3", ano: 2025, mes: 6, fonte: "FPM", valor_previsto: 12000000, valor_realizado: 11500000, percentual: 95.8 },
  { id: "rf-4", ano: 2025, mes: 6, fonte: "ICMS", valor_previsto: 9800000, valor_realizado: 10100000, percentual: 103.1 },
  { id: "rf-5", ano: 2025, mes: 6, fonte: "Transferências SUS", valor_previsto: 4500000, valor_realizado: 4200000, percentual: 93.3 },
  { id: "rf-6", ano: 2025, mes: 6, fonte: "Outros", valor_previsto: 2100000, valor_realizado: 2300000, percentual: 109.5 },
];

// --- GOLD_DESPESA_MENSAL_EVENTO ---
export const goldDespesaMensalEvento: DespesaMensalEvento[] = [
  { id: "de-1", ano: 2025, mes: 6, secretaria: "Educação", funcao: "Ensino Fundamental", valor_empenhado: 12500000, valor_liquidado: 11800000, valor_pago: 11200000 },
  { id: "de-2", ano: 2025, mes: 6, secretaria: "Saúde", funcao: "Atenção Básica", valor_empenhado: 10200000, valor_liquidado: 9800000, valor_pago: 9500000 },
  { id: "de-3", ano: 2025, mes: 6, secretaria: "Administração", funcao: "Gestão Administrativa", valor_empenhado: 6800000, valor_liquidado: 6500000, valor_pago: 6200000 },
  { id: "de-4", ano: 2025, mes: 6, secretaria: "Obras", funcao: "Infraestrutura Urbana", valor_empenhado: 5500000, valor_liquidado: 5100000, valor_pago: 4800000 },
  { id: "de-5", ano: 2025, mes: 6, secretaria: "Assistência Social", funcao: "Proteção Social", valor_empenhado: 3200000, valor_liquidado: 3000000, valor_pago: 2900000 },
  { id: "de-6", ano: 2025, mes: 6, secretaria: "Meio Ambiente", funcao: "Sustentabilidade", valor_empenhado: 1800000, valor_liquidado: 1700000, valor_pago: 1500000 },
];

// --- GOLD_INDICADORES_FISCAIS ---
export const goldIndicadoresFiscais: IndicadorFiscal[] = [
  { id: "if-1", ano: 2025, trimestre: 2, indicador: "Despesa com Pessoal / RCL", valor: 48.2, limite_legal: 54, status: "atencao", descricao: "Próximo do limite prudencial (51,3%). Monitorar contratações." },
  { id: "if-2", ano: 2025, trimestre: 2, indicador: "Dívida Consolidada / RCL", valor: 32.5, limite_legal: 120, status: "normal", descricao: "Nível confortável. Margem ampla para operações de crédito." },
  { id: "if-3", ano: 2025, trimestre: 2, indicador: "Aplicação Mínima Saúde", valor: 18.7, limite_legal: 15, status: "normal", descricao: "Acima do mínimo constitucional. Patamar adequado." },
  { id: "if-4", ano: 2025, trimestre: 2, indicador: "Aplicação Mínima Educação", valor: 26.3, limite_legal: 25, status: "normal", descricao: "Acima do mínimo constitucional. Margem estreita." },
  { id: "if-5", ano: 2025, trimestre: 2, indicador: "Restos a Pagar / Disponibilidade", valor: 78.5, limite_legal: 100, status: "atencao", descricao: "Proporção elevada. Risco de insuficiência financeira no final do exercício." },
];

// Helpers
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: value >= 1000000 ? "compact" : "standard",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getStatusColor = (status: "normal" | "atencao" | "critico"): string => {
  switch (status) {
    case "normal": return "gov-green";
    case "atencao": return "gov-amber";
    case "critico": return "gov-red";
  }
};

export const getTrendIcon = (current: number, previous: number): "up" | "down" | "stable" => {
  const change = ((current - previous) / previous) * 100;
  if (change > 1) return "up";
  if (change < -1) return "down";
  return "stable";
};
