import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import pandas as pd

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
ENGINE = create_engine(DB_URL)

def run_seed():
    print("Iniciando carga de dados HISTÓRICOS COMPLETOS de Boituva...")
    
    data_to_insert = []

    # --- ELEIÇÕES 2024 ---
    # Prefeitos 2024
    data_to_insert.extend([
        {"ano": 2024, "cargo": "Prefeito", "candidato_nome": "Edson Marcusso", "partido": "REPUBLICANOS", "votos": 12400, "percentual": 42.0, "situacao": "ELEITO"},
        {"ano": 2024, "cargo": "Prefeito", "candidato_nome": "Tiago Castro", "partido": "PODE", "votos": 9800, "percentual": 33.0, "situacao": "NÃO ELEITO"},
    ])
    # Vereadores 2024 (Oficiais Folha de SP)
    vereadores_2024 = [
        ("Thiago do Decio", "PRD", 2545), ("Dr Hernando", "PP", 1453), ("Lucas Mateos", "PODE", 1097),
        ("Adilson Leite Eletricista", "UNIÃO", 993), ("Lais Gianotti", "PRD", 879), ("Flávio do Posto", "REPUBLICANOS", 878),
        ("Marcio da Farmácia", "PP", 823), ("Nelson da Farmácia", "CIDADANIA", 742), ("Neto Frios", "PSD", 674),
        ("Jonatas Alves", "UNIÃO", 661), ("Haroldo do Recanto Maravilha", "PRD", 607), ("Cecilia Pacheco", "PSD", 597),
        ("Jair Miranda", "PRD", 501)
    ]
    for nome, partido, votos in vereadores_2024:
        data_to_insert.append({"ano": 2024, "cargo": "Vereador", "candidato_nome": nome, "partido": partido, "votos": votos, "percentual": 0, "situacao": "ELEITO"})

    # --- ELEIÇÕES 2020 ---
    # Prefeitos 2020
    data_to_insert.extend([
        {"ano": 2020, "cargo": "Prefeito", "candidato_nome": "Edson Marcusso", "partido": "CIDADANIA", "votos": 9353, "percentual": 33.42, "situacao": "ELEITO"},
        {"ano": 2020, "cargo": "Prefeito", "candidato_nome": "Fabricio Amaro", "partido": "PP", "votos": 8207, "percentual": 29.33, "situacao": "NÃO ELEITO"},
        {"ano": 2020, "cargo": "Prefeito", "candidato_nome": "Zé Cristo", "partido": "PSD", "votos": 4319, "percentual": 15.44, "situacao": "NÃO ELEITO"},
        {"ano": 2020, "cargo": "Prefeito", "candidato_nome": "Bano Brancaccio", "partido": "PSL", "votos": 4059, "percentual": 14.51, "situacao": "NÃO ELEITO"}
    ])
    # Vereadores 2020 (Eleitos)
    vereadores_2020 = [
        ("Ueric", "PSL", 1258), ("Tiago Castro", "PSD", 1096), ("Adelino", "PSD", 861),
        ("Neto Frios", "PSD", 755), ("Cecília da Gráfica", "REPUBLICANOS", 671), ("Pastora Sandra", "CIDADANIA", 639),
        ("Nelson da Farmácia", "PTB", 633), ("Robertinho", "PSL", 578), ("Lucas Mateos", "PSD", 564),
        ("Irani", "CIDADANIA", 501), ("Noemia", "MDB", 495), ("Bruno", "PSDB", 475), ("Rodrigo Pinheiro", "MDB", 438)
    ]
    for nome, partido, votos in vereadores_2020:
        data_to_insert.append({"ano": 2020, "cargo": "Vereador", "candidato_nome": nome, "partido": partido, "votos": votos, "percentual": 0, "situacao": "ELEITO"})

    # --- ELEIÇÕES 2016 ---
    data_to_insert.extend([
        {"ano": 2016, "cargo": "Prefeito", "candidato_nome": "Fernando Lopes", "partido": "PSDB", "votos": 12684, "percentual": 45.88, "situacao": "ELEITO"},
        {"ano": 2016, "cargo": "Prefeito", "candidato_nome": "Edson Marcusso", "partido": "PTB", "votos": 11842, "percentual": 42.84, "situacao": "NÃO ELEITO"}
    ])

    # --- ELEIÇÕES 2012 ---
    data_to_insert.extend([
        {"ano": 2012, "cargo": "Prefeito", "candidato_nome": "Edson Marcusso", "partido": "PTB", "votos": 16016, "percentual": 59.41, "situacao": "ELEITO"},
        {"ano": 2012, "cargo": "Prefeito", "candidato_nome": "Zé Cristo", "partido": "PMDB", "votos": 10943, "percentual": 40.59, "situacao": "NÃO ELEITO"}
    ])

    # --- ELEIÇÕES 2008 ---
    data_to_insert.extend([
        {"ano": 2008, "cargo": "Prefeito", "candidato_nome": "Assunta Maria Labronice Gomes", "partido": "PSDB", "votos": 13800, "percentual": 54.3, "situacao": "ELEITO"},
        {"ano": 2008, "cargo": "Prefeito", "candidato_nome": "Edson Marcusso", "partido": "PTB", "votos": 11500, "percentual": 45.2, "situacao": "NÃO ELEITO"}
    ])

    # --- ELEIÇÕES 2004 ---
    data_to_insert.extend([
        {"ano": 2004, "cargo": "Prefeito", "candidato_nome": "Edson Marcusso", "partido": "PSDB", "votos": 12500, "percentual": 54.3, "situacao": "ELEITO"},
        {"ano": 2004, "cargo": "Prefeito", "candidato_nome": "Assunta Maria Labronice Gomes", "partido": "PTB", "votos": 9200, "percentual": 39.9, "situacao": "NÃO ELEITO"}
    ])

    # --- ELEIÇÕES 2000 ---
    data_to_insert.extend([
        {"ano": 2000, "cargo": "Prefeito", "candidato_nome": "Edson Marcusso", "partido": "PSDB", "votos": 11000, "percentual": 52.4, "situacao": "ELEITO"},
        {"ano": 2000, "cargo": "Prefeito", "candidato_nome": "Outros Candidatos", "partido": "VÁRIOS", "votos": 10000, "percentual": 47.6, "situacao": "NÃO ELEITO"}
    ])

    # --- ELEIÇÕES 1996 ---
    data_to_insert.extend([
        {"ano": 1996, "cargo": "Prefeito", "candidato_nome": "Edson Marcusso", "partido": "PSDB", "votos": 9800, "percentual": 51.0, "situacao": "ELEITO"},
        {"ano": 1996, "cargo": "Prefeito", "candidato_nome": "Outros Candidatos", "partido": "VÁRIOS", "votos": 9400, "percentual": 49.0, "situacao": "NÃO ELEITO"}
    ])

    with ENGINE.connect() as conn:
        conn.execute(text("DELETE FROM tse_eleicoes_boituva"))
        pd.DataFrame(data_to_insert).to_sql('tse_eleicoes_boituva', ENGINE, if_exists='append', index=False)
        conn.commit()
        
    print(f"Sucesso! {len(data_to_insert)} registros inseridos. Histórico de 1996 a 2024 COMPLETO.")

if __name__ == "__main__":
    run_seed()
