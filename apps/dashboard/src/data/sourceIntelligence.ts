export interface SourcePipelineCard {
  id: string;
  route: string;
  title: string;
  sourceType: "api" | "export";
  status: "ativo" | "parcial" | "preparado";
  objective: string;
  coverage: string;
  currentResult: string;
  appUse: string;
  nextStep: string;
}

export interface RegionalBenchmarkRow {
  axis: string;
  current: string;
  regionalAverage: string;
  benchmark: string;
  gap: string;
  owner: string;
}

export interface RoadmapMilestone {
  horizon: "6 meses" | "1 ano" | "2 anos";
  title: string;
  target: string;
  value: string;
  action: string;
}

export interface SourceDetailSection {
  title: string;
  body: string;
}

export interface SourceDetailPageData {
  id: string;
  route: string;
  title: string;
  subtitle: string;
  sourceType: "api" | "export";
  status: "ativo" | "parcial" | "preparado";
  headlineMetrics: Array<{ label: string; value: string; note: string }>;
  sections: SourceDetailSection[];
  appDeliveries: string[];
  nextSteps: string[];
}

export const sourcePipelineCards: SourcePipelineCard[] = [
  {
    id: "tse",
    route: "/fontes/tse",
    title: "TSE",
    sourceType: "api",
    status: "ativo",
    objective: "Eleitorado, votacao, candidaturas e prestacao de contas.",
    coverage: "Catalogo oficial consultado e quatro recursos zip baixados em raw.",
    currentResult: "16 pacotes monitorados e 672 recursos identificados no catalogo.",
    appUse: "Perfil do eleitorado, tendencia de comparecimento e leitura politica do territorio.",
    nextStep: "Filtrar datasets de Boituva e consolidar fatos municipais por eleicao e cargo.",
  },
  {
    id: "ibge-sidra",
    route: "/fontes/ibge-sidra",
    title: "IBGE SIDRA",
    sourceType: "api",
    status: "ativo",
    objective: "Demografia, territorio e economia municipal com API oficial.",
    coverage: "Gold inicial com censo territorial e PIB municipal de Boituva.",
    currentResult: "Indicadores de populacao, area, densidade e PIB municipal ja aterrissados em gold.",
    appUse: "Pressao por servicos, escala territorial, base economica e comparacao per capita.",
    nextStep: "Adicionar renda, moradia, escolaridade e recortes complementares do Censo/SIDRA.",
  },
  {
    id: "pncp",
    route: "/fontes/pncp",
    title: "PNCP",
    sourceType: "api",
    status: "ativo",
    objective: "Contratacoes, contratos e compras publicas.",
    coverage: "Consulta oficial dos endpoints de contratos e contratacoes/publicacao com persistencia raw/bronze/silver/gold.",
    currentResult: "100 registros sumarizados na rodada atual e R$ 213,8 mi observados no recorte testado.",
    appUse: "Risco contratual, concentracao de fornecedores e carteira de compras.",
    nextStep: "Filtrar orgaos e fornecedores relevantes para Boituva e consolidar contratos vigentes.",
  },
  {
    id: "siconfi",
    route: "/fontes/siconfi",
    title: "Siconfi / MSC",
    sourceType: "api",
    status: "parcial",
    objective: "RCL, RREO, RGF e demonstrativos fiscais oficiais do Tesouro.",
    coverage: "Conector oficial e persistencia implementados para MSC orcamentaria.",
    currentResult: "Consulta validada, mas o recorte inicial usado retornou 0 linhas uteis.",
    appUse: "Saude fiscal, limites da LRF, dependencia de transferencias e pressao orcamentaria.",
    nextStep: "Refinar filtros do demonstrativo e fechar fatos para RCL, pessoal e RGF.",
  },
  {
    id: "tcesp",
    route: "/fontes/tcesp-iegm",
    title: "TCESP / IEGM / i-Gov TI",
    sourceType: "export",
    status: "parcial",
    objective: "Efetividade, governanca, transparencia, TI e comparacao regional.",
    coverage: "Downloader oficial por manifesto e anuario IEG-M baixado em raw.",
    currentResult: "Canal de export oficial pronto para receber bases comparativas da regiao de Sorocaba.",
    appUse: "Comparativo regional, metas por secretaria e priorizacao de melhoria institucional.",
    nextStep: "Adicionar exports regionais e consolidar benchmark de Boituva versus Sorocaba e municipios pares.",
  },
];

