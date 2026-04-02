import { AppLayout } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RevenueSourcesTable } from "@/components/dashboard/RevenueSourcesTable";
import { DataState } from "@/components/ui/DataState";
import { useFinanceiroAnual } from "@/hooks/useGovernancaData";
import { formatCurrency, formatPercent } from "@/data/mockData";

export default function Index() {
  const { data: anoAtual, isLoading, isError } = useFinanceiroAnual(2025);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Executivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada da situação fiscal e financeira do município — exercício 2025.
          </p>
        </div>

        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!anoAtual && !isLoading}
          emptyMessage="Dados anuais indisponíveis"
        >
          {anoAtual && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Receita Realizada"
                value={formatCurrency(anoAtual.receita_realizada)}
                subtitle={`de ${formatCurrency(anoAtual.receita_prevista)} previsto`}
                trend="up"
                trendValue={formatPercent(anoAtual.percentual_execucao_receita)}
                trendPositive
              />
              <KpiCard
                title="Despesa Empenhada"
                value={formatCurrency(anoAtual.despesa_empenhada)}
                subtitle={`de ${formatCurrency(anoAtual.despesa_autorizada)} autorizado`}
                trend="stable"
                trendValue={formatPercent(anoAtual.percentual_execucao_despesa)}
                trendPositive
              />
              <KpiCard
                title="Saldo vs Pago"
                value={formatCurrency(anoAtual.saldo_receita_vs_pago)}
                subtitle="Receita realizada - despesa paga"
                trend={anoAtual.saldo_receita_vs_pago >= 0 ? "up" : "down"}
                trendValue={formatCurrency(Math.abs(anoAtual.saldo_receita_vs_pago))}
                trendPositive={anoAtual.saldo_receita_vs_pago >= 0}
              />
              <KpiCard
                title="Saldo vs Empenhado"
                value={formatCurrency(anoAtual.saldo_receita_vs_empenhado)}
                subtitle="Receita realizada - despesa empenhada"
                trend={anoAtual.saldo_receita_vs_empenhado >= 0 ? "up" : "down"}
                trendValue={formatCurrency(Math.abs(anoAtual.saldo_receita_vs_empenhado))}
                trendPositive={anoAtual.saldo_receita_vs_empenhado >= 0}
              />
            </div>
          )}
        </DataState>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart />
          <RevenueSourcesTable />
        </div>
      </div>
    </AppLayout>
  );
}