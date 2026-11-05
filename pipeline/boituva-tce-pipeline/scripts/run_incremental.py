#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de atualização incremental da Boituva Digital Platform.
Executa: Bronze -> Silver -> Gold -> Upload Supabase

Uso:
    # Atualizar apenas o ano atual (recomendado mensalmente):
    python scripts/run_incremental.py

    # Forcar reprocessamento do ano corrente:
    python scripts/run_incremental.py --force --years 2025

    # Dry-run: executa tudo, mas NAO sobe ao Supabase:
    python scripts/run_incremental.py --dry-run

    # Ciclo completo de todos os anos:
    python scripts/run_incremental.py --force --years 2014 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025
"""
from __future__ import annotations

import argparse
import io
import sys
import time
from datetime import datetime, timezone

# Forca UTF-8 no stdout em Windows (evita UnicodeEncodeError com cp1252)
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Garante imports relativos ao src/
sys.path.insert(0, ".")

from src.core.logger import get_logger
from src.pipelines.registry import get as get_pipeline

log = get_logger("run_incremental")


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def run_step(name: str, dataset: str, **kwargs) -> tuple[bool, float]:
    """Executa um step do pipeline e retorna (sucesso, tempo_segundos)."""
    pipeline = get_pipeline(dataset)
    if pipeline is None:
        log.error("Dataset não encontrado no registry", extra={"dataset": dataset})
        return False, 0.0

    t0 = time.perf_counter()
    try:
        log.info(f"=== {name} ===", extra={"dataset": dataset})
        pipeline(**kwargs)
        elapsed = round(time.perf_counter() - t0, 2)
        log.info(f"{name} concluído", extra={"elapsed_s": elapsed})
        return True, elapsed
    except Exception as exc:
        elapsed = round(time.perf_counter() - t0, 2)
        log.error(f"{name} falhou", extra={"error": str(exc), "elapsed_s": elapsed})
        return False, elapsed


def main() -> None:
    parser = argparse.ArgumentParser(description="Pipeline incremental Boituva Digital Platform")
    parser.add_argument("--years", nargs="+", type=int, help="Anos a processar (padrão: ano atual)")
    parser.add_argument("--force", action="store_true", help="Força reprocessamento mesmo se cache OK")
    parser.add_argument("--dry-run", action="store_true", help="Não sobe dados ao Supabase")
    parser.add_argument("--skip-bronze", action="store_true", help="Pula ingestão Bronze (usa dados existentes)")
    parser.add_argument("--skip-silver", action="store_true", help="Pula transformação Silver")
    parser.add_argument("--skip-gold", action="store_true", help="Pula geração Gold")
    parser.add_argument("--skip-upload", action="store_true", help="Pula upload Supabase")
    args = parser.parse_args()

    # Por padrão, processa o ano atual
    from src.core.month_freshness import (
        assess_bronze_year,
        log_freshness_report,
        reference_date,
    )
    from src.pipelines.despesas_tce import get_bronze_year_meta_path as despesas_meta
    from src.pipelines.receitas_tce import get_bronze_year_meta_path as receitas_meta

    years = args.years or [reference_date()[0]]

    freshness_reports = []
    for year in years:
        freshness_reports.append(
            assess_bronze_year(
                dataset="despesas",
                ano=year,
                meta_path=despesas_meta(year),
                force_reprocess=args.force,
            )
        )
        freshness_reports.append(
            assess_bronze_year(
                dataset="receitas",
                ano=year,
                meta_path=receitas_meta(year),
                force_reprocess=args.force,
            )
        )
    log_freshness_report(freshness_reports)

    silver_force = args.force or any(r["needs_refresh"] for r in freshness_reports)

    started_at = utc_now()
    total_start = time.perf_counter()

    log.info(
        "Iniciando pipeline incremental",
        extra={
            "years": years,
            "force": args.force,
            "dry_run": args.dry_run,
            "started_at": started_at,
        },
    )

    report: dict = {
        "started_at": started_at,
        "years": years,
        "steps": {},
    }

    # ── STEP 1: Bronze Despesas ────────────────────────────────────────────────
    if not args.skip_bronze:
        ok, elapsed = run_step(
            "BRONZE Despesas TCE",
            "despesas",
            years=years,
            force_reprocess=args.force,
        )
        report["steps"]["bronze_despesas"] = {"ok": ok, "elapsed_s": elapsed}
        if not ok:
            log.error("Pipeline abortado na etapa Bronze Despesas.")
            _print_report(report, time.perf_counter() - total_start)
            sys.exit(1)

        # ── STEP 2: Bronze Receitas ────────────────────────────────────────────
        ok, elapsed = run_step(
            "BRONZE Receitas TCE",
            "receitas",
            years=years,
            force_reprocess=args.force,
        )
        report["steps"]["bronze_receitas"] = {"ok": ok, "elapsed_s": elapsed}
        if not ok:
            log.error("Pipeline abortado na etapa Bronze Receitas.")
            _print_report(report, time.perf_counter() - total_start)
            sys.exit(1)

    # ── STEP 3: Silver Despesas ────────────────────────────────────────────────
    if not args.skip_silver:
        ok, elapsed = run_step(
            "SILVER Despesas TCE",
            "silver_despesas",
            years=years,
            force_reprocess=silver_force,
        )
        report["steps"]["silver_despesas"] = {"ok": ok, "elapsed_s": elapsed}
        if not ok:
            log.error("Pipeline abortado na etapa Silver Despesas.")
            _print_report(report, time.perf_counter() - total_start)
            sys.exit(1)

        # ── STEP 4: Silver Receitas ────────────────────────────────────────────
        ok, elapsed = run_step(
            "SILVER Receitas TCE",
            "silver_receitas",
            years=years,
            force_reprocess=silver_force,
        )
        report["steps"]["silver_receitas"] = {"ok": ok, "elapsed_s": elapsed}
        if not ok:
            log.error("Pipeline abortado na etapa Silver Receitas.")
            _print_report(report, time.perf_counter() - total_start)
            sys.exit(1)

    # ── STEP 5: Gold Financeiro ────────────────────────────────────────────────
    if not args.skip_gold:
        ok, elapsed = run_step(
            "GOLD Financeiro TCE",
            "gold_financeiro",
            force_reprocess=args.force,
        )
        report["steps"]["gold_financeiro"] = {"ok": ok, "elapsed_s": elapsed}
        if not ok:
            log.error("Pipeline abortado na etapa Gold Financeiro.")
            _print_report(report, time.perf_counter() - total_start)
            sys.exit(1)

    # ── STEP 6: Upload Supabase ────────────────────────────────────────────────
    if not args.skip_upload:
        ok, elapsed = run_step(
            "UPLOAD Executivo Supabase",
            "upload_exec_cloud",
            dry_run=args.dry_run,
        )
        report["steps"]["upload_exec"] = {"ok": ok, "elapsed_s": elapsed}
        if not ok:
            log.error("Upload Supabase falhou (pipeline Bronze/Silver/Gold foram concluídos).")
            _print_report(report, time.perf_counter() - total_start)
            sys.exit(1)

    _print_report(report, time.perf_counter() - total_start)
    log.info("Pipeline incremental finalizado com sucesso.")


def _print_report(report: dict, total_elapsed: float) -> None:
    log.info("=" * 50)
    log.info("RELATÓRIO DE EXECUÇÃO")
    log.info("=" * 50)
    log.info(f"Início:       {report['started_at']}")
    log.info(f"Anos:         {report['years']}")
    log.info(f"Tempo total:  {round(total_elapsed, 2)}s")
    log.info("")
    for step, result in report.get("steps", {}).items():
        status = "OK" if result["ok"] else "FALHOU"
        log.info(f"  {step:<30} {status:<10} {result['elapsed_s']}s")


if __name__ == "__main__":
    main()
