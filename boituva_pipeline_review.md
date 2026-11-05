# Boituva Digital Platform — Revisão Técnica do Pipeline TCE
**Tipo:** Relatório de Arquitetura de Dados  
**Foco:** Análise pragmática, local-first, equipe pequena, baixo custo  
**Data:** 2026-05-12  

---

## Sumário

1. [Mapa do projeto real](#1-mapa-do-projeto-real)
2. [O que está bem feito](#2-o-que-está-bem-feito)
3. [Problemas identificados no código](#3-problemas-identificados-no-código)
4. [Análise por camada](#4-análise-por-camada)
5. [Análise do `upload_exec_to_cloud.py`](#5-análise-do-upload_exec_to_cloudpy)
6. [Análise do `upload_exec_supabase.ps1`](#6-análise-do-upload_exec_supabaseps1)
7. [Análise do `core/`](#7-análise-do-core)
8. [Riscos futuros reais](#8-riscos-futuros-reais)
9. [Recomendações incrementais](#9-recomendações-incrementais)
10. [Roadmap pragmático](#10-roadmap-pragmático)
11. [Conclusão](#11-conclusão)

---

## 1. Mapa do projeto real

```
src/
├── main.py                          # dispatcher CLI (14 datasets registrados)
├── collectors/                      # chamadas às APIs externas
│   ├── ibge.py, pncp.py, siconfi.py
│   ├── sidra.py, tce.py, tse.py
│   └── tcesp_exports.py
├── core/                            # utilitários compartilhados
│   ├── database.py                  # SQLAlchemy → Supabase
│   ├── http_client.py               # HttpClient com retry
│   ├── metadata.py                  # build + save de meta.json
│   ├── schema.py                    # schemas canônicos + aliases
│   ├── storage.py                   # helpers de I/O
│   └── validations.py               # qualidade de DataFrame
└── pipelines/                       # orquestração por dataset
    ├── despesas_tce.py
    ├── receitas_tce.py
    ├── silver_despesas_tce.py
    ├── silver_receitas_tce.py
    ├── gold_financeiro_tce.py
    ├── gold_indicadores_tce.py
    ├── ibge_localidades.py
    ├── ibge_sidra_demografia.py
    ├── pncp_contratacoes.py
    ├── siconfi_fiscal.py
    ├── tcesp_exports.py
    ├── tcesp_iegm_igov_regional.py
    ├── tse_open_data.py
    ├── upload_exec_to_cloud.py      # modelo estrela → Supabase
    └── upload_gold_to_cloud.py
```

---

## 2. O que está bem feito

| Área | Pontos positivos |
|------|------------------|
| **`HttpClient`** | Retry automático com backoff, status_forcelist correto, retorno padronizado `{status, data, error_message, elapsed_seconds}`. Excelente. |
| **`core/metadata.py`** | Dois builders distintos (year e consolidated), coleta qualidade do DataFrame (nulos, duplicatas), suporta `schema_version` e `pipeline_version`. |
| **`core/schema.py`** | Schema canônico com aliases de colunas — trata variações de nomes da API sem duplicar lógica. Boa prática. |
| **`core/validations.py`** | `validate_schema_contract` retorna colunas faltantes e extras — funciona como contrato leve. |
| **`main.py`** | Dispatcher CLI claro; `--force`, `--dry-run`, `--years` bem parametrizados. |
| **`upload_exec_to_cloud.py`** | Modelo estrela (dim/fato) bem definido. `TRUNCATE CASCADE` + `--dry-run` é seguro para a fase atual. |
| **`database.py`** | `pool_pre_ping=True` evita conexões mortas com Supabase. |
| **`.ps1`** | Orquestra IBGE → legacy → executivo com flags para controle fino. |

---

## 3. Problemas identificados no código

### 3.1 `main.py` — dispatcher frágil

**Problema:** cada novo pipeline exige 3 edições manuais: import, `choices=[]`, e um novo `elif`. Com 14 datasets ativos, já está verboso. Adicionar o 15° requer lembrar de todos os 3 pontos.

```python
# Padrão atual — repetitivo e propenso a erros
from src.pipelines.despesas_tce import run_despesas_tce
...
elif dataset == "despesas":
    run_despesas_tce(years=years, force_reprocess=force_reprocess)
```

**Risco futuro:** ao adicionar pipelines de secretarias municipais, o arquivo pode crescer para 30+ elif, tornando-se impossível de manter.

**Solução incremental — Registry pattern leve:**

```python
# src/main.py (versão melhorada)
from src.pipelines import registry  # dict com todos os pipelines

def main():
    args = parse_args()
    runner = registry.get(args.dataset)
    if runner is None:
        print(f"[ERRO] Dataset desconhecido: {args.dataset}")
        sys.exit(1)
    runner(years=args.years, force_reprocess=args.force, dry_run=args.dry_run)
```

```python
# src/pipelines/registry.py
from src.pipelines.despesas_tce import run_despesas_tce
...

REGISTRY: dict[str, callable] = {
    "despesas": run_despesas_tce,
    "receitas": run_receitas_tce,
    "ambos": run_ambos,
    ...
}

def get(name: str):
    return REGISTRY.get(name)
```

**Benefício:** adicionar pipeline = 1 linha no `registry.py`. Nada mais.

---

### 3.2 `upload_exec_to_cloud.py` — dados hardcoded em código

**Problema crítico:** `IBGE_INDICATORS` e `SECRETARIAS` são listas Python hardcoded no código de produção. Isso quebra a governança de dados.

```python
# Linha 37 — valor fixo hardcoded, vai ficar desatualizado
{"indicador_id": "populacao-estimada", "ano_referencia": 2025, "valor": 63850, ...},
```

**Riscos:**
- Dados ficam desatualizados silenciosamente (sem alerta).
- Não há rastreabilidade da fonte (quando foi atualizado? quem mudou?).
- Não é testável isoladamente.
- Mistura responsabilidades: o arquivo faz build de dims E carrega dados de referência E faz upload.

**Solução incremental:** mover para arquivos JSON versionados em `data/reference/`:

```
data/
└─ reference/
   ├─ ibge_indicators.json
   └─ secretarias.json
```

```python
# src/pipelines/upload_exec_to_cloud.py
import json
from pathlib import Path

def load_reference(name: str) -> list[dict]:
    path = Path(__file__).resolve().parents[2] / "data" / "reference" / f"{name}.json"
    return json.loads(path.read_text(encoding="utf-8"))

IBGE_INDICATORS = load_reference("ibge_indicators")
SECRETARIAS = load_reference("secretarias")
```

**Benefício:**
- Atualização de dados sem alterar código.
- Pode ser versionado e auditado via Git.
- Permite que um não-programador atualize os valores.

---

### 3.3 `upload_exec_to_cloud.py` — `TRUNCATE CASCADE` sem proteção

**Problema:** a função `reset_tables` faz `TRUNCATE TABLE ... CASCADE` em todas as tabelas sem nenhuma validação prévia dos dados que serão inseridos.

```python
def reset_tables(engine) -> None:
    with engine.begin() as conn:
        for table_name in TABLE_RESET_ORDER:
            conn.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
```

**Risco:** se `load_gold_inputs()` retornar DataFrames vazios ou corrompidos, as tabelas serão limpas e ficarão vazias no Supabase. O frontend ficará sem dados.

**Solução incremental — guard antes do truncate:**

```python
def validate_frames_before_upload(frames: dict[str, pd.DataFrame]) -> None:
    for name, df in frames.items():
        if df.empty:
            raise ValueError(f"[ERRO] DataFrame '{name}' está vazio. Upload cancelado.")
        if df.isnull().all(axis=None):
            raise ValueError(f"[ERRO] DataFrame '{name}' contém apenas nulos.")

def run_upload_exec_cloud(dry_run: bool = False) -> None:
    financeiro_df, receita_df = load_gold_inputs()
    ...
    frames = { ... }
    
    validate_frames_before_upload(frames)  # ← guardrail
    describe_frames(frames)
    
    if dry_run:
        return
    
    engine = get_engine()
    ...
```

---

### 3.4 `upload_exec_to_cloud.py` — `receita_prevista == receita_realizada`

**Problema:** há um comentário inline que admite uma simplificação incorreta:

```python
# receita_prevista foi preenchida com receita_total do TCE ate existir
# uma fonte oficial de previsao orcamentaria no pipeline.
fato["receita_prevista"] = fato["receita_total"]
fato["receita_realizada"] = fato["receita_total"]
```

**Risco:** o frontend exibe `receita_prevista` como dado real, gerando relatórios incorretos. Isso pode causar problemas sérios se usado pela prefeitura.

**Solução incremental:** marcar explicitamente no metadata e na tabela Supabase:

```python
fato["receita_prevista"] = None          # coluna existe mas é NULL até ter fonte
fato["receita_prevista_nota"] = "Sem fonte oficial de previsão orçamentária"
```

Ou adicionar uma coluna `is_estimado: bool` na tabela `fato_financeiro_mensal`.

---

### 3.5 `core/metadata.py` — ausência de checksum

**Problema:** o metadata registra `arquivo_saida` e `status`, mas não verifica integridade do arquivo Parquet. Se o arquivo for corrompido ou truncado, o metadata ainda dirá `status: OK`.

**Solução simples:**

```python
import hashlib

def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()
```

Adicionar ao metadata:
```python
"checksum_sha256": sha256_file(arquivo_saida) if os.path.exists(arquivo_saida) else None,
```

---

### 3.6 `core/schema.py` — versões hardcoded

**Problema:**

```python
BRONZE_SCHEMA_VERSION = "1.0.0"
PIPELINE_VERSION = "1.1.0"
```

Essas constantes não são automaticamente incrementadas. Se o schema mudar, alguém precisa lembrar de atualizar manualmente — e frequentemente não atualiza.

**Solução:** mover para `pyproject.toml` ou `version.py` centralizado:

```python
# src/version.py
PIPELINE_VERSION = "1.1.0"

SCHEMA_VERSIONS = {
    "despesas": "1.0.0",
    "receitas": "1.0.0",
    "gold_financeiro": "1.0.0",
}
```

---

### 3.7 Logs com `print()` — sem estrutura

**Problema:** todos os pipelines e o upload usam `print()` diretamente, sem nível de log, sem timestamp, sem componente.

```python
print("[UPLOAD] dim_municipio: 1 linhas")
print("[INFO] Limpando tabelas do modelo executivo...")
```

**Riscos:**
- Impossível filtrar por nível (ERROR vs INFO).
- Não há timestamp nos logs.
- Dificulta diagnóstico de falhas no Supabase em produção.

**Solução incremental — logger centralizado:**

```python
# src/core/logger.py
import logging
import sys

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)s [%(name)s] %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S"
        ))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
```

Uso:
```python
from src.core.logger import get_logger
log = get_logger("upload_exec")
log.info("Enviando dim_municipio: %d linhas", len(dim_municipio_df))
log.error("Falha ao conectar ao Supabase: %s", str(e))
```

---

### 3.8 `build_dim_municipio()` — chamada de API externa no caminho crítico de upload

**Problema:** `build_dim_municipio()` chama a API do IBGE **durante o processo de upload** para o Supabase. Se a API do IBGE estiver fora do ar, o upload falha completamente.

```python
def build_dim_municipio() -> pd.DataFrame:
    client = IBGEClient()
    result = client.get_municipio(BOITUVA_IBGE_CODE)  # ← chamada de rede aqui
    if result["status"] != "ok":
        raise RuntimeError(...)
```

**Solução:** persistir `dim_municipio` como arquivo de referência JSON (vide item 3.2) ou como Parquet na camada gold, e carregar localmente durante o upload.

```python
# data/reference/municipio_boituva.json
{
  "municipio_id_ibge": 3507001,
  "municipio_nome": "Boituva",
  "uf_sigla": "SP",
  "regiao": "Sudeste",
  "regiao_imediata": "Sorocaba",
  "regiao_intermediaria": "Sorocaba"
}
```

---

## 4. Análise por camada

### RAW
- ✅ Nunca alterado após coleta — princípio correto.
- ⚠️ Sem checksum de integridade ao salvar.
- ⚠️ Sem controle de "já baixei este período?" independente do metadata.

### BRONZE
- ✅ Alias de colunas em `schema.py` — resiliente a mudanças da API.
- ✅ Metadata com `meses_com_dados`, `meses_vazios`, `meses_com_erro`.
- ⚠️ `is_year_metadata_ok()` compara `arquivo_saida == csv_path` — se o arquivo for movido, invalida o cache desnecessariamente.
- ⚠️ Metadata salvo como JSON individual por ano — sem índice consolidado consultável.

### SILVER
- ✅ Pipelines `silver_despesas_tce.py` e `silver_receitas_tce.py` separados.
- ⚠️ Não verificado se o silver valida contra o schema da camada anterior (bronze).

### GOLD
- ✅ Modelo estrela bem definido (dim/fato).
- ✅ `gold_financeiro_tce.py` separado de `gold_indicadores_tce.py`.
- ⚠️ Dados de referência hardcoded no pipeline de upload (vide 3.2).

---

## 5. Análise do `upload_exec_to_cloud.py`

### Estrutura atual
```
run_upload_exec_cloud()
├── load_gold_inputs()           → lê Parquet gold
├── build_dim_tempo()
├── build_dim_secretaria()       → dados hardcoded
├── build_dim_fonte_recurso()
├── build_dim_municipio()        → chama API IBGE
├── build_fato_financeiro_mensal()
├── build_fato_receita_mensal_fonte()
├── build_fato_ibge_indicador()  → dados hardcoded
├── describe_frames()
├── reset_tables()               → TRUNCATE CASCADE
└── upload_frame() × 7
```

### Problemas e soluções

| Problema | Criticidade | Solução |
|----------|-------------|---------|
| Dados hardcoded no código | Alta | Mover para `data/reference/*.json` |
| Sem validação antes do TRUNCATE | Alta | `validate_frames_before_upload()` |
| API IBGE no caminho de upload | Média | Cache local em JSON |
| `receita_prevista == receita_realizada` | Média | Marcar como `NULL` ou com flag `is_estimado` |
| Sem log estruturado | Baixa | Usar `src.core.logger` |

---

## 6. Análise do `upload_exec_supabase.ps1`

### O que está bem
- ✅ Detecção automática de `.venv` vs `venv` vs `python` global — resiliente.
- ✅ `$ErrorActionPreference = 'Stop'` — falhas param a execução.
- ✅ `Push-Location / Pop-Location` em `finally` — limpa o estado sempre.
- ✅ `--dry-run` passado corretamente para o Python.

### Problemas

**Problema 1: Sem log de timestamp**

```powershell
# Atual
Write-Host '[STEP] Enviando modelo executivo para o Supabase...'

# Melhorado
function Log-Step { param($msg) Write-Host "$(Get-Date -Format 'HH:mm:ss') [STEP] $msg" }
Log-Step "Enviando modelo executivo para o Supabase..."
```

**Problema 2: Sem verificação de `.env` completo**

O script verifica se `.env` existe, mas não se `DATABASE_URL` está preenchida dentro dele.

```powershell
# Adicionar após Test-Path '.env':
$envContent = Get-Content '.env' -Raw
if ($envContent -notmatch 'DATABASE_URL=.+') {
    throw 'DATABASE_URL não está configurada no arquivo .env.'
}
```

**Problema 3: `--dataset upload_cloud` usa nome de dataset interno**

O parâmetro `--dataset upload_exec_cloud` é acoplado ao nome interno da função Python. Mudar o nome do pipeline quebraria o script sem aviso.

---

## 7. Análise do `core/`

### `database.py` ✅
- `load_pipeline_env()` resolve o `.env` pelo caminho relativo ao arquivo — correto e portável.
- `pool_pre_ping=True` correto para conexões Supabase (que expiram).
- **Melhoria menor:** adicionar `connect_args={"connect_timeout": 10}` para evitar travamentos longos.

### `http_client.py` ✅✅
- Melhor arquivo do projeto. Retry com backoff, streaming, resultado padronizado.
- **Sugestão:** expor `elapsed_seconds` nos logs automaticamente para monitorar latência de APIs.

### `metadata.py` ⚠️
- Dois builders distintos para year e consolidated é correto.
- **Problema:** `build_dataframe_quality()` é chamado em cada build — se o DataFrame for grande, pode ser lento. Não é crítico agora mas vale notar.
- **Faltante:** sem checksum do arquivo de saída.

### `schema.py` ⚠️
- Aliases funcionam bem para TCE/IBGE.
- **Problema:** cada nova fonte precisa de um novo bloco de constantes neste arquivo. Vai ficar grande. Alternativa: mover para `contracts/` como YAML/JSON versionado.

### `validations.py` ✅
- Limpo, funcional, sem surpresas.
- **Sugestão:** adicionar validação de range de valores (ex.: `vl_despesa >= 0`).

### `storage.py` — não analisado (423 bytes, provavelmente utilitários básicos)

---

## 8. Riscos futuros reais

| Risco | Probabilidade | Impacto | Quando |
|-------|---------------|---------|--------|
| API do TCE muda formato → bronze quebra silenciosamente | Alta | Alto | A qualquer momento |
| `IBGE_INDICATORS` desatualizado no código → frontend exibe dado errado | Média | Médio | Sem data definida |
| TRUNCATE sem guard → frontend fica sem dados | Baixa | Crítico | Na próxima falha de pipeline |
| `main.py` com 30+ elif após secretarias municipais | Alta | Médio | Fase 2 do projeto |
| Logs sem timestamp → diagnóstico impossível em produção | Certa | Médio | Agora |
| Sem checksum → corrupção de Parquet não detectada | Baixa | Alto | Crescimento do volume |

---

## 9. Recomendações incrementais

### Sprint 1 (esta semana) — sem quebrar nada

- [ ] Criar `src/core/logger.py` e substituir `print()` por `log.info()/log.error()` no `upload_exec_to_cloud.py`.
- [ ] Adicionar `validate_frames_before_upload()` antes do `reset_tables()`.
- [ ] Mover `IBGE_INDICATORS` e `SECRETARIAS` para `data/reference/*.json`.
- [ ] Adicionar verificação de `DATABASE_URL` no `.ps1`.

### Sprint 2 (próximas 2 semanas)

- [ ] Criar `src/pipelines/registry.py` e simplificar `main.py`.
- [ ] Criar `data/reference/municipio_boituva.json` e remover chamada de API do caminho de upload.
- [ ] Adicionar `checksum_sha256` ao `build_bronze_year_metadata()`.
- [ ] Marcar `receita_prevista = NULL` com nota no metadata.

### Sprint 3 (próximo mês)

- [ ] Centralizar `SCHEMA_VERSIONS` em `src/version.py`.
- [ ] Criar `metadata/index.json` com índice consolidado de todos os datasets.
- [ ] Adicionar validação de range de valores em `validations.py`.
- [ ] Criar `tests/test_contracts.py` com validações de schema básicas.

---

## 10. Roadmap pragmático

```
Mês 1: Estabilizar o que existe
├─ Logger estruturado
├─ Guard antes de TRUNCATE
├─ Dados de referência em JSON
└─ Verificação de DATABASE_URL no PS1

Mês 2: Modularizar sem reescrever
├─ Registry pattern no main.py
├─ municipio_boituva.json (remover chamada de API no upload)
├─ checksum nos metadata
└─ version.py centralizado

Mês 3: Governança leve
├─ metadata/index.json
├─ Testes de contrato (pytest básico)
├─ GitHub Actions: rodar testes em push
└─ Documentar contratos no DOC_ARQUITETURA.md

Mês 4-6: Preparar para secretarias
├─ Contratos de dados formais (YAML ou JSON Schema) para cada fonte
├─ Separação de pipelines externos vs internos
├─ Criptografia básica para dados sensíveis internos
└─ API FastAPI leve como alternativa ao upload direto
```

---

## 11. Conclusão

A base do projeto é **sólida**: `HttpClient` com retry, metadata bem estruturado, schema com aliases, modelo estrela no Supabase. Esses elementos mostram maturidade técnica.

Os riscos críticos para a fase atual são:
1. **TRUNCATE sem guard** — pode deixar o frontend sem dados.
2. **Dados hardcoded** (`IBGE_INDICATORS`, `SECRETARIAS`) — desatualização silenciosa.
3. **API IBGE no caminho de upload** — dependência desnecessária.
4. **`print()` sem estrutura** — diagnóstico impossível em produção.

Nenhuma dessas correções requer reescrita. Todas são incrementais, seguras e compatíveis com a stack atual.

**Nível atual do projeto:** Intermediário-avançado na fundação técnica. As melhorias propostas levam para produção de forma segura sem sobrecarga de complexidade.
