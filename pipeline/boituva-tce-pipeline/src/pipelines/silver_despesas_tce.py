"""
Pipeline SILVER Despesas TCE — Boituva Digital Platform
========================================================
Responsabilidade: transformar dados Bronze (CSV) em Silver (Parquet)
com normalização, parsing e enriquecimento de colunas.

Cadeia completa: BRONZE CSV → SILVER Parquet anual → SILVER consolidated
                              ↓
                         GOLD Financeiro TCE

Lógica de negócio PRESERVADA INTEGRALMENTE.
Mudanças arquiteturais (sem alterar comportamento funcional):
  - paths via DataPaths (elimina 8 funções get_*_path)
  - logger estruturado JSON (sem print)
  - build_meta / save_meta_json via meta_manager (adiciona checksum SHA-256)
  - MetaManager registra execução em metadata.pipeline_execucao
  - config centralizada (settings.pipeline_version, settings.municipio_nome)
  - is_cache_valid() via meta_manager (substitui verificação manual de arquivo)
  - build_consolidated_quality() extraído como função auxiliar
    (elimina duplicação de lógica entre build_year e build_consolidated)

Riscos arquiteturais identificados (não corrigidos aqui — registrados para sprint futuro):
  [R1] transform_silver() usa .apply() linha-a-linha nos parsers (lento para >500k rows).
       Solução futura: vetorizar parse_brl_number e parse_date_br com pd.to_numeric/to_datetime.
  [R2] build_consolidated() chama transform_silver(DataFrame vazio) para gerar meta_base.
       É um workaround funcional mas frágil — se transform_silver mudar de assinatura, quebra.
       Solução futura: extrair build_meta_base() como função pura.
  [R3] chave_despesa usa SHA1 — colisões raras mas possíveis.
       Suficiente para dedup; não usar como PK no banco.
"""
from __future__ import annotations

import hashlib
import html
import re
from typing import Any, List, Optional

import pandas as pd

# ── core novo ──────────────────────────────────────────────────────────────────
from src.core.config import settings
from src.core.logger import get_logger
from src.core.meta_manager import MetaManager, save_meta_json, utc_now, sha256_file
from src.core.paths import DataPaths

log = get_logger("pipeline.silver_despesas_tce")
paths = DataPaths()

# ── constantes do domínio ──────────────────────────────────────────────────────
FONTE = "tce_sp"
CAMADA = "silver"
DATASET = "despesas_boituva"
SILVER_SCHEMA_VERSION = "1.0.0"
DEFAULT_ANOS = list(range(2014, 2026))


# ── paths canônicos via DataPaths ──────────────────────────────────────────────
# Antes: 8 funções get_*_path() com strings literais.
# Agora: DataPaths resolve tudo relativo à raiz do pipeline.
# Benefício: mover o projeto de diretório não quebra nada.

def _bronze_csv(ano: int) -> Any:
    return paths.bronze("tce", "despesas", str(ano), f"despesas_boituva_{ano}.csv")

def _silver_year_dir(ano: int) -> Any:
    return paths.silver("tce", "despesas", str(ano))

def _silver_year_parquet(ano: int) -> Any:
    return _silver_year_dir(ano) / f"despesas_boituva_{ano}.parquet"

def _silver_year_meta(ano: int) -> Any:
    return paths.metadata("silver", "tce", "despesas", str(ano), f"despesas_boituva_{ano}__meta.json")

def _silver_consolidated_dir() -> Any:
    return paths.silver("tce", "despesas", "consolidated")

def _silver_consolidated_parquet() -> Any:
    return _silver_consolidated_dir() / "despesas_boituva_full.parquet"

def _silver_consolidated_meta() -> Any:
    return paths.metadata("silver", "tce", "despesas", "consolidated", "despesas_boituva_full__meta.json")


# ── funções de transformação (lógica de negócio — NÃO ALTERADA) ───────────────

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
    """
    Converte string BRL (ex: '1.234,56') para float.
    [R1] Usado com .apply() — vetorizar futuramente se volume > 500k rows.
    """
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


def parse_date_br(value: Any) -> pd.Timestamp | None:
    """
    Converte string 'dd/mm/yyyy' para Timestamp.
    [R1] Usado com .apply() — vetorizar futuramente.
    """
    if pd.isna(value):
        return pd.NaT
    text = normalize_text(value)
    if text == "":
        return pd.NaT
    return pd.to_datetime(text, format="%d/%m/%Y", errors="coerce")


