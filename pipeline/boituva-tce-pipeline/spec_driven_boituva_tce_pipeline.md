# SPEC-DRIVEN — Boituva Agent

## 1. Visão do produto

### Nome
Boituva Agent

### Propósito
Construir uma plataforma de ingestão, padronização, transformação e análise de dados públicos de Boituva, com foco inicial em dados financeiros do TCESP, evoluindo para uma Urban Data Platform municipal.

### Objetivo principal
Permitir coleta governável, rastreável e escalável de dados públicos para suportar:
- análise técnica
- indicadores de gestão pública
- dashboards
- futura camada de IA
- futura expansão para múltiplas fontes municipais e estaduais

---

## 2. Escopo atual

### Fontes implementadas
#### TCESP API
- despesas
- receitas

### Camadas implementadas
- Bronze
- Silver
- Gold

### Subprodutos já implementados
#### Bronze
- bronze anual de despesas
- bronze anual de receitas
- bronze consolidated de despesas
- bronze consolidated de receitas
- metadata anual
- metadata consolidated
- idempotência anual
- harmonização básica de schema

#### Silver
- silver anual de despesas
- silver annual de receitas
- silver consolidated de despesas
- silver consolidated de receitas
- conversão de tipos
- normalização textual
- parsing monetário
- parsing de fornecedor em despesas
- metadata silver

#### Gold
- gold financeiro mensal v2
- gold financeiro anual v2
- gold receita mensal por fonte
- gold despesa mensal por evento
- gold indicadores fiscais v2.1

---

## 3. Problema de negócio que o sistema resolve

### Problema
Os dados públicos estão dispersos, heterogêneos e pouco prontos para consumo analítico.

### Dor principal
- baixa governança dos dados
- coleta manual repetitiva
- dificuldade de rastrear origem
- dificuldade de comparar anos
- dificuldade de gerar indicadores confiáveis
- ausência de base pronta para análise e decisão

### Solução proposta
Uma arquitetura em camadas, versionada, idempotente e documentada, que transforma dados públicos brutos em ativos analíticos confiáveis.

---

## 4. Princípios do sistema

### 4.1 Governança primeiro
Nenhuma camada deve depender de interpretação manual implícita.

### 4.2 Rastreabilidade
Todo artefato precisa indicar:
- origem
- versão
- período
- status
- estrutura esperada

### 4.3 Idempotência
A mesma execução não deve recriar dados já validados sem necessidade.

### 4.4 Separação de responsabilidades
- collector coleta
- bronze aterrissa e harmoniza
- silver tipa e padroniza
- gold agrega e traduz em métrica

### 4.5 Evolução controlada
Toda mudança relevante deve carregar versionamento de schema e pipeline.

---

## 5. Arquitetura alvo

```text
Fonte pública -> Collector -> Raw -> Bronze -> Silver -> Gold -> Indicadores / Dashboard / IA
```

### Fontes no roadmap
- TCESP API
- conjuntos CSV do TCESP
- portal da transparência municipal
- IBGE
- TSE
- PNCP
- demais bases públicas relevantes

---

## 6. Estrutura de projeto

```text
boituva_agent/
│
├── data/
│   ├── raw/
│   ├── bronze/
│   ├── silver/
│   └── gold/
│
├── logs/
│
├── src/
│   ├── collectors/
│   ├── core/
│   ├── pipelines/
│   └── main.py
│
├── requirements.txt
├── README.md
└── docs/*.md
```

---

## 7. Responsabilidade por pasta

### data/raw
Dados brutos preservados como vieram da origem.

### data/bronze
Dados harmonizados minimamente, próximos da origem, estáveis entre anos.

### data/silver
Dados tipados, padronizados, limpos e prontos para análise.

### data/gold
Dados agregados e transformados em visão de negócio/gestão.

### src/collectors
Implementação de coleta por fonte.

### src/core
Utilitários compartilhados:
- storage
- metadata
- validations
- schema

### src/pipelines
Fluxos específicos de cada dataset e camada.

### logs
Reservado para execução operacional futura.

---

## 8. Contrato da camada Bronze

### Objetivo
Garantir aterrissagem estável, harmonização estrutural e preservação da origem.

### Requisitos obrigatórios
- granularidade anual
- consolidated total
- metadata anual e consolidated
- schema version
- pipeline version
- idempotência anual
- distinção entre `ok`, `empty`, `error`
- alias mapping de colunas

### Status aceitos
- OK
- PARCIAL
- ERRO
- SEM_DADOS

### Regras de idempotência anual
Um ano é pulado se:
- CSV anual existe
- metadata anual existe
- status é OK
- arquivo_saida confere
- schema_version confere
- pipeline_version confere

---

## 9. Contrato da camada Silver

### Objetivo
Transformar dados da Bronze em tabelas confiáveis, tipadas e consistentes.

### Regras gerais
- preservar campo bruto quando houver transformação crítica
- converter datas
- converter valores monetários
- normalizar textos
- criar colunas técnicas derivadas
- gerar chave técnica quando necessário
- salvar em parquet
- gerar metadata

### Requisitos
- schema version
- pipeline version
- status
- registros_entrada
- registros_saida
- registros_descartados
- métricas de parsing
- duplicatas
- nulos por coluna

---

## 10. Contrato da camada Gold

### Objetivo
Traduzir dados tipados da Silver em métricas e agregações úteis para gestão.

### Regras gerais
- não repetir transformação de limpeza da Silver
- não misturar estágios semânticos incompatíveis
- explicitar regras de modelagem no metadata
- produzir datasets de negócio e indicadores

