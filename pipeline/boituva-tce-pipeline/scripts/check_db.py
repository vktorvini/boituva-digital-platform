import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    res = conn.execute(text('SELECT ano, cargo, COUNT(*) FROM tse_eleicoes_boituva GROUP BY ano, cargo ORDER BY ano DESC'))
    for row in res:
        print(row)
