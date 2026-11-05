"""
Metadata operacional da Boituva Digital Platform.

Grava e consulta registros na tabela metadata.pipeline_execucao do Supabase,
além de salvar arquivos meta.json locais por camada/dataset.

Uso:
    from src.core.meta_manager import MetaManager
    mm = MetaManager()
    run_id = mm.start(dataset="tce_despesas", camada="bronze", fonte="tce")
    ...
    mm.finish(run_id, df=df, arquivo_saida="data/bronze/tce/despesas_2024.parquet")
"""
from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from src.core.config import settings
from src.core.logger import get_logger
from src.core.paths import DataPaths
from src.core.validations import build_dataframe_quality

log = get_logger("core.meta_manager")
paths = DataPaths()


# ── helpers ────────────────────────────────────────────────────────────────────

def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sha256_file(path: str | Path) -> str | None:
    p = Path(path)
    if not p.exists():
        return None
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# ── metadata local (meta.json) ─────────────────────────────────────────────────

def build_meta(
    *,
    dataset: str,
    camada: str,
    fonte: str,
    arquivo_saida: str,
    df: pd.DataFrame,
    arquivos_entrada: list[str] | None = None,
    observacoes: dict[str, Any] | None = None,
    schema_version: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Constrói o dicionário de metadata local (salvo como meta.json)."""
    quality = build_dataframe_quality(df)
    meta: dict[str, Any] = {
        "dataset": dataset,
        "camada": camada,
        "fonte": fonte,
        "municipio": settings.municipio_nome,
        "pipeline_version": settings.pipeline_version,
        "schema_version": schema_version,
        "data_execucao_utc": utc_now(),
        "arquivo_saida": arquivo_saida,
        "checksum_sha256": sha256_file(arquivo_saida),
        "arquivos_entrada": arquivos_entrada or [],
        "registros_totais": int(len(df)),
        "num_colunas": int(len(df.columns)),
        "colunas": df.columns.tolist(),
        "duplicatas_exatas": quality["duplicatas_exatas"],
        "linhas_com_nulos": quality["linhas_com_nulos"],
        "nulos_por_coluna": quality["nulos_por_coluna"],
        "status": "OK" if len(df) > 0 else "SEM_DADOS",
    }
    if observacoes:
        meta["observacoes"] = observacoes
    if extra:
        meta.update(extra)
    return meta


def save_meta_json(meta: dict[str, Any], path: str | Path) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    log.info("Meta JSON saved", extra={"path": str(p)})


def load_meta_json(path: str | Path) -> dict[str, Any] | None:
    p = Path(path)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        log.error("Failed to load meta JSON", extra={"path": str(p), "error": str(e)})
        return None


def is_cache_valid(
    *,
    parquet_path: str | Path,
    meta_path: str | Path,
    schema_version: str | None = None,
) -> bool:
    """
    Retorna True se o Parquet existe E o metadata diz status=OK
    E (opcionalmente) o schema_version bate.
    Usado para skip de reprocessamento.
    """
    if not Path(parquet_path).exists():
        return False
    meta = load_meta_json(meta_path)
    if meta is None or meta.get("status") != "OK":
        return False
    if schema_version and meta.get("schema_version") != schema_version:
        return False
    return True


# ── metadata operacional (Supabase) ───────────────────────────────────────────

class MetaManager:
    """
    Registra execuções de pipeline na tabela metadata.pipeline_execucao.

    Uso:
        mm = MetaManager()
        run_id = mm.start("tce_despesas", "bronze", "tce")
        # ... executa pipeline ...
        mm.finish(run_id, df=df, arquivo_saida="data/bronze/tce/despesas.parquet")
        # ou em caso de erro:
        mm.fail(run_id, error="Timeout na API TCE")
    """

    TABLE = "metadata.pipeline_execucao"

    def __init__(self) -> None:
        self._engine = None

    def _get_engine(self):
        if self._engine is None:
            from src.core.loader import get_engine
            self._engine = get_engine()
        return self._engine

    def start(
        self,
        dataset: str,
        camada: str,
        fonte: str,
        extra: dict[str, Any] | None = None,
    ) -> str:
        """Insere registro de início e retorna o run_id (UUID)."""
        run_id = str(uuid.uuid4())
        record = {
            "run_id": run_id,
            "dataset": dataset,
            "camada": camada,
            "fonte": fonte,
            "municipio": settings.municipio_nome,
            "pipeline_version": settings.pipeline_version,
            "iniciado_em": utc_now(),
            "status": "RUNNING",
            "extra": json.dumps(extra or {}),
        }
        try:
            engine = self._get_engine()
            pd.DataFrame([record]).to_sql(
                "pipeline_execucao",
                schema="metadata",
                con=engine,
                if_exists="append",
                index=False,
                method="multi",
            )
            log.info(
                "Pipeline started",
                extra={"run_id": run_id, "dataset": dataset, "camada": camada},
            )
        except Exception as e:
            log.warning("Could not record pipeline start (non-fatal)", extra={"error": str(e)})
        return run_id

    def finish(
        self,
        run_id: str,
        *,
        df: pd.DataFrame,
        arquivo_saida: str,
        observacoes: str | None = None,
    ) -> None:
        """Atualiza o registro como OK com estatísticas do resultado."""
        self._update(
            run_id,
            status="OK",
            finalizado_em=utc_now(),
            registros_processados=int(len(df)),
            arquivo_saida=arquivo_saida,
            observacoes=observacoes or "",
        )
        log.info(
            "Pipeline finished OK",
            extra={"run_id": run_id, "rows": len(df), "file": arquivo_saida},
        )

    def fail(self, run_id: str, *, error: str) -> None:
        """Atualiza o registro como ERRO."""
        self._update(
            run_id,
            status="ERRO",
            finalizado_em=utc_now(),
            observacoes=error[:2000],
        )
        log.error("Pipeline failed", extra={"run_id": run_id, "error": error[:200]})

    def _update(self, run_id: str, **fields) -> None:
        from sqlalchemy import text as sql_text
        set_clause = ", ".join(f"{k} = :{k}" for k in fields)
        query = sql_text(
            f"UPDATE metadata.pipeline_execucao SET {set_clause} WHERE run_id = :run_id"
        )
        try:
            engine = self._get_engine()
            with engine.begin() as conn:
                conn.execute(query, {"run_id": run_id, **fields})
        except Exception as e:
            log.warning("Could not update pipeline record (non-fatal)", extra={"error": str(e)})
