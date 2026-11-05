from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from src.collectors.tcesp_exports import TCESPExportClient
from src.core.metadata import save_metadata, utc_now_iso
from src.core.storage import ensure_dir


EXPORT_MANIFEST_PATH = Path("docs/fontes/tcesp_exports_manifest.json")


def run_tcesp_exports() -> None:
    if not EXPORT_MANIFEST_PATH.exists():
        ensure_dir(str(EXPORT_MANIFEST_PATH.parent))
        sample = [
            {
                "dataset_key": "iegm_anuario_pdf",
                "url": "https://painel.tce.sp.gov.br/arquivos/iegm/Anuario_IEG-M_2014-2023.pdf",
                "filename": "Anuario_IEG-M_2014-2023.pdf",
            }
        ]
        EXPORT_MANIFEST_PATH.write_text(json.dumps(sample, indent=2, ensure_ascii=False), encoding="utf-8")

    manifest = json.loads(EXPORT_MANIFEST_PATH.read_text(encoding="utf-8"))
    client = TCESPExportClient()
    rows: list[dict[str, object]] = []

    for item in manifest:
        dataset_key = item["dataset_key"]
        output_path = f"data/raw/tcesp/{dataset_key}/{item['filename']}"
        result = client.download(item["url"], output_path)
        rows.append(
            {
                "dataset_key": dataset_key,
                "url": item["url"],
                "output_path": output_path,
                "status": result["status"],
                "error_message": result.get("error_message"),
            }
        )
        print(f"[TCESP] {dataset_key}: {result['status']}")

    bronze_df = pd.DataFrame(rows)
    ensure_dir("data/bronze/tcesp/exports")
    bronze_path = "data/bronze/tcesp/exports/tcesp_exports.csv"
    bronze_df.to_csv(bronze_path, index=False, encoding="utf-8-sig")

    ensure_dir("data/gold/tcesp/exports")
    gold_path = "data/gold/tcesp/exports/tcesp_exports_summary.parquet"
    bronze_df.to_parquet(gold_path, index=False)

    save_metadata(
        {
            "dataset": "tcesp_exports",
            "fonte": "tcesp",
            "camada": "gold",
            "data_execucao_utc": utc_now_iso(),
            "arquivo_saida": gold_path,
            "arquivos_intermediarios": [bronze_path, str(EXPORT_MANIFEST_PATH)],
            "registros_totais": int(len(bronze_df)),
            "status": "OK" if len(bronze_df) > 0 else "SEM_DADOS",
        },
        "data/gold/tcesp/exports/tcesp_exports_summary__meta.json",
    )
    print(f"[OK] TCESP exports salvos em: {gold_path}")
