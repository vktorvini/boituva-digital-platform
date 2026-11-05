from __future__ import annotations

import time
from typing import Any, Dict, List, Optional, Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


JsonType = Union[Dict[str, Any], List[Any]]
BOITUVA_IBGE_CODE = 3507001


class IBGEClient:
    """
    Cliente HTTP reutilizavel para APIs publicas do IBGE.
    """

    BASE_URL_LOCALIDADES = "https://servicodados.ibge.gov.br/api/v1/localidades"
    BASE_URL_AGREGADOS = "https://servicodados.ibge.gov.br/api/v3/agregados"

    def __init__(
        self,
        timeout: int = 60,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        user_agent: str = "boituva-digital-platform/1.0",
    ) -> None:
        self.timeout = timeout
        self.session = self._build_session(
            max_retries=max_retries,
            backoff_factor=backoff_factor,
            user_agent=user_agent,
        )

    def _build_session(
        self,
        max_retries: int,
        backoff_factor: float,
        user_agent: str,
    ) -> requests.Session:
        session = requests.Session()

        retry = Retry(
            total=max_retries,
            connect=max_retries,
            read=max_retries,
            status=max_retries,
            backoff_factor=backoff_factor,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"],
            raise_on_status=False,
        )

        adapter = HTTPAdapter(max_retries=retry)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        session.headers.update({"Accept": "application/json", "User-Agent": user_agent})
        return session

    def _safe_join_url(self, base_url: str, path: str) -> str:
        base = base_url.rstrip("/")
        suffix = path.lstrip("/")
        return f"{base}/{suffix}" if suffix else base

    def _request(
        self,
        base_url: str,
        path: str = "",
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = self._safe_join_url(base_url, path)
        started_at = time.perf_counter()

        try:
            response = self.session.get(url, params=params, timeout=self.timeout)
            elapsed = round(time.perf_counter() - started_at, 4)

            if response.status_code != 200:
                return {
                    "status": "error",
                    "data": None,
                    "error_message": f"HTTP {response.status_code} - {response.text[:500]}",
                    "url": response.url,
                    "params": params or {},
                    "elapsed_seconds": elapsed,
                }

            try:
                data: JsonType = response.json()
            except ValueError:
                return {
                    "status": "error",
                    "data": None,
                    "error_message": "Resposta nao e um JSON valido.",
                    "url": response.url,
                    "params": params or {},
                    "elapsed_seconds": elapsed,
                }

            if data is None:
                return {
                    "status": "empty",
                    "data": None,
                    "error_message": None,
                    "url": response.url,
                    "params": params or {},
                    "elapsed_seconds": elapsed,
                }

            if isinstance(data, list) and len(data) == 0:
                return {
                    "status": "empty",
                    "data": [],
                    "error_message": None,
                    "url": response.url,
                    "params": params or {},
                    "elapsed_seconds": elapsed,
                }

            if isinstance(data, dict) and len(data) == 0:
                return {
                    "status": "empty",
                    "data": {},
                    "error_message": None,
                    "url": response.url,
                    "params": params or {},
                    "elapsed_seconds": elapsed,
                }

            return {
                "status": "ok",
                "data": data,
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

    def get_municipio(self, municipio_id: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_LOCALIDADES, path=f"municipios/{municipio_id}")

    def list_municipios_por_uf(self, uf: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_LOCALIDADES, path=f"estados/{uf}/municipios")

    def list_estados(self) -> Dict[str, Any]:
        return self._request(self.BASE_URL_LOCALIDADES, path="estados")

    def get_estado(self, uf: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_LOCALIDADES, path=f"estados/{uf}")

    def search_municipios_por_nome(self, nome: str) -> Dict[str, Any]:
        result = self._request(self.BASE_URL_LOCALIDADES, path="municipios")
        if result["status"] != "ok":
            return result

        nome_normalizado = nome.strip().lower()
        data = result["data"]
        if not isinstance(data, list):
            return {
                "status": "error",
                "data": None,
                "error_message": "Formato inesperado ao buscar municipios.",
                "url": result["url"],
                "params": result["params"],
                "elapsed_seconds": result["elapsed_seconds"],
            }

        filtrados = [
            item
            for item in data
            if str(item.get("nome", "")).strip().lower() == nome_normalizado
            or nome_normalizado in str(item.get("nome", "")).strip().lower()
        ]

        return {
            "status": "ok" if filtrados else "empty",
            "data": filtrados,
            "error_message": None,
            "url": result["url"],
            "params": result["params"],
            "elapsed_seconds": result["elapsed_seconds"],
        }

    def list_agregados(self) -> Dict[str, Any]:
        return self._request(self.BASE_URL_AGREGADOS)

    def get_agregado_metadados(self, agregado_id: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_AGREGADOS, path=f"{agregado_id}/metadados")

    def get_agregado_periodos(self, agregado_id: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_AGREGADOS, path=f"{agregado_id}/periodos")

    def get_agregado_variaveis(self, agregado_id: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_AGREGADOS, path=f"{agregado_id}/variaveis")

    def get_agregado_niveis(self, agregado_id: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_AGREGADOS, path=f"{agregado_id}/niveis")

    def get_agregado_classificacoes(self, agregado_id: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_AGREGADOS, path=f"{agregado_id}/classificacoes")

    def get_agregado_localidades(self, agregado_id: Union[int, str]) -> Dict[str, Any]:
        return self._request(self.BASE_URL_AGREGADOS, path=f"{agregado_id}/localidades")

    def get_agregado_resultado(
        self,
        agregado_id: Union[int, str],
        periodos: Union[str, int],
        variaveis: Union[str, int],
        nivel_geografico: Union[str, int],
        localidades: Union[str, int],
        classificacao: Optional[Union[str, int]] = None,
        categoria: Optional[Union[str, int]] = None,
    ) -> Dict[str, Any]:
        path = f"{agregado_id}/periodos/{periodos}/variaveis/{variaveis}"
        if classificacao is not None and categoria is not None:
            path += f"/classificacoes/{classificacao}[{categoria}]"
        path += f"/resultados/{nivel_geografico}[{localidades}]"
        return self._request(self.BASE_URL_AGREGADOS, path=path)

    def get_boituva_municipio(self) -> Dict[str, Any]:
        return self.get_municipio(BOITUVA_IBGE_CODE)

    def get_boituva_por_nome(self) -> Dict[str, Any]:
        return self.search_municipios_por_nome("Boituva")

    def get_boituva_resultado_agregado(
        self,
        agregado_id: Union[int, str],
        periodos: Union[str, int],
        variaveis: Union[str, int],
        classificacao: Optional[Union[str, int]] = None,
        categoria: Optional[Union[str, int]] = None,
    ) -> Dict[str, Any]:
        return self.get_agregado_resultado(
            agregado_id=agregado_id,
            periodos=periodos,
            variaveis=variaveis,
            nivel_geografico="N6",
            localidades=BOITUVA_IBGE_CODE,
            classificacao=classificacao,
            categoria=categoria,
        )


def fetch_ibge_municipio(municipio_id: Union[int, str]) -> Dict[str, Any]:
    return IBGEClient().get_municipio(municipio_id)


def fetch_ibge_municipios_por_uf(uf: Union[int, str]) -> Dict[str, Any]:
    return IBGEClient().list_municipios_por_uf(uf)


def fetch_ibge_agregado_metadados(agregado_id: Union[int, str]) -> Dict[str, Any]:
    return IBGEClient().get_agregado_metadados(agregado_id)


def fetch_ibge_agregado_resultado(
    agregado_id: Union[int, str],
    periodos: Union[str, int],
    variaveis: Union[str, int],
    nivel_geografico: Union[str, int],
    localidades: Union[str, int],
    classificacao: Optional[Union[str, int]] = None,
    categoria: Optional[Union[str, int]] = None,
) -> Dict[str, Any]:
    return IBGEClient().get_agregado_resultado(
        agregado_id=agregado_id,
        periodos=periodos,
        variaveis=variaveis,
        nivel_geografico=nivel_geografico,
        localidades=localidades,
        classificacao=classificacao,
        categoria=categoria,
    )


if __name__ == "__main__":
    client = IBGEClient()
    print("\n===== TESTE MUNICIPIO BOITUVA =====")
    municipio = client.get_boituva_municipio()
    print("Status:", municipio["status"])
    print("URL:", municipio["url"])
