import type { FinanceiroMensal } from "@/hooks/useSupabaseFinanceiro";

export type ExpenseStage = "despesa_empenhada" | "despesa_liquidada" | "despesa_paga";

export const EXPENSE_STAGES: { key: ExpenseStage; label: string }[] = [
  { key: "despesa_empenhada", label: "Empenhada" },
  { key: "despesa_liquidada", label: "Liquidada" },
  { key: "despesa_paga", label: "Paga" },
];

export interface FinancialTotals {
  despesa_empenhada: number;
  despesa_liquidada: number;
  despesa_paga: number;
  receita_realizada: number;
}

export interface RadarPeriodSummary {
  months: number[];
  current: FinancialTotals;
  previous: FinancialTotals;
  paidVariationPercent: number | null;
}

export interface FinancialAlert {
  title: string;
  description: string;
  period: string;
  indicator: string;
  level: "Atenção";
  currentValue: number;
  referenceValue: number;
  variationPercent: number;
  justification: string;
}

const EMPTY_TOTALS: FinancialTotals = {
  despesa_empenhada: 0,
  despesa_liquidada: 0,
  despesa_paga: 0,
  receita_realizada: 0,
};

const MONTH_NAMES = [
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

export function sumFinancialRows(rows: FinanceiroMensal[]): FinancialTotals {
  return rows.reduce(
    (totals, row) => ({
      despesa_empenhada: totals.despesa_empenhada + (row.despesa_empenhada ?? 0),
      despesa_liquidada: totals.despesa_liquidada + (row.despesa_liquidada ?? 0),
      despesa_paga: totals.despesa_paga + (row.despesa_paga ?? 0),
      receita_realizada: totals.receita_realizada + (row.receita_realizada ?? 0),
    }),
    { ...EMPTY_TOTALS },
  );
}

export function getRadarPeriodSummary(
  rows: FinanceiroMensal[],
  year: number,
  month: string,
): RadarPeriodSummary {
  const yearRows = rows.filter((row) => row.ano === year);
  const availableMonths = [...new Set(yearRows.map((row) => row.mes_num))].sort((a, b) => a - b);
  const requestedMonth = month === "all" ? null : Number(month);
  const months =
    requestedMonth === null
      ? availableMonths
      : availableMonths.includes(requestedMonth)
        ? [requestedMonth]
        : [];
  const currentRows = yearRows.filter((row) => months.includes(row.mes_num));
  const previousRows = rows.filter(
    (row) => row.ano === year - 1 && months.includes(row.mes_num),
  );
  const current = sumFinancialRows(currentRows);
  const previous = sumFinancialRows(previousRows);

  return {
    months,
    current,
    previous,
    paidVariationPercent:
      previousRows.length > 0 && previous.despesa_paga > 0
        ? ((current.despesa_paga - previous.despesa_paga) / previous.despesa_paga) * 100
        : null,
  };
}

export function getFinancialYearToDate(
  rows: FinanceiroMensal[],
  year: number,
  month: string,
): FinancialTotals {
  const requestedMonth = month === "all" ? Number.POSITIVE_INFINITY : Number(month);
  return sumFinancialRows(
    rows.filter((row) => row.ano === year && row.mes_num <= requestedMonth),
  );
}

export function getHistoricalSeries(
  rows: FinanceiroMensal[],
  selectedYear: number,
  month: string,
): (FinancialTotals & { year: number; months: number })[] {
  const monthNumber = month === "all" ? null : Number(month);
  const years = [...new Set(rows.map((row) => row.ano))]
    .filter((year) => year <= selectedYear)
    .sort((a, b) => a - b);

  return years.flatMap((year) => {
    const yearRows = rows.filter(
      (row) => row.ano === year && (monthNumber === null || row.mes_num === monthNumber),
    );
    return yearRows.length
      ? [{ ...sumFinancialRows(yearRows), year, months: yearRows.length }]
      : [];
  });
}

export function getMonthlyExpenseAlerts(
  rows: FinanceiroMensal[],
  year: number,
  months: number[],
  thresholdPercent = 20,
): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];

  for (const month of months) {
    const current = rows.find((row) => row.ano === year && row.mes_num === month);
    const reference = rows.find((row) => row.ano === year - 1 && row.mes_num === month);
    if (!current || !reference) continue;

    for (const stage of EXPENSE_STAGES) {
      const currentValue = current[stage.key];
      const referenceValue = reference[stage.key];
      if (referenceValue <= 0) continue;

      const variationPercent = ((currentValue - referenceValue) / referenceValue) * 100;
      if (Math.abs(variationPercent) < thresholdPercent) continue;

      const monthName = MONTH_NAMES[month - 1] ?? `Mês ${month}`;
      const direction = variationPercent > 0 ? "aumento" : "redução";
      const formattedVariation = `${variationPercent > 0 ? "+" : ""}${variationPercent.toFixed(1)}%`;

      alerts.push({
        title: `Variação relevante na despesa ${stage.label.toLowerCase()}`,
        description: `${monthName}/${year}: ${formattedVariation} em relação ao mesmo mês do exercício anterior.`,
        period: `${monthName}/${year}`,
        indicator: `Despesa ${stage.label.toLowerCase()}`,
        level: "Atenção",
        currentValue,
        referenceValue,
        variationPercent,
        justification: `Variação absoluta igual ou superior a ${thresholdPercent}% frente ao mesmo mês do exercício anterior (${direction}). Comparação calculada sobre os valores da view financeira mensal.`,
      });
    }
  }

  return alerts.sort(
    (a, b) => Math.abs(b.variationPercent) - Math.abs(a.variationPercent),
  );
}
