import type { DespesaMensalOrgao } from "@/hooks/useSupabaseFinanceiro";

export type ExpenseStage = "despesa_empenhada" | "despesa_liquidada" | "despesa_paga";

export const EXPENSE_STAGES: { key: ExpenseStage; label: string }[] = [
  { key: "despesa_empenhada", label: "Empenhada" },
  { key: "despesa_liquidada", label: "Liquidada" },
  { key: "despesa_paga", label: "Paga" },
];

export interface OrganizationExpenseSummary {
  organization: string;
  current: Record<ExpenseStage, number>;
  previous: Record<ExpenseStage, number>;
  variationPercent: number | null;
}

export interface OrganizationExpenseAlert {
  organization: string;
  stage: ExpenseStage;
  month: number;
  currentValue: number;
  referenceValue: number;
  variationPercent: number;
}

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function getOrganizationSummaries(
  rows: DespesaMensalOrgao[],
  year: number,
  month: string,
  stage: ExpenseStage,
  selectedOrganization = "all",
): OrganizationExpenseSummary[] {
  const yearRows = rows.filter(
    (row) =>
      row.ano === year &&
      (month === "all" || row.mes_num === Number(month)) &&
      (selectedOrganization === "all" || row.orgao_nome === selectedOrganization),
  );
  const months = new Set(yearRows.map((row) => row.mes_num));
  const organizations = [...new Set(yearRows.map((row) => row.orgao_nome))];

  return organizations
    .map((organization) => {
      const currentRows = yearRows.filter((row) => row.orgao_nome === organization);
      const previousRows = rows.filter(
        (row) =>
          row.ano === year - 1 &&
          months.has(row.mes_num) &&
          row.orgao_nome === organization,
      );
      const current = Object.fromEntries(
        EXPENSE_STAGES.map(({ key }) => [
          key,
          currentRows.reduce((total, row) => total + (row[key] ?? 0), 0),
        ]),
      ) as Record<ExpenseStage, number>;
      const previous = Object.fromEntries(
        EXPENSE_STAGES.map(({ key }) => [
          key,
          previousRows.reduce((total, row) => total + (row[key] ?? 0), 0),
        ]),
      ) as Record<ExpenseStage, number>;

      return {
        organization,
        current,
        previous,
        variationPercent:
          previous[stage] > 0
            ? ((current[stage] - previous[stage]) / previous[stage]) * 100
            : null,
      };
    })
    .sort((a, b) => b.current[stage] - a.current[stage]);
}

export function getMonthlyOrganizationSeries(
  rows: DespesaMensalOrgao[],
  year: number,
  stage: ExpenseStage,
  selectedOrganization = "all",
) {
  const filtered = rows.filter(
    (row) =>
      row.ano === year &&
      (selectedOrganization === "all" || row.orgao_nome === selectedOrganization),
  );
  const organizations = [...new Set(filtered.map((row) => row.orgao_nome))];
  const months = [...new Set(filtered.map((row) => row.mes_num))].sort((a, b) => a - b);

  return {
    organizations,
    data: months.map((month) => {
      const monthRows = filtered.filter((row) => row.mes_num === month);
      const values = Object.fromEntries(
        organizations.map((organization) => [
          organization,
          monthRows.find((row) => row.orgao_nome === organization)?.[stage] ?? 0,
        ]),
      );
      return { month: MONTH_LABELS[month - 1] ?? String(month), ...values };
    }),
  };
}

export function getOrganizationHistoricalSeries(
  rows: DespesaMensalOrgao[],
  selectedYear: number,
  month: string,
  stage: ExpenseStage,
  selectedOrganization = "all",
) {
  const filtered = rows.filter(
    (row) =>
      row.ano <= selectedYear &&
      (month === "all" || row.mes_num === Number(month)) &&
      (selectedOrganization === "all" || row.orgao_nome === selectedOrganization),
  );
  const organizations = [...new Set(filtered.map((row) => row.orgao_nome))];
  const years = [...new Set(filtered.map((row) => row.ano))].sort((a, b) => a - b);

  return {
    organizations,
    data: years.map((year) => {
      const yearRows = filtered.filter((row) => row.ano === year);
      const values = Object.fromEntries(
        organizations.map((organization) => [
          organization,
          yearRows
            .filter((row) => row.orgao_nome === organization)
            .reduce((total, row) => total + (row[stage] ?? 0), 0),
        ]),
      );
      return { year, ...values };
    }),
  };
}

export function getOrganizationExpenseAlerts(
  rows: DespesaMensalOrgao[],
  year: number,
  month: string,
  stage: ExpenseStage,
  selectedOrganization = "all",
  thresholdPercent = 20,
): OrganizationExpenseAlert[] {
  return rows
    .filter(
      (row) =>
        row.ano === year &&
        (month === "all" || row.mes_num === Number(month)) &&
        (selectedOrganization === "all" || row.orgao_nome === selectedOrganization),
    )
    .flatMap((current) => {
      const reference = rows.find(
        (row) =>
          row.ano === year - 1 &&
          row.mes_num === current.mes_num &&
          row.orgao_nome === current.orgao_nome,
      );
      const currentValue = current[stage];
      const referenceValue = reference?.[stage];
      if (referenceValue === undefined || referenceValue <= 0) return [];

      const variationPercent = ((currentValue - referenceValue) / referenceValue) * 100;
      return Math.abs(variationPercent) >= thresholdPercent
        ? [{
            organization: current.orgao_nome,
            stage,
            month: current.mes_num,
            currentValue,
            referenceValue,
            variationPercent,
          }]
        : [];
    })
    .sort((a, b) => Math.abs(b.variationPercent) - Math.abs(a.variationPercent));
}
