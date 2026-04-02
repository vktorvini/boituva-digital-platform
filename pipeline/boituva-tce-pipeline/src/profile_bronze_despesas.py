import pandas as pd


def main():
    path = "data/bronze/tce/despesas/consolidated/despesas_boituva_full.csv"

    print("\n===== PROFILE BRONZE DESPESAS =====\n")

    # ==============================
    # LEITURA
    # ==============================
    df = pd.read_csv(path)

    # ==============================
    # VISÃO GERAL
    # ==============================
    print("SHAPE:")
    print(df.shape)

    print("\nCOLUNAS:")
    print(df.columns.tolist())

    print("\nDTYPES:")
    print(df.dtypes)

    # ==============================
    # NULOS
    # ==============================
    print("\n===== NULOS POR COLUNA =====")
    print(df.isnull().sum())

    # ==============================
    # AMOSTRA GERAL
    # ==============================
    print("\n===== AMOSTRA GERAL =====")
    print(df.head(20).to_string())

    # ==============================
    # CAMPOS CRÍTICOS
    # ==============================

    print("\n===== AMOSTRA id_fornecedor =====")
    print(df["id_fornecedor"].dropna().head(20).to_string())

    print("\n===== AMOSTRA vl_despesa =====")
    print(df["vl_despesa"].dropna().head(20).to_string())

    print("\n===== AMOSTRA dt_emissao_despesa =====")
    print(df["dt_emissao_despesa"].dropna().head(20).to_string())

    print("\n===== AMOSTRA orgao =====")
    print(df["orgao"].dropna().head(20).to_string())

    # ==============================
    # VALORES ÚNICOS IMPORTANTES
    # ==============================

    print("\n===== VALORES ÚNICOS (TOP 10) =====")

    for col in ["evento", "mes"]:
        if col in df.columns:
            print(f"\n-- {col} --")
            print(df[col].value_counts().head(10))

    # ==============================
    # DUPLICIDADE
    # ==============================

    print("\n===== DUPLICIDADE =====")
    print("Duplicatas exatas:", df.duplicated().sum())

    # ==============================
    # DISTRIBUIÇÃO POR ANO
    # ==============================

    if "ano" in df.columns:
        print("\n===== DISTRIBUIÇÃO POR ANO =====")
        print(df["ano"].value_counts().sort_index())

    # ==============================
    # TAMANHO DO ARQUIVO EM MEMÓRIA
    # ==============================

    print("\n===== MEMORY USAGE =====")
    print(df.memory_usage(deep=True))


if __name__ == "__main__":
    main()