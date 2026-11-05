from __future__ import annotations

from typing import Any

from src.collectors.ibge import BOITUVA_IBGE_CODE
from src.core.http_client import HttpClient


class SIDRAClient:
    BASE_URL = "https://apisidra.ibge.gov.br/values"

    def __init__(self) -> None:
        self.http = HttpClient()

    def get_values(
        self,
        *,
        tabela: str | int,
        variavel: str | int,
        periodos: str,
        municipio_id: int = BOITUVA_IBGE_CODE,
        classificacoes: str | None = None,
    ) -> dict[str, Any]:
        path = f"t/{tabela}/n6/{municipio_id}/v/{variavel}/p/{periodos}"
        if classificacoes:
            path += f"/c/{classificacoes}"
        return self.http.get(f"{self.BASE_URL}/{path}")