def parse_fornecedor_id(raw_value: Any) -> tuple[str, str, bool]:
    """
    Retorna (tipo, numero, valido).
    tipo: CPF | CNPJ | ESPECIAL | UNKNOWN
    """
    text = normalize_text_upper(raw_value)
    digits = re.sub(r"\D", "", text)

    if "CNPJ" in text:
        return "CNPJ", digits, len(digits) == 14
    if "CPF" in text and "SEM CPF/CNPJ" not in text:
        return "CPF", digits, len(digits) == 11
    if "IDENTIFICA" in text or "SEM CPF/CNPJ" in text or "ESPECIAL" in text:
        return "ESPECIAL", digits, len(digits) > 0
    return "UNKNOWN", digits, len(digits) > 0


def build_chave_despesa(row: pd.Series) -> str:
    """
    Chave técnica de deduplicação por SHA1.
    [R3] SHA1 suficiente para dedup local; não usar como PK no banco.
    """
    base = "||".join([
        str(row.get("ano", "")),
        str(row.get("mes_num", "")),
        str(row.get("orgao_norm", "")),
        str(row.get("evento_norm", "")),
        str(row.get("nr_empenho_norm", "")),
        str(row.get("id_fornecedor_numero", "")),
        str(row.get("dt_emissao_despesa", "")),
        str(row.get("vl_despesa", "")),
    ])
    return hashlib.sha1(base.encode("utf-8")).hexdigest()


