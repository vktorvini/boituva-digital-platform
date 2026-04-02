from __future__ import annotations

from typing import Any

import pandas as pd

from src.core.metadata import save_metadata
from src.core.schema import PIPELINE_VERSION
from src.core.storage import ensure_dir, file_exists


MUNICIPIO = "boituva"
FONTE = "tce_sp"
CAMADA = "gold"
DATASET = "indicadores_fiscais_boituva"

GOLD_SCHEMA_VERSION = "2.1.0"


def get_gold_financeiro_anual_path() -> str:
    return "data/gold/tce/financeiro/gold_financeiro_anual.parquet"


def get_output_dir() -> str:
    return "data/gold/tce/financeiro"


def get_output_parquet_path() -> str:
    return f"{get_output_dir()}/gold_indicadores_fiscais.parquet"


def get_output_meta_path() -> str:
    return f"{get_output_dir()}/gold_indicadores_fiscais__meta.json"


def build_meta(
    *,
    arquivo_entrada: str,
    arquivo_saida: str,
    df: pd.DataFrame,
) -> dict[str, Any]:
    return {
        "dataset": DATASET,
        "camada": CAMADA,
        "fonte": FONTE,
        "municipio": MUNICIPIO,
        "schema_version": GOLD_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "arquivo_entrada": arquivo_entrada,
        "arquivo_saida": arquivo_saida,
        "registros_totais": int(len(df)),
        "num_colunas": int(len(df.columns)),
        "colunas": df.columns.tolist(),
        "status": "OK" if len(df) > 0 else "SEM_DADOS",
        "observacoes": {
            "execucao": "despesa_paga / despesa_empenhada",
            "gap_empenhado_pago": "despesa_empenhada - despesa_paga",
            "pressao_fiscal": "gap / receita_total",
            "crescimento_receita": "variação percentual ano a ano",
            "crescimento_despesa": "variação percentual ano a ano (pago)",
        },
    }


def run_gold_indicadores_tce(force_reprocess: bool = False) -> None:
    input_path = get_gold_financeiro_anual_path()

    if not file_exists(input_path):
        raise FileNotFoundError(f"Gold financeiro anual não encontrado: {input_path}")

    ensure_dir(get_output_dir())

    print("\n===== PIPELINE GOLD INDICADORES FISCAIS =====")
    print("Schema version:", GOLD_SCHEMA_VERSION)
    print("Pipeline version:", PIPELINE_VERSION)

    print(f"[LEITURA] {input_path}")
    df = pd.read_parquet(input_path).copy()

    # ==============================
    # INDICADORES PRINCIPAIS
    # ==============================

    df["execucao"] = df["despesa_paga"] / df["despesa_empenhada"]

    df["gap_empenhado_pago"] = df["despesa_empenhada"] - df["despesa_paga"]

    df["pressao_fiscal"] = df["gap_empenhado_pago"] / df["receita_total"]

    # ==============================
    # CRESCIMENTO
    # ==============================

    df = df.sort_values(by="ano").reset_index(drop=True)

    df["crescimento_receita"] = df["receita_total"].pct_change()
    df["crescimento_despesa"] = df["despesa_paga"].pct_change()

    # ==============================
    # SELEÇÃO FINAL
    # ==============================

    output_cols = [
        "ano",
        "receita_total",
        "despesa_paga",
        "despesa_empenhada",
        "execucao",
        "gap_empenhado_pago",
        "pressao_fiscal",
        "crescimento_receita",
        "crescimento_despesa",
        "saldo_receita_vs_pago",
        "saldo_receita_vs_empenhado",
    ]

    df_final = df[output_cols]

    # ==============================
    # SALVAR
    # ==============================

    output_path = get_output_parquet_path()
    df_final.to_parquet(output_path, index=False)

    save_metadata(
        build_meta(
            arquivo_entrada=input_path,
            arquivo_saida=output_path,
            df=df_final,
        ),
        get_output_meta_path(),
    )

    print(f"[OK] Indicadores fiscais salvos em: {output_path}")