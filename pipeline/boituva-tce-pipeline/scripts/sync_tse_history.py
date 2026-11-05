import os
import requests
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Carrega credenciais do .env do pipeline
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise Exception("DATABASE_URL não encontrada no .env")

# Configurações
COD_MUN_BOITUVA = "62413"
ANOS = [1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024]
ENGINE = create_engine(DB_URL)

def setup_table():
    """Cria a tabela de histórico TSE no banco de dados"""
    query = """
    CREATE TABLE IF NOT EXISTS tse_eleicoes_boituva (
        id SERIAL PRIMARY KEY,
        ano INTEGER,
        cargo VARCHAR(50),
        candidato_nome VARCHAR(255),
        partido VARCHAR(20),
        votos INTEGER,
        percentual NUMERIC(5,2),
        situacao VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    with ENGINE.connect() as conn:
        conn.execute(text(query))
        conn.commit()
    print("Tabela 'tse_eleicoes_boituva' pronta.")

def sync_year(ano):
    """Busca dados de Prefeito e Vereadores e salva no banco"""
    # Cargos: 11 (Prefeito), 13 (Vereador)
    for cargo_cod, cargo_nome in [(11, "Prefeito"), (13, "Vereador")]:
        print(f"Buscando {cargo_nome} de {ano}...")
        url = f"https://cepesp.io/api/consulta/votos_munzona?ano={ano}&cargo={cargo_cod}&municipio={COD_MUN_BOITUVA}"
        
        try:
            response = requests.get(url)
            if response.status_code != 200:
                print(f"Falha ao buscar {cargo_nome} em {ano}.")
                continue

            data = response.json()
            if not data:
                continue

            df_raw = pd.DataFrame(data)
            total_votos = df_raw['QTDE_VOTOS'].astype(int).sum()
            
            votos_db = []
            for _, row in df_raw.iterrows():
                # No caso de vereadores, focamos apenas nos eleitos para não sobrecarregar o banco inicial
                situacao = row['DESC_SIT_TOT_TURNO']
                if cargo_cod == 13 and situacao != "ELEITO":
                    continue

                votos = int(row['QTDE_VOTOS'])
                votos_db.append({
                    "ano": ano,
                    "cargo": cargo_nome,
                    "candidato_nome": row['NOME_CANDIDATO'],
                    "partido": row['SIGLA_PARTIDO'],
                    "votos": votos,
                    "percentual": round((votos / total_votos) * 100, 2) if total_votos > 0 else 0,
                    "situacao": situacao
                })

            if votos_db:
                with ENGINE.connect() as conn:
                    conn.execute(text(f"DELETE FROM tse_eleicoes_boituva WHERE ano = {ano} AND cargo = '{cargo_nome}'"))
                    df_to_save = pd.DataFrame(votos_db)
                    df_to_save.to_sql('tse_eleicoes_boituva', ENGINE, if_exists='append', index=False)
                    conn.commit()
                print(f"Sucesso: {len(votos_db)} {cargo_nome} salvos para {ano}.")

        except Exception as e:
            print(f"Erro ao processar {cargo_nome} de {ano}: {str(e)}")

def run():
    setup_table()
    for ano in ANOS:
        sync_year(ano)
    print("\nSincronização completa! O banco de dados agora contém o histórico real de Boituva.")

if __name__ == "__main__":
    run()
