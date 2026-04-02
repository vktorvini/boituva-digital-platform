from __future__ import annotations

import hashlib
import html
import re
from typing import List, Optional, Any

import pandas as pd

from src.core.metadata import save_metadata
from src.core.schema import PIPELINE_VERSION
from src.core.storage import ensure_dir, file_exists


MUNICIPIO = "boituva"
FONTE = "tce_sp"
CAMADA = "silver"
DATASET = "despesas_boituva"

SILVER_SCHEMA_VERSION = "1.0.0"
DEFAULT_ANOS = list(range(2014, 2026))


def get_bronze_year_csv_path(ano: int) -> str:
    return f"data/bronze/tce/despesas/{ano}/despesas_boituva_{ano}.csv"


def get_silver_year_dir(ano: int) -> str:
    return f"data/silver/tce/despesas/{ano}"


def get_silver_year_parquet_path(ano: int) -> str:
    return f"{get_silver_year_dir(ano)}/despesas_boituva_{ano}.parquet"


def get_silver_year_meta_path(ano: int) -> str:
    return f"{get_silver_year_dir(ano)}/despesas_boituva_{ano}__meta.json"


def get_silver_consolidated_dir() -> str:
    return "data/silver/tce/despesas/consolidated"


def get_silver_consolidated_parquet_path() -> str:
    return f"{get_silver_consolidated_dir()}/despesas_boituva_full.parquet"


def get_silver_consolidated_meta_path() -> str:
    return f"{get_silver_consolidated_dir()}/despesas_boituva_full__meta.json"


def normalize_text(value: Any) -> str:
    if pd.isna(value):
        return ""
    text = str(value)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text.strip())
    return text


def normalize_text_upper(value: Any) -> str:
    return normalize_text(value).upper()


def parse_brl_number(value: Any) -> float | None:
    if pd.isna(value):
        return None

    text = normalize_text(value)

    if text == "":
        return None

    text = text.replace(".", "").replace(",", ".")

    try:
        return float(text)
    except ValueError:
        return None


def parse_date_br(value: Any) -> pd.Timestamp | pd.NaT:
    if pd.isna(value):
        return pd.NaT

    text = normalize_text(value)

    if text == "":
        return pd.NaT

    return pd.to_datetime(text, format="%d/%m/%Y", errors="coerce")


def parse_fornecedor_id(raw_value: Any) -> tuple[str, str, bool]:
    """
    Retorna:
    - tipo: CPF | CNPJ | ESPECIAL | UNKNOWN
    - numero: apenas dígitos
    - valido: bool
    """
    text = normalize_text_upper(raw_value)
    digits = re.sub(r"\D", "", text)

    if "CNPJ" in text:
        return "CNPJ", digits, len(digits) == 14

    if "CPF" in text and "SEM CPF/CNPJ" not in text:
        return "CPF", digits, len(digits) == 11

    if "IDENTIFICA" in text or "SEM CPF/CNPJ" in text or "ESPECIAL" in text:
        return "ESPECIAL", digits, len(digits) > 0

    return "UNKNOWN", digits, len(digits) > 0


def build_chave_despesa(row: pd.Series) -> str:
    base = "||".join(
        [
            str(row.get("ano", "")),
            str(row.get("mes_num", "")),
            str(row.get("orgao_norm", "")),
            str(row.get("evento_norm", "")),
            str(row.get("nr_empenho_norm", "")),
            str(row.get("id_fornecedor_numero", "")),
            str(row.get("dt_emissao_despesa", "")),
            str(row.get("vl_despesa", "")),
        ]
    )
    return hashlib.sha1(base.encode("utf-8")).hexdigest()