### Exemplo de correção aplicada
Na Gold Financeira v2, despesa não é somada de forma única. Os eventos foram separados em:
- despesa_empenhada
- despesa_liquidada
- despesa_paga
- despesa_anulada
- despesa_reforcada
- despesa_outros_eventos

---

## 11. Datasets implementados

### 11.1 Bronze — despesas_tce
#### Entrada
- TCESP API / despesas

#### Saída
- anual CSV
- consolidated CSV
- metadata anual e consolidated

### 11.2 Bronze — receitas_tce
#### Entrada
- TCESP API / receitas

#### Saída
- anual CSV
- consolidated CSV
- metadata anual e consolidated

### 11.3 Silver — despesas_tce
#### Principais transformações
- normalização de texto
- parsing de data
- parsing monetário
- parsing de fornecedor em tipo/número/validade
- chave técnica
- parquet

### 11.4 Silver — receitas_tce
#### Principais transformações
- normalização de texto
- parsing monetário
- referência temporal
- chave técnica
- parquet

### 11.5 Gold — financeiro_tce v2
#### Tabelas
- gold_financeiro_mensal
- gold_financeiro_anual
- gold_receita_mensal_fonte
- gold_despesa_mensal_evento

### 11.6 Gold — indicadores fiscais v2.1
#### Métricas
- execucao
- gap_empenhado_pago
- pressao_fiscal
- crescimento_receita
- crescimento_despesa
- saldo_receita_vs_pago
- saldo_receita_vs_empenhado

---

## 12. Regras semânticas críticas

### 12.1 Despesa não pode ser agregada sem separar evento
Eventos representam estágios distintos da mesma despesa.

### 12.2 Comparações corretas
- receita_total vs despesa_paga
- receita_total vs despesa_empenhada

### 12.3 Interpretação do gap
`gap_empenhado_pago = despesa_empenhada - despesa_paga`

Interpretação:
- obrigação assumida e ainda não paga
- possível pressão futura
- potencial formação de restos a pagar

### 12.4 Interpretação da execução
`execucao = despesa_paga / despesa_empenhada`

Interpretação:
- taxa de realização financeira do que foi comprometido

---

## 13. Metadados obrigatórios

### Para Bronze
- dataset
- camada
- fonte
- município
- ano ou escopo
- data_execucao_utc
- schema_version
- pipeline_version
- status
- registros_totais
- num_colunas
- colunas
- validacao_schema
- meses_esperados
- meses_com_dados
- meses_vazios
- meses_com_erro
- arquivo_saida

### Para Silver
- dataset
- camada
- fonte
- município
- schema_version
- pipeline_version
- registros_entrada
- registros_saida
- registros_descartados
- métricas de parsing
- duplicatas
- nulos_por_coluna
- arquivo_entrada
- arquivo_saida
- status

### Para Gold
- dataset
- camada
- fonte
- município
- schema_version
- pipeline_version
- arquivos_entrada
- arquivo_saida
- registros_totais
- colunas
- nulos_por_coluna
- status
- observacoes_modelagem

---

## 14. Requisitos não funcionais

### Performance
- Silver e Gold devem preferir parquet
- agregações devem ser reprodutíveis

### Escalabilidade
- novos datasets devem seguir o mesmo contrato
- novas fontes devem reutilizar utilitários do core

### Auditabilidade
- toda camada deve ser reprocessável a partir da camada anterior

### Legibilidade
- o pipeline deve permanecer compreensível por pasta, arquivo e metadata

---

## 15. Critérios de pronto por camada

### Bronze pronta quando
- schema estável
- collector separa ok/empty/error
- metadata correta
- idempotência ativa
- documentação bronze concluída

### Silver pronta quando
- tipos corretos
- transformações críticas preservam coluna raw
- parquet gerado
- metadata consistente
- documentação silver concluída

### Gold pronta quando
- métricas semânticas corretas
- agregações coerentes com gestão pública
- metadata registra observações de modelagem
- documentação gold concluída

---

## 16. Roadmap recomendado

### Fase atual
- fechar documentação do processo completo
- documentar Gold Financeira v2
- documentar Gold Indicadores v2.1

### Próxima fase
- dashboard inicial
- primeiras análises narrativas de Boituva
- revisão de anomalias/insights

### Expansão posterior
- CSVs do TCESP
- restos a pagar
- licitações e contratos
- Fundeb
- saúde
- educação

### Fase futura
- Urban Data Platform municipal
- camada de IA sobre dados consolidados
- indicadores ligados a gestão pública e cidade digital

---

## 17. Decisões arquiteturais tomadas

### Mantidas
- Bronze em CSV
- Silver em Parquet
- Gold em Parquet
- versionamento central em `core/schema.py`
- metadata em todas as camadas
- idempotência anual na Bronze

### Justificativa
- CSV é bom para aterrissagem e inspeção
- Parquet é melhor para tipagem, compressão e analytics
- metadata reduz opacidade
- idempotência reduz custo operacional e retrabalho

---

## 18. Riscos conhecidos

- novas fontes podem introduzir drift de schema
- fontes públicas podem mudar sem aviso
- métricas públicas exigem interpretação semântica correta
- expansão prematura para muitas fontes pode comprometer governança

---

## 19. Próximo artefato esperado

### Nome sugerido
`DOC_GOLD_FINANCEIRO_TCE.md`

### Objetivo
Detalhar:
- tabelas gold
- métricas
- regras de saldo
- interpretação analítica
- limites de uso

---

## 20. Resumo executivo

O Boituva Agent já possui uma arquitetura em camadas funcional e governada, com domínio financeiro implementado ponta a ponta:
- ingestão
- bronze
- silver
- gold
- indicadores fiscais

O sistema já é capaz de sustentar análises financeiras municipais e serve como base concreta para o projeto Cidade Digital Boituva.

