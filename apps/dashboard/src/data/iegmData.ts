// ============================================================
// Boituva Digital Platform — Dados IEGM / i-GovTI Regional
// ============================================================
// Fonte: TCE-SP — Anuário IEG-M (exportação oficial)
// Escopo: Região de Sorocaba — Municípios de médio porte
//
// ⚠️  COMO ADICIONAR NOVOS MUNICÍPIOS:
//   1. Adicione um novo objeto ao array `municipiosRegiao`
//   2. Preencha `iegmSeries` com dados históricos anuais
//   3. Preencha `iGovTiSeries` com dados i-GovTI anuais
//   4. O cockpit exibirá automaticamente o novo município
// ============================================================

export type FaixaIEGM = "A" | "B+" | "B" | "C+" | "C" | "D" | "E";
export type FaixaIGovTI = "Elevado" | "Alto" | "Suficiente" | "Básico" | "Baixo" | FaixaIEGM;

/** Estrutura de um município na região */
export interface MunicipioRegional {
  id: string;
  nome: string;
  populacao: number;
  /** true = Boituva — será destacado nos gráficos */
  isBoituva?: boolean;
  /**
   * Série histórica IEGM (0–10).
   * Cada entrada: { ano, nota, faixa }
   */
  iegmSeries: { ano: number; nota: number; faixa: FaixaIEGM }[];
  /**
   * Série histórica i-Gov TI (0–10).
   * Cada entrada: { ano, nota, faixa }
   */
  iGovTiSeries: { ano: number; nota: number; faixa: FaixaIGovTI }[];
  /**
   * Eixos detalhados do IEGM para o Radar.
   * i-Plan, i-Fiscal, i-Educ, i-Saude, i-Cidade, i-GovTI, i-AM
   * Valores de 0 a 10.
   */
  eixosDetalhados?: {
    iPlan: number;
    iFiscal: number;
    iEduc: number;
    iSaude: number;
    iCidade: number;
    iGovTI: number;
    iAM: number;
  };
}

