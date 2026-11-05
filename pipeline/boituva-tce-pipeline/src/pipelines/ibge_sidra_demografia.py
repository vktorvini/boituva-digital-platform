from __future__ import annotations

import pandas as pd

from src.collectors.ibge import BOITUVA_IBGE_CODE
from src.collectors.sidra import SIDRAClient
from src.core.metadata import save_metadata, utc_now_iso
from src.core.storage import ensure_dir, save_json


SIDRA_INDICATORS = [
    {"indicador_id": "censo_territorio", "tabela": 4714, "variavel": "allxp", "periodos": "2022"},
    {"indicador_id": "pib_municipal", "tabela": 5938, "variavel": "allxp", "periodos": "2022"},
]


def run_ibge_sidra_demografia() -> None:
    client = SIDRAClient()
    bronze_rows: list[dict[str, object]] = []

    for indicator in SIDRA_INDICATORS:
        result = client.get_values(
            tabela=indicator["tabela"],
            variavel=indicator["variavel"],
            periodos=indicator["periodos"],
        )
        if result["status"] == "error":
            print(f"[ERRO] SIDRA {indicator['indicador_id']}: {result['error_message']}")
            continue

        raw_path = f"data/raw/ibge/sidra/{indicator['indicador_id']}.json"
        save_json(result["data"], raw_path)

        for row in result["data"][1:]:
            bronze_rows.append(
                {
                    "indicador_id": indicator["indicador_id"],
                    "municipio_id_ibge": BOITUVA_IBGE_CODE,
                    "municipio_nome": row.get("D1N"),
                    "variavel_codigo": row.get("D2C"),
                    "variavel_nome": row.get("D2N"),
                    "ano_codigo": row.get("D3C"),
                    "ano_nome": row.get("D3N"),
                    "valor": row.get("V"),
                    "unidade": row.get("MN"),
                }
            )

    if not bronze_rows:
        print("[INFO] SIDRA sem linhas retornadas.")
        return

    bronze_df = pd.DataFrame(bronze_rows)
    ensure_dir("data/bronze/ibge/sidra")
    bronze_path = "data/bronze/ibge/sidra/ibge_sidra_demografia.csv"
    bronze_df.to_csv(bronze_path, index=False, encoding="utf-8-sig")

    silver_df = bronze_df.copy()
    silver_df["valor_numerico"] = pd.to_numeric(silver_df["valor"], errors="coerce")
    ensure_dir("data/silver/ibge/sidra")
    silver_path = "data/silver/ibge/sidra/ibge_sidra_demografia.csv"
    silver_df.to_csv(silver_path, index=False, encoding="utf-8-sig")

    gold_df = silver_df[["indicador_id", "municipio_id_ibge", "ano_nome", "valor_numerico", "unidade"]]
    ensure_dir("data/gold/ibge/sidra")
    gold_path = "data/gold/ibge/sidra/ibge_sidra_demografia.parquet"
    gold_df.to_parquet(gold_path, index=False)

    save_metadata(
        {
            "dataset": "ibge_sidra_demografia",
            "fonte": "ibge_sidra",
            "camada": "gold",
            "data_execucao_utc": utc_now_iso(),
            "arquivo_saida": gold_path,
            "arquivos_intermediarios": [bronze_path, silver_path],
            "registros_totais": int(len(gold_df)),
            "status": "OK",
        },
        "data/gold/ibge/sidra/ibge_sidra_demografia__meta.json",
    )
    print(f"[OK] SIDRA demografia salva em: {gold_path}")
