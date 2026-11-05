import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line, Legend, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  municipiosRegiao, planoExecucao, getRankingIegm,
  getEvolutionSeries, getBoituvaRadar, getLatestYearData,
} from "@/data/iegmData";
import { Trophy, Target, Zap, ArrowUp, Shield, Monitor, ChevronRight } from "lucide-react";

// ── constantes visuais ──────────────────────────────────────────────────────────
const ANOS_DISPONIVEIS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const COR_BOITUVA = "hsl(214 80% 42%)";   // azul institucional
const COR_BENCHMARK = "hsl(150 60% 40%)"; // esmeralda referência
const COR_OUTROS = "hsl(220 14% 60%)";    // cinza outros municípios

// ── helpers ─────────────────────────────────────────────────────────────────────
const faixaColor = (faixa: string) => {
  if (faixa === "A")         return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
  if (faixa === "B+" || faixa === "Elevado") return "bg-blue-500/10 text-blue-700 border-blue-500/30";
  if (faixa === "B" || faixa === "Alto")     return "bg-sky-500/10 text-sky-700 border-sky-500/30";
  if (faixa === "C+" || faixa === "Suficiente") return "bg-amber-500/10 text-amber-700 border-amber-500/30";
  if (faixa === "C" || faixa === "Básico")   return "bg-orange-500/10 text-orange-700 border-orange-500/30";
  return "bg-red-500/10 text-red-600 border-red-500/30";
};

const prioridadeColor = (p: string) => {
  if (p === "Alta")  return "bg-red-500/10 text-red-600 border-red-500/30";
  if (p === "Média") return "bg-amber-500/10 text-amber-700 border-amber-500/30";
  return "bg-blue-500/10 text-blue-700 border-blue-500/30";
};

// ── sub-componentes ─────────────────────────────────────────────────────────────

function ExecutiveKpiCard({ icon: Icon, title, value, sub, badge, badgeClass }: {
  icon: React.ElementType; title: string; value: string; sub: string;
  badge: string; badgeClass: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-sm hover:border-primary/30 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary border border-primary/10">
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest rounded-full border px-2.5 py-0.5", badgeClass)}>
          {badge}
        </Badge>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">{title}</p>
        <p className="text-3xl font-black tracking-tight text-foreground mt-1">{value}</p>
        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function RankingBar({ municipio, nota, posicao, isBoituva, faixa }: {
  municipio: string; nota: number; posicao: number; isBoituva?: boolean; faixa: string;
}) {
  const pct = (nota / 10) * 100;
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
      isBoituva ? "bg-primary/6 border border-primary/20" : "hover:bg-muted/30"
    )}>
      <span className={cn(
        "w-6 text-center text-xs font-black",
        isBoituva ? "text-primary" : "text-muted-foreground/50"
      )}>
        {posicao}
      </span>
      <span className={cn(
        "w-28 text-xs font-bold shrink-0",
        isBoituva ? "text-primary" : "text-foreground/80"
      )}>
        {isBoituva ? `★ ${municipio}` : municipio}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: isBoituva ? COR_BOITUVA : COR_OUTROS }}
        />
      </div>
      <span className={cn("text-xs font-black w-8 text-right", isBoituva ? "text-primary" : "text-muted-foreground")}>
        {nota.toFixed(1)}
      </span>
      <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-1.5 py-0 rounded-full border", faixaColor(faixa))}>
        {faixa}
      </Badge>
    </div>
  );
}

function CustomRadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-lg px-4 py-3 text-xs">
      <p className="font-black text-foreground mb-1">{payload[0]?.payload?.eixo}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name === "boituva" ? "Boituva" : "Sorocaba"}: {Number(p.value).toFixed(1)}
        </p>
      ))}
    </div>
  );
}

function CustomEvolutionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-lg px-4 py-3 text-xs space-y-1">
      <p className="font-black text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke }} className="font-bold">
          {p.name}: {Number(p.value).toFixed(1)}
        </p>
      ))}
    </div>
  );
}

