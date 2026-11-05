"""
Registry de pipelines da Boituva Digital Platform.
Substitui o bloco de 14+ elif em main.py por um dicionário simples.

Para adicionar um novo pipeline:
  1. Importe a função run_* aqui
  2. Adicione uma entrada no REGISTRY

Nada mais precisa ser alterado.
"""
from __future__ import annotations

from typing import Callable

from src.pipelines.despesas_tce import run_despesas_tce
from src.pipelines.gold_financeiro_tce import run_gold_financeiro_tce
from src.pipelines.gold_indicadores_tce import run_gold_indicadores_tce
from src.pipelines.ibge_localidades import run_ibge_localidades
from src.pipelines.ibge_sidra_demografia import run_ibge_sidra_demografia
from src.pipelines.pncp_contratacoes import run_pncp_contratacoes
from src.pipelines.receitas_tce import run_receitas_tce
from src.pipelines.siconfi_fiscal import run_siconfi_fiscal
from src.pipelines.silver_despesas_tce import run_silver_despesas_tce
from src.pipelines.silver_receitas_tce import run_silver_receitas_tce
from src.pipelines.tcesp_exports import run_tcesp_exports
from src.pipelines.tcesp_iegm_igov_regional import run_tcesp_iegm_igov_regional
from src.pipelines.tse_open_data import run_tse_open_data
from src.pipelines.upload_exec_to_cloud import run_upload_exec_cloud
from src.pipelines.upload_gold_to_cloud import upload_all_gold_data


def _run_ambos(years=None, force_reprocess=False, **_):
    run_despesas_tce(years=years, force_reprocess=force_reprocess)
    run_receitas_tce(years=years, force_reprocess=force_reprocess)


# ── registry principal ─────────────────────────────────────────────────────────
# Cada valor é um callable com assinatura compatível com os args do CLI:
#   fn(years=..., force_reprocess=..., dry_run=...)
# Use **kwargs nas funções que não aceitam todos os parâmetros.

REGISTRY: dict[str, Callable] = {
    "despesas":               lambda years=None, force_reprocess=False, **_: run_despesas_tce(years=years, force_reprocess=force_reprocess),
    "receitas":               lambda years=None, force_reprocess=False, **_: run_receitas_tce(years=years, force_reprocess=force_reprocess),
    "ambos":                  _run_ambos,
    "silver_despesas":        lambda years=None, force_reprocess=False, **_: run_silver_despesas_tce(years=years, force_reprocess=force_reprocess),
    "silver_receitas":        lambda years=None, force_reprocess=False, **_: run_silver_receitas_tce(years=years, force_reprocess=force_reprocess),
    "gold_financeiro":        lambda force_reprocess=False, **_: run_gold_financeiro_tce(force_reprocess=force_reprocess),
    "gold_indicadores":       lambda force_reprocess=False, **_: run_gold_indicadores_tce(force_reprocess=force_reprocess),
    "ibge_localidades":       lambda force_reprocess=False, **_: run_ibge_localidades(force_reprocess=force_reprocess),
    "ibge_sidra_demografia":  lambda **_: run_ibge_sidra_demografia(),
    "tse_open_data":          lambda force_reprocess=False, **_: run_tse_open_data(download_resources=force_reprocess),
    "pncp_contratacoes":      lambda **_: run_pncp_contratacoes(),
    "siconfi_fiscal":         lambda **_: run_siconfi_fiscal(),
    "tcesp_exports":          lambda **_: run_tcesp_exports(),
    "tcesp_iegm_igov_regional": lambda **_: run_tcesp_iegm_igov_regional(),
    "upload_cloud":           lambda **_: upload_all_gold_data(),
    "upload_exec_cloud":      lambda dry_run=False, **_: run_upload_exec_cloud(dry_run=dry_run),
}


def get(name: str) -> Callable | None:
    return REGISTRY.get(name)


def list_datasets() -> list[str]:
    return sorted(REGISTRY.keys())
