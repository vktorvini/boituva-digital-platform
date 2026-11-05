import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataState } from "@/components/ui/DataState";
import { fetchPncpSourceData } from "@/services/sourcePipelines";
import { formatCurrencyCompact } from "@/data/executiveModel";

export default function OperacionalContratos() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["operacional", "contratos", "pncp"],
    queryFn: fetchPncpSourceData,
  });

  const topContracts = useMemo(
    () =>
      (data?.detail ?? [])
        .filter((row) => row.valor_total_num !== null)
        .sort((a, b) => (b.valor_total_num ?? 0) - (a.valor_total_num ?? 0))
        .slice(0, 15),
    [data],
  );

  const chartData = (data?.rows ?? []).map((row) => ({
    dataset: row.dataset_key,
    valor: row.valor_total,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Operacional - Contratos</h2>
          <p className="text-sm text-muted-foreground">
            Leitura de contratacoes para risco de fornecedores, concentracao de gasto e planejamento contratual.
          </p>
        </div>

        <DataState isLoading={isLoading} isError={isError} isEmpty={!data}>
          {data && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Registros analisados</CardDescription>
                    <CardTitle>{data.summary.registros}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Valor observado</CardDescription>
                    <CardTitle>{formatCurrencyCompact(data.summary.valor_total)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Fontes PNCP</CardDescription>
                    <CardTitle>{data.summary.datasets}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Volume por endpoint</CardTitle>
                  <CardDescription>Peso de contratos versus contratacoes/publicacao.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 88%)" />
                      <XAxis dataKey="dataset" />
                      <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
                      <Tooltip formatter={(value: number) => formatCurrencyCompact(value)} />
                      <Bar dataKey="valor" fill="hsl(18 84% 52%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Top contratos por valor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-muted-foreground">
                          <th className="py-3 pr-4">Controle</th>
                          <th className="py-3 pr-4">Orgao</th>
                          <th className="py-3 pr-4">Municipio</th>
                          <th className="py-3 pr-4">UF</th>
                          <th className="py-3 pr-4 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topContracts.map((row, idx) => (
                          <tr key={`${row.numero_controle_pncp}-${idx}`} className="border-b border-border/50">
                            <td className="py-3 pr-4 font-medium text-foreground">{row.numero_controle_pncp ?? "-"}</td>
                            <td className="py-3 pr-4 text-muted-foreground">{row.orgao_entidade ?? "-"}</td>
                            <td className="py-3 pr-4 text-muted-foreground">{row.municipio_nome ?? "-"}</td>
                            <td className="py-3 pr-4 text-muted-foreground">{row.uf_sigla ?? "-"}</td>
                            <td className="py-3 pr-4 text-right">{row.valor_total_num !== null ? formatCurrencyCompact(row.valor_total_num) : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </DataState>
      </div>
    </AppLayout>
  );
}
