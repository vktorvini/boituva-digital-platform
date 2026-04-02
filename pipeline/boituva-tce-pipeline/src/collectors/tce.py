import requests
from typing import Dict, Any

BASE_URL = "https://transparencia.tce.sp.gov.br/api/json"


def fetch_tce_data(
    endpoint: str,
    municipio: str,
    ano: int,
    mes: int,
    timeout: int = 60,
) -> Dict[str, Any]:
    url = f"{BASE_URL}/{endpoint}/{municipio}/{ano}/{mes}"

    try:
        response = requests.get(url, timeout=timeout)

        if response.status_code != 200:
            return {
                "status": "error",
                "data": None,
                "error_message": f"HTTP {response.status_code}",
                "url": url,
            }

        data = response.json()

        if not data:
            return {
                "status": "empty",
                "data": [],
                "error_message": None,
                "url": url,
            }

        return {
            "status": "ok",
            "data": data,
            "error_message": None,
            "url": url,
        }

    except Exception as e:
        return {
            "status": "error",
            "data": None,
            "error_message": str(e),
            "url": url,
        }