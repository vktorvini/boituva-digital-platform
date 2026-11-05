from __future__ import annotations

import pandas as pd

from src.collectors.siconfi import SiconfiClient
from src.core.metadata import save_metadata, utc_now_iso
from src.core.storage import ensure_dir, save_json


def run_siconfi_fiscal(
    an_exercicio: int = 2024,
    nr_periodo: int = 1,
    co_tipo_matriz: str = "MSCC",
    no_anexo: str = "RREO-Anexo 01",
) -> None:
    client = SiconfiClient()
    result = client.get_resource(
        "msc_orcamentaria",
        {
            "an_exercicio": an_exercicio,
            "nr_periodo": nr_periodo,
            "co_tipo_matriz": co_tipo_matriz,
            "no_anexo": no_anexo,
            "pagina": 1,
            "limite": 5000,
        },
    )

    raw_path = f"data/raw/siconfi/msc_orcamentaria/{an_exercicio}_{nr_periodo}.json"
    save_json(result, raw_path)

    payload = result.get("data")
    items = payload.get("items", []) if isinstance(payload, dict) else []
    bronze_df = pd.DataFrame(items)
    ensure_dir("data/bronze/siconfi/msc_orcamentaria")
    bronze_path = "data/bronze/siconfi/msc_orcamentaria/siconfi_msc_orcamentaria.csv"
    bronze_df.to_csv(bronze_path, index=False, encoding="utf-8-sig")

    silver_df = bronze_df.copy()
    ensure_dir("data/silver/siconfi/msc_orcamentaria")
    silver_path = "data/silver/siconfi/msc_orcamentaria/siconfi_msc_orcamentaria.csv"
    silver_df.to_csv(silver_path, index=False, encoding="utf-8-sig")

    gold_df = pd.DataFrame(
        [
            {
                "an_exercicio": an_exercicio,
                "nr_periodo": nr_periodo,
                "registros": int(len(bronze_df)),
                "has_more": payload.get("hasMore") if isinstance(payload, dict) else None,
            }
        ]
    )
    ensure_dir("data/gold/siconfi/msc_orcamentaria")
    gold_path = "data/gold/siconfi/msc_orcamentaria/siconfi_msc_orcamentaria_summary.parquet"
    gold_df.to_parquet(gold_path, index=False)

    save_metadata(
        {
            "dataset": "siconfi_msc_orcamentaria",
            "fonte": "siconfi",
            "camada": "gold",
            "data_execucao_utc": utc_now_iso(),
            "arquivo_saida": gold_path,
            "arquivos_intermediarios": [bronze_path, silver_path],
            "registros_totais": int(len(gold_df)),
            "status": "OK",
        },
        "data/gold/siconfi/msc_orcamentaria/siconfi_msc_orcamentaria_summary__meta.json",
    )
    print(f"[OK] Siconfi resumo salvo em: {gold_path}")
