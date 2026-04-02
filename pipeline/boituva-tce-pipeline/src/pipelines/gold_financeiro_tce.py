from __future__ import annotations

from typing import Any

import pandas as pd

from src.core.metadata import save_metadata
from src.core.schema import PIPELINE_VERSION
from src.core.storage import ensure_dir, file_exists


MUNICIPIO = "boituva"
FONTE = "tce_sp"
CAMADA = "gold"
DATASET = "financeiro_boituva"

GOLD_SCHEMA_VERSION = "2.0.0"


def get_silver_despesas_path() -> str:
    return "data/silver/tce/despesas/consolidated/despesas_boituva_full.parquet"


def get_silver_receitas_path() -> str:
    return "data/silver/tce/receitas/consolidated/receitas_boituva_full.parquet"


def get_gold_dir() -> str:
    return "data/gold/tce/financeiro"


def get_gold_financeiro_mensal_path() -> str:
    return f"{get_gold_dir()}/gold_financeiro_mensal.parquet"


def get_gold_financeiro_mensal_meta_path() -> str:
    return f"{get_gold_dir()}/gold_financeiro_mensal__meta.json"


def get_gold_receita_fonte_path() -> str:
    return f"{get_gold_dir()}/gold_receita_mensal_fonte.parquet"


def get_gold_receita_fonte_meta_path() -> str:
    return f"{get_gold_dir()}/gold_receita_mensal_fonte__meta.json"


def get_gold_despesa_evento_path() -> str:
    return f"{get_gold_dir()}/gold_despesa_mensal_evento.parquet"


def get_gold_despesa_evento_meta_path() -> str:
    return f"{get_gold_dir()}/gold_despesa_mensal_evento__meta.json"


def get_gold_financeiro_anual_path() -> str:
    return f"{get_gold_dir()}/gold_financeiro_anual.parquet"


def get_gold_financeiro_anual_meta_path() -> str:
    return f"{get_gold_dir()}/gold_financeiro_anual__meta.json"


def build_meta(
    *,
    dataset: str,
    arquivo_entrada: list[str],
    arquivo_saida: str,
    df: pd.DataFrame,
    observacoes: dict[str, Any] | None = None,
) -> dict[str, Any]:
    meta = {
        "dataset": dataset,
        "camada": CAMADA,
        "fonte": FONTE,
        "municipio": MUNICIPIO,
        "schema_version": GOLD_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "arquivos_entrada": arquivo_entrada,
        "arquivo_saida": arquivo_saida,
        "registros_totais": int(len(df)),
        "num_colunas": int(len(df.columns)),
        "colunas": df.columns.tolist(),
        "nulos_por_coluna": {
            col: int(qtd)
            for col, qtd in df.isnull().sum().items()
            if int(qtd) > 0
        },
        "status": "OK" if len(df) > 0 else "SEM_DADOS",
    }

    if observacoes:
        meta["observacoes_modelagem"] = observacoes

    return meta


def classify_evento(evento_norm: str) -> str:
    text = str(evento_norm or "").upper().strip()

    if "ANULA" in text:
        return "despesa_anulada"

    if "REFOR" in text:
        return "despesa_reforcada"

    if "PAGO" in text:
        return "despesa_paga"

    if "LIQUID" in text:
        return "despesa_liquidada"

    if "EMPENH" in text:
        return "despesa_empenhada"

    return "despesa_outros_eventos"