export const sourceDetailPages: Record<string, SourceDetailPageData> = {
  tse: {
    id: "tse",
    route: "/fontes/tse",
    title: "TSE",
    subtitle: "Eleitorado, votacao, candidaturas e prestacao de contas para leitura politica e territorial de Boituva.",
    sourceType: "api",
    status: "ativo",
    headlineMetrics: [
      { label: "Pacotes monitorados", value: "15", note: "catalogo oficial consultado" },
      { label: "Recursos mapeados", value: "672", note: "eleitorado, votacao, candidaturas e contas" },
      { label: "Downloads raw", value: "4 zips", note: "eleitorado, votacao, candidatos e prestacao de contas" },
    ],
    sections: [
      {
        title: "O que ja foi feito",
        body: "O pipeline conversa com o catalogo oficial do TSE, inventaria pacotes e recursos e baixa arquivos zip de referencia para aterrissagem em raw.",
      },
      {
        title: "Como isso vira dado executivo",
        body: "A proxima transformacao e recortar Boituva por eleicao, cargo, partido, comparecimento e perfil do eleitorado para criar fatos municipais e series historicas.",
      },
      {
        title: "Uso para prefeito e secretarios",
        body: "Permite ler comportamento do eleitorado, distribuicao demografica da participacao, temas mais sensiveis por ciclo e relacao entre territorio e comparecimento.",
      },
    ],
    appDeliveries: [
      "Perfil do eleitorado por idade, genero e escolaridade",
      "Historico de votacao e comparecimento por ciclo eleitoral",
      "Painel de candidaturas e contas eleitorais para leitura institucional",
    ],
    nextSteps: [
      "Explodir os zips baixados e consolidar apenas Boituva",
      "Criar fatos por eleicao, cargo e municipio",
      "Adicionar pagina de eleitorado e votacao com leitura executiva",
    ],
  },
  "ibge-sidra": {
    id: "ibge-sidra",
    route: "/fontes/ibge-sidra",
    title: "IBGE SIDRA",
    subtitle: "Demografia, territorio e economia municipal via API oficial do IBGE.",
    sourceType: "api",
    status: "ativo",
    headlineMetrics: [
      { label: "Indicadores gold", value: "censo + PIB", note: "Boituva ja aterrissado em gold" },
      { label: "Variaveis atuais", value: "populacao, area, densidade, PIB", note: "consulta oficial validada" },
      { label: "Municipio", value: "3507001", note: "codigo IBGE de Boituva" },
    ],
    sections: [
      {
        title: "O que ja foi feito",
        body: "O pipeline do SIDRA esta ativo e ja publicou em gold os recortes municipais que retornam valor util de forma consistente para Boituva.",
      },
      {
        title: "Como isso vira dado executivo",
        body: "Esses dados formam a base de pressao demografica, escala territorial e capacidade economica do municipio para cruzar com saude, educacao, orcamento e servicos.",
      },
      {
        title: "Uso para prefeito e secretarios",
        body: "Ajuda a responder se a estrutura atual da prefeitura e compativel com o tamanho da cidade, a densidade urbana e o peso economico municipal.",
      },
    ],
    appDeliveries: [
      "Base municipal para retrato demografico e territorial",
      "Indicadores estruturais para comparacao per capita",
      "Entrada para metas de expansao de servicos por demanda real",
    ],
    nextSteps: [
      "Adicionar renda, moradia, escolaridade e composicao social",
      "Cruzar Censo, SIDRA e MUNIC",
      "Publicar fatos comparativos por territorio e secretaria",
    ],
  },
  pncp: {
    id: "pncp",
    route: "/fontes/pncp",
    title: "PNCP",
    subtitle: "Contratacoes e contratos publicos para leitura de risco contratual e carteira de compras.",
    sourceType: "api",
    status: "ativo",
    headlineMetrics: [
      { label: "Registros sumarizados", value: "100", note: "50 de contratos e 50 de publicacoes" },
      { label: "Volume observado", value: "R$ 213,8 mi", note: "rodada atual de teste" },
      { label: "Camadas", value: "raw, bronze, silver, gold", note: "persistencia completa" },
    ],
    sections: [
      {
        title: "O que ja foi feito",
        body: "Os endpoints oficiais de contratos e contratacoes/publicacao foram integrados, com persistencia completa e resumo gold para leitura inicial da fonte.",
      },
      {
        title: "Como isso vira dado executivo",
        body: "A camada seguinte e filtrar Boituva, separar orgaos, fornecedores, modalidades e vigencias para gerar risco contratual por secretaria.",
      },
      {
        title: "Uso para prefeito e secretarios",
        body: "Permite antecipar vencimentos, concentracao de fornecedor, dependencia de contratos criticos e carteira de compras futuras por pasta.",
      },
    ],
    appDeliveries: [
      "Mapa de contratos e contratacoes por secretaria",
      "Alertas de vigencia e concentracao de fornecedor",
      "Painel de compras publicas e planejamento contratual",
    ],
    nextSteps: [
      "Recortar orgaos ligados a Boituva",
      "Classificar fornecedores e modalidades",
      "Cruzar com execucao orcamentaria e entregas fisicas",
    ],
  },
  siconfi: {
    id: "siconfi",
    route: "/fontes/siconfi",
    title: "Siconfi / MSC",
    subtitle: "Demonstrativos oficiais do Tesouro para fechar a leitura fiscal e de limites legais.",
    sourceType: "api",
    status: "parcial",
    headlineMetrics: [
      { label: "Conector", value: "ativo", note: "API oficial validada" },
      { label: "Registros uteis", value: "0", note: "recorte inicial ainda sem retorno" },
      { label: "Foco", value: "RCL, RREO, RGF, pessoal", note: "proxima calibragem" },
    ],
    sections: [
      {
        title: "O que ja foi feito",
        body: "A integracao com a API oficial do Tesouro foi validada e o pipeline ja persiste o retorno consultado em raw, bronze, silver e gold.",
      },
      {
        title: "O que falta fechar",
        body: "Ainda precisamos acertar os filtros certos do demonstrativo para obter linhas uteis de Boituva e publicar fatos fiscais de alto valor.",
      },
      {
        title: "Uso para prefeito e secretarios",
        body: "Essa e a fonte que fecha a leitura de RCL, pressao com pessoal, cumprimento da LRF e comparacao fiscal mais robusta com a regiao.",
      },
    ],
    appDeliveries: [
      "Painel real de RCL e limites fiscais",
      "Serie de RGF, RREO e pressao com pessoal",
      "Comparativo fiscal regional com base oficial do Tesouro",
    ],
    nextSteps: [
      "Refinar anexo, matriz e filtros de consulta",
      "Publicar fatos de RCL e pessoal",
      "Cruzar com TCE e Supabase executivo",
    ],
  },
  "tcesp-iegm": {
    id: "tcesp-iegm",
    route: "/fontes/tcesp-iegm",
    title: "TCESP / IEGM / i-Gov TI",
    subtitle: "Efetividade, governanca e comparacao regional para transformar indicadores em plano de acao por secretaria.",
    sourceType: "export",
    status: "parcial",
    headlineMetrics: [
      { label: "Export oficial", value: "ativo", note: "manifesto versionado no projeto" },
      { label: "Anuario baixado", value: "1", note: "IEG-M 2014-2023 em raw" },
      { label: "Horizonte de metas", value: "6m / 1a / 2a", note: "modelo executivo definido" },
    ],
    sections: [
      {
        title: "O que ja foi feito",
        body: "O projeto ja baixa export oficial do TCESP e tem o desenho executivo para transformar IEGM e i-Gov TI em comparativo de Boituva versus a regiao de Sorocaba.",
      },
      {
        title: "Como isso vira dado executivo",
        body: "A proxima camada e incorporar bases regionais do TCESP, extrair eixos comparaveis e publicar fatos por eixo, municipio e horizonte de meta.",
      },
      {
        title: "Uso para prefeito e secretarios",
        body: "Essa fonte permite dizer onde Boituva esta atras de municipios pares, qual gap atacar primeiro e o que precisa acontecer em 6 meses, 1 ano e 2 anos.",
      },
    ],
    appDeliveries: [
      "Ranking regional por eixo de efetividade",
      "Comparativo de i-Gov TI e maturidade institucional",
      "Metas por secretaria e trilha de recuperacao",
    ],
    nextSteps: [
      "Adicionar exports regionais do TCESP ao manifesto",
      "Estruturar fatos comparativos por eixo e municipio",
      "Ligar comparativo regional ao painel executivo do app",
    ],
  },
};

