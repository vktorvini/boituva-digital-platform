import { useMemo } from "react";
import { monthOptions as staticMonthOptions, type MonthOption } from "@/data/executiveModel";
import { useDimTempo, useFinanceiroAnual, useSecretarias } from "@/hooks/useSupabaseFinanceiro";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Opções de filtros derivadas do Supabase (vw_financeiro_anual, vw_dim_tempo, vw_secretarias).
 */
export function useFilterOptions(selectedYear: number) {
  const anual = useFinanceiroAnual();
  const dimTempo = useDimTempo();
  const secretariasQuery = useSecretarias();

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    (anual.data ?? []).forEach((row) => years.add(row.ano));
    (dimTempo.data ?? []).forEach((row) => years.add(row.ano));

    if (years.size === 0) {
      return anual.isLoading || dimTempo.isLoading ? [CURRENT_YEAR] : [CURRENT_YEAR];
    }

    // Sempre inclui o ano corrente para permitir navegação (mesmo antes do pipeline subir junho)
    years.add(CURRENT_YEAR);

    return Array.from(years).sort((a, b) => b - a);
  }, [anual.data, anual.isLoading, dimTempo.data, dimTempo.isLoading]);

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
