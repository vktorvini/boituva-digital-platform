import { useReceitaMensalFonte } from "@/hooks/useGovernancaData";
import { formatCurrency, formatPercent } from "@/data/mockData";
import { DataState } from "@/components/ui/DataState";
import { cn } from "@/lib/utils";

export function RevenueSourcesTable() {
  const { data, isLoading, isError, isEmpty } = useReceitaMensalFonte();

  return (
    <div className="bg-card rounded-lg p-5 gov-shadow-card border border-border">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Fontes de Receita — Jun/2025</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Arrecadação realizada por fonte de recurso no mês selecionado.
        </p>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        compact
        emptyMessage="Sem dados de receita por fonte"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Fonte</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Previsto</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Realizado</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Execução</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 font-medium text-foreground">{item.fonte}</td>
                  <td className="text-right py-2.5 text-muted-foreground">
                    {formatCurrency(item.valor_previsto)}
                  </td>
                  <td className="text-right py-2.5 text-foreground font-medium">
                    {formatCurrency(item.valor_realizado)}
                  </td>
                  <td className="text-right py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        item.percentual >= 100
                          ? "bg-gov-green/10 text-gov-green"
                          : item.percentual >= 90
                            ? "bg-gov-amber/10 text-gov-amber"
                            : "bg-gov-red/10 text-gov-red"
                      )}
                    >
                      {formatPercent(item.percentual)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
    </div>
  );
}