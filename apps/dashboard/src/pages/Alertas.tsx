import { AppLayout } from "@/components/layout/AppLayout";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { DataState } from "@/components/ui/DataState";
import { useIndicadoresFiscais } from "@/hooks/useGovernancaData";
import { formatPercent } from "@/data/mockData";

export default function Alertas() {
  const { data, isLoading, isError, isEmpty } = useIndicadoresFiscais();

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas e Riscos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento contínuo de indicadores que exigem atenção da gestão.
          </p>
        </div>
        <DataState isLoading={isLoading} isError={isError} isEmpty={isEmpty} emptyMessage="Nenhum indicador disponível">
          <div className="grid grid-cols-1 gap-3">
            {(data ?? []).map((ind) => (
              <AlertCard
                key={ind.id}
                title={ind.indicador}
                description={ind.descricao}
                status={ind.status}
                value={formatPercent(ind.valor)}
                indicator={`Limite legal: ${formatPercent(ind.limite_legal)}`}
              />
            ))}
          </div>
        </DataState>
      </div>
    </AppLayout>
  );
}
