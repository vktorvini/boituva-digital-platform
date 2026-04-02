from __future__ import annotations

import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_gold_dir() -> Path:
    return Path("data/gold/tce/financeiro")


def upload_parquet_to_cloud(
    filepath: str | Path,
    table_name: str,
    if_exists: str = "replace",
) -> bool:
    engine = None

    try:
        filepath = Path(filepath)

        if not filepath.exists():
            print(f"❌ Arquivo não encontrado: {filepath}")
            return False

        print(f"📖 Lendo {filepath}...")
        df = pd.read_parquet(filepath)
        print(f"✅ Arquivo lido: {len(df)} linhas, {len(df.columns)} colunas")

        if not DATABASE_URL:
            raise ValueError("DATABASE_URL não encontrada no .env")

        print("🔗 Conectando ao banco...")
        engine = create_engine(DATABASE_URL)

        print(f"📤 Enviando dados para tabela '{table_name}'...")
        df.to_sql(
            name=table_name,
            con=engine,
            if_exists=if_exists,
            index=False,
            method="multi",
            chunksize=1000,
        )

        print(f"✅ Upload concluído para '{table_name}'")
        return True

    except Exception as e:
        print(f"❌ Erro durante upload: {e}")
        return False

    finally:
        if engine is not None:
            engine.dispose()


def upload_all_gold_data() -> None:
    gold_dir = get_gold_dir()

    if not gold_dir.exists():
        print(f"❌ Pasta não encontrada: {gold_dir}")
        return

    print("\n🚀 Iniciando upload de dados GOLD para Supabase...")
    print(f"📁 Pasta: {gold_dir}\n")

    uploads = [
        ("gold_financeiro_mensal.parquet", "gold_financeiro_mensal"),
        ("gold_receita_mensal_fonte.parquet", "gold_receita_mensal_fonte"),
        ("gold_despesa_mensal_evento.parquet", "gold_despesa_mensal_evento"),
        ("gold_financeiro_anual.parquet", "gold_financeiro_anual"),
    ]

    successful = 0
    total_existentes = 0

    for idx, (filename, table_name) in enumerate(uploads, start=1):
        filepath = gold_dir / filename

        print(f"[{idx}/{len(uploads)}] Processando: {filename}")
        print(f"    Tabela de destino: {table_name}")

        if not filepath.exists():
            print(f"⏭️ Arquivo não encontrado: {filepath}\n")
            continue

        total_existentes += 1

        if upload_parquet_to_cloud(filepath, table_name):
            successful += 1

        print()

    print("=" * 60)
    print(f"✅ Resumo: {successful}/{total_existentes} uploads bem-sucedidos")
    print("=" * 60)


if __name__ == "__main__":
    upload_all_gold_data()