def run_gold_financeiro_tce(force_reprocess: bool = False) -> None:
    despesas_path = get_silver_despesas_path()
    receitas_path = get_silver_receitas_path()

    if not file_exists(despesas_path):
        raise FileNotFoundError(f"Silver despesas não encontrada: {despesas_path}")

    if not file_exists(receitas_path):
        raise FileNotFoundError(f"Silver receitas não encontrada: {receitas_path}")

    ensure_dir(get_gold_dir())

    print("\n===== PIPELINE GOLD FINANCEIRO TCE V2 =====")
    print("Force:", force_reprocess)
    print("Schema version:", GOLD_SCHEMA_VERSION)
    print("Pipeline version:", PIPELINE_VERSION)

    print(f"[LEITURA] {despesas_path}")
    df_desp = pd.read_parquet(despesas_path)

    print(f"[LEITURA] {receitas_path}")
    df_rec = pd.read_parquet(receitas_path)

    # ==============================
    # RECEITA MENSAL
    # ==============================
    receita_mensal = (
        df_rec.groupby(["ano", "mes_num", "ano_mes_ref"], dropna=False, as_index=False)["vl_arrecadacao"]
        .sum()
        .rename(columns={"vl_arrecadacao": "receita_total"})
    )

    # ==============================
    # DESPESA POR EVENTO - CLASSIFICAÇÃO
    # ==============================
    df_desp = df_desp.copy()
    df_desp["categoria_evento"] = df_desp["evento_norm"].apply(classify_evento)

    despesa_evento_base = (
        df_desp.groupby(
            ["ano", "mes_num", "ano_mes_ref", "categoria_evento"],
            dropna=False,
            as_index=False,
        )["vl_despesa"]
        .sum()
    )

    gold_despesa_mensal_evento = (
        despesa_evento_base.rename(columns={"vl_despesa": "vl_despesa_total"})
        .sort_values(by=["ano", "mes_num", "categoria_evento"])
        .reset_index(drop=True)
    )

    despesa_evento_path = get_gold_despesa_evento_path()
    gold_despesa_mensal_evento.to_parquet(despesa_evento_path, index=False)
    save_metadata(
        build_meta(
            dataset="gold_despesa_mensal_evento",
            arquivo_entrada=[despesas_path],
            arquivo_saida=despesa_evento_path,
            df=gold_despesa_mensal_evento,
            observacoes={
                "criterio_classificacao_evento": {
                    "despesa_empenhada": "evento_norm contém EMPENH",
                    "despesa_liquidada": "evento_norm contém LIQUID",
                    "despesa_paga": "evento_norm contém PAGO",
                    "despesa_anulada": "evento_norm contém ANULA",
                    "despesa_reforcada": "evento_norm contém REFOR",
                    "despesa_outros_eventos": "demais eventos não classificados",
                }
            },
        ),
        get_gold_despesa_evento_meta_path(),
    )
    print(f"[OK] Gold despesa mensal por evento salva em: {despesa_evento_path}")

    # ==============================
    # DESPESA MENSAL PIVOTADA
    # ==============================
    despesa_mensal_pivot = (
        despesa_evento_base.pivot_table(
            index=["ano", "mes_num", "ano_mes_ref"],
            columns="categoria_evento",
            values="vl_despesa",
            aggfunc="sum",
            fill_value=0.0,
        )
        .reset_index()
    )

    despesa_mensal_pivot.columns.name = None

    expected_cols = [
        "despesa_empenhada",
        "despesa_liquidada",
        "despesa_paga",
        "despesa_anulada",
        "despesa_reforcada",
        "despesa_outros_eventos",
    ]

    for col in expected_cols:
        if col not in despesa_mensal_pivot.columns:
            despesa_mensal_pivot[col] = 0.0

    # ==============================
    # GOLD FINANCEIRO MENSAL
    # ==============================
    gold_financeiro_mensal = pd.merge(
        receita_mensal,
        despesa_mensal_pivot,
        on=["ano", "mes_num", "ano_mes_ref"],
        how="outer",
    )

    numeric_cols = [
        "receita_total",
        "despesa_empenhada",
        "despesa_liquidada",
        "despesa_paga",
        "despesa_anulada",
        "despesa_reforcada",
        "despesa_outros_eventos",
    ]

    for col in numeric_cols:
        if col not in gold_financeiro_mensal.columns:
            gold_financeiro_mensal[col] = 0.0
        gold_financeiro_mensal[col] = gold_financeiro_mensal[col].fillna(0.0)

    # ==============================
    # MÉTRICAS AJUSTADAS / PROXY TCE
    # ==============================
    gold_financeiro_mensal["despesa_empenhada_liquida"] = (
        gold_financeiro_mensal["despesa_empenhada"] - gold_financeiro_mensal["despesa_anulada"]
    )

    gold_financeiro_mensal["saldo_receita_vs_pago"] = (
        gold_financeiro_mensal["receita_total"] - gold_financeiro_mensal["despesa_paga"]
    )

    gold_financeiro_mensal["saldo_receita_vs_empenhado"] = (
        gold_financeiro_mensal["receita_total"] - gold_financeiro_mensal["despesa_empenhada"]
    )

    gold_financeiro_mensal["saldo_receita_vs_empenhado_liquido"] = (
        gold_financeiro_mensal["receita_total"] - gold_financeiro_mensal["despesa_empenhada_liquida"]
    )

    gold_financeiro_mensal = gold_financeiro_mensal.sort_values(
        by=["ano", "mes_num"], ascending=[True, True]
    ).reset_index(drop=True)

    gold_financeiro_mensal["saldo_acumulado_vs_pago"] = (
        gold_financeiro_mensal["saldo_receita_vs_pago"].cumsum()
    )

    gold_financeiro_mensal["saldo_acumulado_vs_empenhado"] = (
        gold_financeiro_mensal["saldo_receita_vs_empenhado"].cumsum()
    )

    gold_financeiro_mensal["saldo_acumulado_vs_empenhado_liquido"] = (
        gold_financeiro_mensal["saldo_receita_vs_empenhado_liquido"].cumsum()
    )

    financeiro_mensal_path = get_gold_financeiro_mensal_path()
    gold_financeiro_mensal.to_parquet(financeiro_mensal_path, index=False)

    save_metadata(
        build_meta(
            dataset="gold_financeiro_mensal",
            arquivo_entrada=[receitas_path, despesas_path],
            arquivo_saida=financeiro_mensal_path,
            df=gold_financeiro_mensal,
            observacoes={
                "saldo_receita_vs_pago": "receita_total - despesa_paga",
                "saldo_receita_vs_empenhado": "receita_total - despesa_empenhada",
                "despesa_empenhada_liquida": "despesa_empenhada - despesa_anulada",
                "saldo_receita_vs_empenhado_liquido": "receita_total - despesa_empenhada_liquida",
                "observacao": "A métrica v2 evita somar estágios distintos da despesa no mesmo indicador.",
            },
        ),
        get_gold_financeiro_mensal_meta_path(),
    )
    print(f"[OK] Gold financeiro mensal salva em: {financeiro_mensal_path}")

    # ==============================
    # RECEITA MENSAL POR FONTE
    # ==============================
    gold_receita_mensal_fonte = (
        df_rec.groupby(
            ["ano", "mes_num", "ano_mes_ref", "ds_fonte_recurso_norm"],
            dropna=False,
            as_index=False,
        )["vl_arrecadacao"]
        .sum()
        .rename(columns={"vl_arrecadacao": "vl_arrecadacao_total"})
        .sort_values(by=["ano", "mes_num", "ds_fonte_recurso_norm"])
        .reset_index(drop=True)
    )

    receita_fonte_path = get_gold_receita_fonte_path()
    gold_receita_mensal_fonte.to_parquet(receita_fonte_path, index=False)
    save_metadata(
        build_meta(
            dataset="gold_receita_mensal_fonte",
            arquivo_entrada=[receitas_path],
            arquivo_saida=receita_fonte_path,
            df=gold_receita_mensal_fonte,
        ),
        get_gold_receita_fonte_meta_path(),
    )
    print(f"[OK] Gold receita mensal por fonte salva em: {receita_fonte_path}")

    # ==============================
    # GOLD FINANCEIRO ANUAL
    # ==============================
        gold_financeiro_anual = (
        gold_financeiro_mensal.groupby("ano", dropna=False, as_index=False)[
            [
                "receita_total",
                "despesa_empenhada",
                "despesa_empenhada_liquida",
                "despesa_liquidada",
                "despesa_paga",
                "despesa_anulada",
                "despesa_reforcada",
                "despesa_outros_eventos",
                "saldo_receita_vs_pago",
                "saldo_receita_vs_empenhado",
                "saldo_receita_vs_empenhado_liquido",
            ]
        ]
        .sum()
        .sort_values(by="ano")
        .reset_index(drop=True)
    )


    financeiro_anual_path = get_gold_financeiro_anual_path()
    gold_financeiro_anual.to_parquet(financeiro_anual_path, index=False)

    save_metadata(
        build_meta(
            dataset="gold_financeiro_anual",
            arquivo_entrada=[receitas_path, despesas_path],
            arquivo_saida=financeiro_anual_path,
            df=gold_financeiro_anual,
            bservacoes={
                "saldo_receita_vs_pago": "receita_total - despesa_paga",
                "saldo_receita_vs_empenhado": "receita_total - despesa_empenhada",
                "despesa_empenhada_liquida": "despesa_empenhada - despesa_anulada",
                "saldo_receita_vs_empenhado_liquido": "receita_total - despesa_empenhada_liquida",
            },
        ),
        get_gold_financeiro_anual_meta_path(),
    )
    print(f"[OK] Gold financeiro anual salva em: {financeiro_anual_path}")