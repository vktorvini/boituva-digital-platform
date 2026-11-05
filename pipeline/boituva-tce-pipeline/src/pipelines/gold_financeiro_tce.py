"""
Pipeline GOLD Financeiro TCE — Boituva Digital Platform
========================================================
Responsabilidade: transformar dados Silver (despesas + receitas) em
datasets Gold analíticos para consumo no Supabase e frontend Next.js.

Lógica de negócio preservada integralmente. Mudanças arquiteturais:
  - paths via DataPaths (sem strings literais espalhadas)
  - logger estruturado JSON (sem print)
  - build_meta / save_meta_json via meta_manager (com checksum SHA-256)
  - MetaManager registra execução na tabela metadata.pipeline_execucao
  - config centralizada (settings.pipeline_version, settings.municipio_nome)
"""
from __future__ import annotations

from typing import Any

import pandas as pd

# ── core novo ──────────────────────────────────────────────────────────────────
from src.core.config import settings
from src.core.logger import get_logger
from src.core.meta_manager import MetaManager, build_meta, save_meta_json
from src.core.paths import DataPaths

log = get_logger("pipeline.gold_financeiro_tce")
paths = DataPaths()

# ── constantes do domínio (não alterar sem incrementar GOLD_SCHEMA_VERSION) ───
FONTE = "tce_sp"
CAMADA = "gold"
GOLD_SCHEMA_VERSION = "2.0.0"


# ── paths canônicos via DataPaths ─────────────────────────────────────────────
# Antes: funções get_silver_*_path() e get_gold_*_path() com strings literais.
# Agora: DataPaths resolve tudo relativo à raiz do pipeline — portável em
# qualquer ambiente sem hard-code.

def _silver_despesas() -> Any:
    return paths.silver("tce", "despesas", "consolidated", "despesas_boituva_full.parquet")

def _silver_receitas() -> Any:
    return paths.silver("tce", "receitas", "consolidated", "receitas_boituva_full.parquet")

def _gold_dir() -> Any:
    return paths.gold("tce", "financeiro")

def _gold_path(name: str) -> Any:
    return _gold_dir() / name

def _meta_path(name: str) -> Any:
    return paths.metadata("gold", "tce", "financeiro", name)


# ── lógica de negócio (preservada do original) ────────────────────────────────

def classify_evento(evento_norm: str) -> str:
    """Classifica o evento de despesa em categoria canônica."""
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


def _save(df: pd.DataFrame, parquet_name: str, meta_name: str, **meta_kwargs) -> str:
    """
    Helper: salva Parquet + meta.json de forma padronizada.
    Retorna o path do Parquet salvo (str) para uso no MetaManager.
    """
    out = _gold_path(parquet_name)
    paths.ensure(out)
    df.to_parquet(out, index=False)

    meta = build_meta(
        camada=CAMADA,
        fonte=FONTE,
        schema_version=GOLD_SCHEMA_VERSION,
        arquivo_saida=str(out),
        df=df,
        **meta_kwargs,
    )
    save_meta_json(meta, _meta_path(meta_name))
    log.info("Dataset gold salvo", extra={"file": parquet_name, "rows": len(df)})
    return str(out)


# ── pipeline principal ─────────────────────────────────────────────────────────

def run_gold_financeiro_tce(force_reprocess: bool = False, **_) -> None:
    """
    Transforma Silver → Gold para:
      - gold_despesa_mensal_evento   (despesa por categoria de evento)
      - gold_financeiro_mensal       (merge receita + despesa pivotada + saldos)
      - gold_receita_mensal_fonte    (receita agregada por fonte)
      - gold_financeiro_anual        (consolidado anual)

    Parâmetro force_reprocess ignorado na camada gold (sempre reprocessa,
    pois depende do silver que pode ter sido atualizado).
    """
    mm = MetaManager()
    run_id = mm.start("gold_financeiro_tce", CAMADA, FONTE)

    try:
        _run(mm, run_id)
    except Exception as exc:
        mm.fail(run_id, error=str(exc))
        raise


