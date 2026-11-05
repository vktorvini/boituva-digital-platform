"""
Entrypoint CLI da Boituva Digital Platform.
Usa o registry de pipelines para dispatching — sem elif encadeados.
"""
from __future__ import annotations

import argparse
import sys
from typing import Optional

from src.core.logger import get_logger
from src.pipelines import registry

log = get_logger("main")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pipeline de dados públicos — Boituva Digital Platform"
    )
    parser.add_argument(
        "--dataset",
        choices=registry.list_datasets(),
        default="ambos",
        help="Pipeline a executar",
    )
    parser.add_argument("--force", action="store_true", help="Força reprocessamento")
    parser.add_argument("--dry-run", action="store_true", help="Simula sem gravar no banco")
    parser.add_argument("--years", nargs="+", type=int, help="Anos a processar (ex: 2023 2024)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    log.info(
        "Pipeline iniciado",
        extra={
            "dataset": args.dataset,
            "force": args.force,
            "dry_run": args.dry_run,
            "years": args.years,
        },
    )

    runner = registry.get(args.dataset)
    if runner is None:
        log.error("Dataset desconhecido", extra={"dataset": args.dataset})
        sys.exit(1)

    try:
        runner(
            years=args.years,
            force_reprocess=args.force,
            dry_run=args.dry_run,
        )
        log.info("Pipeline finalizado com sucesso", extra={"dataset": args.dataset})
    except Exception as e:
        log.error("Pipeline falhou", extra={"dataset": args.dataset, "error": str(e)})
        raise


if __name__ == "__main__":
    main()
