# Guia de Upload de Dados para Supabase

## ✅ Configuração Concluída

A pipeline foi configurada com sucesso para conectar e fazer upload de dados para o Supabase.

### O que foi feito:

1. **Arquivo `.env` configurado** 
   - Localização: `data-platform/pipeline/.env`
   - Contém: Database URL do Supabase
   ```
   DATABASE_URL=postgresql://postgres:UKuUKaKA9YZ5TT6I@db.zporftfzvxbdntptsoea.supabase.co:5432/postgres
   ```

2. **Script de upload criado**
   - Localização: `src/pipelines/upload_gold_to_cloud.py`
   - Função: Faz upload dos arquivos Parquet de `data/gold/tce` para tabelas no Supabase

3. **Main.py atualizado**
   - Nova opção: `--dataset upload_cloud`
   - Integrado ao comando principal da pipeline

## 🚀 Como Usar

### Opção 1: Executar Upload via Main.py

```bash
cd pipeline/boituva-tce-pipeline
python -m src.main --dataset upload_cloud
```

### Opção 2: Executar Script Diretamente

```bash
cd pipeline/boituva-tce-pipeline
python -m src.pipelines.upload_gold_to_cloud
```

### Opção 3: Usar em Código Python

```python
from src.pipelines.upload_gold_to_cloud import upload_all_gold_data

upload_all_gold_data()
```

## 📊 Dados que Serão Enviados

A pipeline fará upload dos seguintes arquivos para o Supabase:

| Arquivo Local | Tabela no Banco |
|---|---|
| `data/gold/tce/financeiro/gold_financeiro_mensal.parquet` | `gold_financeiro_mensal` |
| `data/gold/tce/financeiro/gold_receita_mensal_fonte.parquet` | `gold_receita_mensal_fonte` |
| `data/gold/tce/financeiro/gold_despesa_mensal_evento.parquet` | `gold_despesa_mensal_evento` |

## ⚙️ Detalhes Técnicos

### Dependências Instaladas
- `pandas`: Lê e manipula os arquivos Parquet
- `sqlalchemy`: ORM para conexão com PostgreSQL
- `psycopg2-binary`: Driver PostgreSQL
- `python-dotenv`: Carrega variáveis do `.env`

### Caracteres da Conexão
- **Host**: `db.zporftfzvxbdntptsoea.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Driver**: psycopg2 (PostgreSQL)

### Comportamento do Upload
- **Mode**: `replace` (substitui dados existentes por padrão)
- **Chunk Size**: 1000 linhas por vez
- **Validação**: Testa conexão antes de enviar dados

## 🔍 Testando a Conexão

```bash
python -c "from src.core.database import test_connection; test_connection()"
```

**Saída esperada:**
```
Conexão OK
database: postgres
schema: public
timestamp: 2026-03-30 ...
```

## 🛠️ Solução de Problemas

### Erro: "could not translate host name"
- **Causa**: Problema de conectividade/DNS ou sem internet
- **Solução**: Verifique conexão com internet e acesso ao Supabase

### Erro: "FATAL: password authentication failed"
- **Causa**: Credenciais incorretas
- **Solução**: Verifique a `DATABASE_URL` no arquivo `.env`

### Erro: "Table already exists"
- **Causa**: Tabela já existe no banco (depende do `if_exists`)
- **Solução**: Use `if_exists='append'` para adicionar dados, não sobrescrever

### Arquivo Parquet não encontrado
- **Causa**: Arquivos não foram gerados por pipelines anteriores
- **Solução**: Execute primeiro as pipelines de gold:
  ```bash
  python -m src.main --dataset gold_financeiro
  python -m src.main --dataset gold_indicadores
  ```

## 📝 Próximos Passos

1. ✅ Configuração do `.env` - **CONCLUÍDO**
2. ✅ Script de upload - **CONCLUÍDO**
3. ⏳ Testar conexão com Supabase (quando tiver acesso à internet)
4. ⏳ Executar pipelines de gold (se ainda não fez)
5. ⏳ Fazer upload dos dados para a nuvem

## 📚 Referências

- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [SQLAlchemy PostgreSQL](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)
- [Pandas to_sql](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_sql.html)
