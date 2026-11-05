from typing import Optional

import pandas as pd

from src.collectors.ibge import BOITUVA_IBGE_CODE, IBGEClient
from src.core.metadata import (
    build_bronze_consolidated_metadata,
    build_bronze_year_metadata,
    is_year_metadata_ok,
    save_metadata,
)
from src.core.schema import BRONZE_SCHEMA_VERSION, PIPELINE_VERSION
from src.core.storage import ensure_dir, file_exists, save_json
from src.core.validations import validate_schema_contract


FONTE = "ibge"
CAMADA = "bronze"
DATASET = "localidades_boituva"

ANO_REFERENCIA = 2026
UF_PADRAO = "SP"
MUNICIPIO_ID_BOITUVA = BOITUVA_IBGE_CODE

REQUIRED_COLUMNS = [
    "municipio_id_ibge",
    "municipio_nome",
    "uf_sigla",
    "uf_nome",
    "regiao_nome",
    "mesorregiao_nome",
    "microrregiao_nome",
    "regiao_imediata_id",
    "regiao_imediata_nome",
    "regiao_intermediaria_id",
    "regiao_intermediaria_nome",
    "fonte",
    "ano_referencia",
]


def get_raw_json_path() -> str:
    return "data/raw/ibge/localidades/boituva_municipio.json"


def get_bronze_year_dir() -> str:
    return f"data/bronze/ibge/localidades/{ANO_REFERENCIA}"


def get_bronze_year_csv_path() -> str:
    return f"{get_bronze_year_dir()}/localidades_boituva_{ANO_REFERENCIA}.csv"


def get_bronze_year_meta_path() -> str:
    return f"{get_bronze_year_dir()}/localidades_boituva_{ANO_REFERENCIA}__meta.json"


def get_bronze_consolidated_dir() -> str:
    return "data/bronze/ibge/localidades/consolidated"


def get_bronze_consolidated_csv_path() -> str:
    return f"{get_bronze_consolidated_dir()}/localidades_boituva_full.csv"


def get_bronze_consolidated_meta_path() -> str:
    return f"{get_bronze_consolidated_dir()}/localidades_boituva_full__meta.json"


def should_skip(force_reprocess: bool) -> bool:
    if force_reprocess:
        print("[FORCE] Reprocessando localidades do IBGE.")
        return False

    csv_path = get_bronze_year_csv_path()
    meta_path = get_bronze_year_meta_path()

    if is_year_metadata_ok(
        csv_path=csv_path,
        meta_path=meta_path,
        schema_version=BRONZE_SCHEMA_VERSION,
        pipeline_version=PIPELINE_VERSION,
    ):
        print("[SKIP] Localidades do IBGE ja processadas com status OK.")
        return True

    return False


def extract_nested_values(data: dict) -> dict:
    microrregiao = data.get("microrregiao", {}) or {}
    mesorregiao = microrregiao.get("mesorregiao", {}) or {}
    uf = mesorregiao.get("UF", {}) or {}
    regiao = uf.get("regiao", {}) or {}

    regiao_imediata = data.get("regiao-imediata", {}) or {}
    regiao_intermediaria = regiao_imediata.get("regiao-intermediaria", {}) or {}

    return {
        "municipio_id_ibge": data.get("id"),
        "municipio_nome": data.get("nome"),
        "uf_sigla": uf.get("sigla"),
        "uf_nome": uf.get("nome"),
        "regiao_nome": regiao.get("nome"),
        "mesorregiao_nome": mesorregiao.get("nome"),
        "microrregiao_nome": microrregiao.get("nome"),
        "regiao_imediata_id": regiao_imediata.get("id"),
        "regiao_imediata_nome": regiao_imediata.get("nome"),
        "regiao_intermediaria_id": regiao_intermediaria.get("id"),
        "regiao_intermediaria_nome": regiao_intermediaria.get("nome"),
    }


def build_dataframe_from_payload(payload: dict) -> pd.DataFrame:
    row = extract_nested_values(payload)
    row["fonte"] = FONTE
    row["ano_referencia"] = ANO_REFERENCIA

    df = pd.DataFrame([row])
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            df[col] = None

    return df[REQUIRED_COLUMNS]


