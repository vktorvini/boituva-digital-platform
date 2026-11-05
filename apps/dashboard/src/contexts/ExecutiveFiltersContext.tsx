import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ExecutiveFilters, MonthFilter } from "@/data/executiveModel";

interface ExecutiveFiltersContextValue {
  filters: ExecutiveFilters;
  setYear: (year: number) => void;
  setMonth: (month: MonthFilter) => void;
  setSecretaria: (secretaria: string) => void;
  resetFilters: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

const defaultFilters: ExecutiveFilters = {
  year: CURRENT_YEAR,
  month: "all",
  secretaria: "all",
};

const ExecutiveFiltersContext = createContext<ExecutiveFiltersContextValue | undefined>(undefined);

export function ExecutiveFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<ExecutiveFilters>(() => {
    if (typeof window === "undefined") return defaultFilters;

    const raw = window.localStorage.getItem("boituva.executive.filters");
    if (!raw) return defaultFilters;

    try {
      const parsed = JSON.parse(raw) as Partial<ExecutiveFilters>;
      return {
        year: parsed.year ?? CURRENT_YEAR,
        month: parsed.month ?? "all",
        secretaria: parsed.secretaria ?? "all",
      };
    } catch {
      return defaultFilters;
    }
  });

  useEffect(() => {
    window.localStorage.setItem("boituva.executive.filters", JSON.stringify(filters));
  }, [filters]);

  const value = useMemo(
    () => ({
      filters,
      setYear: (year: number) => setFilters((current) => ({ ...current, year })),
      setMonth: (month: MonthFilter) => setFilters((current) => ({ ...current, month })),
      setSecretaria: (secretaria: string) => setFilters((current) => ({ ...current, secretaria })),
      resetFilters: () => setFilters({ ...defaultFilters, year: CURRENT_YEAR }),
    }),
    [filters],
  );

  return <ExecutiveFiltersContext.Provider value={value}>{children}</ExecutiveFiltersContext.Provider>;
}

export function useExecutiveFilters() {
  const context = useContext(ExecutiveFiltersContext);

  if (!context) {
    throw new Error("useExecutiveFilters must be used inside ExecutiveFiltersProvider");
  }

  return context;
}
