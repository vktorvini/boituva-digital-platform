"""
Caminhos canônicos de dados da Boituva Digital Platform.
Centraliza todos os paths para evitar strings literais espalhadas nos pipelines.

Uso:
    from src.core.paths import DataPaths
    p = DataPaths()
    df = pd.read_parquet(p.bronze("tce", "despesas_2024.parquet"))
"""
from __future__ import annotations

from pathlib import Path


# Raiz do pipeline (dois níveis acima deste arquivo: src/core/ → src/ → raiz)
_PIPELINE_ROOT = Path(__file__).resolve().parents[2]


class DataPaths:
    """
    Acesso padronizado a todos os diretórios de dados.

    Exemplo de uso:
        p = DataPaths()
        p.raw("tce")                          # data/raw/tce/
        p.bronze("tce", "despesas_2024.csv")  # data/bronze/tce/despesas_2024.csv
        p.gold("tce", "financeiro")           # data/gold/tce/financeiro/
        p.metadata("bronze", "tce")           # data/metadata/bronze/tce/
        p.reference("secretarias.json")       # data/reference/secretarias.json
    """

    def __init__(self, root: Path | None = None) -> None:
        self.root = root or _PIPELINE_ROOT
        self.data = self.root / "data"

    # ── camadas medallion ──────────────────────────────────────────────────
    def raw(self, *parts: str) -> Path:
        return self._layer("raw", *parts)

    def bronze(self, *parts: str) -> Path:
        return self._layer("bronze", *parts)

    def silver(self, *parts: str) -> Path:
        return self._layer("silver", *parts)

    def gold(self, *parts: str) -> Path:
        return self._layer("gold", *parts)

    # ── suporte ────────────────────────────────────────────────────────────
    def metadata(self, camada: str, *parts: str) -> Path:
        return self._layer("metadata", camada, *parts)

    def reference(self, *parts: str) -> Path:
        return self._layer("reference", *parts)

    def logs(self, *parts: str) -> Path:
        return self.root / "logs" / Path(*parts) if parts else self.root / "logs"

    # ── helpers ────────────────────────────────────────────────────────────
    def _layer(self, layer: str, *parts: str) -> Path:
        return self.data / layer / Path(*parts) if parts else self.data / layer

    def ensure(self, path: Path) -> Path:
        """Cria o diretório pai se não existir. Retorna o path."""
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    def ensure_dir(self, path: Path) -> Path:
        """Cria o diretório inteiro se não existir. Retorna o path."""
        path.mkdir(parents=True, exist_ok=True)
        return path
