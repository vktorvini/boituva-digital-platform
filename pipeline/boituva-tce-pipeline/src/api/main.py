from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import datetime

from src.core.loader import get_engine

app = FastAPI(
    title="Boituva Digital Platform API",
    description="API do backend Python para metadados e observabilidade do pipeline.",
    version="1.0.0"
)

# Dependência do BD
def get_db():
    engine = get_engine()
    with engine.connect() as conn:
        yield conn

@app.get("/health", tags=["System"])
def healthcheck():
    """
    Endpoint simples para verificar se a API está online (Deploy Render).
    """
    return {"status": "ok", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}

@app.get("/api/pipeline/status/latest", tags=["Observability"])
def latest_pipeline_status(conn = Depends(get_db)):
    """
    Retorna o status mais recente do pipeline geral, buscando da view vw_pipeline_status.
    """
    try:
        query = text("SELECT * FROM public.vw_pipeline_status ORDER BY finalizado_em DESC LIMIT 1;")
        result = conn.execute(query).fetchone()
        
        if not result:
            return {"status": "Nenhum dado encontrado"}
            
        # O SQLAlchemy mapeia a linha num proxy, podemos acessar usando keys() e converte para dict
        return dict(result._mapping)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gold/latest-update", tags=["Observability"])
def latest_gold_update(conn = Depends(get_db)):
    """
    Retorna a última vez que a camada GOLD foi consolidada.
    """
    try:
        query = text(\"""
            SELECT dataset, finalizado_em, registros_processados
            FROM public.vw_pipeline_status 
            WHERE camada = 'gold' AND status = 'OK'
            ORDER BY finalizado_em DESC 
            LIMIT 5;
        \""")
        result = conn.execute(query).fetchall()
        
        return {
            "latest_gold_updates": [dict(r._mapping) for r in result]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Entrypoint padrão para rodar local via `uvicorn src.api.main:app --reload`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)
