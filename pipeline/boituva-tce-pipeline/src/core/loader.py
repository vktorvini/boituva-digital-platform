"""
Loader Supabase: UPSERT seguro, validação antes de truncate, logging estruturado.

Uso básico:
    from src.core.loader import SupabaseLoader
    loader = SupabaseLoader()
    loader.upsert(df, table="analytics.dim_tempo", conflict_columns=["tempo_id"])
    loader.truncate_and_load(frames, schema="analytics")
"""
from __future__ import annotations

import time
from contextlib import contextmanager
from typing import Generator

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from src.core.config import settings
from src.core.logger import get_logger

log = get_logger("loader.supabase")


# ── engine singleton ───────────────────────────────────────────────────────────

_engine: Engine | None = None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        settings.validate()
        _engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            future=True,
            connect_args={"connect_timeout": 10},
        )
    return _engine


@contextmanager
def engine_context() -> Generator[Engine, None, None]:
    """Context manager que descarta o engine ao sair (útil em scripts únicos)."""
    eng = get_engine()
    try:
        yield eng
    finally:
        eng.dispose()


# ── validação ──────────────────────────────────────────────────────────────────

def validate_frames(frames: dict[str, pd.DataFrame]) -> None:
    """
    Aborta se qualquer DataFrame estiver vazio.
    Evita TRUNCATE seguido de carga vazia que deixaria o frontend sem dados.
    """
    errors: list[str] = []
    for name, df in frames.items():
        if df.empty:
            errors.append(f"'{name}' está vazio")
        elif len(df.columns) == 0:
            errors.append(f"'{name}' não tem colunas")
    if errors:
        raise ValueError(
            f"Carga abortada — DataFrames inválidos: {'; '.join(errors)}"
        )


# ── operações de escrita ───────────────────────────────────────────────────────

def truncate_tables(engine: Engine, tables: list[str]) -> None:
    """TRUNCATE CASCADE nas tabelas na ordem fornecida (respeita FK)."""
    with engine.begin() as conn:
        for table in tables:
            log.info("Truncating table", extra={"table": table})
            conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))


def upload_frame(
    df: pd.DataFrame,
    table: str,
    engine: Engine,
    if_exists: str = "append",
    chunksize: int = 1000,
) -> None:
    """Carrega DataFrame inteiro na tabela via to_sql (append por padrão)."""
    t0 = time.perf_counter()
    df.to_sql(
        table.split(".")[-1],      # nome sem schema
        schema=table.split(".")[0] if "." in table else None,
        con=engine,
        if_exists=if_exists,
        index=False,
        method="multi",
        chunksize=chunksize,
    )
    elapsed = round(time.perf_counter() - t0, 2)
    log.info(
        "Uploaded frame",
        extra={"table": table, "rows": len(df), "elapsed_s": elapsed},
    )


def upsert(
    df: pd.DataFrame,
    table: str,
    engine: Engine,
    conflict_columns: list[str],
    schema: str | None = None,
) -> None:
    """
    UPSERT via INSERT ... ON CONFLICT DO UPDATE.
    Mais seguro que TRUNCATE para tabelas que o frontend lê continuamente.

    Exemplo:
        upsert(df, "dim_tempo", engine, conflict_columns=["tempo_id"],
               schema="analytics")
    """
    if df.empty:
        log.warning("upsert: DataFrame vazio, nada a fazer", extra={"table": table})
        return

    schema_prefix = f"{schema}." if schema else ""
    full_table = f"{schema_prefix}{table}"
    cols = list(df.columns)
    col_names = ", ".join(f'"{c}"' for c in cols)
    placeholders = ", ".join(f":{c}" for c in cols)
    updates = ", ".join(
        f'"{c}" = EXCLUDED."{c}"'
        for c in cols
        if c not in conflict_columns
    )
    conflict_str = ", ".join(f'"{c}"' for c in conflict_columns)

    sql = text(f"""
        INSERT INTO {full_table} ({col_names})
        VALUES ({placeholders})
        ON CONFLICT ({conflict_str})
        DO UPDATE SET {updates}
    """)

    t0 = time.perf_counter()
    records = df.to_dict(orient="records")
    with engine.begin() as conn:
        conn.execute(sql, records)
    elapsed = round(time.perf_counter() - t0, 2)
    log.info(
        "Upserted frame",
        extra={"table": full_table, "rows": len(df), "elapsed_s": elapsed},
    )


# ── padrão completo: truncate + carga ─────────────────────────────────────────

def truncate_and_load(
    frames: dict[str, pd.DataFrame],
    truncate_order: list[str],
    dry_run: bool = False,
) -> None:
    """
    Valida, faz preview, trunca tabelas na ordem correta e carrega os frames.

    Args:
        frames: dict {nome_tabela: DataFrame}  — nome_tabela pode incluir schema
        truncate_order: lista de tabelas na ordem de truncate (filhos antes de pais)
        dry_run: se True, imprime preview e encerra sem escrever no banco
    """
    validate_frames(frames)

    log.info("=== PREVIEW DA CARGA ===")
    for name, df in frames.items():
        log.info("Frame ready", extra={"table": name, "rows": len(df), "cols": len(df.columns)})

    if dry_run:
        log.info("[DRY-RUN] Nenhum dado gravado.")
        return

    with engine_context() as engine:
        log.info("Truncating tables in order...")
        truncate_tables(engine, truncate_order)

        log.info("Uploading frames...")
        for table, df in frames.items():
            upload_frame(df, table, engine)

    log.info("Carga concluída com sucesso.")
