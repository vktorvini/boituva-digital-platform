import { Building2, Globe2, HeartPulse, Landmark, Map, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataState } from "@/components/ui/DataState";
import { BOITUVA_IBGE_CITY_URL } from "@/services/ibge";
import { useIndicadoresIbge } from "@/hooks/useSupabaseFinanceiro";
import { KpiCard } from "@/components/dashboard/KpiCard";

const categoryMeta = {
  territorio: { label: "Territorio", icon: Map },
  demografia: { label: "Demografia", icon: Users },
  social: { label: "Social", icon: HeartPulse },
  economia: { label: "Economia", icon: Building2 },
  gestao: { label: "Gestao", icon: Landmark },
} as const;

export default function IbgeMunicipio() {
  const { data: indicadores, isLoading, isError } = useIndicadoresIbge();

  const getInd = (id: string) => indicadores?.find(i => i.indicador_id === id);

  const pop = getInd("populacao-estimada");
  const dens = getInd("densidade-demografica");
  const pib = getInd("pib-per-capita");
  const idhm = getInd("idhm");
  const area = getInd("area-territorial");

  // Dados estáticos de contexto executivo (poderiam vir de um CMS depois)
  const profile = {
    nome: pop?.municipio_nome || "Boituva",
    estado: "São Paulo",
    uf: pop?.uf_sigla || "SP",
    codigo: "3507001",
    regiao: "Sudeste",
    regiaoIntermediaria: "Sorocaba",
    regiaoImediata: "Sorocaba",
    microrregiao: "Sorocaba",
    mesorregiao: "Macro Metropolitana Paulista",
  };

  const insights = [
    {
      id: "i1", title: "Crescimento Populacional", audience: "Gabinete",
      description: "Aumento populacional exige revisão de vagas em creches e rede de saúde.",
      action: "Avaliar expansão da infraestrutura nos próximos 2 anos.",
    },
    {
      id: "i2", title: "Perfil Econômico", audience: "Fazenda",
      description: "PIB forte indica capacidade de arrecadação própria.",
      action: "Focar em incentivos fiscais para manter empresas locais.",
    }
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 border-b border-border/20 pb-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">População e Território</h2>
            <a
              href={BOITUVA_IBGE_CITY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
            >
              Consultar Painel IBGE Cidades →
            </a>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-70">
            {profile.nome} - SP • {profile.mesorregiao}
          </p>
        </div>

        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!indicadores || indicadores.length === 0}
          emptyMessage="Nenhuma referencia do IBGE disponivel"
        >
          {indicadores && indicadores.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  title="População Estimada"
                  value={pop?.valor_formatado || "-"}
                  subtitle={`Censo Demográfico`}
                  status="normal"
                />
                <KpiCard
                  title="Densidade Demográfica"
                  value={dens?.valor_formatado || "-"}
                  subtitle="Pressão sobre serviços"
                />
                <KpiCard
                  title="PIB per capita"
                  value={pib?.valor_formatado || "-"}
                  subtitle="Base de Arrecadação"
                />
                <KpiCard
                  title="IDHM (Desenvolvimento)"
                  value={idhm?.valor_formatado || "-"}
                  subtitle="Qualidade de Vida"
                  status="positive"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="gov-shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl">Indicadores relevantes para decisao</CardTitle>
                    <CardDescription>
                      Cada indicador abaixo inclui a fonte oficial exibida pelo IBGE e um uso pratico para gestao.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {indicadores.map((indicator) => {
                      // fallback simples para mapeamento visual de icone
                      let Icon = categoryMeta.demografia.icon;
                      let label = "Demografia";
                      
                      if (indicator.indicador_id.includes("pib")) {
                        Icon = categoryMeta.economia.icon; label = "Economia";
                      } else if (indicator.indicador_id.includes("idhm")) {
                        Icon = categoryMeta.social.icon; label = "Social";
                      } else if (indicator.indicador_id.includes("area")) {
                        Icon = categoryMeta.territorio.icon; label = "Território";
                      }

                      return (
                        <div key={indicator.indicador_id} className="rounded-lg border bg-background/70 p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <Badge variant="secondary" className="gap-1">
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                              </Badge>
                              <h3 className="text-base font-semibold text-foreground">{indicator.indicador_nome}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground">{indicator.ano_referencia}</span>
                          </div>

                          <div className="mb-3 text-2xl font-semibold text-foreground">{indicator.valor_formatado}</div>

                          <p className="mb-3 text-sm leading-6 text-muted-foreground">
                            Atualizado via integração de dados Boituva Digital Platform.
                          </p>

                          <a
                            href={indicator.fonte_url || BOITUVA_IBGE_CITY_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-primary underline underline-offset-4"
                          >
                            Fonte: {indicator.fonte}
                          </a>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="gov-shadow-card">
                    <CardHeader>
                      <CardTitle className="text-xl">Perfil territorial</CardTitle>
                      <CardDescription>Contexto geografico de Boituva no recorte oficial do IBGE.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4 border-b pb-3">
                        <span className="text-muted-foreground">Região</span>
                        <strong>{profile.regiao}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b pb-3">
                        <span className="text-muted-foreground">Região intermediária</span>
                        <strong>{profile.regiaoIntermediaria}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b pb-3">
                        <span className="text-muted-foreground">Região imediata</span>
                        <strong>{profile.regiaoImediata}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b pb-3">
                        <span className="text-muted-foreground">Microrregião</span>
                        <strong>{profile.microrregiao}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Mesorregião</span>
                        <strong>{profile.mesorregiao}</strong>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gov-shadow-card">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Globe2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Leituras executivas</CardTitle>
                      </div>
                      <CardDescription>Traducao dos dados para uso de prefeito e secretarios.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {insights.map((insight) => (
                        <div key={insight.id} className="rounded-lg border bg-muted/30 p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold">{insight.title}</h3>
                            <Badge variant="outline">{insight.audience}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          <p className="mt-3 text-sm font-medium text-foreground">{insight.action}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="gov-shadow-card">
                    <CardHeader>
                      <CardTitle className="text-xl">Como usar na prefeitura</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>Planejamento: calibrar metas fisicas, territorializacao e expansao da cidade.</p>
                      <p>Saúde: cruzar mortalidade infantil e crescimento populacional com cobertura territorial.</p>
                      <p>Educação: usar escolarização como base e complementar com permanência e desempenho.</p>
                      <p>Fazenda e Desenvolvimento: relacionar PIB per capita com receita, emprego e estratégia produtiva.</p>
                      <p className="text-xs">Atualizado via API Oficial</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DataState>
      </div>
    </AppLayout>
  );
}

