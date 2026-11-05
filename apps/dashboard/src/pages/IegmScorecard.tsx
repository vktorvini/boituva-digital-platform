import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/DataState";
import { fetchTcespSourceData } from "@/services/sourcePipelines";

type RegionalRow = Record<string, string | number | boolean | null>;

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toText(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : "sem nota";
}

export default function IegmScorecard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["painel", "iegm-scorecard", "tcesp"],
    queryFn: fetchTcespSourceData,
    refetchInterval: 5 * 60 * 1000,
  });

  const rows = useMemo(() => (data?.regional?.rows ?? []) as RegionalRow[], [data?.regional?.rows]);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const row of rows) {
      Object.keys(row).forEach((key) => {
        const match = key.match(/^iegm_(\d{4})_num$/);
        if (match) set.add(Number(match[1]));
      });
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const year = selectedYear ?? (years.length ? years[years.length - 1] : null);

  const boituva = rows.find((row) => row.municipio === "Boituva");

  const regionalStats = useMemo(() => {
    if (!year) return null;
    const iegmCol = `iegm_${year}_num`;
    const igovCol = `igovti_${year}_num`;
    const iegmValues = rows.map((r) => toNumber(r[iegmCol])).filter((v): v is number => v !== null);
    const igovValues = rows.map((r) => toNumber(r[igovCol])).filter((v): v is number => v !== null);
    const avg = (values: number[]) => (values.length ? values.reduce((s, n) => s + n, 0) / values.length : null);

    return {
      iegmAvg: avg(iegmValues),
      igovAvg: avg(igovValues),
      municipiosIegm: iegmValues.length,
      municipiosIgov: igovValues.length,
    };
  }, [rows, year]);

  const timeline = useMemo(() => {
    if (!boituva || !years.length) return [];
    return years.map((y) => {
      const iegmCol = `iegm_${y}_num`;
      const igovCol = `igovti_${y}_num`;
      const iegmValues = rows.map((r) => toNumber(r[iegmCol])).filter((v): v is number => v !== null);
      const igovValues = rows.map((r) => toNumber(r[igovCol])).filter((v): v is number => v !== null);
      const avg = (values: number[]) => (values.length ? values.reduce((s, n) => s + n, 0) / values.length : null);
      return {
        ano: String(y),
        iegmBoituva: toNumber(boituva[iegmCol]),
        igovBoituva: toNumber(boituva[igovCol]),
        iegmRegional: avg(iegmValues),
        igovRegional: avg(igovValues),
      };
    });
  }, [boituva, rows, years]);

  const ranking = useMemo(() => {
    if (!year) return [];
    const iegmCol = `iegm_${year}_num`;
    return [...rows]
      .map((row) => ({
        municipio: toText(row.municipio),
        iegmNum: toNumber(row[iegmCol]),
        iegmGrade: toText(row[`iegm_${year}`]),
      }))
      .filter((row) => row.iegmNum !== null)
      .sort((a, b) => (b.iegmNum ?? 0) - (a.iegmNum ?? 0));
  }, [rows, year]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Score Card IEGM - Boituva</h2>
            <p className="text-sm text-muted-foreground">
              Painel do TCE com comparacao anual de Boituva e regiao de Sorocaba, com busca por anos anteriores.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Ano</span>
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={year ?? ""}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              disabled={!years.length}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataState isLoading={isLoading} isError={isError} isEmpty={!data?.regional || rows.length === 0}>
          {data?.regional && year && boituva && regionalStats && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>IEGM Boituva ({year})</CardDescription>
                    <CardTitle>{toText(boituva[`iegm_${year}`])}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Score numerico: {toNumber(boituva[`iegm_${year}_num`]) ?? "n/d"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>i-Gov TI Boituva ({year})</CardDescription>
                    <CardTitle>{toText(boituva[`igovti_${year}`])}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Score numerico: {toNumber(boituva[`igovti_${year}_num`]) ?? "n/d"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Media regional IEGM</CardDescription>
                    <CardTitle>{regionalStats.iegmAvg?.toFixed(2) ?? "n/d"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Municipios com nota: {regionalStats.municipiosIegm}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Media regional i-Gov TI</CardDescription>
                    <CardTitle>{regionalStats.igovAvg?.toFixed(2) ?? "n/d"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">Municipios com nota: {regionalStats.municipiosIgov}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Historico de Boituva versus media regional</CardTitle>
                  <CardDescription>Serie anual para IEGM e i-Gov TI.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 88%)" />
                      <XAxis dataKey="ano" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="iegmBoituva" stroke="hsl(210 70% 45%)" strokeWidth={3} name="IEGM Boituva" />
                      <Line type="monotone" dataKey="iegmRegional" stroke="hsl(210 60% 70%)" strokeDasharray="6 4" name="IEGM Regional" />
                      <Line type="monotone" dataKey="igovBoituva" stroke="hsl(152 60% 36%)" strokeWidth={3} name="i-Gov TI Boituva" />
                      <Line type="monotone" dataKey="igovRegional" stroke="hsl(152 30% 65%)" strokeDasharray="6 4" name="i-Gov TI Regional" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Ranking regional IEGM ({year})</CardTitle>
                  <CardDescription>Posicao de Boituva entre municipios com nota valida.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-muted-foreground">
                          <th className="py-3 pr-4">Posicao</th>
                          <th className="py-3 pr-4">Municipio</th>
                          <th className="py-3 pr-4">Nota</th>
                          <th className="py-3 pr-4">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((item, idx) => (
                          <tr key={`${item.municipio}-${idx}`} className="border-b border-border/50">
                            <td className="py-3 pr-4 text-muted-foreground">{idx + 1}</td>
                            <td className="py-3 pr-4 font-medium text-foreground">
                              {item.municipio}
                              {item.municipio === "Boituva" && <Badge className="ml-2" variant="secondary">Boituva</Badge>}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{item.iegmGrade}</td>
                            <td className="py-3 pr-4 text-muted-foreground">{item.iegmNum?.toFixed(2)}</td>
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
