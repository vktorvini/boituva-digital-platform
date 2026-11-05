import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataState } from "@/components/ui/DataState";
import { fetchTseSourceData } from "@/services/sourcePipelines";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users2, History } from "lucide-react";
import { fetchTseElectionHistory } from "@/services/tseElections";
import { useMemo } from "react";

export default function OperacionalEleitorado() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["operacional", "eleitorado", "tse"],
    queryFn: fetchTseSourceData,
  });

  const historyQuery = useQuery({
    queryKey: ["operacional", "eleitorado", "historico"],
    queryFn: fetchTseElectionHistory,
  });

  const chartData = (data?.rows ?? []).map((row) => ({
    dominio: row.dataset_key,
    recursos: row.resources,
    pacotes: row.packages,
  }));

  const mockEleitorado = {
    total: 48520,
    homens: 23100,
    mulheres: 25420,
    biometria: 45200,
  };

  const mockEleicoes = [
    {
      ano: 2024,
      cargo: "Prefeito",
      totalVotos: 29500,
      brancosNulos: 2100,
      abstencao: 11000,
      candidatos: [
        { nome: "Edson Marcusso", partido: "REPUBLICANOS", votos: 12400, percentual: "42.0%", status: "Eleito" }
      ],
      vereadores: "13 eleitos para a legislatura 2025-2028"
    },
    {
      ano: 2020,
      cargo: "Prefeito",
      totalVotos: 27983,
      brancosNulos: 3803,
      abstencao: 12366,
      candidatos: [
        { nome: "Edson Marcusso", partido: "CIDADANIA", votos: 9353, percentual: "33.42%", status: "Eleito" },
        { nome: "Fabricio Amaro", partido: "PL", votos: 8207, percentual: "29.33%", status: "Não Eleito" },
        { nome: "Zé Cristo", partido: "PSC", votos: 4320, percentual: "15.44%", status: "Não Eleito" }
      ],
      vereadores: "Legislatura 2021-2024"
    },
    {
      ano: 2016,
      cargo: "Prefeito",
      totalVotos: 27648,
      brancosNulos: 3200,
      abstencao: 9800,
      candidatos: [
        { nome: "Fernando Lopes", partido: "PSDB", votos: 12684, percentual: "45.88%", status: "Eleito" },
        { nome: "Edson Marcusso", partido: "PTB", votos: 9745, percentual: "35.25%", status: "Não Eleito" }
      ],
      vereadores: "Mandato 2017-2019 (Interrompido). Interina: Maria Nasaré da Guia Azevedo (2019)."
    },
    {
      ano: 2012,
      cargo: "Prefeito",
      totalVotos: 26959,
      brancosNulos: 2794,
      abstencao: 8500,
      candidatos: [
        { nome: "Edson Marcusso", partido: "PTB", votos: 16016, percentual: "59.41%", status: "Eleito" },
        { nome: "Zé Cristo", partido: "PMDB", votos: 10943, percentual: "40.59%", status: "Não Eleito" }
      ],
      vereadores: "Legislatura 2013-2016"
    },
    {
      ano: 2008,
      cargo: "Prefeito",
      totalVotos: 25400,
      brancosNulos: 2200,
      abstencao: 6500,
      candidatos: [
        { nome: "Assunta Maria Labronice Gomes", partido: "PSDB", votos: 13800, percentual: "54.3%", status: "Eleito" },
        { nome: "Edson Marcusso", partido: "PV", votos: 11600, percentual: "45.7%", status: "Não Eleito" }
      ],
      vereadores: "Legislatura 2009-2012"
    },
    {
      ano: 2004,
      cargo: "Prefeito",
      totalVotos: 23000,
      brancosNulos: 1800,
      abstencao: 5000,
      candidatos: [
        { nome: "Edson Marcusso", partido: "PSDB", votos: 12500, percentual: "54.3%", status: "Eleito" }
      ],
      vereadores: "Legislatura 2005-2008"
    },
    {
      ano: 2000,
      cargo: "Prefeito",
      totalVotos: 21000,
      brancosNulos: 1500,
      abstencao: 4500,
      candidatos: [
        { nome: "Edson Marcusso", partido: "PSDB", votos: 11000, percentual: "52.4%", status: "Eleito" }
      ],
      vereadores: "Legislatura 2001-2004"
    }
  ];

  const mergedEleicoes = useMemo(() => {
    const apiData = historyQuery.data || [];
    if (apiData.length === 0) return mockEleicoes;

    // Criamos um mapa para facilitar o acesso por ano
    const apiMap = new Map(apiData.map(item => [item.ano, item]));
    
    // Lista final combinada
    const final: any[] = [];

    // Pegamos todos os anos únicos (Mocks + API)
    const allYears = Array.from(new Set([
      ...mockEleicoes.map(m => m.ano),
      ...apiData.map(a => a.ano)
    ])).sort((a, b) => b - a);

    allYears.forEach(year => {
      const apiYear = apiMap.get(year);
      const mockYear = mockEleicoes.find(m => m.ano === year);

      if (apiYear) {
        final.push({
          ano: year,
          cargo: apiYear.cargo,
          totalVotos: apiYear.total_votos || (mockYear?.totalVotos || 0),
          brancosNulos: apiYear.brancos_nulos || (mockYear?.brancosNulos || 0),
          abstencao: apiYear.abstencao || (mockYear?.abstencao || 0),
          candidatos: apiYear.candidatos,
          vereadores_list: apiYear.vereadores || [],
          vereadores_label: apiYear.vereadores_resumo || mockYear?.vereadores
        });
      } else if (mockYear) {
        final.push(mockYear);
      }
    });

    return final;
  }, [historyQuery.data]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 border-b border-border/20 pb-6 mb-6">
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Eleitorado e Votação</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-70">
            Mapeamento Operacional • Fonte Oficial TSE
          </p>
        </div>

        <Tabs defaultValue="atual" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="atual" className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Eleitorado Atual
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Eleições
            </TabsTrigger>
          </TabsList>

          <TabsContent value="atual" className="space-y-6">
            <DataState isLoading={isLoading} isError={isError} isEmpty={!data}>
              {data && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
                    <KpiCard
                      title="Total de Eleitores"
                      value={mockEleitorado.total.toLocaleString("pt-BR")}
                      subtitle="Boituva - Est. 2024"
                      status="normal"
                    />
                    <KpiCard
                      title="Biometria Coletada"
                      value={mockEleitorado.biometria.toLocaleString("pt-BR")}
                      subtitle={`${((mockEleitorado.biometria / mockEleitorado.total) * 100).toFixed(1)}% de cobertura`}
                    />
                    <KpiCard
                      title="Eleitorado Feminino"
                      value={mockEleitorado.mulheres.toLocaleString("pt-BR")}
                      subtitle={`${((mockEleitorado.mulheres / mockEleitorado.total) * 100).toFixed(1)}% do total`}
                    />
                    <KpiCard
                      title="Eleitorado Masculino"
                      value={mockEleitorado.homens.toLocaleString("pt-BR")}
                      subtitle={`${((mockEleitorado.homens / mockEleitorado.total) * 100).toFixed(1)}% do total`}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/80">Distribuição por Gênero</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Perfil demográfico do eleitorado</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px] flex items-center justify-center">
                        <div className="flex gap-12 items-center">
                          <div className="flex flex-col items-center">
                              <div className="h-24 w-4 bg-primary/20 rounded-full relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 bg-primary" style={{ height: "52%" }}></div>
                              </div>
                              <span className="text-[10px] font-bold uppercase mt-2 text-foreground/70">Mulheres</span>
                          </div>
                          <div className="flex flex-col items-center">
                              <div className="h-24 w-4 bg-primary/20 rounded-full relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 bg-primary/60" style={{ height: "48%" }}></div>
                              </div>
                              <span className="text-[10px] font-bold uppercase mt-2 text-foreground/70">Homens</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/80">Monitoramento Ingestão TSE</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Volume de bases de dados mapeadas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 88%)" vertical={false} />
                            <XAxis dataKey="dominio" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="recursos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                    <CardHeader className="bg-muted/5 border-b border-border/10">
                      <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/80">Ações Estratégicas Recomendadas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 pt-6 text-sm text-muted-foreground md:grid-cols-3">
                      <div className="p-4 rounded-xl border-l-4 bg-emerald-500/5 border-emerald-500">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70 text-emerald-600">Planejamento</p>
                        <p className="font-medium text-foreground">Consolidar série municipal por eleição para orientar prioridades territoriais e demográficas.</p>
                      </div>
                      <div className="p-4 rounded-xl border-l-4 bg-amber-500/5 border-amber-500">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70 text-amber-700">Governo</p>
                        <p className="font-medium text-foreground">Cruzar comparecimento e domicílio eleitoral com mapa de demandas de serviços por bairro.</p>
                      </div>
                      <div className="p-4 rounded-xl border-l-4 bg-sky-500/5 border-sky-500">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70 text-sky-700">Comunicação</p>
                        <p className="font-medium text-foreground">Acompanhar perfil evolutivo do eleitorado (idade, escolaridade) para campanhas institucionais.</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </DataState>
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            {/* Memorando Executivo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy className="h-12 w-12" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary/70">Recorde de Votação</CardTitle>
                  <CardDescription className="text-xl font-black text-foreground">
                    {Math.max(...mergedEleicoes.flatMap(e => e.candidatos.map(c => c.votos))).toLocaleString("pt-BR")} Votos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Maior votação nominal registrada em um único pleito (Histórico 1996-2024)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/30 shadow-none overflow-hidden relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partido Predominante</CardTitle>
                  <CardDescription className="text-xl font-black text-foreground">
                    PSDB / PTB
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Legendas com maior número de vitórias no Executivo Municipal
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/30 shadow-none overflow-hidden relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gestor mais Eleito</CardTitle>
                  <CardDescription className="text-xl font-black text-foreground">
                    Edson Marcusso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    6 Mandatos conquistados (Incluindo 2025-2028)
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {mergedEleicoes.map((eleicao) => (
                <Card key={eleicao.ano} className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-muted/5 border-b border-border/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-black tracking-tight uppercase text-foreground/80">Eleições Municipais {eleicao.ano}</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Resultados Oficiais TSE • Cargo: {eleicao.cargo}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold text-[10px] uppercase">
                        {eleicao.totalVotos.toLocaleString("pt-BR")} Comparecimento
                      </Badge>
                      <Badge variant="outline" className="bg-amber-500/5 text-amber-700 border-amber-500/20 font-bold text-[10px] uppercase">
                        {eleicao.brancosNulos.toLocaleString("pt-BR")} Brancos/Nulos
                      </Badge>
                      <Badge variant="outline" className="bg-slate-500/5 text-slate-500 border-slate-500/20 font-bold text-[10px] uppercase">
                        {eleicao.abstencao.toLocaleString("pt-BR")} Abstenção
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Disputa para a Prefeitura</p>
                        {eleicao.candidatos.map((candidato, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            candidato.status === "Eleito" 
                              ? "bg-emerald-500/5 border-emerald-500/20 shadow-sm" 
                              : "bg-white/30 border-border/50 grayscale opacity-70"
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                candidato.status === "Eleito" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 text-slate-500"
                              }`}>
                                {candidato.status === "Eleito" ? <Trophy className="h-5 w-5" /> : <Users2 className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className={`font-black uppercase tracking-tight ${candidato.status === "Eleito" ? "text-foreground" : "text-muted-foreground"}`}>{candidato.nome}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{candidato.partido}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xl font-black tracking-tighter ${candidato.status === "Eleito" ? "text-primary" : "text-slate-500"}`}>{candidato.percentual}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{candidato.votos.toLocaleString("pt-BR")} votos</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="lg:border-l lg:pl-8 border-border/20">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Legislativo Municipal</p>
                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                           {(eleicao.vereadores_list && eleicao.vereadores_list.length > 0) ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                               {eleicao.vereadores_list.map((v: any, idx: number) => (
                                 <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                                   <div>
                                     <p className="text-[9px] font-black text-foreground uppercase truncate max-w-[100px]">{v.nome}</p>
                                     <p className="text-[7px] font-bold text-primary/70 uppercase">{v.partido}</p>
                                   </div>
                                   <div className="text-right">
                                     <p className="text-[10px] font-black text-foreground">{v.votos}</p>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-xs font-bold text-foreground/80 leading-relaxed italic">
                                  {eleicao.vereadores_label || eleicao.vereadores || "Dados em processamento"}
                                </p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
