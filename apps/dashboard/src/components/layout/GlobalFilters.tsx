import { useEffect } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";

export function GlobalFilters() {
  const {
    filters,
    availableYears,
    monthOptions,
    secretarias,
    defaultYear,
    setYear,
    setMonth,
    setSecretaria,
    resetFilters,
  } = useExecutiveDashboard();

  // Sincroniza ano salvo no localStorage quando não existe mais nos dados
  useEffect(() => {
    if (availableYears.length === 0) return;
    if (!availableYears.includes(filters.year)) {
      setYear(defaultYear);
    }
  }, [availableYears, defaultYear, filters.year, setYear]);

  // Se o mês selecionado não existir no ano, volta para "ano completo"
  useEffect(() => {
    if (filters.month === "all") return;
    const monthExists = monthOptions.some((option) => option.value === filters.month);
    if (!monthExists) {
      setMonth("all");
    }
  }, [filters.month, monthOptions, setMonth]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="rounded-md border border-primary/15 bg-primary/10 p-1.5 text-primary">
          <Filter className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider">Filtros</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-3xl lg:flex-1">
        <Select value={String(filters.year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="h-9 bg-background/80 text-xs">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.month} onValueChange={(value) => setMonth(value as typeof filters.month)}>
          <SelectTrigger className="h-9 bg-background/80 text-xs">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.secretaria} onValueChange={setSecretaria}>
          <SelectTrigger className="col-span-2 h-9 bg-background/80 text-xs sm:col-span-1">
            <SelectValue placeholder="Secretaria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as secretarias</SelectItem>
            {secretarias.map((secretaria) => (
              <SelectItem key={secretaria.id} value={secretaria.id}>
                {secretaria.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="col-span-2 h-9 justify-center gap-1.5 text-xs sm:col-span-1"
          onClick={resetFilters}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpar
        </Button>
      </div>
    </div>
  );
}
