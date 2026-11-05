from __future__ import annotations

from typing import Any

from src.core.http_client import HttpClient


class PNCPClient:
    BASE_URL = "https://pncp.gov.br/api/consulta/v1"

    def __init__(self) -> None:
        self.http = HttpClient(timeout=90)

    def get(self, endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
        return self.http.get(f"{self.BASE_URL}/{endpoint.lstrip('/')}", params=params)

    def contratos(
        self,
        *,
        data_inicial: str,
        data_final: str,
        pagina: int = 1,
        tamanho_pagina: int = 50,
    ) -> dict[str, Any]:
        return self.get(
            "contratos",
            {
                "dataInicial": data_inicial,
                "dataFinal": data_final,
                "pagina": pagina,
                "tamanhoPagina": tamanho_pagina,
            },
        )

    def contratacoes_publicacao(
        self,
        *,
        data_inicial: str,
        data_final: str,
        codigo_modalidade_contratacao: int,
        pagina: int = 1,
        tamanho_pagina: int = 50,
    ) -> dict[str, Any]:
        return self.get(
            "contratacoes/publicacao",
            {
                "dataInicial": data_inicial,
                "dataFinal": data_final,
                "codigoModalidadeContratacao": codigo_modalidade_contratacao,
                "pagina": pagina,
                "tamanhoPagina": tamanho_pagina,
            },
        )
