import pandas as pd

df = pd.read_parquet("data/gold/tce/financeiro/gold_financeiro_anual.parquet")

df["execucao"] = df["despesa_paga"] / df["despesa_empenhada"]

print(df[["ano", "execucao"]])

df["gap"] = df["despesa_empenhada"] - df["despesa_paga"]
print(df[["ano", "gap"]])

df["crescimento_receita"] = df["receita_total"].pct_change()
print(df[["ano", "crescimento_receita"]])