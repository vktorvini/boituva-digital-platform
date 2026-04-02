# Arquitetura do Projeto Boituva Agent

Este documento explica a organização do projeto, o papel de cada pasta, cada arquivo e como o fluxo de dados acontece.

O objetivo é permitir que qualquer pessoa (ou você no futuro) entenda rapidamente:

- onde estão as funções
- quem é responsável por cada etapa
- como executar pipelines
- como adicionar novas fontes de dados

---

# Visão geral do fluxo


Fonte Pública -> Collector -> RAW -> Pipeline -> Bronze -> (futuro Silver -> Gold)


Exemplo real:


API TCE -> collectors/tce.py -> data/raw -> pipelines/despesas_tce.py -> data/bronze


---

# Estrutura do projeto


src/
│
├── core/
│ └── storage.py
│
├── collectors/
│ └── tce.py
│
├── pipelines/
│ └── despesas_tce.py
│
└── main.py


---

# CORE

## Arquivo: `core/storage.py`

### Função: `ensure_dir(path)`
Responsável por criar diretórios automaticamente.

Usada quando:
- vamos salvar arquivos RAW
- vamos salvar CSV bronze
- vamos criar novas estruturas

### Função: `save_json(data, path)`
Responsável por salvar arquivos JSON brutos.

É usada pelos pipelines.

Objetivo:
- preservar dado original
- permitir auditoria
- permitir reprocessamento futuro

---

# COLLECTORS

## Arquivo: `collectors/tce.py`

### Função: `fetch_tce_data(endpoint, municipio, ano, mes)`

Responsável por:
- montar a URL da API do TCE
- fazer requisição HTTP
- retornar dados JSON
- tratar erros de conexão
- tratar mês sem dados

Essa função NÃO salva arquivos.
Essa função NÃO cria DataFrame.
Essa função NÃO gera bronze.

Ela apenas coleta.

Isso permite reutilizar para:

- despesas
- receitas
- outros municípios

---

# PIPELINES

## Arquivo: `pipelines/despesas_tce.py`

### Função: `run_despesas_tce()`

Responsável por:

1. definir parâmetros do fluxo:
   - município
   - endpoint
   - anos
   - meses

2. chamar o collector
3. salvar arquivos RAW
4. transformar JSON em DataFrame
5. adicionar colunas técnicas (ano e mês)
6. consolidar todos os meses
7. gerar arquivo bronze final

Este arquivo representa a **regra de negócio do fluxo de despesas**.

---

# MAIN

## Arquivo: `main.py`

### Função: `main()`

Responsável por:

- disparar pipelines
- controlar execução do projeto

Exemplo atual:
- roda pipeline de despesas do TCE

No futuro poderá:
- rodar receitas
- rodar IBGE
- rodar tudo

---

# Onde ficam os dados

## RAW


data/raw/tce/despesas/boituva/2019/01.json


Cada arquivo representa:
- um mês
- um ano
- um endpoint

---

## BRONZE


data/bronze/tce/despesas_boituva.csv


Representa:
- consolidação de todos os meses coletados
- estrutura tabular
- primeira camada de tratamento

---

# Como rodar o projeto

Na raiz:


python src/main.py


---

# Como adicionar um novo pipeline (exemplo receitas)

Passos:

1. criar arquivo:


pipelines/receitas_tce.py


2. reutilizar função:


fetch_tce_data(endpoint="receitas", ...)


3. salvar RAW em nova pasta:


data/raw/tce/receitas/...


4. gerar bronze:


data/bronze/tce/receitas_boituva.csv


5. adicionar no main:


from src.pipelines.receitas_tce import run_receitas_tce


---

# Princípios arquiteturais

- collectors não tratam dados
- core não conhece regra de negócio
- pipeline orquestra o fluxo
- main controla execução
- raw nunca é alterado
- bronze pode ser recriado a partir do raw

---

# Evolução futura planejada

- retry automático de API
- paralelismo por mês
- controle incremental
- logs estruturados
- camada silver
- camada gold
- carga em DuckDB/PostgreSQL
- criação de agente IA analítico