// ============================================================
// Dados dos municípios — Região de Sorocaba
// Adicione novos municípios aqui ↓
// ============================================================
export const municipiosRegiao: MunicipioRegional[] = [

  {
    id: "aguas-de-santa-barbara",
    nome: "Águas De Santa Bárbara",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    eixosDetalhados: { iPlan: 5.5, iFiscal: 6.5, iEduc: 4.5, iSaude: 4.5, iCidade: 4.5, iGovTI: 4.5, iAM: 4.5 },
  },
  {
    id: "alambari",
    nome: "Alambari",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 5.5, iEduc: 5.5, iSaude: 6.5, iCidade: 4.5, iGovTI: 4.5, iAM: 4.5 },
  },
  {
    id: "aluminio",
    nome: "Alumínio",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 4.5, iSaude: 4.5, iCidade: 5.5, iGovTI: 4.5, iAM: 4.5 },
  },
  {
    id: "aracariguama",
    nome: "Araçariguama",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 4.5, iEduc: 4.5, iSaude: 5.5, iCidade: 5.5, iGovTI: 6.5, iAM: 4.5 },
  },
  {
    id: "aracoiaba-da-serra",
    nome: "Araçoiaba Da Serra",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 8.0, faixa: "B+" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 8.0, faixa: "B+" },
      { ano: 2019, nota: 8.0, faixa: "B+" }, { ano: 2020, nota: 8.0, faixa: "B+" }, { ano: 2021, nota: 8.0, faixa: "B+" }, { ano: 2022, nota: 8.0, faixa: "B+" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 8.0, faixa: "B+" }, { ano: 2025, nota: 8.0, faixa: "B+" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 5.5, iSaude: 6.5, iCidade: 8.0, iGovTI: 8.0, iAM: 4.5 },
  },
  {
    id: "boituva",
    nome: "Boituva",
    populacao: 50000,
    isBoituva: true,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 8.0, faixa: "B+" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 4.5, iEduc: 5.5, iSaude: 6.5, iCidade: 4.5, iGovTI: 8.0, iAM: 8.0 },
  },
  {
    id: "capela-do-alto",
    nome: "Capela Do Alto",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 6.5, iSaude: 6.5, iCidade: 4.5, iGovTI: 6.5, iAM: 4.5 },
  },
  {
    id: "cerquilho",
    nome: "Cerquilho",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 9.0, faixa: "A" }, { ano: 2016, nota: 9.0, faixa: "A" }, { ano: 2017, nota: 9.0, faixa: "A" }, { ano: 2018, nota: 9.0, faixa: "A" },
      { ano: 2019, nota: 9.0, faixa: "A" }, { ano: 2020, nota: 9.0, faixa: "A" }, { ano: 2021, nota: 9.0, faixa: "A" }, { ano: 2022, nota: 9.0, faixa: "A" },
      { ano: 2023, nota: 9.0, faixa: "A" }, { ano: 2024, nota: 9.0, faixa: "A" }, { ano: 2025, nota: 9.0, faixa: "A" }
    ],
    eixosDetalhados: { iPlan: 5.5, iFiscal: 5.5, iEduc: 6.5, iSaude: 6.5, iCidade: 4.5, iGovTI: 9.0, iAM: 6.5 },
  },
  {
    id: "cesario-lange",
    nome: "Cesário Lange",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 9.0, faixa: "A" }, { ano: 2016, nota: 9.0, faixa: "A" }, { ano: 2017, nota: 9.0, faixa: "A" }, { ano: 2018, nota: 9.0, faixa: "A" },
      { ano: 2019, nota: 9.0, faixa: "A" }, { ano: 2020, nota: 9.0, faixa: "A" }, { ano: 2021, nota: 9.0, faixa: "A" }, { ano: 2022, nota: 9.0, faixa: "A" },
      { ano: 2023, nota: 9.0, faixa: "A" }, { ano: 2024, nota: 9.0, faixa: "A" }, { ano: 2025, nota: 9.0, faixa: "A" }
    ],
    eixosDetalhados: { iPlan: 6.5, iFiscal: 6.5, iEduc: 5.5, iSaude: 8.0, iCidade: 8.0, iGovTI: 9.0, iAM: 4.5 },
  },
  {
    id: "ibiuna",
    nome: "Ibiúna",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 4.5, iEduc: 4.5, iSaude: 4.5, iCidade: 4.5, iGovTI: 6.5, iAM: 4.5 },
  },
  {
    id: "ipero",
    nome: "Iperó",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 8.0, faixa: "B+" }, { ano: 2025, nota: 8.0, faixa: "B+" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 8.0, iEduc: 5.5, iSaude: 6.5, iCidade: 5.5, iGovTI: 8.0, iAM: 5.5 },
  },
  {
    id: "itapetininga",
    nome: "Itapetininga",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 9.0, faixa: "A" }, { ano: 2016, nota: 9.0, faixa: "A" }, { ano: 2017, nota: 9.0, faixa: "A" }, { ano: 2018, nota: 9.0, faixa: "A" },
      { ano: 2019, nota: 9.0, faixa: "A" }, { ano: 2020, nota: 9.0, faixa: "A" }, { ano: 2021, nota: 9.0, faixa: "A" }, { ano: 2022, nota: 9.0, faixa: "A" },
      { ano: 2023, nota: 9.0, faixa: "A" }, { ano: 2024, nota: 9.0, faixa: "A" }, { ano: 2025, nota: 9.0, faixa: "A" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 6.5, iSaude: 8.0, iCidade: 8.0, iGovTI: 9.0, iAM: 5.5 },
  },
  {
    id: "itu",
    nome: "Itu",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 6.5, iSaude: 6.5, iCidade: 5.5, iGovTI: 4.5, iAM: 6.5 },
  },
  {
    id: "jumirim",
    nome: "Jumirim",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    eixosDetalhados: { iPlan: 6.5, iFiscal: 6.5, iEduc: 8.0, iSaude: 6.5, iCidade: 6.5, iGovTI: 6.5, iAM: 5.5 },
  },
  {
    id: "mairinque",
    nome: "Mairinque",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    eixosDetalhados: { iPlan: 5.5, iFiscal: 4.5, iEduc: 4.5, iSaude: 4.5, iCidade: 4.5, iGovTI: 6.5, iAM: 4.5 },
  },
  {
    id: "piedade",
    nome: "Piedade",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 4.5, iSaude: 4.5, iCidade: 4.5, iGovTI: 6.5, iAM: 4.5 },
  },
  {
    id: "pilar-do-sul",
    nome: "Pilar Do Sul",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    eixosDetalhados: { iPlan: 5.5, iFiscal: 8.0, iEduc: 6.5, iSaude: 6.5, iCidade: 4.5, iGovTI: 4.5, iAM: 4.5 },
  },
  {
    id: "porto-feliz",
    nome: "Porto Feliz",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 8.0, faixa: "B+" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 8.0, faixa: "B+" },
      { ano: 2019, nota: 8.0, faixa: "B+" }, { ano: 2020, nota: 8.0, faixa: "B+" }, { ano: 2021, nota: 8.0, faixa: "B+" }, { ano: 2022, nota: 8.0, faixa: "B+" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 9.0, faixa: "A" }, { ano: 2025, nota: 9.0, faixa: "A" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 8.0, iEduc: 6.5, iSaude: 6.5, iCidade: 8.0, iGovTI: 9.0, iAM: 6.5 },
  },
  {
    id: "salto",
    nome: "Salto",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 5.5, iEduc: 5.5, iSaude: 5.5, iCidade: 4.5, iGovTI: 4.5, iAM: 5.5 },
  },
  {
    id: "salto-de-pirapora",
    nome: "Salto De Pirapora",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 8.0, faixa: "B+" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 8.0, faixa: "B+" },
      { ano: 2019, nota: 8.0, faixa: "B+" }, { ano: 2020, nota: 8.0, faixa: "B+" }, { ano: 2021, nota: 8.0, faixa: "B+" }, { ano: 2022, nota: 8.0, faixa: "B+" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 8.0, faixa: "B+" }, { ano: 2025, nota: 8.0, faixa: "B+" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 6.5, iSaude: 6.5, iCidade: 4.5, iGovTI: 8.0, iAM: 5.5 },
  },
  {
    id: "sao-miguel-arcanjo",
    nome: "São Miguel Arcanjo",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    eixosDetalhados: { iPlan: 6.5, iFiscal: 8.0, iEduc: 5.5, iSaude: 5.5, iCidade: 4.5, iGovTI: 5.5, iAM: 4.5 },
  },
  {
    id: "sao-roque",
    nome: "São Roque",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 8.0, faixa: "B+" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 8.0, faixa: "B+" },
      { ano: 2019, nota: 8.0, faixa: "B+" }, { ano: 2020, nota: 8.0, faixa: "B+" }, { ano: 2021, nota: 8.0, faixa: "B+" }, { ano: 2022, nota: 8.0, faixa: "B+" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 8.0, faixa: "B+" }, { ano: 2025, nota: 8.0, faixa: "B+" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 8.0, iEduc: 5.5, iSaude: 6.5, iCidade: 4.5, iGovTI: 8.0, iAM: 4.5 },
  },
  {
    id: "sarapui",
    nome: "Sarapuí",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 4.5, iSaude: 6.5, iCidade: 5.5, iGovTI: 4.5, iAM: 4.5 },
  },
  {
    id: "sorocaba",
    nome: "Sorocaba",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 5.5, faixa: "C+" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 8.0, faixa: "B+" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 8.0, faixa: "B+" },
      { ano: 2019, nota: 8.0, faixa: "B+" }, { ano: 2020, nota: 8.0, faixa: "B+" }, { ano: 2021, nota: 8.0, faixa: "B+" }, { ano: 2022, nota: 8.0, faixa: "B+" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 8.0, faixa: "B+" }, { ano: 2025, nota: 9.0, faixa: "A" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 5.5, iEduc: 6.5, iSaude: 6.5, iCidade: 6.5, iGovTI: 9.0, iAM: 6.5 },
  },
  {
    id: "tapirai",
    nome: "Tapiraí",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 8.0, faixa: "B+" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 8.0, faixa: "B+" },
      { ano: 2019, nota: 8.0, faixa: "B+" }, { ano: 2020, nota: 8.0, faixa: "B+" }, { ano: 2021, nota: 8.0, faixa: "B+" }, { ano: 2022, nota: 8.0, faixa: "B+" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 8.0, faixa: "B+" }, { ano: 2025, nota: 8.0, faixa: "B+" }
    ],
    eixosDetalhados: { iPlan: 6.5, iFiscal: 6.5, iEduc: 6.5, iSaude: 6.5, iCidade: 5.5, iGovTI: 8.0, iAM: 4.5 },
  },
  {
    id: "tatui",
    nome: "Tatuí",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 5.5, faixa: "C+" }, { ano: 2016, nota: 5.5, faixa: "C+" }, { ano: 2017, nota: 5.5, faixa: "C+" }, { ano: 2018, nota: 5.5, faixa: "C+" },
      { ano: 2019, nota: 5.5, faixa: "C+" }, { ano: 2020, nota: 5.5, faixa: "C+" }, { ano: 2021, nota: 5.5, faixa: "C+" }, { ano: 2022, nota: 5.5, faixa: "C+" },
      { ano: 2023, nota: 5.5, faixa: "C+" }, { ano: 2024, nota: 5.5, faixa: "C+" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 8.0, faixa: "B+" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 8.0, faixa: "B+" },
      { ano: 2019, nota: 8.0, faixa: "B+" }, { ano: 2020, nota: 8.0, faixa: "B+" }, { ano: 2021, nota: 8.0, faixa: "B+" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 8.0, faixa: "B+" }, { ano: 2025, nota: 8.0, faixa: "B+" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 4.5, iEduc: 4.5, iSaude: 5.5, iCidade: 6.5, iGovTI: 8.0, iAM: 6.5 },
  },
  {
    id: "tiete",
    nome: "Tietê",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 8.0, faixa: "B+" }, { ano: 2016, nota: 8.0, faixa: "B+" }, { ano: 2017, nota: 8.0, faixa: "B+" }, { ano: 2018, nota: 8.0, faixa: "B+" },
      { ano: 2019, nota: 8.0, faixa: "B+" }, { ano: 2020, nota: 8.0, faixa: "B+" }, { ano: 2021, nota: 8.0, faixa: "B+" }, { ano: 2022, nota: 8.0, faixa: "B+" },
      { ano: 2023, nota: 8.0, faixa: "B+" }, { ano: 2024, nota: 8.0, faixa: "B+" }, { ano: 2025, nota: 8.0, faixa: "B+" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 6.5, iEduc: 4.5, iSaude: 6.5, iCidade: 8.0, iGovTI: 8.0, iAM: 4.5 },
  },
  {
    id: "votorantim",
    nome: "Votorantim",
    populacao: 50000,
    isBoituva: false,
    iegmSeries: [
      { ano: 2015, nota: 4.5, faixa: "C" }, { ano: 2016, nota: 4.5, faixa: "C" }, { ano: 2017, nota: 4.5, faixa: "C" }, { ano: 2018, nota: 4.5, faixa: "C" },
      { ano: 2019, nota: 4.5, faixa: "C" }, { ano: 2020, nota: 4.5, faixa: "C" }, { ano: 2021, nota: 4.5, faixa: "C" }, { ano: 2022, nota: 4.5, faixa: "C" },
      { ano: 2023, nota: 4.5, faixa: "C" }, { ano: 2024, nota: 4.5, faixa: "C" }, { ano: 2025, nota: 4.5, faixa: "C" }
    ],
    iGovTiSeries: [
      { ano: 2015, nota: 6.5, faixa: "B" }, { ano: 2016, nota: 6.5, faixa: "B" }, { ano: 2017, nota: 6.5, faixa: "B" }, { ano: 2018, nota: 6.5, faixa: "B" },
      { ano: 2019, nota: 6.5, faixa: "B" }, { ano: 2020, nota: 6.5, faixa: "B" }, { ano: 2021, nota: 6.5, faixa: "B" }, { ano: 2022, nota: 6.5, faixa: "B" },
      { ano: 2023, nota: 6.5, faixa: "B" }, { ano: 2024, nota: 6.5, faixa: "B" }, { ano: 2025, nota: 6.5, faixa: "B" }
    ],
    eixosDetalhados: { iPlan: 4.5, iFiscal: 5.5, iEduc: 5.5, iSaude: 6.5, iCidade: 6.5, iGovTI: 6.5, iAM: 4.5 },
  },
];

