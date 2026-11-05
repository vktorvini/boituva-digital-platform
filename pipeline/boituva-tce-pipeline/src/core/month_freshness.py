"""
Verificação de frescor mensal — Boituva Digital Platform.

Garante que o ano corrente seja reprocessado quando surgir um novo mês
(ex.: junho/2026) sem exigir --force manual.
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from src.core.logger import get_logger

log = get_logger("core.month_freshness")

MONTH_NAMES = {
    1: "janeiro",
    2: "fevereiro",
    3: "marco",
    4: "abril",
    5: "maio",
    6: "junho",
    7: "julho",
    8: "agosto",
    9: "setembro",
    10: "outubro",
    11: "novembro",
    12: "dezembro",
}


def reference_date() -> tuple[int, int]:
    today = date.today()
    return today.year, today.month


def expected_months_for_year(
    ano: int,
    *,
    ref_year: int | None = None,
    ref_month: int | None = None,
) -> list[int]:
    """Meses que devem estar cobertos até a data de referência."""
    ref_year = ref_year if ref_year is not None else reference_date()[0]
    ref_month = ref_month if ref_month is not None else reference_date()[1]

    if ano < ref_year:
        return list(range(1, 13))
    if ano > ref_year:
        return []
    return list(range(1, ref_month + 1))


def default_year_range(start: int = 2014) -> list[int]:
    """Intervalo padrão de anos: start .. ano corrente."""
    return list(range(start, reference_date()[0] + 1))


def load_meta(meta_path: str | Path) -> dict[str, Any] | None:
    path = Path(meta_path)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        log.warning("Falha ao ler metadata", extra={"path": str(path), "error": str(exc)})
        return None


def covered_months(meta: dict[str, Any] | None) -> set[int]:
    """Meses já verificados (com dados, vazios ou erro registrado)."""
    if not meta:
        return set()
    covered: set[int] = set()
    for key in ("meses_com_dados", "meses_vazios", "meses_com_erro"):
        for value in meta.get(key) or []:
            try:
                covered.add(int(value))
            except (TypeError, ValueError):
                continue
    return covered


def missing_months(meta_path: str | Path, ano: int) -> list[int]:
    expected = expected_months_for_year(ano)
    if not expected:
        return []
    meta = load_meta(meta_path)
    covered = covered_months(meta)
    return [m for m in expected if m not in covered]


def year_is_fresh(meta_path: str | Path, ano: int) -> bool:
    missing = missing_months(meta_path, ano)
    return len(missing) == 0


def format_missing_months(months: list[int]) -> str:
    if not months:
        return "nenhum"
    return ", ".join(f"{m:02d} ({MONTH_NAMES.get(m, str(m))})" for m in months)


def assess_bronze_year(
    *,
    dataset: str,
    ano: int,
    meta_path: str | Path,
    force_reprocess: bool = False,
) -> dict[str, Any]:
    ref_year, ref_month = reference_date()
    expected = expected_months_for_year(ano, ref_year=ref_year, ref_month=ref_month)
    missing = missing_months(meta_path, ano)
    fresh = len(missing) == 0

    return {
        "dataset": dataset,
        "ano": ano,
        "ref": f"{ref_year}-{ref_month:02d}",
        "expected_months": expected,
        "missing_months": missing,
        "fresh": fresh and not force_reprocess,
        "needs_refresh": bool(missing) or force_reprocess,
    }


def bronze_is_newer_than(meta_path_a: str | Path, meta_path_b: str | Path) -> bool:
    """True se meta A (bronze) foi executada depois de meta B (silver)."""
    meta_a = load_meta(meta_path_a)
    meta_b = load_meta(meta_path_b)
    if not meta_a or not meta_b:
        return bool(meta_a) and not meta_b
    ts_a = meta_a.get("data_execucao_utc") or ""
    ts_b = meta_b.get("data_execucao_utc") or ""
    return ts_a > ts_b


def log_freshness_report(reports: list[dict[str, Any]]) -> None:
    ref_year, ref_month = reference_date()
    log.info(
        "Diagnóstico de frescor mensal",
        extra={"referencia": f"{ref_year}-{ref_month:02d} ({MONTH_NAMES.get(ref_month, ref_month)})"},
    )
    for item in reports:
        if item["needs_refresh"]:
            log.info(
                "Ano precisa atualização",
                extra={
                    "dataset": item["dataset"],
                    "ano": item["ano"],
                    "meses_faltantes": format_missing_months(item["missing_months"]),
                },
            )
        else:
            log.info(
                "Ano atualizado",
                extra={"dataset": item["dataset"], "ano": item["ano"]},
            )
