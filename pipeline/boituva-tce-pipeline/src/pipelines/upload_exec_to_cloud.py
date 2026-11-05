"""
Upload Executivo → Supabase — Boituva Digital Platform
======================================================
Responsabilidade: construir o modelo estrela (dim + fato) a partir
dos datasets Gold e carregá-lo no Supabase (schema analytics).

Mudanças arquiteturais em relação ao original:
  - SECRETARIAS e IBGE_INDICATORS movidos para data/reference/*.json
    (dados de referência fora do código → atualizáveis sem alterar Python)
  - dim_municipio carregado de reference/municipio_boituva.json
    (remove chamada de API IBGE no caminho crítico de upload)
  - validate_frames() antes de qualquer TRUNCATE
    (evita frontend sem dados em caso de falha)
  - truncate_and_load() via loader.py padronizado
  - upsert() disponível para tabelas que não podem ficar offline
  - logger estruturado (sem print)
  - MetaManager registra a execução do upload
  - receita_prevista marcada como None até existir fonte oficial

Lógica de negócio preservada: build_dim_*, build_fato_*, infer_fonte_grupo.
"""
from __future__ import annotations

import json
from pathlib import Path
from uuid import NAMESPACE_DNS, uuid5

import pandas as pd

from src.core.config import settings
from src.core.loader import get_engine, truncate_and_load, upsert, validate_frames
from src.core.logger import get_logger
from src.core.meta_manager import MetaManager
from src.core.paths import DataPaths

log = get_logger("pipeline.upload_exec_cloud")
paths = DataPaths()

# ── ordem de TRUNCATE respeita FK (filhos antes dos pais) ────────────────────
TABLE_RESET_ORDER = [
    "analytics.fato_receita_mensal_fonte",
    "analytics.fato_financeiro_mensal",
    "analytics.fato_ibge_indicador_municipio",
    "analytics.dim_fonte_recurso",
    "analytics.dim_secretaria",
    "analytics.dim_tempo",
    "analytics.dim_municipio",
]

MONTH_NAMES = {
    1: "Janeiro", 2: "Fevereiro", 3: "Marco", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
}


# ── carregamento de dados de referência (data/reference/) ─────────────────────
# Motivo: dados de referência (indicadores IBGE, secretarias, município) devem
# ficar em arquivos JSON versionáveis, não hardcoded em Python. Isso permite
# atualização sem alterar código e rastreabilidade via Git diff.

def _load_reference(name: str) -> list[dict]:
    """Carrega arquivo JSON de data/reference/. Falha explicitamente se ausente."""
    ref_path = paths.reference(name)
    if not ref_path.exists():
        raise FileNotFoundError(
            f"Arquivo de referência não encontrado: {ref_path}\n"
            f"Execute: python scripts/init_reference_data.py"
        )
    return json.loads(ref_path.read_text(encoding="utf-8"))


