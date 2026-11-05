from __future__ import annotations

from src.core.http_client import HttpClient


class TCESPExportClient:
    def __init__(self) -> None:
        self.http = HttpClient(timeout=120)

    def download(self, url: str, output_path: str) -> dict[str, object]:
        return self.http.download_file(url, output_path)
