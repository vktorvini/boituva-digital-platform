from __future__ import annotations

import hashlib
import html
import re
from typing import List, Optional, Any

import pandas as pd

from src.core.metadata import save_metadata
from src.core.schema import PIPELINE_VERSION
from src.core.storage import ensure_dir, file_exists


MUNICIPIO = "boituva"
FONTE = "tce_sp"
CAMADA = "silver"
DATASET = "receitas_boituva"

SILVER_SCHEMA_VERSION = "1.0.0"
DEFAULT_ANOS = list(range(2014, 2026))


def get_bronze_year_csv_path(ano: int) -> str:
    return f"data/bronze/tce/receitas/{ano}/receitas_boituva_{ano}.csv"


def get_silver_year_dir(ano: int) -> str:
    return f"data/silver/tce/receitas/{ano}"


def get_silver_year_parquet_path(ano: int) -> str:
    return f"{get_silver_year_dir(ano)}/receitas_boituva_{ano}.parquet"


def get_silver_year_meta_path(ano: int) -> str:
    return f"{get_silver_year_dir(ano)}/receitas_boituva_{ano}__meta.json"


def get_silver_consolidated_dir() -> str:
    return "data/silver/tce/receitas/consolidated"


def get_silver_consolidated_parquet_path() -> str:
    return f"{get_silver_consolidated_dir()}/receitas_boituva_full.parquet"


def get_silver_consolidated_meta_path() -> str:
    return f"{get_silver_consolidated_dir()}/receitas_boituva_full__meta.json"


def normalize_text(value: Any) -> str:
    if pd.isna(value):
        return ""
    text = str(value)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text.strip())
    return text


def normalize_text_upper(value: Any) -> str:
    return normalize_text(value).upper()


def parse_brl_number(value: Any) -> float | None:
    if pd.isna(value):
        return None

    text = normalize_text(value)

    if text == "":
        return None

    text = text.replace(".", "").replace(",", ".")

    try:
        return float(text)
    except ValueError:
        return None


def build_chave_receita(row: pd.Series) -> str:
    base = "||".join(
        [
            str(row.get("ano", "")),
            str(row.get("mes_num", "")),
            str(row.get("orgao_norm", "")),
            str(row.get("ds_fonte_recurso_norm", "")),
            str(row.get("ds_cd_aplicacao_fixo_norm", "")),
            str(row.get("ds_alinea_norm", "")),
            str(row.get("ds_subalinea_norm", "")),
            str(row.get("vl_arrecadacao", "")),
        ]
    )
    return hashlib.sha1(base.encode("utf-8")).hexdigest()


