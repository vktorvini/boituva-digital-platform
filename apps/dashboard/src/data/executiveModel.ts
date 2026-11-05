export type MonthFilter = "all" | `${number}`;

export interface ExecutiveFilters {
  year: number;
  month: MonthFilter;
  secretaria: string;
}

export interface MonthOption {
  value: MonthFilter;
  label: string;
  shortLabel: string;
  monthNumber: number | null;
}

export interface Secretaria {
  id: string;
  nome: string;
  eixo: string;
  owner: string;
}

export interface FinanceMonthlyFact {
  year: number;
  month: number;
  receitaPrevista: number;
  receitaRealizada: number;
  despesaEmpenhada: number;
  despesaLiquidada: number;
  despesaPaga: number;
}

export interface RevenueSourceFact {
  year: number;
  month: number;
  source: string;
  valor: number;
}

export interface SecretaryExecutionFact {
  year: number;
  month: number;
  secretariaId: string;
  programa: string;
  empenhado: number;
  liquidado: number;
  pago: number;
  metaFisica: number;
  entregaFisica: number;
}

export interface GovernanceFact {
  year: number;
  secretariaId: string;
  maturidade: number;
  servicosDigitais: number;
  integracoes: number;
  qualidadeDados: number;
  risco: "normal" | "atencao" | "critico";
}

export interface StrategicIndicator {
  id: string;
  category: "fiscal" | "secretaria" | "social" | "economia" | "governanca";
  title: string;
  value: number;
  unit: "percent" | "currency" | "number" | "score";
  reference: string;
  status: "normal" | "atencao" | "critico";
  description: string;
}

export interface ExecutiveAlert {
  id: string;
  title: string;
  status: "normal" | "atencao" | "critico";
  value: string;
  indicator: string;
  description: string;
  owner: string;
  recommendation: string;
}

export interface SituationAction {
  id: string;
  secretaria: string;
  status: "normal" | "atencao" | "critico";
  title: string;
  impact: string;
  action: string;
  deadline: string;
}

export interface GovernanceRisk {
  secretaria: string;
  status: "normal" | "atencao" | "critico";
  title: string;
  description: string;
}

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const monthWeights = [0.071, 0.073, 0.083, 0.079, 0.084, 0.083, 0.081, 0.082, 0.081, 0.083, 0.091, 0.109];

const annualFinanceConfig = {
  2023: { receitaPrevista: 480_000_000, receitaRealizada: 462_000_000, despesaEmpenhada: 455_000_000, despesaLiquidada: 438_000_000, despesaPaga: 420_000_000 },
  2024: { receitaPrevista: 510_000_000, receitaRealizada: 498_000_000, despesaEmpenhada: 488_000_000, despesaLiquidada: 472_000_000, despesaPaga: 458_000_000 },
  2025: { receitaPrevista: 545_000_000, receitaRealizada: 526_000_000, despesaEmpenhada: 522_000_000, despesaLiquidada: 505_000_000, despesaPaga: 494_000_000 },
} as const;

export const secretarias: Secretaria[] = [
  { id: "educacao", nome: "Educacao", eixo: "Social", owner: "Secretaria de Educacao" },
  { id: "saude", nome: "Saude", eixo: "Social", owner: "Secretaria de Saude" },
  { id: "administracao", nome: "Administracao", eixo: "Gestao", owner: "Secretaria de Administracao" },
  { id: "obras", nome: "Obras e Mobilidade", eixo: "Infraestrutura", owner: "Secretaria de Obras" },
  { id: "assistencia", nome: "Assistencia Social", eixo: "Social", owner: "Secretaria de Assistencia" },
  { id: "desenvolvimento", nome: "Desenvolvimento Economico", eixo: "Economia", owner: "Secretaria de Desenvolvimento" },
  { id: "meio-ambiente", nome: "Meio Ambiente", eixo: "Infraestrutura", owner: "Secretaria de Meio Ambiente" },
];

export const monthOptions: MonthOption[] = [
  { value: "all", label: "Ano completo", shortLabel: "Ano", monthNumber: null },
  ...monthNames.map((name, index) => ({
    value: String(index + 1) as MonthFilter,
    label: name,
    shortLabel: name.slice(0, 3),
    monthNumber: index + 1,
  })),
];

