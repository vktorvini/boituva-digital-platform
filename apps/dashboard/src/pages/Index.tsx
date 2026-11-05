import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabaseFinanceiro, useIndicadoresIbge } from "@/hooks/useSupabaseFinanceiro";
import { fetchPncpSourceData, fetchTseSourceData } from "@/services/sourcePipelines";
import { useQuery } from "@tanstack/react-query";
import { useExecutiveFilters } from "@/contexts/ExecutiveFiltersContext";
import { formatCurrencyCompact, formatPercent } from "@/data/executiveModel";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Globe2, Vote, ShoppingCart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { municipiosRegiao, getLatestYearData } from "@/data/iegmData";

export default function Index() {
  const { filters } = useExecutiveFilters();
  const ano = filters.year;
  const { kpis, mensal, isLoading: loadingFin } = useSupabaseFinanceiro(ano, filters.month);
  const { data: ibge } = useIndicadoresIbge();
  const { data: pncp } = useQuery({ queryKey: ["source", "pncp"], queryFn: fetchPncpSourceData });
  const { data: tse } = useQuery({ queryKey: ["source", "tse"], queryFn: fetchTseSourceData });

  if (loadingFin) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-[360px] w-full rounded-xl lg:col-span-2" />
            <Skeleton className="h-[360px] w-full rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const revenueSpark = (mensal.data ?? []).slice(-6).map((m) => ({ value: m.receita_realizada }));
  const expenseSpark = (mensal.data ?? []).slice(-6).map((m) => ({ value: m.despesa_paga }));

  const alerts = [];
  if (kpis.saldoPago < 0) {
    alerts.push({
      title: "Risco Fiscal",
      desc: `Déficit operacional de ${formatCurrencyCompact(Math.abs(kpis.saldoPago))}`,
      type: "critico" as const,
    });
  } else {
    alerts.push({
      title: "Superávit de Caixa",
      desc: `Resultado positivo de ${formatCurrencyCompact(kpis.saldoPago)} no período.`,
      type: "normal" as const,
    });
  }

  const pressaoPct = (kpis.despesaEmpenhada / kpis.receitaTotal) * 100 || 0;
  if (pressaoPct > 90) {
    alerts.push({
      title: "Alerta de Liquidez",
      desc: "Empenhos pendentes ultrapassaram 90% da receita arrecadada.",
      type: "critico" as const,
    });
  } else if (pressaoPct > 70) {
    alerts.push({
      title: "Pressão Fiscal",
      desc: "Gasto empenhado em nível de atenção (acima de 70%).",
      type: "atencao" as const,
    });
  }

  const boituva = municipiosRegiao.find((m) => m.isBoituva);
  const boituvaIEGM = boituva ? getLatestYearData(boituva, ano) : null;
  const popIbge =
    ibge?.find((i) => i.indicador_nome.toLowerCase().includes("população"))?.valor_formatado || "62.000";

  const quickLinks = [
    { title: "Execução Financeira", href: "/execucao", desc: "Receitas, despesas e saldo" },
    { title: "Índice IEGM", href: "/painel/iegm-scorecard", desc: "Desempenho municipal TCE-SP" },
    { title: "Comparativo Regional", href: "/comparativo-regional", desc: "Benchmark Sorocaba" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 pb-6 md:space-y-8 md:pb-10">
        <section className="flex flex-col gap-4 border-b border-border/30 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-white p-1.5 shadow-sm">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Bras%C3%A3o_de_Boituva_-_SP.svg"
                alt="Brasão de Boituva"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Cockpit Executivo</h1>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Gestão por Dados · Exercício {ano}
              </p>
            </div>
          </div>
          <Badge className="w-fit border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            Dados Oficiais Integrados
          </Badge>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
          <KpiCard title="Receita Arrecadada" value={formatCurrencyCompact(kpis.receitaTotal)} subtitle="Arrecadação Real" sparklineData={revenueSpark} />
          <KpiCard title="Despesa Paga" value={formatCurrencyCompact(kpis.despesaPaga)} subtitle="Liquidação de Caixa" sparklineData={expenseSpark} trendPositive={false} />
          <KpiCard title="Saldo Disponível" value={formatCurrencyCompact(kpis.saldoPago)} subtitle="Fluxo de Período" status={kpis.saldoPago >= 0 ? "normal" : "critico"} />
          <KpiCard title="Pressão Fiscal" value={formatPercent(pressaoPct)} subtitle="Comprometimento" status={pressaoPct > 90 ? "critico" : pressaoPct > 70 ? "atencao" : "normal"} />
          <KpiCard title="População (IBGE)" value={popIbge} subtitle="Estimativa Censo" />
          <KpiCard
            title="Maturidade IEGM"
            value={`Faixa ${boituvaIEGM?.iegm.faixa || "C+"}`}
            subtitle={`Nota ${boituvaIEGM?.iegm.nota.toFixed(1) || "5.5"} no TCESP`}
            status={boituvaIEGM?.iegm.faixa.includes("A") || boituvaIEGM?.iegm.faixa.includes("B") ? "normal" : "atencao"}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm gov-shadow-card lg:col-span-2">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-base font-bold md:text-lg">Evolução de Caixa</CardTitle>
              <CardDescription className="text-xs">Receitas vs despesas mensais</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mensal.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--gov-blue))" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="hsl(var(--gov-blue))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--gov-red))" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="hsl(var(--gov-red))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.25} />
                  <XAxis dataKey="mes_nome" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatCurrencyCompact(v)} width={56} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
                    formatter={(v: number) => formatCurrencyCompact(v)}
                  />
                  <Area type="monotone" dataKey="receita_realizada" stroke="hsl(var(--gov-blue))" strokeWidth={2.5} fill="url(#colorRec)" name="Receita" isAnimationActive={false} />
                  <Area type="monotone" dataKey="despesa_paga" stroke="hsl(var(--gov-red))" strokeWidth={2.5} fill="url(#colorDes)" name="Despesa" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="flex flex-col border-border/50 bg-card/70 backdrop-blur-sm gov-shadow-card">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-base font-bold md:text-lg">Alertas do Período</CardTitle>
              <CardDescription className="text-xs">Indicadores automáticos do cockpit</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 pt-4">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border-l-4 p-3.5",
                    alert.type === "critico" && "border-red-500 bg-red-500/5",
                    alert.type === "atencao" && "border-amber-500 bg-amber-500/5",
                    alert.type === "normal" && "border-emerald-500 bg-emerald-500/5"
                  )}
                >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{alert.title}</p>
                  <p className="text-sm font-semibold leading-snug text-foreground">{alert.desc}</p>
                </div>
              ))}

              <div className="mt-auto space-y-2 border-t border-border/30 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Acesso rápido</p>
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="group flex items-center justify-between rounded-lg border border-border/40 bg-background/60 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{link.title}</p>
                      <p className="text-xs text-muted-foreground">{link.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SourceMiniCard title="IBGE" icon={Globe2} status="OK" value={ibge?.find((i) => i.indicador_id === "populacao-estimada")?.valor_formatado || "63.850"} />
          <SourceMiniCard title="TCE-SP" icon={ShieldCheck} status="LIVE" value="Integrado" />
          <SourceMiniCard title="Compras" icon={ShoppingCart} status="LIVE" value={pncp ? formatCurrencyCompact(pncp.summary.valor_total) : "—"} />
          <SourceMiniCard title="TSE" icon={Vote} status="OK" value={`${tse?.summary.datasets || 4} datasets`} />
        </section>
      </div>
    </AppLayout>
  );
}

function SourceMiniCard({
  title,
  icon: Icon,
  status,
  value,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/70 p-4 backdrop-blur-sm transition-shadow hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="mb-0.5 flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
          <span className="text-[9px] font-bold uppercase text-emerald-600">{status}</span>
        </div>
        <p className="truncate text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