def transform_silver(df_bronze: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    df = df_bronze.copy()

    registros_entrada = len(df)

    # preservar bruto
    df["vl_arrecadacao_raw"] = df["vl_arrecadacao"]

    # normalização textual
    text_columns = [
        "orgao",
        "mes",
        "ds_fonte_recurso",
        "ds_cd_aplicacao_fixo",
        "ds_alinea",
        "ds_subalinea",
    ]

    for col in text_columns:
        df[col] = df[col].map(normalize_text)

    df["orgao_norm"] = df["orgao"].map(normalize_text_upper)
    df["ds_fonte_recurso_norm"] = df["ds_fonte_recurso"].map(normalize_text_upper)
    df["ds_cd_aplicacao_fixo_norm"] = df["ds_cd_aplicacao_fixo"].map(normalize_text_upper)
    df["ds_alinea_norm"] = df["ds_alinea"].map(normalize_text_upper)
    df["ds_subalinea_norm"] = df["ds_subalinea"].map(normalize_text_upper)

    # valor
    df["vl_arrecadacao"] = df["vl_arrecadacao_raw"].apply(parse_brl_number)

    # temporal
    df["ano"] = pd.to_numeric(df["ano"], errors="coerce").astype("Int64")
    df["mes_num"] = pd.to_numeric(df["mes_num"], errors="coerce").astype("Int64")

    df["ano_mes_ref"] = df.apply(
        lambda row: f"{int(row['ano']):04d}-{int(row['mes_num']):02d}"
        if pd.notna(row["ano"]) and pd.notna(row["mes_num"])
        else None,
        axis=1,
    )

    # chave técnica
    df["chave_receita"] = df.apply(build_chave_receita, axis=1)

    ordered_columns = [
        "orgao",
        "orgao_norm",
        "mes",
        "mes_num",
        "ano",
        "ano_mes_ref",
        "ds_fonte_recurso",
        "ds_fonte_recurso_norm",
        "ds_cd_aplicacao_fixo",
        "ds_cd_aplicacao_fixo_norm",
        "ds_alinea",
        "ds_alinea_norm",
        "ds_subalinea",
        "ds_subalinea_norm",
        "vl_arrecadacao_raw",
        "vl_arrecadacao",
        "chave_receita",
    ]

    df = df[ordered_columns]

    parse_valores_erro = int(df["vl_arrecadacao"].isna().sum())
    parse_valores_ok = int(len(df) - parse_valores_erro)

    duplicatas_exatas = int(df.duplicated().sum())
    duplicatas_chave = int(df["chave_receita"].duplicated().sum())

    nulos_por_coluna = {
        col: int(qtd)
        for col, qtd in df.isnull().sum().items()
        if int(qtd) > 0
    }

    validation = {
        "parse_valores_ok": parse_valores_ok,
        "parse_valores_erro": parse_valores_erro,
        "duplicatas_exatas": duplicatas_exatas,
        "duplicatas_chave_receita": duplicatas_chave,
        "nulos_por_coluna": nulos_por_coluna,
    }

    registros_saida = len(df)
    registros_descartados = registros_entrada - registros_saida

    status = "OK"
    if registros_saida == 0:
        status = "SEM_DADOS"
    elif parse_valores_erro > 0:
        status = "PARCIAL"

    meta_base = {
        "dataset": DATASET,
        "camada": CAMADA,
        "fonte": FONTE,
        "municipio": MUNICIPIO,
        "schema_version": SILVER_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "registros_entrada": int(registros_entrada),
        "registros_saida": int(registros_saida),
        "registros_descartados": int(registros_descartados),
        "num_colunas": int(len(df.columns)),
        "colunas": df.columns.tolist(),
        "status": status,
        **validation,
    }

    return df, meta_base


def build_year_metadata(
    ano: int,
    meta_base: dict,
    arquivo_entrada: str,
    arquivo_saida: str,
) -> dict:
    return {
        **meta_base,
        "ano": ano,
        "arquivo_entrada": arquivo_entrada,
        "arquivo_saida": arquivo_saida,
    }


def build_consolidated_metadata(
    anos_consolidados: list[int],
    meta_base: dict,
    arquivos_entrada: list[str],
    arquivo_saida: str,
) -> dict:
    return {
        **meta_base,
        "escopo": "consolidated",
        "anos_consolidados": anos_consolidados,
        "arquivos_entrada": arquivos_entrada,
        "arquivo_saida": arquivo_saida,
    }


def process_one_year(ano: int, force_reprocess: bool = False) -> str | None:
    bronze_path = get_bronze_year_csv_path(ano)

    if not file_exists(bronze_path):
        print(f"[INFO] Bronze não encontrada para {ano}: {bronze_path}")
        return None

    silver_path = get_silver_year_parquet_path(ano)
    silver_meta_path = get_silver_year_meta_path(ano)

    if file_exists(silver_path) and file_exists(silver_meta_path) and not force_reprocess:
        print(f"[SKIP] Silver {ano} já existe.")
        return silver_path

    print(f"\n========== SILVER RECEITAS ANO {ano} ==========")
    print(f"[LEITURA] {bronze_path}")

    df_bronze = pd.read_csv(bronze_path)
    df_silver, meta_base = transform_silver(df_bronze)

    ensure_dir(get_silver_year_dir(ano))
    df_silver.to_parquet(silver_path, index=False)

    year_meta = build_year_metadata(
        ano=ano,
        meta_base=meta_base,
        arquivo_entrada=bronze_path,
        arquivo_saida=silver_path,
    )
    save_metadata(year_meta, silver_meta_path)

    print(f"[OK] Silver anual salva em: {silver_path}")
    print(f"[OK] Metadata anual salva em: {silver_meta_path}")
    print(f"[OK] Registros silver {ano}: {len(df_silver)}")

    return silver_path


def build_consolidated(years: list[int]) -> str | None:
    print("\n========== SILVER RECEITAS CONSOLIDATED ==========")

    parquet_paths: List[str] = []
    anos_consolidados: List[int] = []

    for ano in years:
        p = get_silver_year_parquet_path(ano)
        if file_exists(p):
            parquet_paths.append(p)
            anos_consolidados.append(ano)

    if not parquet_paths:
        print("[INFO] Nenhum parquet anual encontrado para consolidar.")
        return None

    frames = [pd.read_parquet(p) for p in parquet_paths]
    full_df = pd.concat(frames, ignore_index=True)

    ensure_dir(get_silver_consolidated_dir())
    consolidated_path = get_silver_consolidated_parquet_path()
    full_df.to_parquet(consolidated_path, index=False)

    meta_base = {
        "dataset": DATASET,
        "camada": CAMADA,
        "fonte": FONTE,
        "municipio": MUNICIPIO,
        "schema_version": SILVER_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "registros_entrada": int(len(full_df)),
        "registros_saida": int(len(full_df)),
        "registros_descartados": 0,
        "num_colunas": int(len(full_df.columns)),
        "colunas": full_df.columns.tolist(),
        "parse_valores_ok": int(full_df["vl_arrecadacao"].notna().sum()),
        "parse_valores_erro": int(full_df["vl_arrecadacao"].isna().sum()),
        "duplicatas_exatas": int(full_df.duplicated().sum()),
        "duplicatas_chave_receita": int(full_df["chave_receita"].duplicated().sum()),
        "nulos_por_coluna": {
            col: int(qtd)
            for col, qtd in full_df.isnull().sum().items()
            if int(qtd) > 0
        },
        "status": "OK" if len(full_df) > 0 else "SEM_DADOS",
    }

    consolidated_meta = build_consolidated_metadata(
        anos_consolidados=anos_consolidados,
        meta_base=meta_base,
        arquivos_entrada=parquet_paths,
        arquivo_saida=consolidated_path,
    )
    save_metadata(consolidated_meta, get_silver_consolidated_meta_path())

    print(f"[OK] Silver consolidated salva em: {consolidated_path}")
    print(f"[OK] Metadata consolidated salva em: {get_silver_consolidated_meta_path()}")
    print(f"[OK] Registros silver consolidated: {len(full_df)}")

    return consolidated_path


def run_silver_receitas_tce(
    years: Optional[List[int]] = None,
    force_reprocess: bool = False,
) -> None:
    anos = years if years else DEFAULT_ANOS

    print("\n===== PIPELINE SILVER RECEITAS TCE =====")
    print("Anos:", anos)
    print("Force:", force_reprocess)
    print("Schema version:", SILVER_SCHEMA_VERSION)
    print("Pipeline version:", PIPELINE_VERSION)

    for ano in anos:
        process_one_year(ano, force_reprocess=force_reprocess)

    build_consolidated(anos)