from __future__ import annotations

from typing import Any

import pandas as pd


def _to_python_int(value: Any) -> int:
    return int(value) if value is not None else 0


def build_dataframe_quality(df: pd.DataFrame) -> dict[str, Any]:
    duplicated_exact = _to_python_int(df.duplicated().sum())

    nulls_by_column_series = df.isnull().sum()
    nulls_by_column = {
        str(col): _to_python_int(qtd)
        for col, qtd in nulls_by_column_series.items()
        if _to_python_int(qtd) > 0
    }

    rows_with_nulls = _to_python_int(df.isnull().any(axis=1).sum())

    return {
        "duplicatas_exatas": duplicated_exact,
        "linhas_com_nulos": rows_with_nulls,
        "nulos_por_coluna": nulls_by_column,
    }


def validate_schema_contract(
    df: pd.DataFrame,
    required_columns: list[str],
    aliases_aplicados: dict[str, str] | None = None,
) -> dict[str, Any]:
    existing_columns = [str(col) for col in df.columns.tolist()]
    existing_columns_set = set(existing_columns)
    required_columns_set = set(required_columns)

    missing_columns = sorted(list(required_columns_set - existing_columns_set))
    extra_columns = sorted(list(existing_columns_set - required_columns_set))

    return {
        "colunas_recebidas": existing_columns,
        "colunas_obrigatorias": required_columns,
        "colunas_faltantes": missing_columns,
        "colunas_extras": extra_columns,
        "aliases_aplicados": aliases_aplicados or {},
        "status": "OK" if not missing_columns else "ERRO",
    }