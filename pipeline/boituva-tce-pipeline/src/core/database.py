import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


def load_pipeline_env() -> None:
    """
    Carrega o .env da pasta raiz do pipeline.
    """
    env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(env_path)


def get_database_url() -> str:
    """
    Lê a DATABASE_URL do ambiente e valida se existe.
    """
    load_pipeline_env()
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError(
            "DATABASE_URL não encontrada. Verifique o arquivo data-platform/pipeline/.env"
        )

    return database_url


def get_engine() -> Engine:
    """
    Cria e retorna a engine SQLAlchemy para conexão com Postgres/Supabase.
    """
    database_url = get_database_url()

    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        future=True,
    )
    return engine


def test_connection() -> None:
    """
    Testa a conexão com o banco.
    """
    engine = get_engine()

    with engine.connect() as conn:
        result = conn.execute(text("select current_database(), current_schema(), now();"))
        row = result.fetchone()

    print("Conexão OK")
    print(f"database: {row[0]}")
    print(f"schema:   {row[1]}")
    print(f"timestamp:{row[2]}")