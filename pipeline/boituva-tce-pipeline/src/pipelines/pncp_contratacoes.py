from __future__ import annotations

import pandas as pd

from src.collectors.pncp import PNCPClient
from src.core.metadata import save_metadata, utc_now_iso
from src.core.storage import ensure_dir, save_json


def run_pncp_contratacoes(
    data_inicial: str = "20250101",
    data_final: str = "20251231",
    codigo_modalidade_contratacao: int = 1,
) -> None:
    client = PNCPClient()

    endpoints = [
        (
            "contratos",
            client.contratos(
                data_inicial=data_inicial,
                data_final=data_final,
                pagina=1,
                tamanho_pagina=50,
            ),
        ),
        (
            "contratacoes_publicacao",
            client.contratacoes_publicacao(
                data_inicial=data_inicial,
                data_final=data_final,
                codigo_modalidade_contratacao=codigo_modalidade_contratacao,
                pagina=1,
                tamanho_pagina=50,
            ),
        ),
    ]

    bronze_rows: list[dict[str, object]] = []
    for dataset_key, result in endpoints:
        raw_path = f"data/raw/pncp/{dataset_key}/{data_inicial}_{data_final}.json"
        save_json(result, raw_path)

        payload = result.get("data")
        if result["status"] == "error":
            print(f"[ERRO] PNCP {dataset_key}: {result['error_message']}")
            continue

        items = payload.get("data") if isinstance(payload, dict) else payload
        if not isinstance(items, list):
            continue

        for item in items:
            bronze_rows.append(
                {
                    "dataset_key": dataset_key,
                    "numero_controle_pncp": item.get("numeroControlePNCP"),
                    "orgao_entidade": item.get("orgaoEntidade", {}).get("razaoSocial")
                    if isinstance(item.get("orgaoEntidade"), dict)
                    else None,
                    "municipio_nome": item.get("unidadeOrgao", {}).get("municipioNome")
                    if isinstance(item.get("unidadeOrgao"), dict)
                    else None,
                    "uf_sigla": item.get("unidadeOrgao", {}).get("ufSigla")
                    if isinstance(item.get("unidadeOrgao"), dict)
                    else None,
                    "valor_total": item.get("valorTotalEstimado") or item.get("valorInicial"),
                    "data_inclusao": item.get("dataInclusao"),
                }
            )

    ensure_dir("data/bronze/pncp")
    bronze_df = pd.DataFrame(bronze_rows)
    bronze_path = "data/bronze/pncp/pncp_contratacoes.csv"
    bronze_df.to_csv(bronze_path, index=False, encoding="utf-8-sig")

    silver_df = bronze_df.copy()
    silver_df["valor_total_num"] = pd.to_numeric(silver_df["valor_total"], errors="coerce")
    ensure_dir("data/silver/pncp")
    silver_path = "data/silver/pncp/pncp_contratacoes.csv"
    silver_df.to_csv(silver_path, index=False, encoding="utf-8-sig")

    gold_df = (
        silver_df.groupby("dataset_key", dropna=False, as_index=False)
        .agg(registros=("numero_controle_pncp", "count"), valor_total=("valor_total_num", "sum"))
    )
    ensure_dir("data/gold/pncp")
    gold_path = "data/gold/pncp/pncp_contratacoes_summary.parquet"
    gold_df.to_parquet(gold_path, index=False)

    save_metadata(
        {
            "dataset": "pncp_contratacoes",
            "fonte": "pncp",
            "camada": "gold",
            "data_execucao_utc": utc_now_iso(),
            "arquivo_saida": gold_path,
            "arquivos_intermediarios": [bronze_path, silver_path],
            "registros_totais": int(len(gold_df)),
            "status": "OK" if len(gold_df) > 0 else "SEM_DADOS",
            "observacao": "O PNCP responde com exigencias de filtros e pode variar entre 400/500 conforme a combinacao consultada.",
        },
        "data/gold/pncp/pncp_contratacoes_summary__meta.json",
    )
    print(f"[OK] PNCP resumo salvo em: {gold_path}")
