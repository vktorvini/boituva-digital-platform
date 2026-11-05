import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataState } from "@/components/ui/DataState";
import { fetchExecFiscalSeries, fetchSiconfiSourceData } from "@/services/sourcePipelines";
import { formatCurrencyCompact, formatPercent } from "@/data/executiveModel";
import { hasSupabaseConfig } from "@/lib/supabase";

export default function OperacionalFiscal() {
  const siconfiQuery = useQuery({
    queryKey: ["operacional", "fiscal", "siconfi"],
    queryFn: fetchSiconfiSourceData,
  });

  const fiscalQuery = useQuery({
    queryKey: ["operacional", "fiscal", "serie"],
    queryFn: fetchExecFiscalSeries,
  });

  const last12 = useMemo(() => (fiscalQuery.data ?? []).slice(-12), [fiscalQuery.data]);
  const lastRow = last12[last12.length - 1];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Operacional - Fiscal</h2>
          <p className="text-sm text-muted-foreground">
            Serie fiscal mensal para controle de receita, pagamento e pressao no gabinete executivo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Receita no ultimo mes</CardDescription>
              <CardTitle>{lastRow ? formatCurrencyCompact(lastRow.receita_realizada) : "-"}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Despesa paga no ultimo mes</CardDescription>
              <CardTitle>{lastRow ? formatCurrencyCompact(lastRow.despesa_paga) : "-"}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pressao fiscal no ultimo mes</CardDescription>
              <CardTitle>{lastRow ? formatPercent(lastRow.pressao_fiscal * 100) : "-"}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Tendencia mensal</CardTitle>
            <CardDescription>
              Receita, despesa paga e pressao fiscal. {hasSupabaseConfig ? "Dados da view executiva no Supabase." : "Supabase nao configurado no frontend."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataState isLoading={fiscalQuery.isLoading} isError={fiscalQuery.isError} isEmpty={last12.length === 0} compact>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={last12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 88%)" />
                  <XAxis dataKey="ano_mes_ref" />
                  <YAxis yAxisId="money" tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
                  <YAxis yAxisId="pct" orientation="right" tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "pressao_fiscal") return formatPercent(value * 100);
                      return formatCurrencyCompact(value);
                    }}
                  />
                  <Legend />
                  <Line yAxisId="money" type="monotone" dataKey="receita_realizada" stroke="hsl(210 70% 45%)" dot={false} name="Receita" />
                  <Line yAxisId="money" type="monotone" dataKey="despesa_paga" stroke="hsl(0 72% 51%)" dot={false} name="Despesa paga" />
                  <Line yAxisId="pct" type="monotone" dataKey="pressao_fiscal" stroke="hsl(35 92% 50%)" dot={false} name="Pressao fiscal" />
                </LineChart>
              </ResponsiveContainer>
            </DataState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Estado da fonte Siconfi</CardTitle>
            <CardDescription>Situacao atual da ingestao oficial da camada Siconfi/MSC.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState isLoading={siconfiQuery.isLoading} isError={siconfiQuery.isError} isEmpty={!siconfiQuery.data} compact>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Exercicio: {siconfiQuery.data?.summary[0]?.an_exercicio ?? "-"}</p>
                <p>Periodo: {siconfiQuery.data?.summary[0]?.nr_periodo ?? "-"}</p>
                <p>Registros retornados: {siconfiQuery.data?.summary[0]?.registros ?? 0}</p>
                <p>Proximo passo tecnico: calibrar filtros de anexo para materializar RCL, RGF e pessoal no modelo gold.</p>
              </div>
            </DataState>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
