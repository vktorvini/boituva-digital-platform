export const BOITUVA_IBGE_CODE = 3507001;
export const BOITUVA_IBGE_CITY_URL = "https://www.ibge.gov.br/cidades-e-estados/sp/boituva.html";
const BOITUVA_LOCALIDADES_API_URL = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${BOITUVA_IBGE_CODE}`;

export interface IbgeIndicator {
  id: string;
  title: string;
  value: string;
  year: number;
  source: string;
  sourceUrl: string;
  category: "territorio" | "demografia" | "social" | "economia" | "gestao";
  decisionUse: string;
}

export interface IbgeMunicipioProfile {
  codigo: number;
  nome: string;
  uf: string;
  estado: string;
  regiao: string;
  regiaoIntermediaria: string;
  regiaoImediata: string;
  microrregiao: string;
  mesorregiao: string;
}

export interface IbgeInsight {
  id: string;
  title: string;
  audience: string;
  description: string;
  action: string;
}

export interface IbgeMunicipioDashboard {
  profile: IbgeMunicipioProfile;
  indicators: IbgeIndicator[];
  insights: IbgeInsight[];
  highlights: {
    populacaoEstimada: string;
    variacaoPopulacional: string;
    densidadeDemografica: string;
    pibPerCapita: string;
  };
  updatedAtLabel: string;
}

const fallbackProfile: IbgeMunicipioProfile = {
  codigo: BOITUVA_IBGE_CODE,
  nome: "Boituva",
  uf: "SP",
  estado: "Sao Paulo",
  regiao: "Sudeste",
  regiaoIntermediaria: "Sorocaba",
  regiaoImediata: "Sorocaba",
  microrregiao: "Tatui",
  mesorregiao: "Itapetininga",
};

const ibgeIndicators: IbgeIndicator[] = [
  {
    id: "area-territorial",
    title: "Area territorial",
    value: "248,95 km2",
    year: 2022,
    source: "IBGE - Area territorial brasileira 2022",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "territorio",
    decisionUse: "Dimensiona cobertura de servicos, expansao urbana, manutencao viaria e custo operacional do territorio.",
  },
  {
    id: "populacao-censo",
    title: "Populacao no ultimo censo",
    value: "61.081 pessoas",
    year: 2022,
    source: "IBGE - Censo Demografico 2022",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "demografia",
    decisionUse: "Serve de base para planejamento de demanda em saude, educacao, assistencia e infraestrutura.",
  },
  {
    id: "densidade-demografica",
    title: "Densidade demografica",
    value: "245,35 hab/km2",
    year: 2022,
    source: "IBGE - Censo Demografico 2022",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "territorio",
    decisionUse: "Ajuda a priorizar bairros com maior pressao por mobilidade, residuos, drenagem e servicos publicos.",
  },
  {
    id: "populacao-estimada",
    title: "Populacao estimada",
    value: "63.850 pessoas",
    year: 2025,
    source: "IBGE - Estimativas populacionais",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "demografia",
    decisionUse: "Atualiza a escala real da cidade para metas fisicas, contratos, equipes e capacidade de atendimento.",
  },
  {
    id: "escolarizacao",
    title: "Escolarizacao de 6 a 14 anos",
    value: "98,66%",
    year: 2022,
    source: "IBGE - Cidades e Estados",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "social",
    decisionUse: "Sinaliza cobertura educacional e orienta busca ativa, transporte escolar e reforco em territorios vulneraveis.",
  },
  {
    id: "idhm",
    title: "IDHM",
    value: "0,780",
    year: 2010,
    source: "PNUD disponibilizado no painel do IBGE",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "social",
    decisionUse: "Ajuda a calibrar politicas estruturantes de desenvolvimento humano e comparacoes historicas.",
  },
  {
    id: "mortalidade-infantil",
    title: "Mortalidade infantil",
    value: "14,81 obitos por mil nascidos vivos",
    year: 2023,
    source: "DATASUS disponibilizado no painel do IBGE",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "social",
    decisionUse: "Aciona leitura combinada de atencao primaria, saneamento, pre-natal e vulnerabilidade territorial.",
  },
  {
    id: "receitas-brutas",
    title: "Receitas brutas realizadas",
    value: "R$ 449,1 mi",
    year: 2024,
    source: "Siconfi disponibilizado no painel do IBGE",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "gestao",
    decisionUse: "Permite conectar porte economico-administrativo com capacidade de entrega e sustentabilidade fiscal.",
  },
  {
    id: "despesas-brutas",
    title: "Despesas brutas empenhadas",
    value: "R$ 446,8 mi",
    year: 2024,
    source: "Siconfi disponibilizado no painel do IBGE",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "gestao",
    decisionUse: "Ajuda o prefeito e secretarios a comparar pressao de gasto com capacidade total do municipio.",
  },
  {
    id: "pib-per-capita",
    title: "PIB per capita",
    value: "R$ 73.249,13",
    year: 2023,
    source: "IBGE - PIB dos Municipios",
    sourceUrl: BOITUVA_IBGE_CITY_URL,
    category: "economia",
    decisionUse: "Apoia estrategia de desenvolvimento, arrecadacao, emprego qualificado e atracao de investimentos.",
  },
];

const ibgeInsights: IbgeInsight[] = [
  {
    id: "crescimento-populacional",
    title: "Cidade em crescimento acima do censo",
    audience: "Prefeito e Planejamento",
    description: "A estimativa de 2025 supera o censo de 2022, indicando aumento recente de demanda sobre servicos urbanos e equipamentos publicos.",
    action: "Usar a populacao estimada como referencia de capacidade para UBS, escolas, mobilidade e zeladoria.",
  },
  {
    id: "pressao-social",
    title: "Saude infantil merece monitoramento territorial",
    audience: "Saude e Assistencia Social",
    description: "A mortalidade infantil exige leitura territorializada junto com cobertura de pre-natal, saneamento e vulnerabilidade social.",
    action: "Cruzar o indicador com bairros, NASF, ESF e dados socioassistenciais para priorizar intervencoes.",
  },
  {
    id: "capital-humano",
    title: "Boa escolarizacao precisa virar permanencia e resultado",
    audience: "Educacao",
    description: "A taxa de escolarizacao e alta, mas isso nao garante aprendizagem, permanencia nem equidade territorial.",
    action: "Complementar com frequencia, evasao, transporte, creche e desempenho para direcionar investimento.",
  },
  {
    id: "base-economica",
    title: "PIB per capita e arrecadacao sustentam agenda de competitividade",
    audience: "Desenvolvimento e Fazenda",
    description: "O porte economico sugere potencial para politica de emprego, adensamento produtivo e qualificacao da base tributaria.",
    action: "Cruzar com dados de ISS, ICMS, empresas, emprego formal e uso do solo para definir estrategia economica.",
  },
];

interface LocalidadesApiResponse {
  id: number;
  nome: string;
  microrregiao?: {
    nome: string;
    mesorregiao?: {
      nome: string;
      UF?: {
        sigla: string;
        nome: string;
        regiao?: {
          nome: string;
        };
      };
    };
  };
  "regiao-imediata"?: {
    nome: string;
    "regiao-intermediaria"?: {
      nome: string;
      UF?: {
        sigla: string;
        nome: string;
        regiao?: {
          nome: string;
        };
      };
    };
  };
}

function buildProfile(payload?: LocalidadesApiResponse): IbgeMunicipioProfile {
  if (!payload) return fallbackProfile;

  const region = payload["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.regiao?.nome
    ?? payload.microrregiao?.mesorregiao?.UF?.regiao?.nome
    ?? fallbackProfile.regiao;

  return {
    codigo: payload.id ?? fallbackProfile.codigo,
    nome: payload.nome ?? fallbackProfile.nome,
    uf: payload["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla
      ?? payload.microrregiao?.mesorregiao?.UF?.sigla
      ?? fallbackProfile.uf,
    estado: payload["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.nome
      ?? payload.microrregiao?.mesorregiao?.UF?.nome
      ?? fallbackProfile.estado,
    regiao: region,
    regiaoIntermediaria: payload["regiao-imediata"]?.["regiao-intermediaria"]?.nome ?? fallbackProfile.regiaoIntermediaria,
    regiaoImediata: payload["regiao-imediata"]?.nome ?? fallbackProfile.regiaoImediata,
    microrregiao: payload.microrregiao?.nome ?? fallbackProfile.microrregiao,
    mesorregiao: payload.microrregiao?.mesorregiao?.nome ?? fallbackProfile.mesorregiao,
  };
}

function calculateHighlights() {
  const census = 61081;
  const estimated = 63850;
  const growth = ((estimated - census) / census) * 100;

  return {
    populacaoEstimada: "63.850",
    variacaoPopulacional: `+${growth.toFixed(1)}% desde 2022`,
    densidadeDemografica: "245,35 hab/km2",
    pibPerCapita: "R$ 73,2 mil",
  };
}

export async function fetchIbgeMunicipioDashboard(): Promise<IbgeMunicipioDashboard> {
  let payload: LocalidadesApiResponse | undefined;

  try {
    const response = await fetch(BOITUVA_LOCALIDADES_API_URL);

    if (response.ok) {
      payload = await response.json() as LocalidadesApiResponse;
    }
  } catch {
    payload = undefined;
  }

  return {
    profile: buildProfile(payload),
    indicators: ibgeIndicators,
    insights: ibgeInsights,
    highlights: calculateHighlights(),
    updatedAtLabel: "Painel baseado em referencias oficiais do IBGE e fontes publicadas na pagina municipal de Boituva.",
  };
}

