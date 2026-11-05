from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.collectors.tse import TSEOpenDataClient
from src.core.metadata import save_metadata, utc_now_iso
from src.core.storage import ensure_dir, save_json


TSE_QUERIES = {
    "eleitorado": "eleitorado atual",
    "votacao": "resultados 2024",
    "candidatos": "candidatos 2024",
    "prestacao_contas": "prestacao de contas eleitorais 2024",
}


def run_tse_open_data(download_resources: bool = False) -> None:
    client = TSEOpenDataClient()
    bronze_rows: list[dict[str, object]] = []

    for dataset_key, query in TSE_QUERIES.items():
        result = client.package_search(query=query, rows=5)
        if result["status"] == "error":
            print(f"[ERRO] TSE {dataset_key}: {result['error_message']}")
            continue

        raw_path = f"data/raw/tse/{dataset_key}/catalog_search.json"
        save_json(result["data"], raw_path)

        packages = result["data"].get("result", {}).get("results", [])
        for package in packages:
            for resource in package.get("resources", []):
                bronze_rows.append(
                    {
                        "dataset_key": dataset_key,
                        "query": query,
                        "package_name": package.get("name"),
                        "package_title": package.get("title"),
                        "resource_name": resource.get("name"),
                        "resource_format": resource.get("format"),
                        "resource_url": resource.get("url"),
                        "last_modified": resource.get("last_modified"),
                    }
                )

        if download_resources and packages:
            resource = packages[0].get("resources", [None])[0]
            if resource and resource.get("url"):
                extension = ".zip" if "zip" in str(resource.get("url")).lower() else ".bin"
                output_path = f"data/raw/tse/{dataset_key}/downloads/{dataset_key}{extension}"
                download_result = client.download_resource(resource["url"], output_path)
                print(f"[TSE] {dataset_key}: {download_result['status']} -> {output_path}")

    if not bronze_rows:
        print("[INFO] Nenhum dataset TSE retornado.")
        return

    bronze_df = pd.DataFrame(bronze_rows)
    ensure_dir("data/bronze/tse/catalog")
    bronze_path = "data/bronze/tse/catalog/tse_catalog_resources.csv"
    bronze_df.to_csv(bronze_path, index=False, encoding="utf-8-sig")

    silver_df = (
        bronze_df.groupby(["dataset_key", "resource_format"], dropna=False, as_index=False)
        .size()
        .rename(columns={"size": "resource_count"})
    )
    ensure_dir("data/silver/tse/catalog")
    silver_path = "data/silver/tse/catalog/tse_catalog_resources_summary.csv"
    silver_df.to_csv(silver_path, index=False, encoding="utf-8-sig")

    gold_df = (
        bronze_df.groupby("dataset_key", dropna=False, as_index=False)
        .agg(
            packages=("package_name", "nunique"),
            resources=("resource_url", "count"),
        )
        .sort_values("dataset_key")
    )
    ensure_dir("data/gold/tse/catalog")
    gold_path = "data/gold/tse/catalog/tse_catalog_resources_summary.parquet"
    gold_df.to_parquet(gold_path, index=False)

    save_metadata(
        {
            "dataset": "tse_open_data_catalog",
            "fonte": "tse",
            "camada": "gold",
            "data_execucao_utc": utc_now_iso(),
            "arquivo_saida": gold_path,
            "arquivos_intermediarios": [bronze_path, silver_path],
            "registros_totais": int(len(gold_df)),
            "status": "OK",
        },
        "data/gold/tse/catalog/tse_catalog_resources_summary__meta.json",
    )
    print(f"[OK] TSE catalogo salvo em: {gold_path}")
