import { describe, expect, it } from "vitest";
import type { FinanceiroMensal } from "@/hooks/useSupabaseFinanceiro";
import {
  getFinancialYearToDate,
  getHistoricalSeries,
  getMonthlyExpenseAlerts,
  getRadarPeriodSummary,
} from "@/data/radarFinanceiro";

function row(
  ano: number,
  mes_num: number,
  values: Partial<FinanceiroMensal> = {},
): FinanceiroMensal {
  return {
    ano,
    mes_num,
    mes_nome: "Janeiro",
    trimestre: 1,
    ano_mes: `${ano}-${String(mes_num).padStart(2, "0")}`,
    receita_realizada: 500,
    receita_prevista: null,
    despesa_empenhada: 300,
    despesa_liquidada: 200,
    despesa_paga: 100,
    saldo_vs_pago: 400,
    saldo_vs_empenhado: 200,
    gap_empenhado_pago: 200,
    pct_execucao_financeira: 33.33,
    pct_pressao_fiscal: 40,
    municipio_id_ibge: 3507001,
    ...values,
  };
}

describe("Radar financeiro", () => {
  it("compara o exercício parcial com os mesmos meses do ano anterior", () => {
    const data = [
      row(2025, 1, { despesa_paga: 100 }),
      row(2025, 2, { despesa_paga: 200 }),
      row(2025, 3, { despesa_paga: 900 }),
      row(2026, 1, { despesa_paga: 150 }),
      row(2026, 2, { despesa_paga: 250 }),
    ];

    const result = getRadarPeriodSummary(data, 2026, "all");

    expect(result.months).toEqual([1, 2]);
    expect(result.current.despesa_paga).toBe(400);
    expect(result.previous.despesa_paga).toBe(300);
    expect(result.paidVariationPercent).toBeCloseTo(33.333);
  });

  it("compara um único mês e não calcula percentual sem referência positiva", () => {
    const data = [
      row(2025, 1, { despesa_paga: 0 }),
      row(2026, 1, { despesa_paga: 100 }),
      row(2025, 2, { despesa_paga: 80 }),
      row(2026, 2, { despesa_paga: 100 }),
    ];

    expect(getRadarPeriodSummary(data, 2026, "1").paidVariationPercent).toBeNull();
    expect(getRadarPeriodSummary(data, 2026, "2").paidVariationPercent).toBe(25);
  });

  it("calcula acumulado até o mês selecionado sem somar meses futuros", () => {
    const data = [
      row(2026, 1, { despesa_paga: 10 }),
      row(2026, 2, { despesa_paga: 20 }),
      row(2026, 4, { despesa_paga: 40 }),
    ];

    expect(getFinancialYearToDate(data, 2026, "2").despesa_paga).toBe(30);
    expect(getFinancialYearToDate(data, 2026, "all").despesa_paga).toBe(70);
  });

  it("cria alertas explicáveis para variações relevantes e ignora referência zero", () => {
    const data = [
      row(2025, 1, { despesa_paga: 100, despesa_empenhada: 100, despesa_liquidada: 100 }),
      row(2025, 2, { despesa_paga: 0, despesa_empenhada: 0, despesa_liquidada: 0 }),
      row(2026, 1, { despesa_paga: 121, despesa_empenhada: 119, despesa_liquidada: 100 }),
      row(2026, 2, { despesa_paga: 300, despesa_empenhada: 300, despesa_liquidada: 300 }),
    ];

    const alerts = getMonthlyExpenseAlerts(data, 2026, [1, 2]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      period: "Janeiro/2026",
      indicator: "Despesa paga",
      level: "Atenção",
      currentValue: 121,
      referenceValue: 100,
      variationPercent: 21,
    });
    expect(alerts[0].justification).toContain("mesmo mês do exercício anterior");
  });

  it("monta histórico até o exercício selecionado e respeita filtro mensal", () => {
    const data = [
      row(2024, 1, { despesa_paga: 10 }),
      row(2024, 2, { despesa_paga: 20 }),
      row(2025, 1, { despesa_paga: 30 }),
      row(2026, 1, { despesa_paga: 40 }),
    ];

    expect(getHistoricalSeries(data, 2025, "1").map(({ year, despesa_paga }) => [year, despesa_paga]))
      .toEqual([[2024, 10], [2025, 30]]);
  });
});