export const availableYears = Object.keys(annualFinanceConfig).map(Number).sort((a, b) => a - b);

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function generateFinanceFacts(): FinanceMonthlyFact[] {
  return availableYears.flatMap((year) => {
    const annual = annualFinanceConfig[year as keyof typeof annualFinanceConfig];
    return monthWeights.map((weight, index) => {
      const seasonality = 1 + ((index % 4) - 1.5) * 0.012;
      return {
        year,
        month: index + 1,
        receitaPrevista: round(annual.receitaPrevista * weight),
        receitaRealizada: round(annual.receitaRealizada * weight * seasonality),
        despesaEmpenhada: round(annual.despesaEmpenhada * weight * (1 + (index > 8 ? 0.03 : 0))),
        despesaLiquidada: round(annual.despesaLiquidada * weight * (1 + (index > 9 ? 0.02 : 0))),
        despesaPaga: round(annual.despesaPaga * weight * (1 + (index > 9 ? 0.018 : 0))),
      };
    });
  });
}

const sourceWeights = {
  ISS: 0.18,
  IPTU: 0.12,
  FPM: 0.24,
  ICMS: 0.22,
  SUS: 0.13,
  Convenios: 0.11,
};

function generateRevenueSources(financeFacts: FinanceMonthlyFact[]): RevenueSourceFact[] {
  return financeFacts.flatMap((fact) => {
    const seasonalFactors: Record<string, number> = {
      ISS: fact.month >= 8 ? 1.05 : 0.98,
      IPTU: fact.month <= 4 ? 1.26 : 0.84,
      FPM: 1,
      ICMS: fact.month === 12 ? 1.08 : 1,
      SUS: 1,
      Convenios: fact.month >= 9 ? 1.1 : 0.92,
    };

    return Object.entries(sourceWeights).map(([source, weight]) => ({
      year: fact.year,
      month: fact.month,
      source,
      valor: round(fact.receitaRealizada * weight * seasonalFactors[source]),
    }));
  });
}

const baseSecretaryWeights: Record<string, number> = {
  educacao: 0.27,
  saude: 0.24,
  administracao: 0.13,
  obras: 0.14,
  assistencia: 0.08,
  desenvolvimento: 0.07,
  "meio-ambiente": 0.07,
};

const programs: Record<string, string> = {
  educacao: "Aprendizagem, transporte e manutencao escolar",
  saude: "Atencao primaria e rede assistencial",
  administracao: "Gestao, pessoas e tecnologia",
  obras: "Infraestrutura urbana e mobilidade",
  assistencia: "Protecao social e cadastros",
  desenvolvimento: "Emprego, empreender e desburocratizar",
  "meio-ambiente": "Residuos, limpeza e sustentabilidade",
};

function buildSecretaryWeight(secretariaId: string, month: number, year: number) {
  let value = baseSecretaryWeights[secretariaId];

  if (secretariaId === "educacao" && month >= 2 && month <= 10) value += 0.015;
  if (secretariaId === "saude") value += 0.008;
  if (secretariaId === "obras" && month >= 5 && month <= 11) value += 0.02;
  if (secretariaId === "assistencia" && month >= 10) value += 0.006;
  if (secretariaId === "desenvolvimento" && year === 2025) value += 0.004;

  return value;
}

function generateSecretaryFacts(financeFacts: FinanceMonthlyFact[]): SecretaryExecutionFact[] {
  return financeFacts.flatMap((fact) => {
    const weights = secretarias.map((secretaria) => ({
      secretariaId: secretaria.id,
      weight: buildSecretaryWeight(secretaria.id, fact.month, fact.year),
    }));
    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);

    return weights.map(({ secretariaId, weight }) => {
      const normalized = weight / totalWeight;
      const empenhado = round(fact.despesaEmpenhada * normalized);
      const liquidado = round(fact.despesaLiquidada * normalized * (secretariaId === "obras" ? 0.96 : 1));
      const pago = round(fact.despesaPaga * normalized * (secretariaId === "obras" ? 0.93 : 1));
      const metaFisica = Math.round(100 * normalized * 11 + fact.month * 2);
      const entregaFisica = Math.round(metaFisica * (liquidado / Math.max(empenhado, 1)));

      return {
        year: fact.year,
        month: fact.month,
        secretariaId,
        programa: programs[secretariaId],
        empenhado,
        liquidado,
        pago,
        metaFisica,
        entregaFisica,
      };
    });
  });
}