def _load_gold_inputs() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Lê os Parquets Gold de entrada. Falha imediatamente se ausentes."""
    gold_dir = paths.gold("tce", "financeiro")
    financeiro_path = gold_dir / "gold_financeiro_mensal.parquet"
    receita_path = gold_dir / "gold_receita_mensal_fonte.parquet"

    for p in (financeiro_path, receita_path):
        if not p.exists():
            raise FileNotFoundError(
                f"Gold não encontrado: {p}\n"
                f"Execute primeiro: python -m src.main --dataset gold_financeiro"
            )

    log.info("Lendo Gold inputs", extra={"financeiro": str(financeiro_path)})
    return pd.read_parquet(financeiro_path), pd.read_parquet(receita_path)


# ── builders de dimensões ──────────────────────────────────────────────────────

def _normalize_text(value: str) -> str:
    return " ".join(str(value).strip().split())


def _infer_fonte_grupo(fonte_nome: str) -> str:
    """Classifica a fonte de recurso em grupo canônico."""
    nome = fonte_nome.lower()
    if "tesouro" in nome:
        return "tesouro"
    if "estadua" in nome:
        return "estadual"
    if "federal" in nome or "sus" in nome:
        return "federal"
    if "conven" in nome:
        return "convenios"
    return "outras"


def build_dim_tempo(financeiro_df: pd.DataFrame) -> pd.DataFrame:
    dim = (
        financeiro_df[["ano", "mes_num", "ano_mes_ref"]]
        .drop_duplicates()
        .sort_values(["ano", "mes_num"])
        .reset_index(drop=True)
    )
    dim["tempo_id"] = dim["ano_mes_ref"]
    dim["mes_nome"] = dim["mes_num"].map(MONTH_NAMES)
    dim["trimestre"] = ((dim["mes_num"] - 1) // 3) + 1
    return dim[["tempo_id", "ano", "mes_num", "mes_nome", "trimestre", "ano_mes_ref"]]


def build_dim_secretaria() -> pd.DataFrame:
    # Carrega de reference/ — não mais hardcoded no código
    return pd.DataFrame(_load_reference("secretarias.json"))


def build_dim_fonte_recurso(receita_df: pd.DataFrame) -> pd.DataFrame:
    nomes = sorted({_normalize_text(v) for v in receita_df["ds_fonte_recurso_norm"].dropna()})
    rows = [
        {
            "fonte_id": str(uuid5(NAMESPACE_DNS, f"boituva:{n.lower()}")),
            "fonte_nome": n,
            "grupo": _infer_fonte_grupo(n),
        }
        for n in nomes
    ]
    return pd.DataFrame(rows)


def build_dim_municipio() -> pd.DataFrame:
    """
    Carrega dados do município de reference/ (JSON local).
    Motivo: a chamada de API ao IBGE no caminho de upload criava
    dependência de rede no momento crítico. Se a API ficasse fora do ar,
    o upload inteiro falhava. O JSON de referência é atualizado raramente
    e pode ser versionado no Git.
    """
    data = _load_reference("municipio_boituva.json")
    # Suporta tanto lista quanto dict único
    if isinstance(data, dict):
        data = [data]
    return pd.DataFrame(data)


# ── builders de fatos ──────────────────────────────────────────────────────────

def build_fato_financeiro_mensal(financeiro_df: pd.DataFrame) -> pd.DataFrame:
    fato = financeiro_df.copy()
    fato["tempo_id"] = fato["ano_mes_ref"]
    fato["municipio_id_ibge"] = settings.municipio_ibge_code

    # receita_prevista = 0.0 até existir fonte oficial de previsão orçamentária.
    # O banco de dados (Supabase) tem uma constraint NOT NULL nesta coluna.
    # TODO: integrar LOA quando disponível no pipeline siconfi_fiscal.
    fato["receita_prevista"] = 0.0
    fato["receita_realizada"] = fato["receita_total"]

    return fato[[
        "tempo_id", "municipio_id_ibge",
        "receita_prevista", "receita_realizada",
        "despesa_empenhada", "despesa_liquidada", "despesa_paga",
    ]]


def build_fato_receita_mensal_fonte(
    receita_df: pd.DataFrame,
    dim_fonte_df: pd.DataFrame,
) -> pd.DataFrame:
    fonte_map = dim_fonte_df.set_index("fonte_nome")["fonte_id"].to_dict()
    fato = receita_df.copy()
    fato["tempo_id"] = fato["ano_mes_ref"]
    fato["municipio_id_ibge"] = settings.municipio_ibge_code
    fato["fonte_nome"] = fato["ds_fonte_recurso_norm"].map(_normalize_text)
    fato["fonte_id"] = fato["fonte_nome"].map(fonte_map)
    fato["valor"] = fato["vl_arrecadacao_total"]
    return fato[["tempo_id", "municipio_id_ibge", "fonte_id", "valor"]]


def build_fato_ibge_indicador() -> pd.DataFrame:
    indicators = _load_reference("ibge_indicators.json")
    rows = [{**item, "municipio_id_ibge": settings.municipio_ibge_code} for item in indicators]
    return pd.DataFrame(rows)[[
        "indicador_id", "municipio_id_ibge", "ano_referencia",
        "indicador_nome", "valor", "unidade", "fonte", "fonte_url",
    ]]


# ── execução principal ─────────────────────────────────────────────────────────

def run_upload_exec_cloud(dry_run: bool = False, **_) -> None:
    """
    Orquestra a carga do modelo executivo para o Supabase.

    Fluxo:
      1. Lê Gold Parquets
      2. Constrói dims e fatos
      3. Valida (não permite TRUNCATE com DataFrames vazios)
      4. dry_run → apenas preview, sem escrita
      5. TRUNCATE na ordem correta (respeita FK)
      6. Upload em sequência (dims antes de fatos)
      7. Registra execução no MetaManager
    """
    mm = MetaManager()
    run_id = mm.start("upload_exec_cloud", "supabase", "gold_tce")

    try:
        financeiro_df, receita_df = _load_gold_inputs()

        # ── build ────────────────────────────────────────────────────────
        dim_municipio_df   = build_dim_municipio()
        dim_tempo_df       = build_dim_tempo(financeiro_df)
        dim_secretaria_df  = build_dim_secretaria()
        dim_fonte_df       = build_dim_fonte_recurso(receita_df)
        fato_financeiro_df = build_fato_financeiro_mensal(financeiro_df)
        fato_receita_df    = build_fato_receita_mensal_fonte(receita_df, dim_fonte_df)
        fato_ibge_df       = build_fato_ibge_indicador()

        # Ordem importa: dims antes de fatos (integridade referencial)
        frames = {
            "analytics.dim_municipio":              dim_municipio_df,
            "analytics.dim_tempo":                  dim_tempo_df,
            "analytics.dim_secretaria":             dim_secretaria_df,
            "analytics.dim_fonte_recurso":          dim_fonte_df,
            "analytics.fato_financeiro_mensal":     fato_financeiro_df,
            "analytics.fato_receita_mensal_fonte":  fato_receita_df,
            "analytics.fato_ibge_indicador_municipio": fato_ibge_df,
        }

        # ── validate: aborta ANTES de qualquer truncate ───────────────────
        # Motivo: sem esse guard, um parquet vazio ou corrompido causaria
        # TRUNCATE seguido de carga vazia — frontend ficaria sem dados.
        validate_frames(frames)

        # ── preview ───────────────────────────────────────────────────────
        log.info("=== PREVIEW DA CARGA EXECUTIVA ===")
        for name, df in frames.items():
            log.info("Frame ready", extra={"table": name, "rows": len(df), "cols": len(df.columns)})

        if dry_run:
            log.info("[DRY-RUN] Nenhum dado gravado no banco.")
            mm.finish(run_id, df=fato_financeiro_df, arquivo_saida="dry-run",
                      observacoes="Dry-run: sem escrita no Supabase")
            return

        # ── carga ─────────────────────────────────────────────────────────
        # Usa truncate_and_load do loader.py:
        #   - TRUNCATE na ordem TABLE_RESET_ORDER (filhos antes de pais)
        #   - upload sequencial por DataFrame
        truncate_and_load(frames=frames, truncate_order=TABLE_RESET_ORDER)

        mm.finish(
            run_id,
            df=fato_financeiro_df,
            arquivo_saida="supabase:analytics",
            observacoes="Carga executiva enviada com sucesso.",
        )
        log.info("Upload executivo concluído.")

    except Exception as exc:
        mm.fail(run_id, error=str(exc))
        raise


if __name__ == "__main__":
    # Útil para teste local: python -m src.pipelines.upload_exec_to_cloud
    run_upload_exec_cloud(dry_run=True)
