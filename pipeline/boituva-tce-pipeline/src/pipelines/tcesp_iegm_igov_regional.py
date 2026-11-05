from __future__ import annotations

from dataclasses import dataclass, asdict

import pandas as pd

from src.core.metadata import save_metadata, utc_now_iso
from src.core.storage import ensure_dir


@dataclass(frozen=True)
class RegionalRow:
    municipio: str
    populacao: int
    porte: str
    iegm_2021: str | None
    iegm_2022: str | None
    iegm_2023: str | None
    iegm_2024: str | None
    iegm_2025: str | None
    igovti_2021: str | None
    igovti_2022: str | None
    igovti_2023: str | None
    igovti_2024: str | None
    igovti_2025: str | None
    termometro_igovti: int | None
    servicos_online: int | None
    total_servicos: int | None
    tem_area_ti: bool | None
    tem_lgpd: bool | None
    tem_govbr: bool | None
    tem_lei_gov_digital: bool | None


LEGACY_REGIONAL_ROWS: list[RegionalRow] = [
    RegionalRow("Boituva", 62000, "Medio", "C+", "C", "C+", "C+", "C+", "C+", "C", "C+", "C+", "C+", 20, 13, 16, True, False, False, False),
    RegionalRow("Cerquilho", 47000, "Medio", "B", "C+", "C+", "B", "B", "A", "A", "A", "A", "A", 26, 16, 16, True, None, None, None),
    RegionalRow("Ipero", 28000, "Pequeno", "C+", "C", "C+", "C+", "B", "B", "C+", "B+", "B+", "B+", 18, 10, 16, None, None, None, None),
    RegionalRow("Porto Feliz", 52000, "Medio", None, None, None, None, None, None, None, None, None, None, 19, 13, 16, None, None, None, None),
    RegionalRow("Tatui", 118000, "Medio", "C+", "C+", "C+", "C+", "C", "B+", "B", "B+", "B+", "B+", 23, 16, 16, None, None, None, None),
    RegionalRow("Capela do Alto", 18000, "Pequeno", "C", "C+", "C+", "C+", "C+", "C+", "C+", "B", "B", "B", 18, 13, 16, None, None, None, None),
    RegionalRow("Cesario Lange", 18000, "Pequeno", "B", "B", "B", "B", "B", "A", "A", "A", "A", "A", 21, 14, 16, None, None, None, None),
    RegionalRow("Sorocaba", 723682, "Grande", "C+", "C", "C+", "C+", "C+", "B+", "B+", "B+", "B+", "A", 27, 15, 16, None, None, None, None),
    RegionalRow("Aguas de Santa Barbara", 18000, "Pequeno", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", 13, 9, 16, None, None, None, None),
]

GRADE_SCALE = {"A": 5, "B+": 4, "B": 3, "C+": 2, "C": 1}


def run_tcesp_iegm_igov_regional() -> None:
    print("[TCESP-IEGM] Montando base comparativa regional (Sorocaba).")

    raw_rows = [asdict(row) for row in LEGACY_REGIONAL_ROWS]
    silver_df = pd.DataFrame(raw_rows)

    grade_cols = [
        "iegm_2021",
        "iegm_2022",
        "iegm_2023",
        "iegm_2024",
        "iegm_2025",
        "igovti_2021",
        "igovti_2022",
        "igovti_2023",
        "igovti_2024",
        "igovti_2025",
    ]
    for col in grade_cols:
        silver_df[f"{col}_num"] = silver_df[col].map(GRADE_SCALE)

    silver_df["is_boituva"] = silver_df["municipio"].eq("Boituva")
    silver_df["pct_servicos_online"] = (
        (silver_df["servicos_online"] / silver_df["total_servicos"]) * 100
    ).round(1)

    silver_dir = "data/silver/tcesp/iegm_igov_regional"
    ensure_dir(silver_dir)
    silver_path = f"{silver_dir}/tcesp_iegm_igov_regional.csv"
    silver_df.to_csv(silver_path, index=False, encoding="utf-8-sig")

    gold_df = silver_df.copy()
    gold_dir = "data/gold/tcesp/iegm_igov_regional"
    ensure_dir(gold_dir)
    gold_path = f"{gold_dir}/tcesp_iegm_igov_regional.parquet"
    gold_df.to_parquet(gold_path, index=False)

    save_metadata(
        {
            "dataset": "tcesp_iegm_igov_regional",
            "fonte": "tcesp_manual_regional",
            "camada": "gold",
            "data_execucao_utc": utc_now_iso(),
            "arquivo_saida": gold_path,
            "arquivos_intermediarios": [silver_path],
            "registros_totais": int(len(gold_df)),
            "status": "OK" if len(gold_df) > 0 else "SEM_DADOS",
            "referencia_origem": "Projetos Anteriores/Boituva_2/analise_iegm_sorocaba.ipynb",
            "nota": "Base historica consolidada para comparativos regionais no app.",
        },
        "data/gold/tcesp/iegm_igov_regional/tcesp_iegm_igov_regional__meta.json",
    )
    print(f"[OK] Base regional IEGM/i-Gov TI salva em: {gold_path}")