function generateGovernanceFacts(): GovernanceFact[] {
  return availableYears.flatMap((year) => secretarias.map((secretaria, index) => {
    const maturityBase = 48 + index * 4 + (year - 2023) * 6;
    const qualityBase = 52 + index * 3 + (year - 2023) * 5;
    const integrations = 2 + index + (year - 2023);
    const services = 5 + index * 2 + (year - 2023) * 3;
    const risk = maturityBase >= 72 ? "normal" : maturityBase >= 60 ? "atencao" : "critico";

    return {
      year,
      secretariaId: secretaria.id,
      maturidade: Math.min(maturityBase, 88),
      servicosDigitais: services,
      integracoes: integrations,
      qualidadeDados: Math.min(qualityBase, 90),
      risco: risk,
    };
  }));
}

export const financeFacts = generateFinanceFacts();
export const revenueSourceFacts = generateRevenueSources(financeFacts);
export const secretaryFacts = generateSecretaryFacts(financeFacts);
export const governanceFacts = generateGovernanceFacts();

const ibgeIndicators = {
  populacaoEstimada: 63850,
  populacaoCenso: 61081,
  densidadeDemografica: 245.35,
  areaTerritorial: 248.95,
  escolarizacao: 98.66,
  idhm: 0.78,
  mortalidadeInfantil: 14.81,
  pibPerCapita: 73249.13,
};

export function getMonthLabel(month: MonthFilter) {
  return monthOptions.find((option) => option.value === month)?.label ?? "Ano completo";
}

function toMonthNumber(month: MonthFilter) {
  return month === "all" ? null : Number(month);
}

function getMonthsForFilter(month: MonthFilter) {
  const selectedMonth = toMonthNumber(month);
  return selectedMonth ? [selectedMonth] : monthNames.map((_, index) => index + 1);
}

function getCumulativeMonthsForFilter(month: MonthFilter) {
  const selectedMonth = toMonthNumber(month);
  return selectedMonth ? monthNames.slice(0, selectedMonth).map((_, index) => index + 1) : monthNames.map((_, index) => index + 1);
}