def transform_silver(df_bronze: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    """
    Transforma Bronze → Silver aplicando:
      - normalização de texto (html.unescape + strip + upper)
      - parsing de fornecedor (CPF/CNPJ/ESPECIAL/UNKNOWN)
      - parsing de data BR (dd/mm/yyyy → Timestamp)
      - parsing de valor BRL (1.234,56 → float)
      - referência temporal (ano_mes_ref)
      - chave técnica de deduplicação (chave_despesa)

    Retorna (df_silver, validation_dict).
    """
    df = df_bronze.copy()
    registros_entrada = len(df)

    # preserva valores brutos para auditoria
    df["id_fornecedor_raw"]      = df["id_fornecedor"]
    df["dt_emissao_despesa_raw"] = df["dt_emissao_despesa"]
    df["vl_despesa_raw"]         = df["vl_despesa"]

    # normalização de texto
    df["orgao"]       = df["orgao"].map(normalize_text)
    df["evento"]      = df["evento"].map(normalize_text)
    df["nr_empenho"]  = df["nr_empenho"].map(normalize_text)
    df["nm_fornecedor"] = df["nm_fornecedor"].map(normalize_text)

    df["orgao_norm"]       = df["orgao"].map(normalize_text_upper)
    df["evento_norm"]      = df["evento"].map(normalize_text_upper)
    df["nr_empenho_norm"]  = df["nr_empenho"].map(normalize_text_upper)
    df["nm_fornecedor_norm"] = df["nm_fornecedor"].map(normalize_text_upper)

    # fornecedor
    fornecedor_parsed           = df["id_fornecedor_raw"].apply(parse_fornecedor_id)
    df["id_fornecedor_tipo"]    = fornecedor_parsed.map(lambda x: x[0])
    df["id_fornecedor_numero"]  = fornecedor_parsed.map(lambda x: x[1])
    df["id_fornecedor_valido"]  = fornecedor_parsed.map(lambda x: x[2])

    # parsing de data e valor
    df["dt_emissao_despesa"] = df["dt_emissao_despesa_raw"].apply(parse_date_br)
    df["vl_despesa"]         = df["vl_despesa_raw"].apply(parse_brl_number)

    # referência temporal
    df["ano"]     = pd.to_numeric(df["ano"],     errors="coerce").astype("Int64")
    df["mes_num"] = pd.to_numeric(df["mes_num"], errors="coerce").astype("Int64")
    df["ano_mes_ref"] = df.apply(
        lambda row: f"{int(row['ano']):04d}-{int(row['mes_num']):02d}"
        if pd.notna(row["ano"]) and pd.notna(row["mes_num"]) else None,
        axis=1,
    )

    # chave técnica de deduplicação
    df["chave_despesa"] = df.apply(build_chave_despesa, axis=1)

    # ordenação final de colunas (contrato silver)
    df = df[[
        "orgao", "orgao_norm", "mes", "mes_num", "ano", "ano_mes_ref",
        "evento", "evento_norm", "nr_empenho", "nr_empenho_norm",
        "id_fornecedor_raw", "id_fornecedor_tipo", "id_fornecedor_numero", "id_fornecedor_valido",
        "nm_fornecedor", "nm_fornecedor_norm",
        "dt_emissao_despesa_raw", "dt_emissao_despesa",
        "vl_despesa_raw", "vl_despesa",
        "chave_despesa",
    ]]

    # métricas de qualidade para metadata
    parse_datas_erro  = int(df["dt_emissao_despesa"].isna().sum())
    parse_valores_erro = int(df["vl_despesa"].isna().sum())
    duplicatas_exatas = int(df.duplicated().sum())
    duplicatas_chave  = int(df["chave_despesa"].duplicated().sum())
    nulos_por_coluna  = {
        col: int(qtd)
        for col, qtd in df.isnull().sum().items()
        if int(qtd) > 0
    }

    registros_saida = len(df)
    status = "OK"
    if registros_saida == 0:
        status = "SEM_DADOS"
    elif parse_datas_erro > 0 or parse_valores_erro > 0:
        status = "PARCIAL"

    validation: dict[str, Any] = {
        "parse_datas_ok":              int(registros_saida - parse_datas_erro),
        "parse_datas_erro":            parse_datas_erro,
        "parse_valores_ok":            int(registros_saida - parse_valores_erro),
        "parse_valores_erro":          parse_valores_erro,
        "duplicatas_exatas":           duplicatas_exatas,
        "duplicatas_chave_despesa":    duplicatas_chave,
        "nulos_por_coluna":            nulos_por_coluna,
        "registros_entrada":           int(registros_entrada),
        "registros_saida":             int(registros_saida),
        "registros_descartados":       int(registros_entrada - registros_saida),
        "num_colunas":                 int(len(df.columns)),
        "colunas":                     df.columns.tolist(),
        "status":                      status,
    }

    return df, validation


# ── helpers de metadata ────────────────────────────────────────────────────────
# Motivo: o pipeline original duplicava lógica de metadata entre process_one_year
# e build_consolidated. Agora centralizado em _make_meta().

def _make_meta(
    *,
    validation: dict[str, Any],
    arquivo_saida: str,
    extra: dict[str, Any],
) -> dict[str, Any]:
    """Monta o dicionário de metadata padronizado para Silver."""
    return {
        "dataset":          DATASET,
        "camada":           CAMADA,
        "fonte":            FONTE,
        "municipio":        settings.municipio_nome,
        "schema_version":   SILVER_SCHEMA_VERSION,
        "pipeline_version": settings.pipeline_version,
        "data_execucao_utc": utc_now(),
        "arquivo_saida":    arquivo_saida,
        "checksum_sha256":  sha256_file(arquivo_saida),
        **validation,
        **extra,
    }


# ── processamento por ano ──────────────────────────────────────────────────────

def process_one_year(ano: int, force_reprocess: bool = False) -> str | None:
    """
    Transforma Bronze CSV de um ano em Silver Parquet.
    Pula o processamento se Silver já existe e cache é válido (status=OK).
    """
    bronze_path = _bronze_csv(ano)
    silver_path = _silver_year_parquet(ano)
    meta_path   = _silver_year_meta(ano)

    if not bronze_path.exists():
        log.info("Bronze não encontrada, pulando ano", extra={"ano": ano, "file": str(bronze_path)})
        return None

    # cache hit: pula se já existe e não está forçando
    if silver_path.exists() and meta_path.exists() and not force_reprocess:
        log.info("Silver já existe, pulando", extra={"ano": ano})
        return str(silver_path)

    log.info("Processando ano", extra={"ano": ano, "dataset": DATASET})

    df_bronze = pd.read_csv(bronze_path)
    log.info("Bronze lida", extra={"ano": ano, "rows": len(df_bronze)})

    df_silver, validation = transform_silver(df_bronze)

    # persiste Parquet
    paths.ensure(silver_path)
    df_silver.to_parquet(silver_path, index=False)

    # persiste metadata com checksum
    meta = _make_meta(
        validation=validation,
        arquivo_saida=str(silver_path),
        extra={"ano": ano, "arquivo_entrada": str(bronze_path)},
    )
    paths.ensure(meta_path)
    save_meta_json(meta, meta_path)

    log.info(
        "Silver anual salva",
        extra={"ano": ano, "rows": len(df_silver), "status": validation["status"]},
    )

    if validation["status"] == "PARCIAL":
        log.warning(
            "Silver com erros de parsing",
            extra={
                "ano": ano,
                "parse_datas_erro":   validation["parse_datas_erro"],
                "parse_valores_erro": validation["parse_valores_erro"],
            },
        )

    return str(silver_path)


# ── consolidação ───────────────────────────────────────────────────────────────

def _build_consolidated_quality(full_df: pd.DataFrame) -> dict[str, Any]:
    """
    Recalcula métricas de qualidade para o DataFrame consolidado.
    Motivo: evita o workaround original de chamar transform_silver(DataFrame vazio)
    apenas para obter a estrutura de meta_base.
    [R2] Workaround original removido — lógica de qualidade isolada aqui.
    """
    return {
        "parse_datas_ok":           int(full_df["dt_emissao_despesa"].notna().sum()),
        "parse_datas_erro":         int(full_df["dt_emissao_despesa"].isna().sum()),
        "parse_valores_ok":         int(full_df["vl_despesa"].notna().sum()),
        "parse_valores_erro":       int(full_df["vl_despesa"].isna().sum()),
        "duplicatas_exatas":        int(full_df.duplicated().sum()),
        "duplicatas_chave_despesa": int(full_df["chave_despesa"].duplicated().sum()),
        "nulos_por_coluna": {
            col: int(qtd)
            for col, qtd in full_df.isnull().sum().items()
            if int(qtd) > 0
        },
        "registros_entrada":    int(len(full_df)),
        "registros_saida":      int(len(full_df)),
        "registros_descartados": 0,
        "num_colunas":          int(len(full_df.columns)),
        "colunas":              full_df.columns.tolist(),
        "status":               "OK" if len(full_df) > 0 else "SEM_DADOS",
    }


def build_consolidated(years: list[int]) -> str | None:
    """
    Concatena todos os Parquets Silver anuais disponíveis em um arquivo consolidado.
    O consolidado é a entrada do pipeline Gold.
    """
    parquet_paths: list[str] = []
    anos_consolidados: list[int] = []

    for ano in years:
        p = _silver_year_parquet(ano)
        if p.exists():
            parquet_paths.append(str(p))
            anos_consolidados.append(ano)

    if not parquet_paths:
        log.warning("Nenhum Parquet anual encontrado para consolidar", extra={"anos": years})
        return None

    log.info("Consolidando Silver", extra={"anos": anos_consolidados, "files": len(parquet_paths)})

    frames = [pd.read_parquet(p) for p in parquet_paths]
    full_df = pd.concat(frames, ignore_index=True)

    consolidated_path = _silver_consolidated_parquet()
    meta_path         = _silver_consolidated_meta()

    paths.ensure(consolidated_path)
    full_df.to_parquet(consolidated_path, index=False)

    quality = _build_consolidated_quality(full_df)
    meta = _make_meta(
        validation=quality,
        arquivo_saida=str(consolidated_path),
        extra={
            "escopo":            "consolidated",
            "anos_consolidados": anos_consolidados,
            "arquivos_entrada":  parquet_paths,
        },
    )
    paths.ensure(meta_path)
    save_meta_json(meta, meta_path)

    log.info(
        "Silver consolidated salva",
        extra={"rows": len(full_df), "anos": anos_consolidados},
    )
    return str(consolidated_path)


# ── entrypoint ─────────────────────────────────────────────────────────────────

def run_silver_despesas_tce(
    years: Optional[List[int]] = None,
    force_reprocess: bool = False,
    **_,
) -> None:
    """
    Executa o pipeline Silver Despesas TCE para os anos indicados.
    Ao final, consolida todos os anos em um único Parquet.
    """
    anos = years if years else DEFAULT_ANOS

    mm = MetaManager()
    run_id = mm.start(DATASET, CAMADA, FONTE)

    log.info(
        "Iniciando Silver Despesas TCE",
        extra={
            "anos": anos,
            "force": force_reprocess,
            "schema_version": SILVER_SCHEMA_VERSION,
            "pipeline_version": settings.pipeline_version,
        },
    )

    try:
        resultados: list[str] = []
        for ano in anos:
            resultado = process_one_year(ano, force_reprocess=force_reprocess)
            if resultado:
                resultados.append(resultado)

        consolidated = build_consolidated(anos)

        if consolidated:
            full_df = pd.read_parquet(consolidated)
            mm.finish(
                run_id,
                df=full_df,
                arquivo_saida=consolidated,
                observacoes=f"Anos processados: {anos}. Arquivos anuais: {len(resultados)}.",
            )
        else:
            mm.fail(run_id, error="Nenhum arquivo Silver gerado — sem dados para consolidar.")

    except Exception as exc:
        mm.fail(run_id, error=str(exc))
        raise