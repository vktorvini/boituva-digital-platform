import { useMemo } from "react";
import { monthOptions as staticMonthOptions, type MonthOption } from "@/data/executiveModel";
import { useDimTempo, useFinanceiroAnual, useSecretarias } from "@/hooks/useSupabaseFinanceiro";

const CURRENT_YEAR = new Date().getFullYear();

export function getFinancialYearOptions(
  annualYears: number[],
  calendarYears: number[],
  currentYear = CURRENT_YEAR,
) {
  const years = new Set(
    [...annualYears, ...calendarYears].filter((year) => Number.isInteger(year)),
  );
  return (years.size ? Array.from(years) : [currentYear]).sort((a, b) => b - a);
}

/**
 * Opções de filtros derivadas do Supabase (vw_financeiro_anual, vw_dim_tempo, vw_secretarias).
 */
export function useFilterOptions(selectedYear: number) {
  const anual = useFinanceiroAnual();
  const dimTempo = useDimTempo();
  const secretariasQuery = useSecretarias();

  const availableYears = useMemo(
    () =>
      getFinancialYearOptions(
        (anual.data ?? []).map((row) => row.ano),
        (dimTempo.data ?? []).map((row) => row.ano),
      ),
    [anual.data, dimTempo.data],
  );

  const monthOptions = useMemo((): MonthOption[] => {
    const allOption = staticMonthOptions[0];
    const rowsForYear = (dimTempo.data ?? []).filter((row) => row.ano === selectedYear);

    if (!rowsForYear.length) {
      return staticMonthOptions;
    }

    const monthsWithData = new Set(rowsForYear.map((row) => row.mes_num));
    return [
      allOption,
      ...staticMonthOptions.slice(1).filter(
        (option) => option.monthNumber != null && monthsWithData.has(option.monthNumber),
      ),
    ];
  }, [dimTempo.data, selectedYear]);

  const secretarias = useMemo(
    () =>
      (secretariasQuery.data ?? []).map((item) => ({
        id: item.secretaria_id,
        nome: item.secretaria_nome,
      })),
    [secretariasQuery.data],
  );

  const defaultYear = availableYears.includes(CURRENT_YEAR)
    ? CURRENT_YEAR
    : availableYears[0] ?? CURRENT_YEAR;

  return {
    availableYears,
    monthOptions,
    secretarias,
    defaultYear,
    isLoading: anual.isLoading || dimTempo.isLoading || secretariasQuery.isLoading,
  };
}
