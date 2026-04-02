from __future__ import annotations

from typing import Any

import pandas as pd


BRONZE_SCHEMA_VERSION = "1.0.0"
PIPELINE_VERSION = "1.1.0"


DESPESAS_REQUIRED_COLUMNS = [
    "orgao",
    "mes",
    "evento",
    "nr_empenho",
    "id_fornecedor",
    "nm_fornecedor",
    "dt_emissao_despesa",
    "vl_despesa",
    "ano",
    "mes_num",
]

DESPESAS_COLUMN_ALIASES = {
    "orgao": ["orgao", "órgão", "nm_orgao"],
    "mes": ["mes", "mês"],
    "evento": ["evento", "tipo_evento"],
    "nr_empenho": ["nr_empenho", "numero_empenho", "num_empenho"],
    "id_fornecedor": ["id_fornecedor", "documento_fornecedor", "cpf_cnpj"],
    "nm_fornecedor": ["nm_fornecedor", "fornecedor", "nome_fornecedor"],
    "dt_emissao_despesa": ["dt_emissao_despesa", "data_emissao", "dt_emissao"],
    "vl_despesa": ["vl_despesa", "valor_despesa", "valor"],
    "ano": ["ano"],
    "mes_num": ["mes_num"],
}


RECEITAS_REQUIRED_COLUMNS = [
    "orgao",
    "mes",
    "ds_fonte_recurso",
    "ds_cd_aplicacao_fixo",
    "ds_alinea",
    "ds_subalinea",
    "vl_arrecadacao",
    "ano",
    "mes_num",
]

RECEITAS_COLUMN_ALIASES = {
    "orgao": ["orgao", "órgão", "nm_orgao"],
    "mes": ["mes", "mês"],
    "ds_fonte_recurso": ["ds_fonte_recurso", "fonte_recurso"],
    "ds_cd_aplicacao_fixo": ["ds_cd_aplicacao_fixo", "cd_aplicacao_fixo"],
    "ds_alinea": ["ds_alinea", "alinea"],
    "ds_subalinea": ["ds_subalinea", "subalinea"],
    "vl_arrecadacao": ["vl_arrecadacao", "valor_arrecadacao", "valor"],
    "ano": ["ano"],
    "mes_num": ["mes_num"],
}


def normalize_column_name(col: Any) -> str:
    return str(col).strip()


def apply_column_aliases(
    df: pd.DataFrame,
    alias_mapping: dict[str, list[str]],
) -> tuple[pd.DataFrame, dict[str, str]]:
    """
    Renomeia colunas do DataFrame para o schema canônico,
    com base em aliases conhecidos.

    Retorna:
    - df renomeado
    - aliases aplicados no formato {coluna_original: coluna_canonica}
    """
    df = df.copy()
    current_columns = [normalize_column_name(c) for c in df.columns]
    df.columns = current_columns

    aliases_aplicados: dict[str, str] = {}

    for canonical, aliases in alias_mapping.items():
        for alias in aliases:
            if alias in df.columns and alias != canonical:
                if canonical not in df.columns:
                    df = df.rename(columns={alias: canonical})
                    aliases_aplicados[alias] = canonical
                break

    return df, aliases_aplicados