// ============================================================
// Plano executivo de evolução — Ações prioritárias para Boituva
// ============================================================
export interface ExecutiveAction {
  id: string;
  acao: string;
  impacto: string;
  prioridade: "Alta" | "Média" | "Baixa";
  prazo: string;
  secretaria: string;
  eixoIEGM: string;
}

export const planoExecucao: ExecutiveAction[] = [
  {
    id: "act-001",
    acao: "Publicar portal de transparência ativa com dados IEGM",
    impacto: "Eleva i-Plan e i-GovTI em até 1 ponto",
    prioridade: "Alta",
    prazo: "3 meses",
    secretaria: "Administração / TI",
    eixoIEGM: "i-Plan",
  },
  {
    id: "act-002",
    acao: "Digitalizar 100% dos serviços de saúde primária",
    impacto: "Melhora i-Saúde e i-GovTI",
    prioridade: "Alta",
    prazo: "6 meses",
    secretaria: "Saúde",
    eixoIEGM: "i-Saúde",
  },
  {
    id: "act-003",
    acao: "Implantar política formal de LGPD e proteção de dados",
    impacto: "Requisito mínimo para faixa A no i-GovTI",
    prioridade: "Alta",
    prazo: "4 meses",
    secretaria: "Jurídico / TI",
    eixoIEGM: "i-GovTI",
  },
  {
    id: "act-004",
    acao: "Fechar baseline do IEGM com dados CNES e INEP atualizados",
    impacto: "Qualifica i-Educ e i-Saúde com evidência oficial",
    prioridade: "Alta",
    prazo: "2 meses",
    secretaria: "Planejamento",
    eixoIEGM: "i-Educ / i-Saúde",
  },
  {
    id: "act-005",
    acao: "Construir painel de metas físicas por secretaria",
    impacto: "Suporte ao i-Plan e governança de gestão",
    prioridade: "Média",
    prazo: "6 meses",
    secretaria: "Planejamento",
    eixoIEGM: "i-Plan",
  },
  {
    id: "act-006",
    acao: "Integrar RCL e RGF ao cockpit executivo (SICONFI)",
    impacto: "Eleva i-Fiscal e fecha leitura de limites LRF",
    prioridade: "Média",
    prazo: "3 meses",
    secretaria: "Fazenda",
    eixoIEGM: "i-Fiscal",
  },
  {
    id: "act-007",
    acao: "Elaborar PMGIRS atualizado e publicar na plataforma",
    impacto: "Pontua i-AM (Meio Ambiente) diretamente",
    prioridade: "Baixa",
    prazo: "9 meses",
    secretaria: "Meio Ambiente",
    eixoIEGM: "i-AM",
  },
];