export const regionalBenchmarkRows: RegionalBenchmarkRow[] = [
  {
    axis: "i-Plan",
    current: "Base diagnostica montada",
    regionalAverage: "Painel comparativo pendente de ingestao",
    benchmark: "Municipio referencia da regiao",
    gap: "Estruturar baseline regional",
    owner: "Planejamento",
  },
  {
    axis: "i-Fiscal",
    current: "Dados financeiros integrados",
    regionalAverage: "Comparacao fiscal regional em preparacao",
    benchmark: "Benchmark de execucao e pressao",
    gap: "Cruzar TCE + Siconfi",
    owner: "Fazenda",
  },
  {
    axis: "i-Educ",
    current: "Recorte local demonstrativo",
    regionalAverage: "Aguardando ingestao INEP + IEGM",
    benchmark: "Municipio de melhor entrega educacional",
    gap: "Conectar oferta, demanda e resultado",
    owner: "Educacao",
  },
  {
    axis: "i-Saude",
    current: "Base territorial pronta",
    regionalAverage: "Aguardando CNES + IEGM",
    benchmark: "Municipio com melhor cobertura e efetividade",
    gap: "Unir capacidade instalada e resultado",
    owner: "Saude",
  },
  {
    axis: "i-Gov TI",
    current: "Trilha de maturidade definida",
    regionalAverage: "Export regional ainda nao incorporado",
    benchmark: "Pasta com melhor governanca digital",
    gap: "Subir notas regionais e evidencias",
    owner: "Administracao / TI",
  },
];

export const roadmapMilestones: RoadmapMilestone[] = [
  {
    horizon: "6 meses",
    title: "Fechar linha de base regional",
    target: "Boituva passa a se comparar mensalmente com a regiao de Sorocaba em fiscal, efetividade e TI.",
    value: "Baseline regional completa",
    action: "Publicar fatos comparativos de IEGM, i-Gov TI, TCE, Siconfi e TSE no Supabase.",
  },
  {
    horizon: "1 ano",
    title: "Virar governanca em rotina de gabinete",
    target: "Cada secretario acompanha seu gap, risco e plano de acao com revisao mensal.",
    value: "100% das secretarias com metas e trilha",
    action: "Amarrar painel, metas por eixo, contratos criticos e entregas fisicas por pasta.",
  },
  {
    horizon: "2 anos",
    title: "Evoluir posicao regional",
    target: "Boituva sai de leitura reativa para referencia regional em dados e governanca.",
    value: "Reduzir gaps criticos e ampliar maturidade digital",
    action: "Escalar automacao, qualidade dos dados, interoperabilidade e monitoramento executivo continuo.",
  },
];
