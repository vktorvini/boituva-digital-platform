import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Printer,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExecutiveFilters } from "@/contexts/ExecutiveFiltersContext";
import {
  EXPENSE_STAGES,
  getFinancialYearToDate,
  getHistoricalSeries,
  getMonthlyExpenseAlerts,
  getRadarPeriodSummary,
} from "@/data/radarFinanceiro";
import {
  useFinanceiroMensal,
  usePipelineStatus,
} from "@/hooks/useSupabaseFinanceiro";

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const fullCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const MONTHS: Record<string, string> = {
  Janeiro: "Jan",
  Fevereiro: "Fev",
  Março: "Mar",
  Marco: "Mar",
  Abril: "Abr",
  Maio: "Mai",
  Junho: "Jun",
  Julho: "Jul",
  Agosto: "Ago",
  Setembro: "Set",
  Outubro: "Out",
  Novembro: "Nov",
  Dezembro: "Dez",
};
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 gov-shadow-card">
      <CardContent className="flex min-h-32 items-start justify-between gap-3 p-4 md:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 truncate text-xl font-bold tracking-tight text-foreground md:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-lg border border-primary/10 bg-primary/5 p-2 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function formatUpdate(value?: string) {
  if (!value) return "Sem registro de atualização publicado no Supabase.";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function RadarGestao() {
  const { filters } = useExecutiveFilters();
  const mensal = useFinanceiroMensal();
  const pipeline = usePipelineStatus();
  const rows = useMemo(() => mensal.data ?? [], [mensal.data]);
  const yearRows = rows.filter((row) => row.ano === filters.year);
  const summary = useMemo(
    () => getRadarPeriodSummary(rows, filters.year, filters.month),
    [rows, filters.year, filters.month],
  );
  const yearToDate = useMemo(
    () => getFinancialYearToDate(rows, filters.year, filters.month),
    [rows, filters.year, filters.month],
  );
  const history = useMemo(
    () => getHistoricalSeries(rows, filters.year, filters.month),
    [rows, filters.year, filters.month],
  );
  const alerts = useMemo(
    () => getMonthlyExpenseAlerts(rows, filters.year, summary.months).slice(0, 6),
    [rows, filters.year, summary.months],
  );
  const chartRows = yearRows
    .filter((row) => filters.month === "all" || row.mes_num === Number(filters.month))
    .map((row) => ({
      month: MONTHS[row.mes_nome] ?? row.mes_nome,
      despesa_empenhada: row.despesa_empenhada,
      despesa_liquidada: row.despesa_liquidada,
      despesa_paga: row.despesa_paga,
    }));
  const lastUpdated = pipeline.data?.find((status) => status.finalizado_em)?.finalizado_em;
  const updateDescription = pipeline.isError
    ? "Não foi possível consultar o status de atualização."
    : formatUpdate(lastUpdated);
  const periodDescription =
    filters.month === "all"
      ? `Exercício ${filters.year}${yearRows.length > 0 && yearRows.length < 12 ? ` · ${yearRows.length} meses com dados` : ""}`
      : `${MONTH_LABELS[Number(filters.month) - 1] ?? filters.month}/${filters.year}`;
  const comparisonLabel =
    summary.months.length === 1
      ? "mesmo mês do exercício anterior"
      : "mesmo período do exercício anterior";
  const yearMonths = new Set(yearRows.map((row) => row.mes_num)).size;

  if (mensal.isLoading) {
    return (
      <AppLayout hideSecretariaFilter>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (mensal.isError) {
    return (
      <AppLayout hideSecretariaFilter>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Não foi possível carregar o Radar</CardTitle>
            <CardDescription>
              Verifique a conexão com o Supabase e a disponibilidade da view financeira.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {mensal.error instanceof Error ? mensal.error.message : "Erro desconhecido ao consultar os dados."}
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideSecretariaFilter>
      <div className="space-y-6 pb-8">
        <section className="flex flex-col gap-4 border-b border-border/30 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Radar de Gestão</h1>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                Financeiro
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Acompanhamento gerencial das despesas e receitas municipais. {periodDescription}.
            </p>
          </div>
          <Button type="button" variant="outline" className="print:hidden" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / salvar PDF
          </Button>
        </section>

        {yearMonths > 0 && yearMonths < 12 && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-muted-foreground">
              Exercício parcial: há dados publicados para {yearMonths} de 12 meses em {filters.year}.
              Comparações anuais usam os mesmos meses disponíveis no exercício anterior.
            </p>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Despesa empenhada"
            value={compactCurrency.format(summary.current.despesa_empenhada)}
            description={`No período selecionado · ${periodDescription}`}
            icon={<ArrowUpRight className="h-4 w-4" />}
          />
          <MetricCard
            title="Despesa liquidada"
            value={compactCurrency.format(summary.current.despesa_liquidada)}
            description={`No período selecionado · ${periodDescription}`}
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            title="Despesa paga"
            value={compactCurrency.format(summary.current.despesa_paga)}
            description={`No período selecionado · ${periodDescription}`}
            icon={<ArrowDownRight className="h-4 w-4" />}
          />
          <MetricCard
            title="Receita realizada"
            value={compactCurrency.format(summary.current.receita_realizada)}
            description="Arrecadação efetiva no período"
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            title="Despesa paga acumulada"
            value={compactCurrency.format(yearToDate.despesa_paga)}
            description={`Acumulado no exercício até ${filters.month === "all" ? "o último mês disponível" : periodDescription}`}
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            title="Variação da despesa paga"
            value={
              summary.paidVariationPercent === null
                ? "Sem comparação"
                : `${summary.paidVariationPercent > 0 ? "+" : ""}${summary.paidVariationPercent.toFixed(1)}%`
            }
            description={
              summary.paidVariationPercent === null
                ? "Não há base positiva comparável no exercício anterior"
                : comparisonLabel
            }
            icon={
              summary.paidVariationPercent !== null && summary.paidVariationPercent < 0 ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )
            }
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/60 gov-shadow-card">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Despesas por mês</CardTitle>
              <CardDescription>
                Empenhada, liquidada e paga são estágios distintos da execução.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartRows.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Não há dados mensais para o período selecionado.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartRows} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={64}
                      tickFormatter={(value: number) => compactCurrency.format(value)}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        fullCurrency.format(value),
                        name,
                      ]}
                    />
                    <Legend />
                    {EXPENSE_STAGES.map((stage, index) => (
                      <Line
                        key={stage.key}
                        type="monotone"
                        dataKey={stage.key}
                        name={stage.label}
                        stroke={["hsl(var(--gov-blue))", "hsl(38 92% 50%)", "hsl(152 60% 36%)"][index]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 gov-shadow-card">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                Comparação entre exercícios
              </CardTitle>
              <CardDescription>
                {filters.month === "all"
                  ? "Totais anuais por estágio; exercício parcial identificado no aviso acima."
                  : `Valores do mês selecionado (${filters.month}) em cada exercício.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={history} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={64}
                    tickFormatter={(value: number) => compactCurrency.format(value)}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      fullCurrency.format(value),
                      name,
                    ]}
                    labelFormatter={(year: number) => `Exercício ${year}`}
                  />
                  <Legend />
                  {EXPENSE_STAGES.map((stage, index) => (
                    <Bar
                      key={stage.key}
                      dataKey={stage.key}
                      name={stage.label}
                      fill={["hsl(var(--gov-blue))", "hsl(38 92% 50%)", "hsl(152 60% 36%)"][index]}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <Card className="border-border/60 gov-shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base md:text-lg">Variações para análise</CardTitle>
            </div>
            <CardDescription>
              Comparação de cada mês com o mesmo mês do exercício anterior. Variação não significa
              irregularidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <p className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                Não foram identificadas variações iguais ou superiores a 20% com base comparável
                neste período. A ausência de alerta não comprova ausência de fatos relevantes.
              </p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={`${alert.period}-${alert.indicator}`}
                  className="grid gap-3 rounded-lg border border-border/60 p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-700">
                        {alert.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.justification}</p>
                  </div>
                  <div className="text-sm md:text-right">
                    <p className="font-semibold">
                      {fullCurrency.format(alert.currentValue)}{" "}
                      <span className="font-normal text-muted-foreground">vs</span>{" "}
                      {fullCurrency.format(alert.referenceValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atual vs referência · {alert.variationPercent > 0 ? "+" : ""}
                      {alert.variationPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/15 bg-primary/[0.025]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Cobertura e limitações dos dados</CardTitle>
            </div>
            <CardDescription>
              O Radar exibe somente dimensões e atualizações efetivamente publicadas no Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium">Disponível nesta página</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                <li>Receita realizada e despesas empenhadas, liquidadas e pagas por mês.</li>
                <li>Comparação com os mesmos meses do exercício anterior.</li>
                <li>Histórico de exercícios de acordo com os filtros do cabeçalho.</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Ainda não publicado para análise</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                <li>Despesas por órgão/secretaria: fato mensal por secretaria sem registros.</li>
                <li>Fornecedores e quantidade de registros processados: não disponíveis nas views.</li>
                <li>
                  Categoria da despesa: os eventos Gold disponíveis representam estágios contábeis,
                  não classificação confiável do gasto.
                </li>
                <li>Última atualização: {updateDescription}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Fonte: TCE-SP, via view pública <code>vw_financeiro_mensal</code> do Supabase. Os alertas
          são sinais comparativos para análise gerencial, não juízo de legalidade.
        </p>
        <p className="hidden text-xs text-muted-foreground print:block">
          Relatório gerado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}
        </p>
      </div>
    </AppLayout>
  );
}