// ============================================================
// Helpers derivados
// ============================================================

/** Retorna os dados do ano mais recente disponível */
export function getLatestYearData(municipio: MunicipioRegional, ano?: number) {
  const targetAno = ano ?? Math.max(...municipio.iegmSeries.map((s) => s.ano));
  const iegm = municipio.iegmSeries.find((s) => s.ano === targetAno) ?? municipio.iegmSeries.at(-1)!;
  const iGovTi = municipio.iGovTiSeries.find((s) => s.ano === targetAno) ?? municipio.iGovTiSeries.at(-1)!;
  return { iegm, iGovTi, ano: targetAno };
}

/** Ranking IEGM do ano mais recente — ordena desc por nota */
export function getRankingIegm(ano?: number) {
  return municipiosRegiao
    .map((m) => ({ ...m, latest: getLatestYearData(m, ano) }))
    .sort((a, b) => b.latest.iegm.nota - a.latest.iegm.nota)
    .map((m, idx) => ({ ...m, posicao: idx + 1 }));
}

/** Série temporal regional para o gráfico de evolução */
export function getEvolutionSeries() {
  const anos = [...new Set(municipiosRegiao.flatMap((m) => m.iegmSeries.map((s) => s.ano)))].sort();
  return anos.map((ano) => {
    const row: Record<string, number | string> = { ano: String(ano) };
    municipiosRegiao.forEach((m) => {
      const iegm = m.iegmSeries.find((s) => s.ano === ano);
      const iGovTi = m.iGovTiSeries.find((s) => s.ano === ano);
      if (iegm) row[`iegm_${m.id}`] = iegm.nota;
      if (iGovTi) row[`iGovTi_${m.id}`] = iGovTi.nota;
    });
    return row;
  });
}

/** Dados do radar de maturidade para Boituva */
export function getBoituvaRadar() {
  const boituva = municipiosRegiao.find((m) => m.isBoituva)!;
  const media = municipiosRegiao.find((m) => m.id === "sorocaba")!; // benchmark

  const eixos = [
    { key: "iPlan", label: "Governança" },
    { key: "iFiscal", label: "Fiscal" },
    { key: "iEduc", label: "Educação" },
    { key: "iSaude", label: "Saúde" },
    { key: "iCidade", label: "Cidade Digital" },
    { key: "iGovTI", label: "Transf. Digital" },
    { key: "iAM", label: "Meio Ambiente" },
  ];

  return eixos.map(({ key, label }) => ({
    eixo: label,
    boituva: boituva.eixosDetalhados?.[key as keyof typeof boituva.eixosDetalhados] ?? 0,
    benchmark: media.eixosDetalhados?.[key as keyof typeof media.eixosDetalhados] ?? 0,
  }));
}
