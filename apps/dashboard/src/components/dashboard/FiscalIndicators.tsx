import { useIndicadoresFiscais } from "@/hooks/useGovernancaData";
import { formatPercent } from "@/data/mockData";
import { DataState } from "@/components/ui/DataState";
import { cn } from "@/lib/utils";

export function FiscalIndicators() {
  const { data, isLoading, isError, isEmpty } = useIndicadoresFiscais();

  return (
    <div className="bg-card rounded-lg p-5 gov-shadow-card border border-border">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Indicadores Fiscais — 2º Tri/2025</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Indicadores legais obrigatórios. Itens em atenção requerem monitoramento reforçado.
        </p>
      </div>
      <DataState isLoading={isLoading} isError={isError} isEmpty={isEmpty} compact emptyMessage="Sem indicadores fiscais disponíveis">
        <div className="space-y-3">
          {(data ?? []).map((ind) => {
            const ratio = (ind.valor / ind.limite_legal) * 100;
            const barColor = ind.status === "normal" ? "bg-gov-green" : ind.status === "atencao" ? "bg-gov-amber" : "bg-gov-red";

            return (
              <div key={ind.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{ind.indicador}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{formatPercent(ind.valor)}</span>
                    <span className="text-[10px] text-muted-foreground">/ {formatPercent(ind.limite_legal)}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", barColor)}
                    style={{ width: `${Math.min(ratio, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{ind.descricao}</p>
              </div>
            );
          })}
        </div>
      </DataState>
    </div>
  );
}