def transform_silver(df_bronze: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    df = df_bronze.copy()

    registros_entrada = len(df)

    # preservar bruto
    df["id_fornecedor_raw"] = df["id_fornecedor"]
    df["dt_emissao_despesa_raw"] = df["dt_emissao_despesa"]
    df["vl_despesa_raw"] = df["vl_despesa"]

    # normalizações de texto
    df["orgao"] = df["orgao"].map(normalize_text)
    df["evento"] = df["evento"].map(normalize_text)
    df["nr_empenho"] = df["nr_empenho"].map(normalize_text)
    df["nm_fornecedor"] = df["nm_fornecedor"].map(normalize_text)

    df["orgao_norm"] = df["orgao"].map(normalize_text_upper)
    df["evento_norm"] = df["evento"].map(normalize_text_upper)
    df["nr_empenho_norm"] = df["nr_empenho"].map(normalize_text_upper)
    df["nm_fornecedor_norm"] = df["nm_fornecedor"].map(normalize_text_upper)

    # fornecedor
    fornecedor_parsed = df["id_fornecedor_raw"].apply(parse_fornecedor_id)
    df["id_fornecedor_tipo"] = fornecedor_parsed.map(lambda x: x[0])
    df["id_fornecedor_numero"] = fornecedor_parsed.map(lambda x: x[1])
    df["id_fornecedor_valido"] = fornecedor_parsed.map(lambda x: x[2])

    # data
    df["dt_emissao_despesa"] = df["dt_emissao_despesa_raw"].apply(parse_date_br)

    # valor
    df["vl_despesa"] = df["vl_despesa_raw"].apply(parse_brl_number)

    # referência temporal
    df["ano"] = pd.to_numeric(df["ano"], errors="coerce").astype("Int64")
    df["mes_num"] = pd.to_numeric(df["mes_num"], errors="coerce").astype("Int64")

    df["ano_mes_ref"] = df.apply(
        lambda row: f"{int(row['ano']):04d}-{int(row['mes_num']):02d}"
        if pd.notna(row["ano"]) and pd.notna(row["mes_num"])
        else None,
        axis=1,
    )

    # chave técnica
    df["chave_despesa"] = df.apply(build_chave_despesa, axis=1)

    # ordenação final de colunas
    ordered_columns = [
        "orgao",
        "orgao_norm",
        "mes",
        "mes_num",
        "ano",
        "ano_mes_ref",
        "evento",
        "evento_norm",
        "nr_empenho",
        "nr_empenho_norm",
        "id_fornecedor_raw",
        "id_fornecedor_tipo",
        "id_fornecedor_numero",
        "id_fornecedor_valido",
        "nm_fornecedor",
        "nm_fornecedor_norm",
        "dt_emissao_despesa_raw",
        "dt_emissao_despesa",
        "vl_despesa_raw",
        "vl_despesa",
        "chave_despesa",
    ]

    df = df[ordered_columns]

    parse_datas_erro = int(df["dt_emissao_despesa"].isna().sum())
    parse_datas_ok = int(len(df) - parse_datas_erro)

    parse_valores_erro = int(df["vl_despesa"].isna().sum())
    parse_valores_ok = int(len(df) - parse_valores_erro)

    duplicatas_exatas = int(df.duplicated().sum())
    duplicatas_chave = int(df["chave_despesa"].duplicated().sum())

    nulos_por_coluna = {
        col: int(qtd)
        for col, qtd in df.isnull().sum().items()
        if int(qtd) > 0
    }

    validation = {
        "parse_datas_ok": parse_datas_ok,
        "parse_datas_erro": parse_datas_erro,
        "parse_valores_ok": parse_valores_ok,
        "parse_valores_erro": parse_valores_erro,
        "duplicatas_exatas": duplicatas_exatas,
        "duplicatas_chave_despesa": duplicatas_chave,
        "nulos_por_coluna": nulos_por_coluna,
    }

    registros_saida = len(df)
    registros_descartados = registros_entrada - registros_saida

    status = "OK"
    if registros_saida == 0:
        status = "SEM_DADOS"
    elif parse_datas_erro > 0 or parse_valores_erro > 0:
        status = "PARCIAL"

    meta_base = {
        "dataset": DATASET,
        "camada": CAMADA,
        "fonte": FONTE,
        "municipio": MUNICIPIO,
        "schema_version": SILVER_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "registros_entrada": int(registros_entrada),
        "registros_saida": int(registros_saida),
        "registros_descartados": int(registros_descartados),
        "num_colunas": int(len(df.columns)),
        "colunas": df.columns.tolist(),
        "status": status,
        **validation,
    }

    return df, meta_base


def build_year_metadata(
    ano: int,
    df_silver: pd.DataFrame,
    meta_base: dict[str, Any],
    arquivo_entrada: str,
    arquivo_saida: str,
) -> dict[str, Any]:
    meta = {
        **meta_base,
        "ano": ano,
        "arquivo_entrada": arquivo_entrada,
        "arquivo_saida": arquivo_saida,
    }
    return meta


def build_consolidated_metadata(
    anos_consolidados: list[int],
    df_silver: pd.DataFrame,
    meta_base: dict[str, Any],
    arquivos_entrada: list[str],
    arquivo_saida: str,
) -> dict[str, Any]:
    meta = {
        **meta_base,
        "escopo": "consolidated",
        "anos_consolidados": anos_consolidados,
        "arquivos_entrada": arquivos_entrada,
        "arquivo_saida": arquivo_saida,
    }
    return meta


def process_one_year(ano: int, force_reprocess: bool = False) -> str | None:
    bronze_path = get_bronze_year_csv_path(ano)

    if not file_exists(bronze_path):
        print(f"[INFO] Bronze não encontrada para {ano}: {bronze_path}")
        return None

    silver_path = get_silver_year_parquet_path(ano)
    silver_meta_path = get_silver_year_meta_path(ano)

    if file_exists(silver_path) and file_exists(silver_meta_path) and not force_reprocess:
        print(f"[SKIP] Silver {ano} já existe.")
        return silver_path

    print(f"\n========== SILVER DESPESAS ANO {ano} ==========")
    print(f"[LEITURA] {bronze_path}")

    df_bronze = pd.read_csv(bronze_path)
    df_silver, meta_base = transform_silver(df_bronze)

    ensure_dir(get_silver_year_dir(ano))
    df_silver.to_parquet(silver_path, index=False)

    year_meta = build_year_metadata(
        ano=ano,
        df_silver=df_silver,
        meta_base=meta_base,
        arquivo_entrada=bronze_path,
        arquivo_saida=silver_path,
    )
    save_metadata(year_meta, silver_meta_path)

    print(f"[OK] Silver anual salva em: {silver_path}")
    print(f"[OK] Metadata anual salva em: {silver_meta_path}")
    print(f"[OK] Registros silver {ano}: {len(df_silver)}")

    return silver_path


def build_consolidated(years: list[int]) -> str | None:
    print("\n========== SILVER CONSOLIDATED ==========")

    parquet_paths: List[str] = []
    anos_consolidados: List[int] = []

    for ano in years:
        p = get_silver_year_parquet_path(ano)
        if file_exists(p):
            parquet_paths.append(p)
            anos_consolidados.append(ano)

    if not parquet_paths:
        print("[INFO] Nenhum parquet anual encontrado para consolidar.")
        return None

    frames = [pd.read_parquet(p) for p in parquet_paths]
    full_df = pd.concat(frames, ignore_index=True)

    ensure_dir(get_silver_consolidated_dir())
    consolidated_path = get_silver_consolidated_parquet_path()
    full_df.to_parquet(consolidated_path, index=False)

    # metadata do consolidado
    _, meta_base = transform_silver(
        pd.DataFrame(
            {
                "orgao": [],
                "mes": [],
                "evento": [],
                "nr_empenho": [],
                "id_fornecedor": [],
                "nm_fornecedor": [],
                "dt_emissao_despesa": [],
                "vl_despesa": [],
                "ano": [],
                "mes_num": [],
            }
        )
    )

    meta_base["registros_entrada"] = int(len(full_df))
    meta_base["registros_saida"] = int(len(full_df))
    meta_base["registros_descartados"] = 0
    meta_base["num_colunas"] = int(len(full_df.columns))
    meta_base["colunas"] = full_df.columns.tolist()
    meta_base["parse_datas_ok"] = int(full_df["dt_emissao_despesa"].notna().sum())
    meta_base["parse_datas_erro"] = int(full_df["dt_emissao_despesa"].isna().sum())
    meta_base["parse_valores_ok"] = int(full_df["vl_despesa"].notna().sum())
    meta_base["parse_valores_erro"] = int(full_df["vl_despesa"].isna().sum())
    meta_base["duplicatas_exatas"] = int(full_df.duplicated().sum())
    meta_base["duplicatas_chave_despesa"] = int(full_df["chave_despesa"].duplicated().sum())
    meta_base["nulos_por_coluna"] = {
        col: int(qtd)
        for col, qtd in full_df.isnull().sum().items()
        if int(qtd) > 0
    }
    meta_base["status"] = "OK" if len(full_df) > 0 else "SEM_DADOS"

    consolidated_meta = build_consolidated_metadata(
        anos_consolidados=anos_consolidados,
        df_silver=full_df,
        meta_base=meta_base,
        arquivos_entrada=parquet_paths,
        arquivo_saida=consolidated_path,
    )
    save_metadata(consolidated_meta, get_silver_consolidated_meta_path())

    print(f"[OK] Silver consolidated salva em: {consolidated_path}")
    print(f"[OK] Metadata consolidated salva em: {get_silver_consolidated_meta_path()}")
    print(f"[OK] Registros silver consolidated: {len(full_df)}")

    return consolidated_path


def run_silver_despesas_tce(
    years: Optional[List[int]] = None,
    force_reprocess: bool = False,
) -> None:
    anos = years if years else DEFAULT_ANOS

    print("\n===== PIPELINE SILVER DESPESAS TCE =====")
    print("Anos:", anos)
    print("Force:", force_reprocess)
    print("Schema version:", SILVER_SCHEMA_VERSION)
    print("Pipeline version:", PIPELINE_VERSION)

    for ano in anos:
        process_one_year(ano, force_reprocess=force_reprocess)

    build_consolidated(anos)