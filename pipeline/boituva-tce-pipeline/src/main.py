import argparse
from typing import Optional

from src.pipelines.despesas_tce import run_despesas_tce
from src.pipelines.receitas_tce import run_receitas_tce
from src.pipelines.silver_despesas_tce import run_silver_despesas_tce
from src.pipelines.silver_receitas_tce import run_silver_receitas_tce
from src.pipelines.gold_financeiro_tce import run_gold_financeiro_tce
from src.pipelines.gold_indicadores_tce import run_gold_indicadores_tce
from src.pipelines.upload_gold_to_cloud import upload_all_gold_data


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pipeline de ingestão e transformação de dados públicos de Boituva"
    )

    parser.add_argument(
        "--dataset",
        choices=[
            "despesas",
            "receitas",
            "ambos",
            "silver_despesas",
            "silver_receitas",
            "gold_financeiro",
            "gold_indicadores",
            "upload_cloud",
        ],
        default="ambos",
        help="Escolhe qual pipeline executar",
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Força reprocessamento",
    )

    parser.add_argument(
        "--years",
        nargs="+",
        type=int,
        help="Lista de anos específicos para processar. Ex: --years 2023 2024",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_args()

    dataset: str = args.dataset
    force_reprocess: bool = args.force
    years: Optional[list[int]] = args.years

    print("\n===== MAIN =====")
    print("Dataset:", dataset)
    print("Force:", force_reprocess)
    print("Years:", years if years else "todos do pipeline")

    if dataset == "despesas":
        run_despesas_tce(years=years, force_reprocess=force_reprocess)

    elif dataset == "receitas":
        run_receitas_tce(years=years, force_reprocess=force_reprocess)

    elif dataset == "ambos":
        run_despesas_tce(years=years, force_reprocess=force_reprocess)
        run_receitas_tce(years=years, force_reprocess=force_reprocess)

    elif dataset == "silver_despesas":
        run_silver_despesas_tce(years=years, force_reprocess=force_reprocess)

    elif dataset == "silver_receitas":
        run_silver_receitas_tce(years=years, force_reprocess=force_reprocess)

    elif dataset == "gold_financeiro":
        run_gold_financeiro_tce(force_reprocess=force_reprocess)

    elif dataset == "gold_indicadores":
        run_gold_indicadores_tce(force_reprocess=force_reprocess)

    elif dataset == "upload_cloud":
        upload_all_gold_data()

if __name__ == "__main__":
    main()