// ── componente principal ─────────────────────────────────────────────────────────
export default function ComparativoRegional() {
  const [anoRef, setAnoRef] = useState(2025);
  const ranking = getRankingIegm(anoRef);
  const evolutionData = getEvolutionSeries();
  const radarData = getBoituvaRadar();
  const boituva = municipiosRegiao.find((m) => m.isBoituva)!;
  const boituvaLatest = getLatestYearData(boituva, anoRef);
  const boituvaPos = ranking.find((m) => m.isBoituva)?.posicao ?? 0;
  const totalMunicipios = ranking.length;

  return (
    <AppLayout>
      <div className="space-y-8 pb-10 animate-in fade-in duration-700">

        {/* ── HEADER EXECUTIVO ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 border-b border-border/20 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-black tracking-tight uppercase text-foreground">
                Cockpit de Maturidade Municipal
              </h1>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              Boituva • Região de Sorocaba • IEGM + i-GovTI • Ref. {anoRef}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={anoRef.toString()} onValueChange={(v) => setAnoRef(Number(v))}>
              <SelectTrigger className="w-[120px] h-10 border-primary/20 bg-card/40 rounded-xl font-bold">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {ANOS_DISPONIVEIS.map(ano => (
                  <SelectItem key={ano} value={ano.toString()} className="font-bold">
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">IEGM</span>
              <span className="text-xl font-black text-primary">{boituvaLatest.iegm.nota.toFixed(1)}</span>
              <Badge variant="outline" className={cn("text-[9px] font-black rounded-full border", faixaColor(boituvaLatest.iegm.faixa))}>
                {boituvaLatest.iegm.faixa}
              </Badge>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">i-GovTI</span>
              <span className="text-xl font-black text-emerald-600">{boituvaLatest.iGovTi.nota.toFixed(1)}</span>
              <Badge variant="outline" className={cn("text-[9px] font-black rounded-full border", faixaColor(boituvaLatest.iGovTi.faixa))}>
                {boituvaLatest.iGovTi.faixa}
              </Badge>
            </div>
          </div>
        </div>

        {/* ── KPIs ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ExecutiveKpiCard
            icon={Trophy}
            title="Posição Regional"
            value={`${boituvaPos}º / ${totalMunicipios}`}
            sub="Ranking IEGM regional"
            badge="↑ Subindo"
            badgeClass="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
          />
          <ExecutiveKpiCard
            icon={Monitor}
            title="Maturidade Digital"
            value={`${boituvaLatest.iGovTi.faixa}`}
            sub={`Nota ${boituvaLatest.iGovTi.nota.toFixed(1)} — i-GovTI ${anoRef}`}
            badge="Crescendo"
            badgeClass="bg-sky-500/10 text-sky-700 border-sky-500/30"
          />
          <ExecutiveKpiCard
            icon={Zap}
            title="Gap para Faixa A"
            value={`${(8.0 - boituvaLatest.iegm.nota).toFixed(1)} pts`}
            sub="Distância até excelência"
            badge="Meta 2 anos"
            badgeClass="bg-amber-500/10 text-amber-700 border-amber-500/30"
          />
          <ExecutiveKpiCard
            icon={ArrowUp}
            title="Evolução 5 Anos"
            value={`+${(boituvaLatest.iegm.nota - (boituva.iegmSeries[0]?.nota ?? boituvaLatest.iegm.nota)).toFixed(1)} pts`}
            sub="IEGM 2019 → 2023"
            badge="Trajetória +"
            badgeClass="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
          />
        </div>

        {/* ── RANKING + RADAR ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* Ranking horizontal */}
          <Card className="lg:col-span-3 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm flex flex-col h-[500px]">
            <CardHeader className="border-b border-border/10 pb-5 shrink-0">
              <CardTitle className="text-base font-black uppercase tracking-tight text-foreground/80">
                Ranking IEGM Regional
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                Municípios da Região de Sorocaba • {anoRef}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-2 overflow-y-auto flex-1 pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/30 [&::-webkit-scrollbar-thumb]:rounded-full">
              {ranking.map((m) => (
                <RankingBar
                  key={m.id}
                  municipio={m.nome}
                  nota={m.latest.iegm.nota}
                  posicao={m.posicao}
                  isBoituva={m.isBoituva}
                  faixa={m.latest.iegm.faixa}
                />
              ))}
              <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest pt-3 px-4">
                * Fonte: TCESP - IEGM Regional
              </p>
            </CardContent>
          </Card>

          {/* Radar de maturidade */}
          <Card className="lg:col-span-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm">
            <CardHeader className="border-b border-border/10 pb-5">
              <CardTitle className="text-base font-black uppercase tracking-tight text-foreground/80">
                Radar de Maturidade
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                Boituva vs Sorocaba (benchmark)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <PolarAngleAxis
                    dataKey="eixo"
                    tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 8 }} tickCount={4} />
                  <Radar
                    name="benchmark"
                    dataKey="benchmark"
                    stroke={COR_BENCHMARK}
                    fill={COR_BENCHMARK}
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                  <Radar
                    name="boituva"
                    dataKey="boituva"
                    stroke={COR_BOITUVA}
                    fill={COR_BOITUVA}
                    fillOpacity={0.18}
                    strokeWidth={2.5}
                  />
                  <Tooltip content={<CustomRadarTooltip />} />
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10, fontWeight: 700 }}
                    formatter={(v) => v === "boituva" ? "Boituva" : "Sorocaba"}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── EVOLUÇÃO HISTÓRICA ─────────────────────────────────────────── */}
        <Card className="border-border/40 bg-card/30 backdrop-blur-sm shadow-sm">
          <CardHeader className="border-b border-border/10 pb-5">
            <CardTitle className="text-base font-black uppercase tracking-tight text-foreground/80">
              Evolução Histórica — IEGM
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-50">
              Trajetória de notas por município • 2015–2025
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis
                  dataKey="ano"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  domain={[3, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<CustomEvolutionTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 12 }}
                />
                {municipiosRegiao.map((m) => (
                  <Line
                    key={m.id}
                    type="monotone"
                    dataKey={`iegm_${m.id}`}
                    name={m.nome}
                    stroke={m.isBoituva ? COR_BOITUVA : m.id === "sorocaba" ? COR_BENCHMARK : COR_OUTROS}
                    strokeWidth={m.isBoituva ? 3 : m.id === "sorocaba" ? 2 : 1.5}
                    strokeDasharray={m.id === "sorocaba" ? "6 3" : undefined}
                    dot={m.isBoituva ? { r: 4, fill: COR_BOITUVA } : false}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── PLANO EXECUTIVO ───────────────────────────────────────────── */}
        <Card className="border-border/40 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/10 pb-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black uppercase tracking-tight text-foreground/80">
                Plano Executivo de Evolução
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                Ações priorizadas para elevar o IEGM e i-GovTI de Boituva
              </CardDescription>
            </div>
            <Target className="h-5 w-5 text-muted-foreground/30" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/20 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/50 border-b border-border/10">
                    <th className="py-4 pl-7 text-left">Ação Estratégica</th>
                    <th className="py-4 text-left">Impacto</th>
                    <th className="py-4 text-center">Prioridade</th>
                    <th className="py-4 text-center">Prazo</th>
                    <th className="py-4 text-left">Secretaria</th>
                    <th className="py-4 pr-7 text-left">Eixo IEGM</th>
                  </tr>
                </thead>
                <tbody>
                  {planoExecucao.map((acao) => (
                    <tr
                      key={acao.id}
                      className="border-b border-border/5 last:border-0 hover:bg-muted/20 transition-colors group"
                    >
                      <td className="py-4 pl-7">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          <span className="font-bold text-foreground/90">{acao.acao}</span>
                        </div>
                      </td>
                      <td className="py-4 text-muted-foreground font-semibold max-w-[200px]">
                        {acao.impacto}
                      </td>
                      <td className="py-4 text-center">
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase px-2 rounded-full border",
                          prioridadeColor(acao.prioridade)
                        )}>
                          {acao.prioridade}
                        </Badge>
                      </td>
                      <td className="py-4 text-center font-black text-foreground/80">{acao.prazo}</td>
                      <td className="py-4 font-bold text-muted-foreground/80">{acao.secretaria}</td>
                      <td className="py-4 pr-7">
                        <span className="rounded-lg bg-primary/5 border border-primary/10 px-2 py-0.5 text-[9px] font-black text-primary uppercase tracking-wider">
                          {acao.eixoIEGM}
                        </span>
                      </td>
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
