from __future__ import annotations

import argparse
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path


PIPELINE_ROOT = Path(__file__).resolve().parents[1]

DEFAULT_DATASETS = [
    "despesas",
    "receitas",
    "silver_despesas",
    "silver_receitas",
    "gold_financeiro",
    "gold_indicadores",
    "ibge_localidades",
    "ibge_sidra_demografia",
    "tse_open_data",
    "pncp_contratacoes",
    "siconfi_fiscal",
    "tcesp_exports",
    "tcesp_iegm_igov_regional",
]


def log(message: str) -> None:
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{stamp}] {message}", flush=True)


def run_cmd(args: list[str]) -> int:
    log(f"Executando: {' '.join(args)}")
    result = subprocess.run(args, cwd=str(PIPELINE_ROOT), check=False)
    if result.returncode == 0:
        log("OK")
    else:
        log(f"ERRO (code={result.returncode})")
    return result.returncode


def run_cycle(datasets: list[str]) -> bool:
    failed = False

    for dataset in datasets:
        code = run_cmd([sys.executable, "-m", "src.main", "--dataset", dataset])
        if code != 0:
            failed = True

    export_code = run_cmd([sys.executable, "scripts/export_dashboard_sources.py"])
    if export_code != 0:
        failed = True

    return not failed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Executa o pipeline completo e repete automaticamente por intervalo."
    )
    parser.add_argument(
        "--interval-hours",
        type=float,
        default=5.0,
        help="Intervalo entre ciclos completos (padrao: 5 horas).",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Executa um ciclo unico e encerra.",
    )
    parser.add_argument(
        "--datasets",
        nargs="+",
        default=DEFAULT_DATASETS,
        help="Lista de datasets do src.main para executar em cada ciclo.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    interval_seconds = max(300, int(args.interval_hours * 3600))

    log("Iniciando runner operacional de pipeline.")
    log(f"Datasets: {', '.join(args.datasets)}")
    log(f"Intervalo: {args.interval_hours}h")

    cycle = 1
    while True:
        log(f"===== CICLO {cycle} INICIO =====")
        ok = run_cycle(args.datasets)
        log(f"===== CICLO {cycle} {'SUCESSO' if ok else 'COM FALHAS'} =====")

        if args.once:
            break

        log(f"Aguardando {interval_seconds // 3600}h para o proximo ciclo.")
        time.sleep(interval_seconds)
        cycle += 1


if __name__ == "__main__":
    main()
