from __future__ import annotations

from typing import Any

from src.core.http_client import HttpClient


class TSEOpenDataClient:
    BASE_URL = "https://dadosabertos.tse.jus.br/api/3/action"

    def __init__(self) -> None:
        self.http = HttpClient()

    def package_search(self, query: str, rows: int = 10) -> dict[str, Any]:
        return self.http.get(
            f"{self.BASE_URL}/package_search",
            params={"q": query, "rows": rows},
        )

    def package_show(self, package_name: str) -> dict[str, Any]:
        return self.http.get(
            f"{self.BASE_URL}/package_show",
            params={"id": package_name},
        )

    def download_resource(self, url: str, output_path: str) -> dict[str, Any]:
        return self.http.download_file(url, output_path)
