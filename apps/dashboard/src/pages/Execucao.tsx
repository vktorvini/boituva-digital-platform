/**
 * Página Execução Orçamentária — dados reais do Supabase
 * =====================================================
 * Substituição da versão mock por dados reais via useSupabaseFinanceiro.
 * Layout preservado. Toda a lógica de formatação mantida.
 *
 * Dados consumidos:
 *   - gold_financeiro_mensal  → gráfico mensal + KPIs
 *   - gold_despesa_mensal_evento → breakdown por categoria
 *   - gold_receita_mensal_fonte  → receita por fonte
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useSupabaseFinanceiro } from "@/hooks/useSupabaseFinanceiro";
import { useExecutiveFilters } from "@/contexts/ExecutiveFiltersContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Activity } from "lucide-react";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const fmtM = (v: number) => BRL.format(v);
const fmtPct = (v: number | null) => v != null ? `${v.toFixed(1)}%` : "—";

const MES_ABREV: Record<string, string> = {
  "Janeiro": "Jan", "Fevereiro": "Fev", "Marco": "Mar", "Abril": "Abr",
  "Maio": "Mai", "Junho": "Jun", "Julho": "Jul", "Agosto": "Ago",
  "Setembro": "Set", "Outubro": "Out", "Novembro": "Nov", "Dezembro": "Dez",
};

export default function Execucao() {
  const { filters } = useExecutiveFilters();
  const { mensal, anoData, kpis, pctExecucaoFinanceira, pctPressaoFiscal, isLoading, isError } =
    useSupabaseFinanceiro(filters.year, filters.month);

  // Gráfico mensal — campos alinhados à vw_financeiro_mensal
  const chartMensal = (mensal.data ?? [])
    .filter((r) => r.ano === filters.year)
    .map((r) => ({
      mes:      MES_ABREV[r.mes_nome] ?? r.mes_nome,
      receita:  r.receita_realizada,
      pago:     r.despesa_paga,
      empenhado: r.despesa_empenhada,
    }));

  // Breakdown de evento: usa os campos diretos que já vêm da view
  const eventoAno = [
    { categoria: "empenhada",  valor: kpis.despesaEmpenhada },
    { categoria: "liquidada",  valor: kpis.despesaLiquidada },
    { categoria: "paga",       valor: kpis.despesaPaga },
  ].filter((e) => e.valor > 0).sort((a, b) => b.valor - a.valor);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Carregando dados do Supabase…
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center text-destructive">
          Erro ao carregar dados. Verifique a conexão com o Supabase.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* ── Cabeçalho ── */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Execução Orçamentária</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Acompanhamento financeiro consolidado do exercício de {filters.year}.
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Dados em tempo real via TCE-SP</Badge>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Receita realizada"
            value={fmtM(kpis.receitaTotal)}
            subtitle="Entrada efetiva no período"
            trend="stable"
            trendValue="-"
          />
          <KpiCard
            title="Despesa paga"
            value={fmtM(kpis.despesaPaga)}
            subtitle="Saída financeira do caixa"
            trend="stable"
            trendValue="-"
          />
          <KpiCard
            title="Execução financeira"
            value={fmtPct(pctExecucaoFinanceira)}
            subtitle="Proporção da receita empenhada"
            status={pctExecucaoFinanceira != null ? (pctExecucaoFinanceira >= 80 ? "normal" : pctExecucaoFinanceira >= 60 ? "atencao" : "critico") : undefined}
          />
          <KpiCard
            title="Pressão fiscal"
            value={fmtPct(pctPressaoFiscal)}
            subtitle="Gap empenhado vs pago"
            status={pctPressaoFiscal != null ? (pctPressaoFiscal <= 15 ? "normal" : pctPressaoFiscal <= 25 ? "atencao" : "critico") : undefined}
          />
        </div>

        {/* ── Gráficos Principais ── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="border-border/60 gov-shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Série Histórica: Receita × Despesa</CardTitle>
              </div>
              <CardDescription>Evolução mensal ao longo de {filters.year}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartMensal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--gov-blue))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--gov-blue))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--gov-red))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--gov-red))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => fmtM(v)} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(v: number) => fmtM(v)} 
                  />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--gov-blue))" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" name="Receita" />
                  <Area type="monotone" dataKey="pago" stroke="hsl(var(--gov-red))" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesa)" name="Despesa Paga" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60 gov-shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Composição da Despesa</CardTitle>
              <CardDescription>Funil orçamentário consolidado no ano.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={eventoAno} layout="vertical" margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" tickFormatter={(v) => fmtM(v)} hide />
                  <YAxis type="category" dataKey="categoria" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', textTransform: 'capitalize' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(v: number) => fmtM(v)} 
                    cursor={{fill: 'hsl(var(--muted)/0.4)'}}
                  />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                    {eventoAno.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.categoria === 'paga' ? 'hsl(152 60% 36%)' : entry.categoria === 'liquidada' ? 'hsl(38 92% 50%)' : 'hsl(220 55% 18%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabela resumo ── */}
        <Card className="border-border/60 gov-shadow-card">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-xl">Detalhamento Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-4 pl-4 pr-6 font-semibold">Indicador</th>
                    <th className="py-4 pr-4 text-right font-semibold">Valor Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Receita total realizada",     value: fmtM(kpis.receitaTotal) },
                    { label: "Despesa empenhada",           value: fmtM(kpis.despesaEmpenhada) },
                    { label: "Despesa liquidada",           value: fmtM(kpis.despesaLiquidada) },
                    { label: "Despesa paga",                value: fmtM(kpis.despesaPaga) },
                    { label: "Saldo receita vs pago",       value: fmtM(kpis.saldoPago) },
                    { label: "Saldo receita vs empenhado",  value: fmtM(kpis.saldoEmpenhado) },
                    { label: "Gap empenhado vs pago",       value: fmtM(kpis.gapEmpenhadoPago) },
                    { label: "Execução financeira",         value: fmtPct(pctExecucaoFinanceira) },
                    { label: "Pressão fiscal",              value: fmtPct(pctPressaoFiscal) },
                  ].map(({ label, value }, idx) => (
                    <tr key={label} className={`border-b border-border/30 hover:bg-muted/10 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/5'}`}>
                      <td className="py-3 pl-4 pr-6 font-medium text-foreground/90">{label}</td>
                      <td className="py-3 pr-4 text-right text-muted-foreground font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
