from __future__ import annotations

from typing import Any

from src.core.http_client import HttpClient


class SiconfiClient:
    BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt"

    def __init__(self) -> None:
        self.http = HttpClient(timeout=90)

    def get_resource(self, resource: str, params: dict[str, Any]) -> dict[str, Any]:
        return self.http.get(f"{self.BASE_URL}/{resource}", params=params)
