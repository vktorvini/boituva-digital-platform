"""
Configuração central da Boituva Digital Platform.
Lê variáveis de ambiente do .env e expõe como objeto tipado.

Uso:
    from src.core.config import settings
    print(settings.database_url)
    print(settings.municipio_ibge_code)
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_ENV_PATH)


@dataclass(frozen=True)
class Settings:
    # ── banco ──────────────────────────────────────────────────────────────
    database_url: str = field(
        default_factory=lambda: os.getenv("DATABASE_URL", "")
    )

    # ── município ──────────────────────────────────────────────────────────
    municipio_nome: str = field(
        default_factory=lambda: os.getenv("BDP_MUNICIPIO_NOME", "boituva")
    )
    municipio_ibge_code: int = field(
        default_factory=lambda: int(os.getenv("BDP_MUNICIPIO_IBGE_CODE", "3507001"))
    )
    municipio_uf: str = field(
        default_factory=lambda: os.getenv("BDP_MUNICIPIO_UF", "SP")
    )

    # ── pipeline ───────────────────────────────────────────────────────────
    pipeline_version: str = field(
        default_factory=lambda: os.getenv("BDP_PIPELINE_VERSION", "1.1.0")
    )
    log_level: str = field(
        default_factory=lambda: os.getenv("BDP_LOG_LEVEL", "INFO")
    )
    dry_run: bool = field(
        default_factory=lambda: os.getenv("BDP_DRY_RUN", "false").lower() == "true"
    )

    # ── supabase schemas ───────────────────────────────────────────────────
    schema_analytics: str = "analytics"
    schema_metadata: str = "metadata"
    schema_staging: str = "staging"

    def validate(self) -> None:
        """Lança ValueError se configurações obrigatórias estiverem ausentes."""
        if not self.database_url:
            raise ValueError(
                "DATABASE_URL não configurada. Verifique o arquivo .env."
            )


# Singleton — importe este objeto nos pipelines
settings = Settings()
