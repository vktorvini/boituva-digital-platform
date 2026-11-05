from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd
from pandas.errors import EmptyDataError


PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PIPELINE_ROOT.parents[1]
DASHBOARD_DATA_DIR = REPO_ROOT / "apps" / "dashboard" / "public" / "data" / "sources"


def to_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []
    cleaned = df.astype(object).where(pd.notnull(df), None)
    return cleaned.to_dict(orient="records")


def write_json(name: str, payload: dict[str, Any]) -> None:
    DASHBOARD_DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DASHBOARD_DATA_DIR / name
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")
    print(f"[OK] {path}")


def export_tse() -> None:
    path = PIPELINE_ROOT / "data" / "gold" / "tse" / "catalog" / "tse_catalog_resources_summary.parquet"
    if not path.exists():
        write_json("tse.json", {"status": "missing", "rows": []})
        return

    df = pd.read_parquet(path)
    total_packages = int(df["packages"].sum()) if "packages" in df.columns else 0
    total_resources = int(df["resources"].sum()) if "resources" in df.columns else 0
    write_json(
        "tse.json",
        {
            "status": "ok",
            "summary": {
                "datasets": int(len(df)),
                "packages": total_packages,
                "resources": total_resources,
            },
            "rows": to_records(df),
        },
    )


def export_sidra() -> None:
    path = PIPELINE_ROOT / "data" / "gold" / "ibge" / "sidra" / "ibge_sidra_demografia.parquet"
    if not path.exists():
        write_json("sidra.json", {"status": "missing", "rows": []})
        return

    df = pd.read_parquet(path)
    summary = (
        df.groupby(["indicador_id"], dropna=False, as_index=False)
        .agg(
            registros=("indicador_id", "count"),
            media_valor=("valor_numerico", "mean"),
        )
        .sort_values("indicador_id")
    )
    write_json(
        "sidra.json",
        {
            "status": "ok",
            "summary": {
                "rows": int(len(df)),
                "indicadores": int(summary["indicador_id"].nunique()) if not summary.empty else 0,
            },
            "rows": to_records(df),
            "grouped": to_records(summary),
        },
    )


def export_pncp() -> None:
    summary_path = PIPELINE_ROOT / "data" / "gold" / "pncp" / "pncp_contratacoes_summary.parquet"
    detail_path = PIPELINE_ROOT / "data" / "silver" / "pncp" / "pncp_contratacoes.csv"
    if not summary_path.exists():
        write_json("pncp.json", {"status": "missing", "rows": []})
        return

    summary_df = pd.read_parquet(summary_path)
    if detail_path.exists():
        try:
            detail_df = pd.read_csv(detail_path)
        except EmptyDataError:
            detail_df = pd.DataFrame()
    else:
        detail_df = pd.DataFrame()
    write_json(
        "pncp.json",
        {
            "status": "ok",
            "summary": {
                "datasets": int(len(summary_df)),
                "registros": int(summary_df["registros"].sum()) if "registros" in summary_df.columns else 0,
                "valor_total": float(summary_df["valor_total"].sum()) if "valor_total" in summary_df.columns else 0.0,
            },
            "rows": to_records(summary_df),
            "detail": to_records(detail_df.head(200)),
        },
    )


def export_siconfi() -> None:
    summary_path = (
        PIPELINE_ROOT
        / "data"
        / "gold"
        / "siconfi"
        / "msc_orcamentaria"
        / "siconfi_msc_orcamentaria_summary.parquet"
    )
    detail_path = (
        PIPELINE_ROOT
        / "data"
        / "silver"
        / "siconfi"
        / "msc_orcamentaria"
        / "siconfi_msc_orcamentaria.csv"
    )
    if not summary_path.exists():
        write_json("siconfi.json", {"status": "missing", "rows": []})
        return

    summary_df = pd.read_parquet(summary_path)
    if detail_path.exists():
        try:
            detail_df = pd.read_csv(detail_path)
        except EmptyDataError:
            detail_df = pd.DataFrame()
    else:
        detail_df = pd.DataFrame()
    write_json(
        "siconfi.json",
        {
            "status": "ok",
            "summary": to_records(summary_df),
            "detail": to_records(detail_df.head(200)),
        },
    )


def export_tcesp() -> None:
    summary_path = PIPELINE_ROOT / "data" / "gold" / "tcesp" / "exports" / "tcesp_exports_summary.parquet"
    regional_path = (
        PIPELINE_ROOT / "data" / "gold" / "tcesp" / "iegm_igov_regional" / "tcesp_iegm_igov_regional.parquet"
    )
    if not summary_path.exists():
        write_json("tcesp.json", {"status": "missing", "rows": []})
        return

    df = pd.read_parquet(summary_path)
    ok_rows = int((df["status"] == "ok").sum()) if "status" in df.columns else 0

    regional_payload: dict[str, Any] = {"status": "missing", "rows": [], "axes": []}
    if regional_path.exists():
        regional_df = pd.read_parquet(regional_path)
        boituva = regional_df[regional_df["municipio"] == "Boituva"]

        axis_config: list[tuple[str, str]] = [
            ("IEGM 2025", "iegm_2025_num"),
            ("i-Gov TI 2025", "igovti_2025_num"),
            ("% Servicos Online", "pct_servicos_online"),
            ("Termometro i-Gov TI", "termometro_igovti"),
        ]

        axes: list[dict[str, Any]] = []
        for axis_name, col in axis_config:
            valid = regional_df[regional_df[col].notna()].copy()
            if valid.empty:
                continue

            benchmark = valid.sort_values(col, ascending=False).iloc[0]
            regional_avg = float(valid[col].mean())
            boituva_value = float(boituva[col].iloc[0]) if not boituva.empty and pd.notna(boituva[col].iloc[0]) else None
            gap_to_avg = (boituva_value - regional_avg) if boituva_value is not None else None

            axes.append(
                {
                    "axis": axis_name,
                    "boituva_value": boituva_value,
                    "regional_average": round(regional_avg, 2),
                    "benchmark_municipio": str(benchmark["municipio"]),
                    "benchmark_value": float(benchmark[col]),
                    "gap_to_regional_average": round(gap_to_avg, 2) if gap_to_avg is not None else None,
                }
            )

        regional_payload = {
            "status": "ok",
            "summary": {
                "municipios": int(len(regional_df)),
                "com_nota_iegm_2025": int(regional_df["iegm_2025_num"].notna().sum()),
                "com_nota_igovti_2025": int(regional_df["igovti_2025_num"].notna().sum()),
            },
            "rows": to_records(regional_df),
            "axes": axes,
        }

    write_json(
        "tcesp.json",
        {
            "status": "ok",
            "summary": {
                "exports": int(len(df)),
                "sucesso": ok_rows,
            },
            "rows": to_records(df),
            "regional": regional_payload,
        },
    )


def main() -> None:
    export_tse()
    export_sidra()
    export_pncp()
    export_siconfi()
    export_tcesp()
    print("[OK] Export de fontes para dashboard concluido.")


if __name__ == "__main__":
    main()
