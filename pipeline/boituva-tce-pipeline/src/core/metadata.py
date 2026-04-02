from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
import json

import pandas as pd

from src.core.storage import save_json, file_exists
from src.core.validations import build_dataframe_quality


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _to_python_int(value: Any) -> int:
    return int(value) if value is not None else 0


def load_metadata(path: str) -> dict[str, Any] | None:
    if not file_exists(path):
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERRO] Falha ao ler metadata {path}: {e}")
        return None


def is_year_metadata_ok(
    *,
    csv_path: str,
    meta_path: str,
    schema_version: str | None = None,
    pipeline_version: str | None = None,
) -> bool:
    if not file_exists(csv_path):
        return False

    meta = load_metadata(meta_path)
    if meta is None:
        return False

    status = meta.get("status")
    arquivo_saida = meta.get("arquivo_saida")

    if status != "OK":
        return False

    if arquivo_saida != csv_path:
        return False

    if schema_version and meta.get("schema_version") != schema_version:
        return False

    if pipeline_version and meta.get("pipeline_version") != pipeline_version:
        return False

    return True


def build_bronze_year_metadata(
    *,
    dataset: str,
    camada: str,
    fonte: str,
    municipio: str,
    ano: int,
    df: pd.DataFrame,
    meses_esperados: list[int],
    meses_com_dados: list[int],
    meses_vazios: list[int],
    meses_com_erro: list[int],
    arquivo_saida: str,
    validation_summary: dict[str, Any] | None = None,
    schema_version: str | None = None,
    pipeline_version: str | None = None,
) -> dict[str, Any]:
    quality = build_dataframe_quality(df)

    status = "OK"
    if len(df) == 0:
        status = "SEM_DADOS"
    elif meses_com_erro:
        status = "ERRO"
    elif meses_vazios:
        status = "PARCIAL"

    meta = {
        "dataset": dataset,
        "camada": camada,
        "fonte": fonte,
        "municipio": municipio,
        "ano": ano,
        "data_execucao_utc": utc_now_iso(),
        "schema_version": schema_version,
        "pipeline_version": pipeline_version,
        "meses_esperados": meses_esperados,
        "meses_com_dados": meses_com_dados,
        "meses_vazios": meses_vazios,
        "meses_com_erro": meses_com_erro,
        "registros_totais": _to_python_int(len(df)),
        "num_colunas": _to_python_int(len(df.columns)),
        "colunas": [str(col) for col in df.columns.tolist()],
        "duplicatas_exatas": quality["duplicatas_exatas"],
        "linhas_com_nulos": quality["linhas_com_nulos"],
        "nulos_por_coluna": quality["nulos_por_coluna"],
        "arquivo_saida": arquivo_saida,
        "status": status,
    }

    if validation_summary is not None:
        meta["validacao_schema"] = validation_summary

    return meta


def build_bronze_consolidated_metadata(
    *,
    dataset: str,
    camada: str,
    fonte: str,
    municipio: str,
    anos_consolidados: list[int],
    df: pd.DataFrame,
    arquivos_entrada: list[str],
    arquivo_saida: str,
    validation_summary: dict[str, Any] | None = None,
    schema_version: str | None = None,
    pipeline_version: str | None = None,
) -> dict[str, Any]:
    quality = build_dataframe_quality(df)

    meta = {
        "dataset": dataset,
        "camada": camada,
        "fonte": fonte,
        "municipio": municipio,
        "escopo": "consolidated",
        "anos_consolidados": anos_consolidados,
        "data_execucao_utc": utc_now_iso(),
        "schema_version": schema_version,
        "pipeline_version": pipeline_version,
        "registros_totais": _to_python_int(len(df)),
        "num_colunas": _to_python_int(len(df.columns)),
        "colunas": [str(col) for col in df.columns.tolist()],
        "duplicatas_exatas": quality["duplicatas_exatas"],
        "linhas_com_nulos": quality["linhas_com_nulos"],
        "nulos_por_coluna": quality["nulos_por_coluna"],
        "arquivos_entrada": arquivos_entrada,
        "arquivo_saida": arquivo_saida,
        "status": "OK" if len(df) > 0 else "SEM_DADOS",
    }

    if validation_summary is not None:
        meta["validacao_schema"] = validation_summary

    return meta


def save_metadata(meta: dict[str, Any], path: str) -> None:
    save_json(meta, path)