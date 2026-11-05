from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from src.core.storage import ensure_dir


class HttpClient:
    def __init__(
        self,
        timeout: int = 60,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        user_agent: str = "boituva-digital-platform/1.0",
    ) -> None:
        self.timeout = timeout
        self.session = requests.Session()

        retry = Retry(
            total=max_retries,
            connect=max_retries,
            read=max_retries,
            status=max_retries,
            backoff_factor=backoff_factor,
            status_forcelist=[408, 429, 500, 502, 503, 504],
            allowed_methods=["GET"],
            raise_on_status=False,
        )

        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        self.session.headers.update(
            {
                "Accept": "application/json, text/plain, */*",
                "User-Agent": user_agent,
            }
        )

    def get(
        self,
        url: str,
        params: Optional[dict[str, Any]] = None,
        headers: Optional[dict[str, str]] = None,
        stream: bool = False,
    ) -> dict[str, Any]:
        started_at = time.perf_counter()

        try:
            response = self.session.get(
                url,
                params=params,
                headers=headers,
                timeout=self.timeout,
                stream=stream,
            )
            elapsed = round(time.perf_counter() - started_at, 4)

            payload: Any
            if stream:
                payload = response
            else:
                try:
                    payload = response.json()
                except ValueError:
                    payload = response.text

            if response.status_code >= 400:
                return {
                    "status": "error",
                    "data": payload,
                    "error_message": f"HTTP {response.status_code}",
                    "url": response.url,
                    "params": params or {},
                    "elapsed_seconds": elapsed,
                }

            is_empty = payload in (None, "", [], {})
            return {
                "status": "empty" if is_empty else "ok",
                "data": payload,
                "error_message": None,
                "url": response.url,
                "params": params or {},
                "elapsed_seconds": elapsed,
            }

        except requests.RequestException as exc:
            elapsed = round(time.perf_counter() - started_at, 4)
            return {
                "status": "error",
                "data": None,
                "error_message": str(exc),
                "url": url,
                "params": params or {},
                "elapsed_seconds": elapsed,
            }

    def download_file(
        self,
        url: str,
        output_path: str,
        params: Optional[dict[str, Any]] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> dict[str, Any]:
        result = self.get(url, params=params, headers=headers, stream=True)
        if result["status"] == "error":
            return result

        response = result["data"]
        ensure_dir(str(Path(output_path).parent))

        with open(output_path, "wb") as file_obj:
            for chunk in response.iter_content(chunk_size=1024 * 128):
                if chunk:
                    file_obj.write(chunk)

        response.close()
        return {
            **result,
            "data": {
                "output_path": output_path,
                "content_type": response.headers.get("content-type"),
                "content_length": response.headers.get("content-length"),
            },
        }
