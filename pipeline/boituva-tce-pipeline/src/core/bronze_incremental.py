"""
Coleta incremental Bronze TCE — reutilizada por despesas e receitas.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Callable

import pandas as pd

from src.core.metadata import build_bronze_year_metadata, save_metadata
from src.core.month_freshness import (
    assess_bronze_year,
    covered_months,
    expected_months_for_year,
    load_meta,
    missing_months,
)
from src.core.schema import (
    BRONZE_SCHEMA_VERSION,
    PIPELINE_VERSION,
    apply_column_aliases,
)
from src.core.storage import ensure_dir, save_json
from src.core.validations import validate_schema_contract


def should_skip_bronze_year(
    *,
    ano: int,
    csv_path: str,
    meta_path: str,
    dataset: str,
    force_reprocess: bool,
    is_year_metadata_ok: Callable[..., bool],
) -> bool:
    if force_reprocess:
        print(f"[FORCE] Reprocessando ano {ano}")
        return False

    if not is_year_metadata_ok(
        csv_path=csv_path,
        meta_path=meta_path,
        schema_version=BRONZE_SCHEMA_VERSION,
        pipeline_version=PIPELINE_VERSION,
    ):
        return False

    assessment = assess_bronze_year(
        dataset=dataset,
        ano=ano,
        meta_path=meta_path,
        force_reprocess=False,
    )
    if assessment["needs_refresh"]:
        print(
            f"[REFRESH] Ano {ano} incompleto — faltam meses: "
            f"{', '.join(f'{m:02d}' for m in assessment['missing_months'])}"
        )
        return False

    print(f"[SKIP] Ano {ano} atualizado até o mês corrente.")
    return True


def collect_bronze_year_incremental(
    *,
    ano: int,
    force_reprocess: bool,
    endpoint: str,
    municipio: str,
    dataset: str,
    camada: str,
    fonte: str,
    csv_path: str,
    meta_path: str,
    raw_json_path_fn: Callable[[int, int], str],
    column_aliases: dict[str, str],
    required_columns: list[str],
    fetch_fn: Callable[..., dict[str, Any]],
    is_year_metadata_ok: Callable[..., bool],
) -> str | None:
    if should_skip_bronze_year(
        ano=ano,
        csv_path=csv_path,
        meta_path=meta_path,
        dataset=dataset,
        force_reprocess=force_reprocess,
        is_year_metadata_ok=is_year_metadata_ok,
    ):
        return csv_path

    months_to_fetch = list(range(1, 13)) if force_reprocess else missing_months(meta_path, ano)
    if not months_to_fetch:
        print(f"[SKIP] Nenhum mês pendente para {endpoint} {ano}.")
        return csv_path if Path(csv_path).exists() else None

    print(f"\n========== PROCESSANDO {endpoint.upper()} ANO {ano} ==========")
    print(f"[INFO] Meses a buscar: {', '.join(f'{m:02d}' for m in months_to_fetch)}")

    existing_meta = load_meta(meta_path) or {}

    existing_df: pd.DataFrame | None = None
    if Path(csv_path).exists() and not force_reprocess:
        existing_df = pd.read_csv(csv_path)
        if "mes_num" in existing_df.columns:
            existing_df = existing_df[~existing_df["mes_num"].isin(months_to_fetch)].copy()

    year_frames: list[pd.DataFrame] = []
    meses_com_dados = [int(m) for m in (existing_meta.get("meses_com_dados") or []) if int(m) not in months_to_fetch]
    meses_vazios = [int(m) for m in (existing_meta.get("meses_vazios") or []) if int(m) not in months_to_fetch]
    meses_com_erro = [int(m) for m in (existing_meta.get("meses_com_erro") or []) if int(m) not in months_to_fetch]
    aliases_aplicados: dict[str, str] = {}

    for mes in months_to_fetch:
        print(f"[COLETA] {endpoint} | {municipio} | {ano}/{mes:02d}")

        result = fetch_fn(
            endpoint=endpoint,
            municipio=municipio,
            ano=ano,
            mes=mes,
        )

        status = result["status"]
        data = result["data"]

        if status == "error":
            print(f"[ERRO] {ano}/{mes:02d} -> {result['error_message']}")
            meses_com_erro.append(mes)
            continue

        if status == "empty":
            print(f"[INFO] {ano}/{mes:02d} sem dados.")
            meses_vazios.append(mes)
            continue

        save_json(data, raw_json_path_fn(ano, mes))

        df = pd.DataFrame(data)
        df["ano"] = ano
        df["mes_num"] = mes
        df, aliases_aplicados = apply_column_aliases(df, column_aliases)

        year_frames.append(df)
        meses_com_dados.append(mes)

    frames: list[pd.DataFrame] = []
    if existing_df is not None and len(existing_df):
        frames.append(existing_df)
    frames.extend(year_frames)

    if not frames:
        print(f"[INFO] Nenhum dado encontrado para o ano {ano}.")
        return None

    year_df = pd.concat(frames, ignore_index=True)

    validation_summary = validate_schema_contract(
        year_df,
        required_columns,
        aliases_aplicados=aliases_aplicados,
    )

    ensure_dir(str(Path(csv_path).parent))
    year_df.to_csv(csv_path, index=False, encoding="utf-8-sig")

    year_meta = build_bronze_year_metadata(
        dataset=dataset,
        camada=camada,
        fonte=fonte,
        municipio=municipio,
        ano=ano,
        df=year_df,
        meses_esperados=list(range(1, 13)),
        meses_com_dados=sorted(set(meses_com_dados)),
        meses_vazios=sorted(set(meses_vazios)),
        meses_com_erro=sorted(set(meses_com_erro)),
        arquivo_saida=csv_path,
        validation_summary=validation_summary,
        schema_version=BRONZE_SCHEMA_VERSION,
        pipeline_version=PIPELINE_VERSION,
    )
    save_metadata(year_meta, meta_path)

    still_missing = missing_months(meta_path, ano)
    if still_missing:
        print(f"[WARN] Após coleta, ainda faltam meses esperados: {', '.join(f'{m:02d}' for m in still_missing)}")

    print(f"[OK] Bronze anual salvo em: {csv_path}")
    print(f"[OK] Registros do ano {ano}: {len(year_df)}")
    return csv_path
