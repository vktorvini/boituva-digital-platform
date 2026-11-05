# Guia de Upload de Dados para Supabase

## Configuracao segura

A pipeline deve carregar credenciais apenas a partir de arquivos `.env` ignorados pelo Git.

### Regra obrigatoria
Nunca documente ou versione senhas, `DATABASE_URL`, service role keys ou qualquer credencial real no repositorio.

### Exemplo correto de `.env`
```bash
DATABASE_URL=postgresql://postgres:<SUA_SENHA>@db.<SEU_PROJETO>.supabase.co:5432/postgres
```

## Como usar

### Opcao 1: executar upload legado via main.py
```bash
cd pipeline/boituva-tce-pipeline
python -m src.main --dataset upload_cloud
```

### Opcao 2: executar upload executivo via main.py
```bash
cd pipeline/boituva-tce-pipeline
python -m src.main --dataset upload_exec_cloud
```

### Opcao 3: executar script PowerShell unico
```powershell
cd pipeline/boituva-tce-pipeline
powershell -ExecutionPolicy Bypass -File .\scripts\upload_exec_supabase.ps1
```

### Opcao 4: validar sem gravar no banco
```powershell
cd pipeline/boituva-tce-pipeline
powershell -ExecutionPolicy Bypass -File .\scripts\upload_exec_supabase.ps1 -DryRun -SkipIbgeRefresh
```

### Opcao 5: executar script legado diretamente
```bash
cd pipeline/boituva-tce-pipeline
python -m src.pipelines.upload_gold_to_cloud
```

## Dados enviados

| Arquivo Local | Tabela no Banco |
|---|---|
| `data/gold/tce/financeiro/gold_financeiro_mensal.parquet` | `gold_financeiro_mensal` |
| `data/gold/tce/financeiro/gold_receita_mensal_fonte.parquet` | `gold_receita_mensal_fonte` |
| `data/gold/tce/financeiro/gold_despesa_mensal_evento.parquet` | `gold_despesa_mensal_evento` |

## Dados enviados no modelo executivo

| Origem Local/API | Tabela no Banco |
|---|---|
| API Localidades IBGE Boituva | `dim_municipio` |
| `gold_financeiro_mensal.parquet` | `dim_tempo` |
| seed do app executivo | `dim_secretaria` |
| `gold_receita_mensal_fonte.parquet` | `dim_fonte_recurso` |
| `gold_financeiro_mensal.parquet` | `fato_financeiro_mensal` |
| `gold_receita_mensal_fonte.parquet` | `fato_receita_mensal_fonte` |
| indicadores municipais curados do IBGE | `fato_ibge_indicador_municipio` |

## Boas praticas
- use `.env` local e nunca comite credenciais
- prefira rotacionar senhas se alguma credencial tiver sido exposta
- valide conexao antes do upload
- separe tabelas operacionais de views executivas

## Teste de conexao
```bash
python -c "from src.core.database import test_connection; test_connection()"
```

## Proximos passos recomendados
1. criar o modelo do app executivo com `docs/projeto/SUPABASE_EXECUTIVO_MEDALHAO.sql`
2. subir dimensoes e fatos gold para o Supabase com `upload_exec_cloud`
3. trocar os mocks do app por views executivas do banco
