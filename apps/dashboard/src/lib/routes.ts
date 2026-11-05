export const routeTitles: Record<string, string> = {
  "/": "Visão Geral",
  "/execucao": "Execução Financeira",
  "/ibge-municipio": "População (IBGE)",
  "/operacional/eleitorado": "Eleitorado (TSE)",
  "/operacional/contratos": "Contratos (PNCP)",
  "/operacional/fiscal": "Contabilidade (Siconfi)",
  "/painel/iegm-scorecard": "Índice IEGM",
  "/comparativo-regional": "Comparativo Regional",
};

export function getRouteTitle(pathname: string): string {
  return routeTitles[pathname] ?? "Boituva Digital";
}