def _run(mm: MetaManager, run_id: str) -> None:
    despesas_path = _silver_despesas()
    receitas_path = _silver_receitas()

    # ── validação de entradas ──────────────────────────────────────────────
    if not despesas_path.exists():
        raise FileNotFoundError(f"Silver despesas não encontrada: {despesas_path}")
    if not receitas_path.exists():
        raise FileNotFoundError(f"Silver receitas não encontrada: {receitas_path}")

    paths.ensure_dir(_gold_dir())
    paths.ensure_dir(paths.metadata("gold", "tce", "financeiro"))

    log.info(
        "Iniciando Gold Financeiro TCE",
        extra={
            "schema_version": GOLD_SCHEMA_VERSION,
            "pipeline_version": settings.pipeline_version,
        },
    )

    # ── leitura ────────────────────────────────────────────────────────────
    log.info("Lendo Silver despesas", extra={"file": str(despesas_path)})
    df_desp = pd.read_parquet(despesas_path)

    log.info("Lendo Silver receitas", extra={"file": str(receitas_path)})
    df_rec = pd.read_parquet(receitas_path)

    # ── 1. RECEITA MENSAL ──────────────────────────────────────────────────
    receita_mensal = (
        df_rec
        .groupby(["ano", "mes_num", "ano_mes_ref"], dropna=False, as_index=False)["vl_arrecadacao"]
        .sum()
        .rename(columns={"vl_arrecadacao": "receita_total"})
    )

    # ── 2. DESPESA POR EVENTO ──────────────────────────────────────────────
    df_desp = df_desp.copy()
    df_desp["categoria_evento"] = df_desp["evento_norm"].apply(classify_evento)

    despesa_evento_base = (
        df_desp
        .groupby(["ano", "mes_num", "ano_mes_ref", "categoria_evento"], dropna=False, as_index=False)["vl_despesa"]
        .sum()
    )

    gold_despesa_evento = (
        despesa_evento_base
        .rename(columns={"vl_despesa": "vl_despesa_total"})
        .sort_values(["ano", "mes_num", "categoria_evento"])
        .reset_index(drop=True)
    )

    _save(
        gold_despesa_evento,
        "gold_despesa_mensal_evento.parquet",
        "gold_despesa_mensal_evento__meta.json",
        dataset="gold_despesa_mensal_evento",
        arquivos_entrada=[str(despesas_path)],
        observacoes={
            "criterio_classificacao": {
                "despesa_empenhada": "evento_norm contém EMPENH",
                "despesa_liquidada": "evento_norm contém LIQUID",
                "despesa_paga": "evento_norm contém PAGO",
                "despesa_anulada": "evento_norm contém ANULA",
                "despesa_reforcada": "evento_norm contém REFOR",
                "despesa_outros_eventos": "demais eventos",
            }
        },
    )

    # ── 3. GOLD FINANCEIRO MENSAL ──────────────────────────────────────────
    # Pivota despesa por categoria de evento para colunas individuais
    despesa_pivot = (
        despesa_evento_base
        .pivot_table(
            index=["ano", "mes_num", "ano_mes_ref"],
            columns="categoria_evento",
            values="vl_despesa",
            aggfunc="sum",
            fill_value=0.0,
        )
        .reset_index()
    )
    despesa_pivot.columns.name = None

    # Garante que todas as colunas esperadas existem (mesmo sem dados)
    for col in [
        "despesa_empenhada", "despesa_liquidada", "despesa_paga",
        "despesa_anulada", "despesa_reforcada", "despesa_outros_eventos",
    ]:
        if col not in despesa_pivot.columns:
            despesa_pivot[col] = 0.0

    gold_financeiro_mensal = pd.merge(
        receita_mensal, despesa_pivot,
        on=["ano", "mes_num", "ano_mes_ref"],
        how="outer",
    )

    # Preenche NaN em colunas numéricas
    for col in ["receita_total", "despesa_empenhada", "despesa_liquidada",
                "despesa_paga", "despesa_anulada", "despesa_reforcada",
                "despesa_outros_eventos"]:
        if col not in gold_financeiro_mensal.columns:
            gold_financeiro_mensal[col] = 0.0
        gold_financeiro_mensal[col] = gold_financeiro_mensal[col].fillna(0.0)

    # ── métricas ajustadas (lógica v2 — não somar estágios distintos) ─────
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
        ["ano", "mes_num"], ascending=[True, True]
    ).reset_index(drop=True)

    # Saldos acumulados (cumsum — deve ser calculado APÓS sort)
    gold_financeiro_mensal["saldo_acumulado_vs_pago"] = (
        gold_financeiro_mensal["saldo_receita_vs_pago"].cumsum()
    )
    gold_financeiro_mensal["saldo_acumulado_vs_empenhado"] = (
        gold_financeiro_mensal["saldo_receita_vs_empenhado"].cumsum()
    )
    gold_financeiro_mensal["saldo_acumulado_vs_empenhado_liquido"] = (
        gold_financeiro_mensal["saldo_receita_vs_empenhado_liquido"].cumsum()
    )

    financeiro_mensal_path = _save(
        gold_financeiro_mensal,
        "gold_financeiro_mensal.parquet",
        "gold_financeiro_mensal__meta.json",
        dataset="gold_financeiro_mensal",
        arquivos_entrada=[str(receitas_path), str(despesas_path)],
        observacoes={
            "saldo_receita_vs_pago": "receita_total - despesa_paga",
            "saldo_receita_vs_empenhado": "receita_total - despesa_empenhada",
            "despesa_empenhada_liquida": "despesa_empenhada - despesa_anulada",
            "saldo_receita_vs_empenhado_liquido": "receita_total - despesa_empenhada_liquida",
            "nota_v2": "Evita somar estágios distintos da despesa no mesmo indicador.",
        },
    )

    # ── 4. RECEITA MENSAL POR FONTE ────────────────────────────────────────
    gold_receita_fonte = (
        df_rec
        .groupby(["ano", "mes_num", "ano_mes_ref", "ds_fonte_recurso_norm"], dropna=False, as_index=False)["vl_arrecadacao"]
        .sum()
        .rename(columns={"vl_arrecadacao": "vl_arrecadacao_total"})
        .sort_values(["ano", "mes_num", "ds_fonte_recurso_norm"])
        .reset_index(drop=True)
    )

    _save(
        gold_receita_fonte,
        "gold_receita_mensal_fonte.parquet",
        "gold_receita_mensal_fonte__meta.json",
        dataset="gold_receita_mensal_fonte",
        arquivos_entrada=[str(receitas_path)],
    )

    # ── 5. GOLD FINANCEIRO ANUAL ───────────────────────────────────────────
    gold_financeiro_anual = (
        gold_financeiro_mensal
        .groupby("ano", dropna=False, as_index=False)[[
            "receita_total", "despesa_empenhada", "despesa_empenhada_liquida",
            "despesa_liquidada", "despesa_paga", "despesa_anulada",
            "despesa_reforcada", "despesa_outros_eventos",
            "saldo_receita_vs_pago", "saldo_receita_vs_empenhado",
            "saldo_receita_vs_empenhado_liquido",
        ]]
        .sum()
        .sort_values("ano")
        .reset_index(drop=True)
    )

    _save(
        gold_financeiro_anual,
        "gold_financeiro_anual.parquet",
        "gold_financeiro_anual__meta.json",
        dataset="gold_financeiro_anual",
        arquivos_entrada=[str(receitas_path), str(despesas_path)],
    )

    # ── registro operacional final ─────────────────────────────────────────
    # Reportamos o dataset principal (financeiro_mensal) como referência
    mm.finish(
        run_id,
        df=gold_financeiro_mensal,
        arquivo_saida=financeiro_mensal_path,
        observacoes="Gold gerado: evento, financeiro_mensal, receita_fonte, financeiro_anual",
    )
    log.info("Gold Financeiro TCE concluído com sucesso.")
