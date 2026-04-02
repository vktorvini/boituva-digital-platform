from typing import List, Optional

import pandas as pd

from src.collectors.tce import fetch_tce_data
from src.core.metadata import (
    build_bronze_consolidated_metadata,
    build_bronze_year_metadata,
    is_year_metadata_ok,
    save_metadata,
)
from src.core.schema import (
    BRONZE_SCHEMA_VERSION,
    PIPELINE_VERSION,
    RECEITAS_COLUMN_ALIASES,
    RECEITAS_REQUIRED_COLUMNS,
    apply_column_aliases,
)
from src.core.storage import ensure_dir, save_json, file_exists
from src.core.validations import validate_schema_contract


MUNICIPIO = "boituva"
ENDPOINT = "receitas"
FONTE = "tce_sp"
CAMADA = "bronze"
DATASET = f"{ENDPOINT}_{MUNICIPIO}"

DEFAULT_ANOS = list(range(2014, 2026))
MESES = list(range(1, 13))


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


def should_skip_year(ano: int, force_reprocess: bool) -> bool:
    if force_reprocess:
        print(f"[FORCE] Reprocessando ano {ano}")
        return False

    csv_path = get_bronze_year_csv_path(ano)
    meta_path = get_bronze_year_meta_path(ano)

    if is_year_metadata_ok(
        csv_path=csv_path,
        meta_path=meta_path,
        schema_version=BRONZE_SCHEMA_VERSION,
        pipeline_version=PIPELINE_VERSION,
    ):
        print(f"[SKIP] Ano {ano} já processado com status OK.")
        return True

    return False


def collect_one_year(ano: int, force_reprocess: bool) -> str | None:
    if should_skip_year(ano, force_reprocess):
        return get_bronze_year_csv_path(ano)

    print(f"\n========== PROCESSANDO {ENDPOINT.upper()} ANO {ano} ==========")

    year_frames: List[pd.DataFrame] = []
    meses_com_dados: List[int] = []
    meses_vazios: List[int] = []
    meses_com_erro: List[int] = []

    for mes in MESES:
        print(f"[COLETA] {ENDPOINT} | {MUNICIPIO} | {ano}/{mes:02d}")

        result = fetch_tce_data(
            endpoint=ENDPOINT,
            municipio=MUNICIPIO,
            ano=ano,
            mes=mes,
        )

        status = result["status"]
        data = result["data"]

        if status == "error":
            print(f"[ERRO] {ano}/{mes:02d} -> {result['error_message']}")
            meses_com_erro.append(mes)
            continue

        if status == "empty":
            print(f"[INFO] {ano}/{mes:02d} sem dados.")
            meses_vazios.append(mes)
            continue

        raw_json_path = get_raw_json_path(ano, mes)
        save_json(data, raw_json_path)

        df = pd.DataFrame(data)
        df["ano"] = ano
        df["mes_num"] = mes

        df, aliases_aplicados = apply_column_aliases(df, RECEITAS_COLUMN_ALIASES)

        year_frames.append(df)
        meses_com_dados.append(mes)

    if not year_frames:
        print(f"[INFO] Nenhum dado encontrado para o ano {ano}.")
        return None

    year_df = pd.concat(year_frames, ignore_index=True)

    validation_summary = validate_schema_contract(
        year_df,
        RECEITAS_REQUIRED_COLUMNS,
        aliases_aplicados=aliases_aplicados if "aliases_aplicados" in locals() else {},
    )

    bronze_year_dir = get_bronze_year_dir(ano)
    ensure_dir(bronze_year_dir)

    bronze_year_csv_path = get_bronze_year_csv_path(ano)
    year_df.to_csv(bronze_year_csv_path, index=False, encoding="utf-8-sig")

    year_meta = build_bronze_year_metadata(
        dataset=DATASET,
        camada=CAMADA,
        fonte=FONTE,
        municipio=MUNICIPIO,
        ano=ano,
        df=year_df,
        meses_esperados=MESES,
        meses_com_dados=meses_com_dados,
        meses_vazios=meses_vazios,
        meses_com_erro=meses_com_erro,
        arquivo_saida=bronze_year_csv_path,
        validation_summary=validation_summary,
        schema_version=BRONZE_SCHEMA_VERSION,
        pipeline_version=PIPELINE_VERSION,
    )

    bronze_year_meta_path = get_bronze_year_meta_path(ano)
    save_metadata(year_meta, bronze_year_meta_path)

    print(f"[OK] Bronze anual salvo em: {bronze_year_csv_path}")
    print(f"[OK] Metadata anual salva em: {bronze_year_meta_path}")
    print(f"[OK] Registros do ano {ano}: {len(year_df)}")

    return bronze_year_csv_path


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