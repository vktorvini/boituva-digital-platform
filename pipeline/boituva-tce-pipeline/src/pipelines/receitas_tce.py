from typing import List, Optional

import pandas as pd

from src.collectors.tce import fetch_tce_data
from src.core.bronze_incremental import collect_bronze_year_incremental
from src.core.metadata import (
    build_bronze_consolidated_metadata,
    is_year_metadata_ok,
    save_metadata,
)
from src.core.month_freshness import default_year_range
from src.core.schema import (
    BRONZE_SCHEMA_VERSION,
    PIPELINE_VERSION,
    RECEITAS_COLUMN_ALIASES,
    RECEITAS_REQUIRED_COLUMNS,
)
from src.core.storage import ensure_dir, file_exists
from src.core.validations import validate_schema_contract


MUNICIPIO = "boituva"
ENDPOINT = "receitas"
FONTE = "tce_sp"
CAMADA = "bronze"
DATASET = f"{ENDPOINT}_{MUNICIPIO}"

DEFAULT_ANOS = default_year_range()


def get_raw_json_path(ano: int, mes: int) -> str:
    return f"data/raw/tce/{ENDPOINT}/{ano}/{mes:02d}.json"


def get_bronze_year_dir(ano: int) -> str:
    return f"data/bronze/tce/{ENDPOINT}/{ano}"


def get_bronze_year_csv_path(ano: int) -> str:
    return f"{get_bronze_year_dir(ano)}/{ENDPOINT}_{MUNICIPIO}_{ano}.csv"


def get_bronze_year_meta_path(ano: int) -> str:
    return f"{get_bronze_year_dir(ano)}/{ENDPOINT}_{MUNICIPIO}_{ano}__meta.json"


def get_bronze_consolidated_dir() -> str:
    return f"data/bronze/tce/{ENDPOINT}/consolidated"


def get_bronze_consolidated_csv_path() -> str:
    return f"{get_bronze_consolidated_dir()}/{ENDPOINT}_{MUNICIPIO}_full.csv"


def get_bronze_consolidated_meta_path() -> str:
    return f"{get_bronze_consolidated_dir()}/{ENDPOINT}_{MUNICIPIO}_full__meta.json"


def collect_one_year(ano: int, force_reprocess: bool) -> str | None:
    return collect_bronze_year_incremental(
        ano=ano,
        force_reprocess=force_reprocess,
        endpoint=ENDPOINT,
        municipio=MUNICIPIO,
        dataset=DATASET,
        camada=CAMADA,
        fonte=FONTE,
        csv_path=get_bronze_year_csv_path(ano),
        meta_path=get_bronze_year_meta_path(ano),
        raw_json_path_fn=get_raw_json_path,
        column_aliases=RECEITAS_COLUMN_ALIASES,
        required_columns=RECEITAS_REQUIRED_COLUMNS,
        fetch_fn=fetch_tce_data,
        is_year_metadata_ok=is_year_metadata_ok,
    )


def build_consolidated(anos: List[int]) -> str | None:
    print("\n========== GERANDO CONSOLIDADO ==========")

    csv_paths: List[str] = []
    anos_consolidados: List[int] = []

    for ano in anos:
        csv_path = get_bronze_year_csv_path(ano)
        if file_exists(csv_path):
            csv_paths.append(csv_path)
            anos_consolidados.append(ano)

    if not csv_paths:
        print("[INFO] Nenhum CSV anual encontrado para consolidar.")
        return None

    frames: List[pd.DataFrame] = []

    for csv_path in csv_paths:
        print(f"[LEITURA] {csv_path}")
        df = pd.read_csv(csv_path)
        frames.append(df)

    full_df = pd.concat(frames, ignore_index=True)

    validation_summary = validate_schema_contract(
        full_df,
        RECEITAS_REQUIRED_COLUMNS,
        aliases_aplicados={},
    )

    consolidated_dir = get_bronze_consolidated_dir()
    ensure_dir(consolidated_dir)

    consolidated_csv_path = get_bronze_consolidated_csv_path()
    full_df.to_csv(consolidated_csv_path, index=False, encoding="utf-8-sig")

    consolidated_meta = build_bronze_consolidated_metadata(
        dataset=DATASET,
        camada=CAMADA,
        fonte=FONTE,
        municipio=MUNICIPIO,
        anos_consolidados=anos_consolidados,
        df=full_df,
        arquivos_entrada=csv_paths,
        arquivo_saida=consolidated_csv_path,
        validation_summary=validation_summary,
        schema_version=BRONZE_SCHEMA_VERSION,
        pipeline_version=PIPELINE_VERSION,
    )

    consolidated_meta_path = get_bronze_consolidated_meta_path()
    save_metadata(consolidated_meta, consolidated_meta_path)

    print(f"[OK] Consolidado salvo em: {consolidated_csv_path}")
    print(f"[OK] Metadata consolidada salva em: {consolidated_meta_path}")
    print(f"[OK] Registros consolidados: {len(full_df)}")

    return consolidated_csv_path


def run_receitas_tce(
    years: Optional[List[int]] = None,
    force_reprocess: bool = False,
) -> None:
    anos = years if years else DEFAULT_ANOS

    print("\n===== PIPELINE RECEITAS TCE =====")
    print("Anos:", anos)
    print("Force:", force_reprocess)
    print("Schema version:", BRONZE_SCHEMA_VERSION)
    print("Pipeline version:", PIPELINE_VERSION)

    for ano in anos:
        collect_one_year(ano, force_reprocess)

    build_consolidated(anos)
