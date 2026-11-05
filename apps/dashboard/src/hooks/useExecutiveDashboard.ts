import { useMemo } from "react";
import {
  getCumulativeFinance,
  getExecutiveAlerts,
  getFinanceComparison,
  getMetadataSummary,
  getMonthLabel,
  getOverviewRecommendations,
  getPeriodFinance,
  getRevenueSources,
  getSecretaryExecution,
  getSituationActions,
  getStrategicIndicators,
  getTrendSeries,
  getGovernanceOverview,
  getGovernanceBySecretaria,
  getGovernanceRisks,
} from "@/data/executiveModel";
import { useExecutiveFilters } from "@/contexts/ExecutiveFiltersContext";
import { useFilterOptions } from "@/hooks/useFilterOptions";

export function useExecutiveDashboard() {
  const { filters, setYear, setMonth, setSecretaria, resetFilters } = useExecutiveFilters();
  const { availableYears, monthOptions, secretarias, defaultYear } = useFilterOptions(filters.year);

  return useMemo(() => {
    const periodFinance = getPeriodFinance(filters);
    const cumulativeFinance = getCumulativeFinance(filters);
    const comparison = getFinanceComparison(filters);
    const alerts = getExecutiveAlerts(filters);
    const secretaryExecution = getSecretaryExecution(filters);
    const recommendations = getOverviewRecommendations(filters);
    const strategicIndicators = getStrategicIndicators(filters);
    const revenueSources = getRevenueSources(filters);
    const trendSeries = getTrendSeries(filters.year);
    const situationActions = getSituationActions(filters);
    const governanceOverview = getGovernanceOverview(filters.year);
    const governanceBySecretaria = getGovernanceBySecretaria(filters.year);
    const governanceRisks = getGovernanceRisks(filters.year);
    const metadata = getMetadataSummary();

    return {
      filters,
      setYear,
      setMonth,
      setSecretaria,
      resetFilters,
      periodFinance,
      cumulativeFinance,
      comparison,
      alerts,
      recommendations,
      strategicIndicators,
      revenueSources,
      secretaryExecution,
      trendSeries,
      situationActions,
      governanceOverview,
      governanceBySecretaria,
      governanceRisks,
      availableYears,
      monthOptions,
      secretarias,
      defaultYear,
      periodLabel: `${filters.year} · ${getMonthLabel(filters.month)}`,
      metadata,
    };
  }, [
    filters,
    resetFilters,
    setMonth,
    setSecretaria,
    setYear,
    availableYears,
    monthOptions,
    secretarias,
    defaultYear,
  ]);
}