def collect_localidades_ibge(force_reprocess: bool = False) -> Optional[str]:
    if should_skip(force_reprocess):
        return get_bronze_year_csv_path()

    print("\n========== PROCESSANDO LOCALIDADES IBGE ==========")
    print(f"[INFO] Municipio alvo: Boituva ({MUNICIPIO_ID_BOITUVA})")

    client = IBGEClient()
    result = client.get_municipio(MUNICIPIO_ID_BOITUVA)

    if result["status"] == "error":
        print(f"[ERRO] Falha ao consultar IBGE: {result['error_message']}")
        return None

    if result["status"] == "empty":
        print("[INFO] IBGE retornou payload vazio para o municipio.")
        return None

    raw_json_path = get_raw_json_path()
    save_json(result["data"], raw_json_path)
    print(f"[OK] Raw salvo em: {raw_json_path}")

    df = build_dataframe_from_payload(result["data"])
    validation_summary = validate_schema_contract(df, REQUIRED_COLUMNS, aliases_aplicados={})

    bronze_year_dir = get_bronze_year_dir()
    ensure_dir(bronze_year_dir)

    bronze_year_csv_path = get_bronze_year_csv_path()
    df.to_csv(bronze_year_csv_path, index=False, encoding="utf-8-sig")

    year_meta = build_bronze_year_metadata(
        dataset=DATASET,
        camada=CAMADA,
        fonte=FONTE,
        municipio="boituva",
        ano=ANO_REFERENCIA,
        df=df,
        meses_esperados=[],
        meses_com_dados=[],
        meses_vazios=[],
        meses_com_erro=[],
        arquivo_saida=bronze_year_csv_path,
        validation_summary=validation_summary,
        schema_version=BRONZE_SCHEMA_VERSION,
        pipeline_version=PIPELINE_VERSION,
    )

    bronze_year_meta_path = get_bronze_year_meta_path()
    save_metadata(year_meta, bronze_year_meta_path)

    print(f"[OK] Bronze anual salvo em: {bronze_year_csv_path}")
    print(f"[OK] Metadata anual salva em: {bronze_year_meta_path}")
    print(f"[OK] Registros salvos: {len(df)}")
    return bronze_year_csv_path


def build_consolidated() -> Optional[str]:
    print("\n========== GERANDO CONSOLIDADO LOCALIDADES IBGE ==========")

    csv_path = get_bronze_year_csv_path()
    if not file_exists(csv_path):
        print("[INFO] Nenhum CSV anual encontrado para consolidar.")
        return None

    df = pd.read_csv(csv_path)
    validation_summary = validate_schema_contract(df, REQUIRED_COLUMNS, aliases_aplicados={})

    consolidated_dir = get_bronze_consolidated_dir()
    ensure_dir(consolidated_dir)

    consolidated_csv_path = get_bronze_consolidated_csv_path()
    df.to_csv(consolidated_csv_path, index=False, encoding="utf-8-sig")

    consolidated_meta = build_bronze_consolidated_metadata(
        dataset=DATASET,
        camada=CAMADA,
        fonte=FONTE,
        municipio="boituva",
        anos_consolidados=[ANO_REFERENCIA],
        df=df,
        arquivos_entrada=[csv_path],
        arquivo_saida=consolidated_csv_path,
        validation_summary=validation_summary,
        schema_version=BRONZE_SCHEMA_VERSION,
        pipeline_version=PIPELINE_VERSION,
    )

    consolidated_meta_path = get_bronze_consolidated_meta_path()
    save_metadata(consolidated_meta, consolidated_meta_path)

    print(f"[OK] Consolidado salvo em: {consolidated_csv_path}")
    print(f"[OK] Metadata consolidada salva em: {consolidated_meta_path}")
    print(f"[OK] Registros consolidados: {len(df)}")
    return consolidated_csv_path


def run_ibge_localidades(force_reprocess: bool = False) -> None:
    print("\n===== PIPELINE LOCALIDADES IBGE =====")
    print("UF padrao:", UF_PADRAO)
    print("Municipio alvo:", MUNICIPIO_ID_BOITUVA)
    print("Ano referencia:", ANO_REFERENCIA)
    print("Force:", force_reprocess)
    print("Schema version:", BRONZE_SCHEMA_VERSION)
    print("Pipeline version:", PIPELINE_VERSION)

    result_path = collect_localidades_ibge(force_reprocess=force_reprocess)
    if result_path:
        build_consolidated()


if __name__ == "__main__":
    run_ibge_localidades(force_reprocess=True)