function sumNumbers(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

export function getPeriodFinance(filters: ExecutiveFilters) {
  const months = getMonthsForFilter(filters.month);
  const rows = financeFacts.filter((item) => item.year === filters.year && months.includes(item.month));

  return {
    receitaPrevista: sumNumbers(rows.map((item) => item.receitaPrevista)),
    receitaRealizada: sumNumbers(rows.map((item) => item.receitaRealizada)),
    despesaEmpenhada: sumNumbers(rows.map((item) => item.despesaEmpenhada)),
    despesaLiquidada: sumNumbers(rows.map((item) => item.despesaLiquidada)),
    despesaPaga: sumNumbers(rows.map((item) => item.despesaPaga)),
  };
}

export function getCumulativeFinance(filters: ExecutiveFilters) {
  const months = getCumulativeMonthsForFilter(filters.month);
  const rows = financeFacts.filter((item) => item.year === filters.year && months.includes(item.month));

  return {
    receitaPrevista: sumNumbers(rows.map((item) => item.receitaPrevista)),
    receitaRealizada: sumNumbers(rows.map((item) => item.receitaRealizada)),
    despesaEmpenhada: sumNumbers(rows.map((item) => item.despesaEmpenhada)),
    despesaLiquidada: sumNumbers(rows.map((item) => item.despesaLiquidada)),
    despesaPaga: sumNumbers(rows.map((item) => item.despesaPaga)),
  };
}

function getPreviousFilters(filters: ExecutiveFilters): ExecutiveFilters | null {
  const previousYear = filters.year - 1;
  if (!availableYears.includes(previousYear)) return null;
  return { ...filters, year: previousYear };
}

export function getFinanceComparison(filters: ExecutiveFilters) {
  const previous = getPreviousFilters(filters);
  if (!previous) return null;

  const current = getCumulativeFinance(filters);
  const prior = getCumulativeFinance(previous);

  return {
    receitaChange: ((current.receitaRealizada - prior.receitaRealizada) / Math.max(prior.receitaRealizada, 1)) * 100,
    gastoChange: ((current.despesaPaga - prior.despesaPaga) / Math.max(prior.despesaPaga, 1)) * 100,
    pressaoAtual: (current.despesaEmpenhada - current.despesaPaga) / Math.max(current.receitaRealizada, 1),
    pressaoAnterior: (prior.despesaEmpenhada - prior.despesaPaga) / Math.max(prior.receitaRealizada, 1),
  };
}

export function getTrendSeries(year: number) {
  return monthNames.map((name, index) => {
    const month = index + 1;
    const current = financeFacts.find((item) => item.year === year && item.month === month);
    const prior = financeFacts.find((item) => item.year === year - 1 && item.month === month);
    const twoYears = financeFacts.find((item) => item.year === year - 2 && item.month === month);

    return {
      month,
      name: name.slice(0, 3),
      receitaAtual: current?.receitaRealizada ?? 0,
      despesaAtual: current?.despesaPaga ?? 0,
      receitaAnterior: prior?.receitaRealizada ?? 0,
      despesaAnterior: prior?.despesaPaga ?? 0,
      receitaDoisAnos: twoYears?.receitaRealizada ?? 0,
      despesaDoisAnos: twoYears?.despesaPaga ?? 0,
    };
  });
}

export function getRevenueSources(filters: ExecutiveFilters) {
  const months = getMonthsForFilter(filters.month);
  const rows = revenueSourceFacts.filter((item) => item.year === filters.year && months.includes(item.month));
  const totals = new Map<string, number>();

  rows.forEach((row) => totals.set(row.source, (totals.get(row.source) ?? 0) + row.valor));

  const grandTotal = sumNumbers(Array.from(totals.values()));

  return Array.from(totals.entries())
    .map(([source, valor]) => ({ source, valor, share: (valor / Math.max(grandTotal, 1)) * 100 }))
    .sort((a, b) => b.valor - a.valor);
}

export function getSecretaryExecution(filters: ExecutiveFilters) {
  const months = getMonthsForFilter(filters.month);
  const rows = secretaryFacts.filter((item) => item.year === filters.year && months.includes(item.month));
  const filtered = filters.secretaria === "all" ? rows : rows.filter((item) => item.secretariaId === filters.secretaria);
  const grouped = new Map<string, SecretaryExecutionFact[]>();

  filtered.forEach((row) => {
    const bucket = grouped.get(row.secretariaId) ?? [];
    bucket.push(row);
    grouped.set(row.secretariaId, bucket);
  });

  return Array.from(grouped.entries()).map(([secretariaId, items]) => {
    const secretaria = secretarias.find((item) => item.id === secretariaId)!;
    const empenhado = sumNumbers(items.map((item) => item.empenhado));
    const liquidado = sumNumbers(items.map((item) => item.liquidado));
    const pago = sumNumbers(items.map((item) => item.pago));
    const metaFisica = sumNumbers(items.map((item) => item.metaFisica));
    const entregaFisica = sumNumbers(items.map((item) => item.entregaFisica));
    const execucaoFinanceira = pago / Math.max(empenhado, 1);
    const execucaoFisica = entregaFisica / Math.max(metaFisica, 1);
    const status = execucaoFinanceira >= 0.8 ? "normal" : execucaoFinanceira >= 0.7 ? "atencao" : "critico";

    return {
      secretariaId,
      secretaria: secretaria.nome,
      eixo: secretaria.eixo,
      owner: secretaria.owner,
      programa: items[0]?.programa ?? "",
      empenhado,
      liquidado,
      pago,
      metaFisica,
      entregaFisica,
      execucaoFinanceira,
      execucaoFisica,
      gap: empenhado - pago,
      status,
    };
  }).sort((a, b) => b.pago - a.pago);
}

function getPressureStatus(value: number) {
  if (value <= 0.15) return "normal";
  if (value <= 0.25) return "atencao";
  return "critico";
}

export function getExecutiveAlerts(filters: ExecutiveFilters): ExecutiveAlert[] {
  const current = getCumulativeFinance(filters);
  const comparison = getFinanceComparison(filters);
  const secretariatView = getSecretaryExecution(filters);
  const topSecretaria = secretariatView[0];
  const pressure = (current.despesaEmpenhada - current.despesaPaga) / Math.max(current.receitaRealizada, 1);
  const execution = current.despesaPaga / Math.max(current.despesaEmpenhada, 1);
  const gapTrend = comparison ? comparison.pressaoAtual - comparison.pressaoAnterior : 0;
  const lowExecutionSecretariat = secretariatView.filter((item) => item.status !== "normal").slice(0, 2);

  const alerts: ExecutiveAlert[] = [
    {
      id: "pressao-fiscal",
      title: "Pressao fiscal do periodo",
      status: getPressureStatus(pressure),
      value: formatPercent(pressure * 100),
      indicator: "Gap empenhado x pago sobre receita realizada",
      description: pressure > 0.25
        ? "O colchao financeiro esta estreito. A gestao precisa conter aceleracao de gasto e revisar entregas de curto prazo."
        : pressure > 0.15
          ? "A execucao segue sustentavel, mas o espaco de manobra diminuiu e exige monitoramento semanal."
          : "O municipio mantem espaco de manobra adequado para atravessar o periodo sem risco fiscal imediato.",
      owner: "Prefeito + Fazenda",
      recommendation: "Revisar cronograma financeiro, contratos de maior peso e empenhos de fim de periodo.",
    },
    {
      id: "execucao-geral",
      title: "Execucao financeira",
      status: execution >= 0.8 ? "normal" : execution >= 0.7 ? "atencao" : "critico",
      value: formatPercent(execution * 100),
      indicator: "Despesa paga / despesa empenhada",
      description: execution < 0.7
        ? "Ha atraso relevante entre compromisso assumido e pagamento efetivo."
        : execution < 0.8
          ? "A execucao merece atencao para evitar concentracao de pagamento no fechamento do ano."
          : "A relacao entre empenho e pagamento esta em faixa saudavel.",
      owner: "Fazenda + Secretarias",
      recommendation: "Atuar sobre liquidacao, cronograma de pagamento e barreiras operacionais nas pastas com atraso.",
    },
    {
      id: "gap-trend",
      title: "Tendencia do gap fiscal",
      status: gapTrend > 0.03 ? "critico" : gapTrend > 0.01 ? "atencao" : "normal",
      value: comparison ? formatPercent(gapTrend * 100) : "0,0%",
      indicator: "Variacao da pressao fiscal versus ano anterior",
      description: comparison && gapTrend > 0
        ? "A pressao cresceu em relacao ao mesmo recorte do ano anterior."
        : "A pressao fiscal esta estavel ou melhor do que no ano anterior.",
      owner: "Planejamento + Fazenda",
      recommendation: "Comparar contratos, folha, custeio continuo e entregas concentradas no periodo.",
    },
  ];

  if (topSecretaria) {
    alerts.push({
      id: "concentracao-setorial",
      title: `Maior concentracao de gasto: ${topSecretaria.secretaria}`,
      status: topSecretaria.pago / Math.max(current.despesaPaga, 1) > 0.28 ? "atencao" : "normal",
      value: formatPercent((topSecretaria.pago / Math.max(current.despesaPaga, 1)) * 100),
      indicator: "Participacao na despesa paga do periodo",
      description: "A secretaria lidera o gasto do periodo e deve ser acompanhada como centro de pressao e entrega.",
      owner: topSecretaria.owner,
      recommendation: "Acompanhar metas fisicas, contratos criticos e qualidade da entrega associada ao gasto.",
    });
  }

  lowExecutionSecretariat.forEach((item) => {
    alerts.push({
      id: `secretaria-${item.secretariaId}`,
      title: `${item.secretaria} com execucao abaixo do esperado`,
      status: item.status,
      value: formatPercent(item.execucaoFinanceira * 100),
      indicator: "Despesa paga / empenhada da secretaria",
      description: `A pasta apresenta baixo giro financeiro para o que foi comprometido. Programa: ${item.programa}.`,
      owner: item.owner,
      recommendation: "Rever gargalos de processo, liquidacao, contratos e capacidade operacional.",
    });
  });

  return alerts;
}

export function getStrategicIndicators(filters: ExecutiveFilters): StrategicIndicator[] {
  const current = getCumulativeFinance(filters);
  const governance = getGovernanceOverview(filters.year);
  const secretaryExecution = getSecretaryExecution(filters);
  const averageExecution = secretaryExecution.reduce((sum, item) => sum + item.execucaoFinanceira, 0) / Math.max(secretaryExecution.length, 1);
  const revenuePerCapita = current.receitaRealizada / ibgeIndicators.populacaoEstimada;
  const pressure = (current.despesaEmpenhada - current.despesaPaga) / Math.max(current.receitaRealizada, 1);

  return [
    {
      id: "fiscal-execucao",
      category: "fiscal",
      title: "Execucao financeira media",
      value: averageExecution * 100,
      unit: "percent",
      reference: "Despesa paga / empenhada",
      status: averageExecution >= 0.8 ? "normal" : averageExecution >= 0.7 ? "atencao" : "critico",
      description: "Mostra se a maquina esta convertendo empenho em entrega financeira no ritmo esperado.",
    },
    {
      id: "fiscal-pressao",
      category: "fiscal",
      title: "Pressao fiscal",
      value: pressure * 100,
      unit: "percent",
      reference: "Gap empenhado x pago / receita",
      status: getPressureStatus(pressure),
      description: "Le o espaco de manobra do municipio no periodo filtrado.",
    },
    {
      id: "secretaria-entrega",
      category: "secretaria",
      title: "Entrega fisica media das secretarias",
      value: (secretaryExecution.reduce((sum, item) => sum + item.execucaoFisica, 0) / Math.max(secretaryExecution.length, 1)) * 100,
      unit: "percent",
      reference: "Entrega / meta fisica",
      status: averageExecution >= 0.8 ? "normal" : "atencao",
      description: "Acompanha se o gasto esta produzindo entrega operacional para as pastas.",
    },
    {
      id: "social-escolarizacao",
      category: "social",
      title: "Escolarizacao 6 a 14 anos",
      value: ibgeIndicators.escolarizacao,
      unit: "percent",
      reference: "IBGE 2022",
      status: ibgeIndicators.escolarizacao >= 98 ? "normal" : "atencao",
      description: "Indicador estrutural para calibrar politica de permanencia e cobertura escolar.",
    },
    {
      id: "social-mortalidade",
      category: "social",
      title: "Mortalidade infantil",
      value: ibgeIndicators.mortalidadeInfantil,
      unit: "number",
      reference: "Obitos por mil nascidos vivos - 2023",
      status: ibgeIndicators.mortalidadeInfantil <= 12 ? "normal" : ibgeIndicators.mortalidadeInfantil <= 15 ? "atencao" : "critico",
      description: "Referencia para cruzar atencao primaria, saneamento e vulnerabilidade.",
    },
    {
      id: "economia-receita-capita",
      category: "economia",
      title: "Receita realizada por habitante",
      value: revenuePerCapita,
      unit: "currency",
      reference: "Receita do periodo / populacao estimada",
      status: revenuePerCapita >= 8000 ? "normal" : revenuePerCapita >= 7000 ? "atencao" : "critico",
      description: "Ajuda a entender capacidade fiscal por escala populacional do municipio.",
    },
    {
      id: "economia-pib",
      category: "economia",
      title: "PIB per capita",
      value: ibgeIndicators.pibPerCapita,
      unit: "currency",
      reference: "IBGE 2023",
      status: ibgeIndicators.pibPerCapita >= 70000 ? "normal" : "atencao",
      description: "Le o porte economico local e apoia agenda de arrecadacao e desenvolvimento.",
    },
    {
      id: "governanca-maturidade",
      category: "governanca",
      title: "Maturidade digital media",
      value: governance.mediaMaturidade,
      unit: "score",
      reference: "Media das secretarias",
      status: governance.mediaMaturidade >= 72 ? "normal" : governance.mediaMaturidade >= 60 ? "atencao" : "critico",
      description: "Mostra preparo institucional para integrar dados, processos e servicos digitais.",
    },
  ];
}

export function getSituationActions(filters: ExecutiveFilters): SituationAction[] {
  const alerts = getExecutiveAlerts(filters);
  const secretariesView = getSecretaryExecution(filters);

  return [
    ...alerts.slice(0, 3).map((alert, index) => ({
      id: `alert-${index}`,
      secretaria: alert.owner,
      status: alert.status,
      title: alert.title,
      impact: alert.description,
      action: alert.recommendation,
      deadline: index === 0 ? "48h" : index === 1 ? "7 dias" : "15 dias",
    })),
    ...secretariesView.slice(0, 3).map((item, index) => ({
      id: `secretaria-${item.secretariaId}`,
      secretaria: item.secretaria,
      status: item.status,
      title: `${item.secretaria}: acompanhar ${item.programa}`,
      impact: `Execucao financeira em ${formatPercent(item.execucaoFinanceira * 100)} e entrega fisica em ${formatPercent(item.execucaoFisica * 100)}.`,
      action: "Reunir secretario, financeiro da pasta e planejamento para ajustar cronograma e destravar entrega.",
      deadline: index === 0 ? "5 dias" : "10 dias",
    })),
  ].slice(0, 6);
}

export function getGovernanceOverview(year: number) {
  const rows = governanceFacts.filter((item) => item.year === year);
  const mediaMaturidade = rows.reduce((sum, item) => sum + item.maturidade, 0) / Math.max(rows.length, 1);
  const mediaQualidade = rows.reduce((sum, item) => sum + item.qualidadeDados, 0) / Math.max(rows.length, 1);
  const servicosDigitais = rows.reduce((sum, item) => sum + item.servicosDigitais, 0);
  const integracoes = rows.reduce((sum, item) => sum + item.integracoes, 0);

  return { mediaMaturidade, mediaQualidade, servicosDigitais, integracoes };
}

export function getGovernanceBySecretaria(year: number) {
  return governanceFacts
    .filter((item) => item.year === year)
    .map((item) => {
      const secretaria = secretarias.find((entry) => entry.id === item.secretariaId)!;
      return {
        secretaria: secretaria.nome,
        owner: secretaria.owner,
        eixo: secretaria.eixo,
        ...item,
      };
    })
    .sort((a, b) => b.maturidade - a.maturidade);
}

export function getGovernanceRisks(year: number): GovernanceRisk[] {
  return getGovernanceBySecretaria(year)
    .map((item) => ({
      secretaria: item.secretaria,
      status: item.risco,
      title: item.risco === "critico"
        ? "Baixa maturidade e qualidade de dados"
        : item.risco === "atencao"
          ? "Maturidade intermediaria com dependencia operacional"
          : "Base digital consistente para escalar",
      description: item.risco === "critico"
        ? "A pasta precisa priorizar cadastro, padronizacao, responsaveis e automacao minima."
        : item.risco === "atencao"
          ? "Ha avancos, mas ainda existe dependencia de planilhas e processos manuais."
          : "A secretaria ja tem base para ampliar integracao, indicadores e servicos digitais.",
    }))
    .sort((a, b) => (a.status === "critico" ? -1 : a.status === "atencao" ? 0 : 1));
}

export function getOverviewRecommendations(filters: ExecutiveFilters) {
  const alerts = getExecutiveAlerts(filters);
  return alerts.slice(0, 4).map((alert) => ({
    title: alert.title,
    owner: alert.owner,
    recommendation: alert.recommendation,
    status: alert.status,
  }));
}

export function getMetadataSummary() {
  return {
    municipality: "Boituva",
    lastRefresh: "Base demonstrativa local em modelo gold executivo",
    dimensions: ["dim_tempo", "dim_secretaria", "dim_fonte_recurso", "dim_municipio"],
    facts: [
      "fato_financeiro_mensal",
      "fato_receita_mensal_fonte",
      "fato_despesa_mensal_secretaria",
      "fato_indicador_estrategico",
      "fato_alerta_executivo",
      "fato_governanca_digital",
      "fato_ibge_indicador_municipio",
    ],
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function formatNumber(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits }).format(value);
}

export function formatIndicatorValue(indicator: StrategicIndicator) {
  switch (indicator.unit) {
    case "currency":
      return formatCurrency(indicator.value);
    case "percent":
      return formatPercent(indicator.value);
    case "score":
      return `${formatNumber(indicator.value, 0)} pts`;
    default:
      return formatNumber(indicator.value, 2);
  }
}
