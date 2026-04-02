import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useFinanceiroMensal } from "@/hooks/useGovernancaData";
import { DataState } from "@/components/ui/DataState";

const formatValue = (value: number) => `R$ ${value.toFixed(1)} mi`;

export function RevenueChart() {
  const { data, isLoading, isError } = useFinanceiroMensal();

  const chartData = (data ?? [])
    .filter((d) => d.ano === 2025)
    .map((d) => ({
      name: d.mes_nome.substring(0, 3),
      receita: d.receita_realizada / 1_000_000,
      despesa: d.despesa_paga / 1_000_000,
    }));

  return (
    <div className="bg-card rounded-lg p-5 gov-shadow-card border border-border">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Receita vs Despesa — 2025</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Evolução mensal em milhões de reais. Meses com despesa superior à receita indicam pressão fiscal.
        </p>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={chartData.length === 0}
        compact
        emptyMessage="Sem dados financeiros mensais"
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} tickFormatter={(v) => `${v}M`} />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatValue(value),
                name === "receita" ? "Receita" : "Despesa Paga",
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(215 20% 88%)" }}
            />
            <Legend
              verticalAlign="top"
              height={30}
              formatter={(value: string) => (value === "receita" ? "Receita" : "Despesa Paga")}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="hsl(210 70% 45%)"
              fill="hsl(210 70% 45% / 0.15)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="despesa"
              stroke="hsl(0 72% 51%)"
              fill="hsl(0 72% 51% / 0.08)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </DataState>
    </div>
  );
}